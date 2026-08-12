(() => {
  const ROOM_COLLECTION = 'pokemonGTournamentRooms';
  const DISCONNECT_GRACE_MS = 10_000;
  const HEARTBEAT_MS = 3_000;
  const ROOM_CODE_RE = /^[A-Z0-9]{5}$/;
  const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const lobby = document.querySelector('#multiplayer-lobby');
  const lobbyStatus = document.querySelector('#multiplayer-lobby-status');
  const codeInput = document.querySelector('#room-code-input');
  const battleStatus = document.querySelector('#multiplayer-status');
  const createButton = document.querySelector('#create-room');
  const openJoinButton = document.querySelector('#open-room-entry');
  const joinButton = document.querySelector('#join-room');

  let roomCode = null;
  let roomRole = null;
  let roomUnsubscribe = null;
  let heartbeatTimer = null;
  let pendingMode = null;
  let applyingSnapshot = false;
  let resolving = false;

  const firebase = () => window.pokemonFirebase;
  const isMulti = () => Boolean(roomCode && roomRole && state.multiplayer?.roomCode === roomCode);
  const ownKey = () => roomRole === 'host' ? 'host' : 'guest';
  const enemyKey = () => roomRole === 'host' ? 'guest' : 'host';
  const ownQueueKey = () => `${ownKey()}Queue`;
  const enemyQueueKey = () => `${enemyKey()}Queue`;
  const ownPokemonKey = () => `${ownKey()}PokemonId`;
  const statusText = (message, kind = '') => {
    if (!battleStatus) return;
    battleStatus.hidden = !message;
    battleStatus.className = `multiplayer-status ${kind}`;
    battleStatus.innerHTML = message ? `<b>1:1 대전</b>${message}` : '';
  };
  const lobbyText = (message) => { if (lobbyStatus) lobbyStatus.textContent = message; };
  const roomCodeFor = () => Array.from({ length: 5 }, () => ROOM_ALPHABET[Math.floor(Math.random() * ROOM_ALPHABET.length)]).join('');
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const cleanCard = (card) => ({ id: card.id, name: card.name, ko: card.ko, icon: card.icon, kind: card.kind, priority: card.priority, energy: card.energy, label: card.label, damage: card.damage ?? null, range: card.range ?? null, restore: card.restore ?? null, dx: card.dx ?? null, dy: card.dy ?? null, relative: card.relative ?? null, pattern: card.pattern ?? null });
  const cleanFighter = (fighter) => {
    if (!fighter) return null;
    return {
      id: fighter.id, baseId: fighter.baseId || fighter.id, name: fighter.name, ko: fighter.ko,
      gen: fighter.gen, type: fighter.type, emoji: fighter.emoji, image: fighter.image,
      className: fighter.className, stats: fighter.stats, passive: fighter.passive || null,
      maxHp: fighter.maxHp || 100, maxEnergy: fighter.maxEnergy || 100,
      hp: Math.max(0, Math.round(fighter.hp)), energy: Math.max(0, Math.round(fighter.energy)),
      x: fighter.x, y: fighter.y, guarding: Boolean(fighter.guarding),
      evolutionGauge: Math.max(0, Math.round(fighter.evolutionGauge || 0)),
      evolved: Boolean(fighter.evolved), evolutionReady: Boolean(fighter.evolutionReady),
      evolutionId: fighter.evolutionId || null, fieldItemEffects: clone(fighter.fieldItemEffects || []),
      attacks: (fighter.attacks || []).map(cleanCard),
    };
  };
  const restoreFighter = (saved, side, mirror = false) => {
    const base = pokemonById(saved?.baseId || saved?.id) || pokemonById(saved?.id) || {};
    const fighter = { ...base, ...clone(saved || {}), side };
    fighter.x = mirror ? 5 - Number(fighter.x || 0) : Number(fighter.x || 0);
    fighter.y = Number(fighter.y || 0);
    fighter.attacks = (fighter.attacks || base.attacks || []).map((card) => ({ ...card }));
    window.ensureFighter?.(fighter);
    return fighter;
  };
  const serializeBattle = () => ({
    host: cleanFighter(state.player), guest: cleanFighter(state.cpu),
    hazards: [...(state.hazard || [])], fieldItems: clone(state.fieldItems || []),
    nextFieldItemRound: Number(state.nextFieldItemRound || 5),
  });
  const mirrorItems = (items) => (items || []).map((item) => ({ ...item, x: 5 - Number(item.x || 0) }));
  const mirrorHazards = (hazards) => (hazards || []).map((key) => {
    const [x, y] = String(key).split(',').map(Number);
    return `${5 - x},${y}`;
  });

  const leaveRoom = () => {
    roomUnsubscribe?.(); roomUnsubscribe = null;
    clearInterval(heartbeatTimer); heartbeatTimer = null;
    roomCode = null; roomRole = null; pendingMode = null; resolving = false; applyingSnapshot = false;
    delete state.multiplayer;
    statusText('');
  };
  const apiReady = async () => {
    if (firebase()?.ready?.()) return firebase();
    await new Promise((resolve) => window.addEventListener('pokemon-firebase-ready', resolve, { once: true }));
    return firebase();
  };
  const ensureSignedIn = async () => {
    const service = await apiReady();
    await service.ensureUser();
    return service;
  };
  const updateRoom = async (patch) => {
    if (!isMulti()) return;
    const service = await apiReady();
    await service.api.updateDoc(service.api.doc(service.db, ROOM_COLLECTION, roomCode), { ...patch, updatedAt: Date.now() });
  };
  const heartbeat = async () => {
    if (!isMulti() || state.gameOver) return;
    try { await updateRoom({ [`${ownKey()}ConnectedAt`]: Date.now() }); } catch (error) { console.warn('대전 연결 갱신 실패', error); }
  };
  const startHeartbeat = () => {
    clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(heartbeat, HEARTBEAT_MS);
    heartbeat();
  };
  const showSelectForMode = (mode, code = '') => {
    pendingMode = mode;
    roomCode = code || null;
    roomRole = null;
    renderRoster(); state.selected = null;
    $('#selection-status').textContent = mode === 'host' ? '파트너를 고른 뒤 방을 만드세요.' : `방 ${code}에 출전할 파트너를 고르세요.`;
    const confirm = $('#confirm-selection');
    confirm.disabled = true;
    confirm.innerHTML = mode === 'host' ? '방 생성 <span>→</span>' : '대전 입장 <span>→</span>';
    showScreen('select');
  };
  const interceptSelectConfirm = (event) => {
    if (!pendingMode) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();
    pendingMode === 'host' ? makeRoom() : joinRoom();
  };

  const makeRoom = async () => {
    if (!state.selected) return;
    const service = await ensureSignedIn();
    const user = service.getUser();
    const host = pokemonById(state.selected);
    if (!host) return;
    createButton.disabled = true;
    try {
      let created = null;
      for (let attempt = 0; attempt < 12 && !created; attempt += 1) {
        const code = roomCodeFor();
        const ref = service.api.doc(service.db, ROOM_COLLECTION, code);
        const now = Date.now();
        await service.api.runTransaction(service.db, async (transaction) => {
          const existing = await transaction.get(ref);
          if (existing.exists()) throw new Error('room-code-collision');
          transaction.set(ref, {
            hostId: user.uid, guestId: null, hostPokemonId: host.id, guestPokemonId: null,
            hostQueue: [], guestQueue: [], status: 'waiting', round: 1, turn: 0,
            lastFirst: 'host', mapTheme: ['grassland', 'forest', 'lake'][Math.floor(Math.random() * 3)],
            battleState: {}, hostConnectedAt: now, guestConnectedAt: null,
            disconnectAt: null, disconnectedSide: null, winnerSide: null, createdAt: now, updatedAt: now,
          });
        });
        created = code;
      }
      if (!created) throw new Error('room-create-failed');
      roomCode = created; roomRole = 'host'; pendingMode = null;
      state.multiplayer = { roomCode, role: roomRole };
      lobby.hidden = false; lobbyText(`방 코드 ${roomCode} · 상대 입장을 기다리는 중`);
      showScreen('start');
      subscribeRoom(); startHeartbeat();
      toast(`방 ${roomCode}가 생성되었습니다.`);
    } catch (error) {
      console.error(error);
      toast('방 생성에 실패했습니다. Firebase 로그인·규칙을 확인하세요.');
    } finally { createButton.disabled = false; }
  };

  const openJoin = async () => {
    lobby.hidden = false;
    codeInput?.focus();
    lobbyText('방 코드 5자리를 입력하세요.');
  };
  const prepareJoin = async () => {
    const code = String(codeInput?.value || '').trim().toUpperCase();
    if (!ROOM_CODE_RE.test(code)) { lobbyText('방 코드는 영문·숫자 5자리입니다.'); return; }
    try {
      const service = await ensureSignedIn();
      const snapshot = await service.api.getDoc(service.api.doc(service.db, ROOM_COLLECTION, code));
      if (!snapshot.exists() || snapshot.data().status !== 'waiting' || snapshot.data().guestId) { lobbyText('입장 가능한 방이 없습니다.'); return; }
      if (snapshot.data().hostId === service.getUser()?.uid) { lobbyText('내가 만든 방에는 입장할 수 없습니다.'); return; }
      showSelectForMode('guest', code);
    } catch (error) {
      console.error(error); lobbyText('방을 확인하지 못했습니다. Firebase 연결을 확인하세요.');
    }
  };
  const joinRoom = async () => {
    if (!state.selected || !roomCode) return;
    const service = await ensureSignedIn();
    const user = service.getUser();
    const guest = pokemonById(state.selected);
    try {
      const ref = service.api.doc(service.db, ROOM_COLLECTION, roomCode);
      await service.api.runTransaction(service.db, async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists()) throw new Error('room-not-found');
        const room = snapshot.data();
        if (room.status !== 'waiting' || room.guestId) throw new Error('room-unavailable');
        transaction.update(ref, { guestId: user.uid, guestPokemonId: guest.id, guestQueue: [], status: 'selecting', guestConnectedAt: Date.now(), updatedAt: Date.now() });
      });
      roomRole = 'guest'; pendingMode = null;
      state.multiplayer = { roomCode, role: roomRole };
      subscribeRoom(); startHeartbeat();
      statusText(`방 ${roomCode} · 전장을 준비하고 있습니다.`);
    } catch (error) {
      console.error(error); toast(error.message === 'room-unavailable' ? '방이 이미 시작되었거나 가득 찼습니다.' : '대전 입장에 실패했습니다.');
    }
  };

  const hostInitializeBattle = async (room) => {
    if (room.battleState?.host && room.battleState?.guest) return;
    const host = pokemonById(room.hostPokemonId); const guest = pokemonById(room.guestPokemonId);
    if (!host || !guest || roomRole !== 'host') return;
    state.player = restoreFighter(cleanFighter({ ...host, attacks: host.attacks, maxHp: 100, maxEnergy: 100, hp: 100, energy: 100, x: 1, y: 2 }), 'player');
    state.cpu = restoreFighter(cleanFighter({ ...guest, attacks: guest.attacks, maxHp: 100, maxEnergy: 100, hp: 100, energy: 100, x: 4, y: 2 }), 'cpu');
    state.round = 1; state.turn = 0; state.lastFirst = 'player'; state.hazard = new Set(); state.fieldItems = [];
    state.nextFieldItemRound = 5 + Math.floor(Math.random() * 4); state.queue = []; state.cpuQueue = [];
    state.gameOver = false; state.executing = false; state.previewCard = null; state.mapTheme = room.mapTheme;
    window.resetBattleActionHistory?.();
    await updateRoom({ battleState: serializeBattle(), status: 'selecting', round: 1, turn: 0, lastFirst: 'host' });
  };
  const applyRoomBattle = (room) => {
    const battle = room.battleState;
    if (!battle?.host || !battle?.guest) return false;
    const guestView = roomRole === 'guest';
    state.player = restoreFighter(guestView ? battle.guest : battle.host, 'player', guestView);
    state.cpu = restoreFighter(guestView ? battle.host : battle.guest, 'cpu', guestView);
    state.hazard = new Set(guestView ? mirrorHazards(battle.hazards) : (battle.hazards || []));
    state.fieldItems = guestView ? mirrorItems(battle.fieldItems) : clone(battle.fieldItems || []);
    state.nextFieldItemRound = Number(battle.nextFieldItemRound || 5);
    state.round = Number(room.round || 1); state.turn = Number(room.turn || 0);
    state.lastFirst = room.lastFirst === ownKey() ? 'player' : 'cpu';
    state.mapTheme = room.mapTheme; state.queue = clone(room[ownQueueKey()] || []); state.cpuQueue = clone(room[enemyQueueKey()] || []);
    state.gameOver = room.status === 'finished'; state.executing = room.status === 'resolving';
    window.resetBattleActionHistory?.();
    return true;
  };
  const publishQueue = async () => {
    if (!isMulti() || applyingSnapshot || state.gameOver) return;
    try {
      await updateRoom({ [ownQueueKey()]: clone(state.queue), [`${ownKey()}ConnectedAt`]: Date.now() });
      statusText(state.queue.length === 3 ? '카드 선택 완료 · 상대를 기다리는 중입니다.' : `카드 ${state.queue.length}/3장 선택`);
    } catch (error) { console.error(error); toast('선택한 카드를 전송하지 못했습니다.'); }
  };
  const publishBattle = async (status = 'selecting', extra = {}) => {
    await updateRoom({ battleState: serializeBattle(), status, round: state.round, turn: state.turn, lastFirst: state.lastFirst === 'player' ? 'host' : 'guest', hostQueue: [], guestQueue: [], ...extra });
  };
  const showMultiplayerResult = (winner) => {
    const localWin = winner === ownKey();
    state.gameOver = true; state.executing = false; state.resultWinnerSide = localWin ? 'player' : 'cpu';
    $('#result-word').textContent = localWin ? '승리!' : '패배!';
    $('#result-summary').innerHTML = `<div class="result-stat"><span>결과</span><strong>${localWin ? '승리' : '패배'}</strong></div><div class="result-stat"><span>라운드</span><strong>${String(state.round).padStart(2, '0')}</strong></div><div class="result-stat"><span>방 코드</span><strong>${roomCode}</strong></div>`;
    document.querySelector('#reward-panel')?.setAttribute('hidden', '');
    document.querySelector('#stage-event-panel')?.setAttribute('hidden', '');
    showScreen('result');
    statusText('');
  };
  const persistHostFinish = async (winner, patch = {}) => {
    try { await publishBattle('finished', { winnerSide: winner, ...patch }); } catch (error) { console.error(error); }
  };
  const declareWinner = async (winner, reason = '') => {
    if (!isMulti()) return;
    resolving = false;
    state.gameOver = true; state.executing = false;
    await persistHostFinish(winner, { disconnectedSide: reason ? enemyKey() : null, disconnectAt: reason ? Date.now() : null });
    showMultiplayerResult(winner);
  };
  const runHostRound = () => {
    if (resolving || roomRole !== 'host' || state.queue.length !== 3 || state.cpuQueue.length !== 3 || state.gameOver) return;
    resolving = true; state.executing = true; state.previewCard = null;
    const actions = [];
    for (let slot = 0; slot < 3; slot += 1) {
      const pair = [
        { fighter: state.player, card: cardById(state.queue[slot]) },
        { fighter: state.cpu, card: cardById(state.cpuQueue[slot]) },
      ];
      pair.sort(compareActions); actions.push(...pair);
    }
    renderPriority(actions); renderBattle();
    updateRoom({ status: 'resolving', hostQueue: clone(state.queue), guestQueue: clone(state.cpuQueue) }).catch(console.error);
    let cursor = 0;
    const next = () => {
      if (state.gameOver) { resolving = false; return; }
      if (cursor >= actions.length) {
        window.clearActionPreview?.();
        finishRound();
        state.queue = []; state.cpuQueue = []; state.executing = false; resolving = false;
        publishBattle().catch(console.error);
        return;
      }
      const action = actions[cursor];
      state.lastFirst = action.fighter.side;
      window.showActionPreview?.(action.fighter, action.card);
      setTimeout(() => {
        if (state.gameOver) { window.clearActionPreview?.(); return; }
        state.turn += 1; resolveAction(action.fighter, action.card); updateActionVisuals(); window.clearActionPreview?.();
        cursor += 1; setTimeout(next, 240);
      }, 310);
    };
    next();
  };
  const checkDisconnect = async (room) => {
    if (!isMulti() || room.status === 'waiting' || room.status === 'finished' || !room.guestId) return;
    const side = roomRole === 'host' ? 'guest' : 'host';
    const lastSeen = Number(room[`${side}ConnectedAt`] || 0);
    const elapsed = Date.now() - lastSeen;
    if (elapsed < DISCONNECT_GRACE_MS) {
      if (elapsed > 4_000) statusText(`상대 연결을 확인 중입니다. ${Math.max(1, Math.ceil((DISCONNECT_GRACE_MS - elapsed) / 1000))}초 후 승리 처리`, 'is-warning');
      return;
    }
    try {
      const service = await apiReady(); const ref = service.api.doc(service.db, ROOM_COLLECTION, roomCode);
      await service.api.runTransaction(service.db, async (transaction) => {
        const fresh = await transaction.get(ref); if (!fresh.exists() || fresh.data().status === 'finished') return;
        const latest = fresh.data(); const staleSide = roomRole === 'host' ? 'guest' : 'host';
        if (Date.now() - Number(latest[`${staleSide}ConnectedAt`] || 0) < DISCONNECT_GRACE_MS) return;
        transaction.update(ref, { status: 'finished', winnerSide: ownKey(), disconnectedSide: staleSide, disconnectAt: Date.now(), updatedAt: Date.now() });
      });
    } catch (error) { console.warn('연결 이탈 처리 실패', error); }
  };
  const onRoom = async (snapshot) => {
    if (!snapshot.exists() || !isMulti()) { toast('대전방을 찾을 수 없습니다.'); leaveRoom(); showScreen('start'); return; }
    const room = snapshot.data();
    if (room.status === 'waiting') { lobby.hidden = false; lobbyText(`방 코드 ${roomCode} · 상대 입장을 기다리는 중`); return; }
    if (roomRole === 'host' && room.status === 'selecting' && (!room.battleState?.host || !room.battleState?.guest)) {
      await hostInitializeBattle(room); return;
    }
    applyingSnapshot = true;
    const ready = applyRoomBattle(room);
    applyingSnapshot = false;
    if (!ready) { statusText('방장이 전장을 준비하고 있습니다.'); return; }
    if (room.status === 'finished') { showMultiplayerResult(room.winnerSide); return; }
    if (state.screen !== 'battle') showScreen('battle');
    renderBattle();
    if (room.status === 'resolving') statusText('양쪽 카드 공개 · 행동을 진행 중입니다.');
    else if ((room[ownQueueKey()] || []).length === 3) statusText('카드 선택 완료 · 상대를 기다리는 중입니다.');
    else statusText(`카드 ${state.queue.length}/3장 선택`);
    if (roomRole === 'host' && room.status === 'selecting' && room.hostQueue?.length === 3 && room.guestQueue?.length === 3) runHostRound();
    checkDisconnect(room);
  };
  const subscribeRoom = () => {
    roomUnsubscribe?.();
    const service = firebase();
    roomUnsubscribe = service.api.onSnapshot(service.api.doc(service.db, ROOM_COLLECTION, roomCode), onRoom, (error) => { console.error(error); toast('대전방 연결이 끊겼습니다.'); });
  };

  createButton?.addEventListener('click', () => showSelectForMode('host'));
  openJoinButton?.addEventListener('click', openJoin);
  joinButton?.addEventListener('click', prepareJoin);
  codeInput?.addEventListener('input', () => { codeInput.value = codeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5); });
  codeInput?.addEventListener('keydown', (event) => { if (event.key === 'Enter') prepareJoin(); });
  document.querySelector('#confirm-selection')?.addEventListener('click', interceptSelectConfirm, true);
  document.addEventListener('click', (event) => {
    if (!isMulti()) return;
    if (event.target.closest('#advance-round')) { event.preventDefault(); event.stopImmediatePropagation(); publishQueue(); }
    const queueButton = event.target.closest('#player-queue [data-queue-index]');
    if (queueButton && !state.executing) {
      event.preventDefault(); event.stopImmediatePropagation();
      state.queue.splice(Number(queueButton.dataset.queueIndex), 1); state.previewCard = state.queue.at(-1) || null; renderBattle(); publishQueue();
    }
  }, true);
  const originalToggleCard = window.toggleCard;
  window.toggleCard = (id) => { const result = originalToggleCard?.(id); if (isMulti()) publishQueue(); return result; };
  const originalClearQueue = window.clearQueue;
  window.clearQueue = () => { const result = originalClearQueue?.(); if (isMulti()) publishQueue(); return result; };
  const originalFinishBattle = window.finishBattle;
  window.finishBattle = (winner) => {
    if (!isMulti()) return originalFinishBattle?.(winner);
    const victor = winner?.side === 'player' ? (roomRole === 'host' ? 'host' : 'guest') : (roomRole === 'host' ? 'guest' : 'host');
    if (roomRole === 'host') {
      state.gameOver = true; state.executing = false; resolving = false;
      persistHostFinish(victor).catch(console.error);
    } else state.gameOver = true;
  };
  document.querySelector('.brand')?.addEventListener('click', () => leaveRoom(), true);
  window.addEventListener('beforeunload', () => { if (isMulti()) heartbeat(); });
})();
