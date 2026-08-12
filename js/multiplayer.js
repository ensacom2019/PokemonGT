(() => {
  const ROOM_COLLECTION = 'pokemonGTournamentRooms';
  const DISCONNECT_GRACE_MS = 5_000;
  const HEARTBEAT_MS = 3_000;
  const DEFAULT_SELECTION_SECONDS = 40;
  const MIN_SELECTION_SECONDS = 20;
  const MAX_SELECTION_SECONDS = 60;
  const ROOM_CODE_RE = /^[A-Z0-9]{5}$/;
  const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const lobby = document.querySelector('#multiplayer-lobby');
  const lobbyStatus = document.querySelector('#multiplayer-lobby-status');
  const createConfig = document.querySelector('#room-create-config');
  const roomEntryForm = document.querySelector('#room-entry-form');
  const selectionSecondsInput = document.querySelector('#room-selection-seconds');
  const selectionSecondsOutput = document.querySelector('#room-selection-seconds-output');
  const confirmRoomCreateButton = document.querySelector('#confirm-room-create');
  const codeInput = document.querySelector('#room-code-input');
  const battleStatus = document.querySelector('#multiplayer-status');
  const countdownOverlay = document.querySelector('#multiplayer-countdown');
  const createButton = document.querySelector('#create-room');
  const openJoinButton = document.querySelector('#open-room-entry');
  const leaveButton = document.querySelector('#leave-room');
  const joinButton = document.querySelector('#join-room');

  let roomCode = null;
  let roomRole = null;
  let roomUnsubscribe = null;
  let heartbeatTimer = null;
  let pendingMode = null;
  let applyingSnapshot = false;
  let resolving = false;
  let selectionTicker = null;
  let selectionDeadline = null;
  let timeoutFilling = false;
  let lastCountdownNumber = null;
  let resultReturnTimer = null;

  const firebase = () => window.pokemonFirebase;
  const isMulti = () => Boolean(roomCode && roomRole && state.multiplayer?.roomCode === roomCode);
  const ownKey = () => roomRole === 'host' ? 'host' : 'guest';
  const enemyKey = () => roomRole === 'host' ? 'guest' : 'host';
  const ownQueueKey = () => `${ownKey()}Queue`;
  const enemyQueueKey = () => `${enemyKey()}Queue`;
  const ownReadyKey = () => `${ownKey()}Ready`;
  const enemyReadyKey = () => `${enemyKey()}Ready`;
  const ownPokemonKey = () => `${ownKey()}PokemonId`;
  const statusText = (message, kind = '') => {
    if (!battleStatus) return;
    battleStatus.hidden = !message;
    battleStatus.className = `multiplayer-status ${kind}`;
    battleStatus.innerHTML = message ? `<b>1:1 대전</b>${message}` : '';
  };
  const lobbyText = (message) => { if (lobbyStatus) lobbyStatus.textContent = message; };
  const setLobbyOpen = (open) => { lobby?.classList.toggle('is-open', Boolean(open)); };
  const setWaitingHostUi = (active) => {
    document.querySelectorAll('.title-action-row > button:not(#leave-room)').forEach((button) => { button.hidden = active; });
    if (leaveButton) leaveButton.hidden = !active;
  };
  const roomSelectionSeconds = (room) => Math.max(MIN_SELECTION_SECONDS, Math.min(MAX_SELECTION_SECONDS, Number(room?.selectionSeconds) || DEFAULT_SELECTION_SECONDS));
  const roomCodeFor = () => Array.from({ length: 5 }, () => ROOM_ALPHABET[Math.floor(Math.random() * ROOM_ALPHABET.length)]).join('');
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const cleanCard = (card) => ({ id: card.id, name: card.name, ko: card.ko, icon: card.icon, kind: card.kind, priority: card.priority, energy: card.energy, label: card.label, damage: card.damage ?? null, range: card.range ?? null, restore: card.restore ?? null, dx: card.dx ?? null, dy: card.dy ?? null, relative: card.relative ?? null, pattern: card.pattern ?? null });
  // 참가자의 전장은 방장 전장을 좌우 반전해 보여 준다. 공격 패턴은 fighter.side가
  // cpu일 때 이미 반전되지만, 이동 dx는 카드에 직접 들어 있으므로 방장 판정 전에만 뒤집는다.
  const cardForHostResolution = (fighter, card) => {
    if (!card || fighter?.side !== 'cpu' || card.kind !== 'move') return card;
    return { ...card, dx: -Number(card.dx || 0) };
  };
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
    clearInterval(selectionTicker); selectionTicker = null; selectionDeadline = null; timeoutFilling = false;
    clearTimeout(resultReturnTimer); resultReturnTimer = null;
    lastCountdownNumber = null;
    if (countdownOverlay) countdownOverlay.hidden = true;
    delete state.roomPartnerCode;
    delete state.multiplayerRoom;
    delete state.multiplayer;
    delete state.multiplayerReady;
    delete state.multiplayerEnemyReady;
    setWaitingHostUi(false);
    lobby.hidden = true; setLobbyOpen(false);
    createConfig.hidden = true;
    roomEntryForm.hidden = true;
    lobbyText('방 코드를 입력하세요.');
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
  const queueWithRandomCards = (fighter, selected = []) => {
    const queue = [...selected];
    let energy = Number(fighter.energy || 0);
    const applyEnergy = (id) => {
      const card = cardById(id);
      if (!card) return;
      energy = card.kind === 'energy' ? Math.min(fighter.maxEnergy || 100, energy + Number(card.restore || 0)) : Math.max(0, energy - Number(card.energy || 0));
    };
    queue.forEach(applyEnergy);
    while (queue.length < 3) {
      const unused = getHand(fighter).filter((card) => !queue.includes(card.id));
      const affordable = unused.filter((card) => card.kind === 'energy' || Number(card.energy || 0) <= energy);
      const candidates = affordable.length ? affordable : unused;
      if (!candidates.length) break;
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      queue.push(chosen.id);
      applyEnergy(chosen.id);
    }
    return queue;
  };
  const renderSelectionCountdown = () => {
    if (!isMulti() || !selectionDeadline || state.executing || state.gameOver) return;
    const remaining = Math.max(0, Math.ceil((selectionDeadline - Date.now()) / 1000));
    $('#round-state').textContent = `선택 ${String(remaining).padStart(2, '0')}초`;
    if (remaining <= 5 && remaining >= 1 && remaining !== lastCountdownNumber && countdownOverlay) {
      lastCountdownNumber = remaining;
      countdownOverlay.hidden = false;
      countdownOverlay.textContent = String(remaining);
      countdownOverlay.style.animation = 'none';
      void countdownOverlay.offsetWidth;
      countdownOverlay.style.animation = '';
      setTimeout(() => { if (countdownOverlay?.textContent === String(remaining)) countdownOverlay.hidden = true; }, 820);
    }
  };
  const fillQueuesOnTimeout = async () => {
    if (!isMulti() || roomRole !== 'host' || timeoutFilling || state.executing || state.gameOver) return;
    timeoutFilling = true;
    try {
      const hostQueue = queueWithRandomCards(state.player, state.queue);
      const guestQueue = queueWithRandomCards(state.cpu, state.cpuQueue);
      if (hostQueue.length !== 3 || guestQueue.length !== 3) return;
      await updateRoom({ hostQueue, guestQueue, hostReady: true, guestReady: true, selectionDeadline: null });
      statusText('선택 시간이 종료되어 남은 카드를 무작위로 채웠습니다.', 'is-warning');
    } catch (error) {
      console.error(error);
    } finally {
      timeoutFilling = false;
    }
  };
  const syncSelectionTimer = (room) => {
    const deadline = Number(room.selectionDeadline || 0);
    if (room.status !== 'selecting' || !deadline) {
      clearInterval(selectionTicker); selectionTicker = null; selectionDeadline = null;
      lastCountdownNumber = null;
      if (countdownOverlay) countdownOverlay.hidden = true;
      return;
    }
    selectionDeadline = deadline;
    if (!selectionTicker) {
      selectionTicker = setInterval(() => {
        renderSelectionCountdown();
        if (Date.now() >= selectionDeadline && roomRole === 'host') fillQueuesOnTimeout();
      }, 250);
    }
    renderSelectionCountdown();
    if (Date.now() >= deadline && roomRole === 'host') fillQueuesOnTimeout();
  };
  const showPartnerSelect = (room) => {
    const ownPokemonId = room[ownPokemonKey()];
    pendingMode = 'partner';
    const enteringPartnerSelect = state.screen !== 'select' || state.roomPartnerCode !== roomCode;
    if (enteringPartnerSelect) {
      renderRoster(); state.selected = null; state.roomPartnerCode = roomCode;
      showScreen('select');
    }
    const confirm = $('#confirm-selection');
    if (ownPokemonId) {
      state.selected = ownPokemonId;
      document.querySelectorAll('[data-pokemon]').forEach((button) => {
        const selected = button.dataset.pokemon === ownPokemonId;
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-pressed', String(selected));
      });
      const pokemon = pokemonById(ownPokemonId);
      $('#selection-status').textContent = `${pokemon?.name || '파트너'} 선택 완료 · 상대를 기다리는 중입니다.`;
      confirm.disabled = true;
      confirm.innerHTML = '파트너 선택 완료';
      return;
    }
    if (state.selected) {
      const selected = pokemonById(state.selected);
      $('#selection-status').innerHTML = `선택 완료 <strong>${selected?.name || '파트너'}</strong> · 파트너 확정을 누르세요.`;
      confirm.disabled = false;
      confirm.innerHTML = '파트너 확정 <span>→</span>';
      return;
    }
    $('#selection-status').textContent = '상대와 연결되었습니다. 출전할 파트너를 선택하세요.';
    confirm.disabled = true;
    confirm.innerHTML = '파트너 확정 <span>→</span>';
  };
  const interceptSelectConfirm = (event) => {
    if (!pendingMode) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();
    if (pendingMode === 'partner') selectRoomPartner();
  };

  const makeRoom = async () => {
    const service = await ensureSignedIn();
    const user = service.getUser();
    const selectionSeconds = Math.max(MIN_SELECTION_SECONDS, Math.min(MAX_SELECTION_SECONDS, Number(selectionSecondsInput?.value) || DEFAULT_SELECTION_SECONDS));
    createButton.disabled = true;
    confirmRoomCreateButton.disabled = true;
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
            hostId: user.uid, guestId: null, hostPokemonId: null, guestPokemonId: null,
            hostQueue: [], guestQueue: [], hostReady: false, guestReady: false, status: 'waiting', round: 1, turn: 0,
            lastFirst: 'host', mapTheme: ['grassland', 'forest', 'lake'][Math.floor(Math.random() * 3)],
            battleState: {}, selectionSeconds, selectionDeadline: null, hostConnectedAt: now, guestConnectedAt: null,
            disconnectAt: null, disconnectedSide: null, winnerSide: null, createdAt: now, updatedAt: now,
          });
        });
        created = code;
      }
      if (!created) throw new Error('room-create-failed');
      roomCode = created; roomRole = 'host'; pendingMode = null;
      state.multiplayer = { roomCode, role: roomRole };
      createConfig.hidden = true;
      setWaitingHostUi(true);
      lobby.hidden = true; setLobbyOpen(false); lobbyText(`방 코드 ${roomCode} · 상대 입장을 기다리는 중`);
      showScreen('start');
      subscribeRoom(); startHeartbeat();
      toast(`방 ${roomCode}가 생성되었습니다.`);
    } catch (error) {
      console.error(error);
      toast('방 생성에 실패했습니다. Firebase 로그인·규칙을 확인하세요.');
    } finally { createButton.disabled = false; confirmRoomCreateButton.disabled = false; }
  };

  const openJoin = async () => {
    createConfig.hidden = true;
    roomEntryForm.hidden = false;
    lobby.hidden = false; setLobbyOpen(true);
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
      joinRoom(code);
    } catch (error) {
      console.error(error); lobbyText('방을 확인하지 못했습니다. Firebase 연결을 확인하세요.');
    }
  };
  const joinRoom = async (code) => {
    const service = await ensureSignedIn();
    const user = service.getUser();
    try {
      const ref = service.api.doc(service.db, ROOM_COLLECTION, code);
      await service.api.runTransaction(service.db, async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists()) throw new Error('room-not-found');
        const room = snapshot.data();
        if (room.status !== 'waiting' || room.guestId) throw new Error('room-unavailable');
        transaction.update(ref, { guestId: user.uid, guestQueue: [], status: 'partner-select', guestConnectedAt: Date.now(), updatedAt: Date.now() });
      });
      roomCode = code; roomRole = 'guest'; pendingMode = null;
      state.multiplayer = { roomCode, role: roomRole };
      subscribeRoom(); startHeartbeat();
      statusText(`방 ${roomCode} · 상대와 연결되었습니다. 파트너를 선택하세요.`);
    } catch (error) {
      console.error(error); toast(error.message === 'room-unavailable' ? '방이 이미 시작되었거나 가득 찼습니다.' : '대전 입장에 실패했습니다.');
    }
  };

  const selectRoomPartner = async () => {
    if (!state.selected || !isMulti()) return;
    const pokemon = pokemonById(state.selected);
    if (!pokemon) return;
    const confirm = $('#confirm-selection');
    confirm.disabled = true;
    try {
      await updateRoom({ [ownPokemonKey()]: pokemon.id, [`${ownKey()}ConnectedAt`]: Date.now() });
      $('#selection-status').textContent = `${pokemon.name} 선택 완료 · 상대를 기다리는 중입니다.`;
      confirm.innerHTML = '파트너 선택 완료';
    } catch (error) {
      console.error(error);
      confirm.disabled = false;
      toast('파트너 선택을 전송하지 못했습니다.');
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
    state.gameOver = false; state.executing = false; state.previewCard = null; state.multiplayerReady = false; state.multiplayerEnemyReady = false; state.mapTheme = room.mapTheme;
    window.resetBattleActionHistory?.();
    pendingMode = null; delete state.roomPartnerCode;
    await updateRoom({ battleState: serializeBattle(), status: 'selecting', round: 1, turn: 0, lastFirst: 'host', selectionDeadline: Date.now() + roomSelectionSeconds(room) * 1000 });
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
    state.multiplayerReady = Boolean(room[ownReadyKey()]); state.multiplayerEnemyReady = Boolean(room[enemyReadyKey()]);
    state.gameOver = room.status === 'finished'; state.executing = room.status === 'resolving';
    window.resetBattleActionHistory?.();
    return true;
  };
  const publishQueue = async () => {
    if (!isMulti() || applyingSnapshot || state.gameOver) return;
    try {
      await updateRoom({ [ownQueueKey()]: clone(state.queue), [ownReadyKey()]: false, [`${ownKey()}ConnectedAt`]: Date.now() });
      state.multiplayerReady = false;
      statusText(state.queue.length === 3 ? '카드 선택 완료 · 상대를 기다리는 중입니다.' : `카드 ${state.queue.length}/3장 선택`);
    } catch (error) { console.error(error); toast('선택한 카드를 전송하지 못했습니다.'); }
  };
  const publishBattle = async (status = 'selecting', extra = {}) => {
    const deadline = status === 'selecting' ? Date.now() + roomSelectionSeconds(state.multiplayerRoom) * 1000 : null;
    await updateRoom({ battleState: serializeBattle(), status, round: state.round, turn: state.turn, lastFirst: state.lastFirst === 'player' ? 'host' : 'guest', hostQueue: [], guestQueue: [], hostReady: false, guestReady: false, selectionDeadline: deadline, ...extra });
  };
  const showMultiplayerResult = (winner) => {
    const localWin = winner === ownKey();
    state.gameOver = true; state.executing = false; state.resultWinnerSide = localWin ? 'player' : 'cpu';
    statusText('');
    toast(localWin ? '대전 승리! 타이틀로 돌아갑니다.' : '대전 패배. 타이틀로 돌아갑니다.');
    clearTimeout(resultReturnTimer);
    resultReturnTimer = setTimeout(() => {
      leaveRoom();
      state.selected = null;
      showScreen('start');
    }, 900);
    return;
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
    if (resolving || roomRole !== 'host' || state.queue.length !== 3 || state.cpuQueue.length !== 3 || !state.multiplayerReady || !state.multiplayerEnemyReady || state.gameOver) return;
    resolving = true; state.executing = true; state.previewCard = null;
    const actions = [];
    for (let slot = 0; slot < 3; slot += 1) {
      const pair = [
        { fighter: state.player, card: cardForHostResolution(state.player, cardById(state.queue[slot])) },
        { fighter: state.cpu, card: cardForHostResolution(state.cpu, cardById(state.cpuQueue[slot])) },
      ];
      pair.sort(compareActions); actions.push(...pair);
    }
    renderPriority(actions); renderBattle();
    updateRoom({ status: 'resolving', hostQueue: clone(state.queue), guestQueue: clone(state.cpuQueue), selectionDeadline: null }).catch(console.error);
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
        updateRoom({ battleState: serializeBattle(), status: 'resolving', turn: state.turn, lastFirst: state.lastFirst === 'player' ? 'host' : 'guest' }).catch(console.error);
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
    if (room.status === 'waiting') { setWaitingHostUi(roomRole === 'host'); lobby.hidden = roomRole === 'host'; setLobbyOpen(false); lobbyText(`방 코드 ${roomCode} · 상대 입장을 기다리는 중`); return; }
    setWaitingHostUi(false);
    if (room.status === 'partner-select') {
      showPartnerSelect(room);
      if (roomRole === 'host' && room.hostPokemonId && room.guestPokemonId) await hostInitializeBattle(room);
      return;
    }
    if (roomRole === 'host' && room.status === 'selecting' && (!room.battleState?.host || !room.battleState?.guest)) {
      await hostInitializeBattle(room); return;
    }
    const hostResolvingLocally = roomRole === 'host' && resolving && room.status === 'resolving';
    applyingSnapshot = !hostResolvingLocally;
    const ready = hostResolvingLocally || applyRoomBattle(room);
    applyingSnapshot = false;
    if (!ready) { statusText('방장이 전장을 준비하고 있습니다.'); return; }
    if (room.status === 'finished') { showMultiplayerResult(room.winnerSide); return; }
    if (state.screen !== 'battle') showScreen('battle');
    renderBattle();
    state.multiplayerRoom = room;
    if (room.status === 'selecting' && !Number(room.selectionDeadline) && roomRole === 'host' && !(room.hostQueue?.length === 3 && room.guestQueue?.length === 3)) {
      updateRoom({ selectionDeadline: Date.now() + roomSelectionSeconds(room) * 1000 }).catch(console.error);
    }
    syncSelectionTimer(room);
    if (room.status === 'resolving') statusText('양쪽 카드 공개 · 행동을 진행 중입니다.');
    else if (state.multiplayerReady && state.multiplayerEnemyReady) statusText('양쪽이 턴 실행을 확정했습니다.');
    else if (state.multiplayerReady) statusText('턴 실행 확정 · 상대의 확정을 기다리는 중입니다.');
    else if ((room[ownQueueKey()] || []).length === 3) statusText('카드 선택 완료 · 턴 실행을 눌러 확정하세요.');
    else statusText(`카드 ${state.queue.length}/3장 선택 · ${Math.max(0, Math.ceil((Number(room.selectionDeadline || 0) - Date.now()) / 1000))}초`);
    if (roomRole === 'host' && room.status === 'selecting' && room.hostQueue?.length === 3 && room.guestQueue?.length === 3 && room.hostReady && room.guestReady) runHostRound();
    checkDisconnect(room);
  };
  const subscribeRoom = () => {
    roomUnsubscribe?.();
    const service = firebase();
    roomUnsubscribe = service.api.onSnapshot(service.api.doc(service.db, ROOM_COLLECTION, roomCode), onRoom, (error) => { console.error(error); toast('대전방 연결이 끊겼습니다.'); });
  };

  createButton?.addEventListener('click', () => {
    lobby.hidden = false; setLobbyOpen(true);
    createConfig.hidden = false;
    roomEntryForm.hidden = true;
    selectionSecondsInput.value = String(DEFAULT_SELECTION_SECONDS);
    selectionSecondsOutput.textContent = `${DEFAULT_SELECTION_SECONDS}초`;
    lobbyText('라운드별 카드 선택 시간을 정하세요.');
  });
  selectionSecondsInput?.addEventListener('input', () => { selectionSecondsOutput.textContent = `${selectionSecondsInput.value}초`; });
  confirmRoomCreateButton?.addEventListener('click', () => makeRoom());
  leaveButton?.addEventListener('click', () => { leaveRoom(); lobby.hidden = true; setLobbyOpen(false); showScreen('start'); });
  openJoinButton?.addEventListener('click', openJoin);
  joinButton?.addEventListener('click', prepareJoin);
  codeInput?.addEventListener('input', () => { codeInput.value = codeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5); });
  codeInput?.addEventListener('keydown', (event) => { if (event.key === 'Enter') prepareJoin(); });
  document.querySelector('#confirm-selection')?.addEventListener('click', interceptSelectConfirm, true);
  document.addEventListener('click', (event) => {
    if (!isMulti()) return;
    if (event.target.closest('#advance-round')) {
      event.preventDefault(); event.stopImmediatePropagation();
      if (state.queue.length !== 3 || state.multiplayerReady || state.executing) return;
      state.multiplayerReady = true;
      renderBattle();
      updateRoom({ [ownQueueKey()]: clone(state.queue), [ownReadyKey()]: true, [`${ownKey()}ConnectedAt`]: Date.now() })
        .catch((error) => { console.error(error); state.multiplayerReady = false; renderBattle(); toast('턴 실행 확정에 실패했습니다.'); });
    }
    const queueButton = event.target.closest('#player-queue [data-queue-index]');
    if (queueButton && !state.executing && !state.multiplayerReady) {
      event.preventDefault(); event.stopImmediatePropagation();
      state.queue.splice(Number(queueButton.dataset.queueIndex), 1); state.previewCard = state.queue.at(-1) || null; renderBattle(); publishQueue();
    }
  }, true);
  const originalToggleCard = window.toggleCard;
  window.toggleCard = (id) => {
    if (isMulti() && state.multiplayerReady) { toast('턴 실행을 확정한 뒤에는 카드 순서를 바꿀 수 없습니다.'); return; }
    const result = originalToggleCard?.(id); if (isMulti()) publishQueue(); return result;
  };
  const originalClearQueue = window.clearQueue;
  window.clearQueue = () => {
    if (isMulti() && state.multiplayerReady) return;
    const result = originalClearQueue?.(); if (isMulti()) publishQueue(); return result;
  };
  const originalRenderQueue = window.renderQueue;
  window.renderQueue = () => {
    originalRenderQueue?.();
    if (!isMulti()) return;
    const ready = Boolean(state.multiplayerReady);
    const advance = document.querySelector('#advance-round');
    const clear = document.querySelector('#clear-queue');
    if (advance) {
      advance.disabled = state.queue.length !== 3 || state.gameOver || state.executing || ready;
      advance.innerHTML = ready ? '턴 실행 확정 <span>✓</span>' : '턴 실행 <span>→</span>';
    }
    if (clear) clear.hidden = ready || state.executing;
    document.querySelectorAll('#player-queue [data-queue-index]').forEach((slot) => { slot.disabled = ready || state.executing; });
  };
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
