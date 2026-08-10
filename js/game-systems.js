(() => {
  const PASSIVES = {
    bulbasaur: { name: '새싹 보호', description: '라운드마다 첫 방어 후 체력 5 회복', trigger: 'guard-heal' },
    charmander: { name: '불씨 증폭', description: '불타는 칸의 적 공격 시 피해 +6', trigger: 'burning-attack' },
    squirtle: { name: '등껍질 충전', description: '방어 후 의욕 10 회복', trigger: 'guard-energy' },
    chikorita: { name: '향긋한 회복', description: '의욕 충전량 +10', trigger: 'energy-boost' },
    cyndaquil: { name: '배수의 불꽃', description: '체력 50% 이하일 때 공격 피해 +7', trigger: 'low-hp-attack' },
    totodile: { name: '난폭한 이빨', description: '인접 공격 피해 +6', trigger: 'adjacent-attack' },
    treecko: { name: '민첩한 발놀림', description: '이동 성공 후 의욕 8 회복', trigger: 'move-energy' },
    torchic: { name: '열기', description: '상대 의욕 35 이하일 때 공격 피해 +6', trigger: 'low-energy-attack' },
    mudkip: { name: '진흙 보호', description: '불타는 칸에서 행동한 뒤 체력 10 회복', trigger: 'hazard-recover' },
    turtwig: { name: '단단한 껍질', description: '방어 후 체력 7 회복', trigger: 'guard-heal-strong' },
    chimchar: { name: '연속 타격', description: '공격 적중 시 진화 게이지 +8', trigger: 'attack-gauge' },
    piplup: { name: '왕관의 여유', description: '공격 카드 의욕 소모 -3', trigger: 'attack-discount' }
  };

  POKEMON.forEach((pokemon) => { pokemon.passive = PASSIVES[pokemon.id] || { name: '전투 본능', description: '전투 중 숨은 힘을 발휘합니다.', trigger: 'none' }; });
  const passiveOf = (fighter) => fighter?.passive || PASSIVES[fighter?.baseId || fighter?.id];
  const cap = (fighter, stat, amount) => Math.min(fighter?.[stat === 'hp' ? 'maxHp' : 'maxEnergy'] || 100, (fighter?.[stat] || 0) + amount);
  const isBurning = (fighter) => state.hazard?.has(`${fighter.x},${fighter.y}`);

  const renderRosterOriginal = window.renderRoster;
  window.renderRoster = (...args) => {
    const result = renderRosterOriginal?.(...args);
    document.querySelectorAll('#pokemon-roster [data-pokemon]').forEach((card) => {
      const pokemon = POKEMON.find((item) => item.id === card.dataset.pokemon);
      const passive = pokemon?.passive;
      if (!passive || card.querySelector('.passive-skill')) return;
      card.insertAdjacentHTML('beforeend', `<span class="passive-skill"><b>특성 · ${passive.name}</b><br />${passive.description}</span>`);
    });
    return result;
  };

  const renderHudOriginal = window.renderHud;
  window.renderHud = (fighter, selector) => {
    const result = renderHudOriginal?.(fighter, selector);
    const hud = document.querySelector(selector);
    const info = hud?.querySelector('.fighter-main > div:last-child');
    const passive = passiveOf(fighter);
    if (!info || !passive) return result;
    info.querySelector('.fighter-passive')?.remove();
    info.insertAdjacentHTML('beforeend', `<span class="fighter-passive"><b>특성 · ${passive.name}</b><span>${passive.description}</span></span>`);
    return result;
  };

  const resolveActionOriginal = window.resolveAction;
  window.resolveAction = (fighter, card) => {
    const passive = passiveOf(fighter);
    const target = opponentOf(fighter);
    const before = { hp: fighter.hp, energy: fighter.energy, targetHp: target?.hp, burning: isBurning(fighter), x: fighter.x, y: fighter.y };
    let actionCard = card;

    if (passive?.trigger === 'burning-attack' && card?.kind === 'attack' && target && isBurning(target)) actionCard = { ...card, damage: card.damage + 6 };
    if (passive?.trigger === 'low-hp-attack' && card?.kind === 'attack' && fighter.hp <= (fighter.maxHp || 100) * 0.5) actionCard = { ...card, damage: card.damage + 7 };
    if (passive?.trigger === 'adjacent-attack' && card?.kind === 'attack' && target && Math.abs(fighter.x - target.x) + Math.abs(fighter.y - target.y) <= 1) actionCard = { ...card, damage: card.damage + 6 };
    if (passive?.trigger === 'low-energy-attack' && card?.kind === 'attack' && target?.energy <= 35) actionCard = { ...card, damage: card.damage + 6 };
    if (passive?.trigger === 'energy-boost' && card?.kind === 'energy') actionCard = { ...card, restore: (card.restore || 0) + 10 };
    if (passive?.trigger === 'attack-discount' && card?.kind === 'attack') actionCard = { ...card, energy: Math.max(0, card.energy - 3) };

    resolveActionOriginal?.(fighter, actionCard);
    if (fighter.hp <= 0 || before.energy === fighter.energy && actionCard?.energy > before.energy) return;

    if (passive?.trigger === 'guard-energy' && actionCard?.kind === 'guard' && fighter.guarding) fighter.energy = cap(fighter, 'energy', 10);
    if (passive?.trigger === 'guard-heal' && actionCard?.kind === 'guard' && fighter.guarding && fighter.passiveRound !== state.round) {
      fighter.hp = cap(fighter, 'hp', 5); fighter.passiveRound = state.round;
    }
    if (passive?.trigger === 'guard-heal-strong' && actionCard?.kind === 'guard' && fighter.guarding) fighter.hp = cap(fighter, 'hp', 7);
    if (passive?.trigger === 'move-energy' && actionCard?.kind === 'move' && (fighter.x !== before.x || fighter.y !== before.y)) fighter.energy = cap(fighter, 'energy', 8);
    if (passive?.trigger === 'hazard-recover' && before.burning && fighter.hp > 0) fighter.hp = cap(fighter, 'hp', 10);
    if (passive?.trigger === 'attack-gauge' && actionCard?.kind === 'attack' && target && before.targetHp > target.hp) window.chargeEvolution?.(fighter, 8, 'passive');
  };

  const PERSONALITIES = ['aggressive', 'cautious', 'skirmisher', 'tactician'];
  const assignPersonality = () => {
    if (state.cpu) state.cpu.aiPersonality = PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];
  };
  const startBattleOriginal = window.startBattle;
  window.startBattle = (...args) => { const result = startBattleOriginal?.(...args); assignPersonality(); return result; };
  const startNextBattleOriginal = window.startNextBattle;
  window.startNextBattle = (...args) => {
    const result = startNextBattleOriginal?.(...args);
    assignPersonality();
    if (state.eventGaugeBonus && state.player) {
      window.chargeEvolution?.(state.player, state.eventGaugeBonus, 'event');
      state.eventGaugeBonus = 0;
      renderBattle();
    }
    return result;
  };

  const resetRunStateOriginal = window.resetRunState;
  window.resetRunState = (...args) => {
    const result = resetRunStateOriginal?.(...args);
    state.eventResolvedStage = null;
    state.eventGaugeBonus = 0;
    state.eventStage = null;
    state.eventChosen = false;
    eventPanel?.setAttribute('hidden', '');
    return result;
  };

  const chooseCpuQueueOriginal = window.chooseCpuQueue;
  window.chooseCpuQueue = () => {
    const cpu = state.cpu; const player = state.player;
    const base = chooseCpuQueueOriginal?.() || [];
    if (!cpu || !player) return base;
    const cards = getHand(cpu) || [];
    const affordable = cards.filter((card) => card.energy <= cpu.energy);
    const attacks = affordable.filter((card) => card.kind === 'attack' && attackPatternContains(cpu, player, card)).sort((a, b) => b.damage - a.damage || b.priority - a.priority);
    const guard = affordable.find((card) => card.kind === 'guard');
    const energy = affordable.find((card) => card.kind === 'energy');
    const move = affordable.find((card) => card.kind === 'move' && card.id === 'back2') || affordable.find((card) => card.kind === 'move');
    const fill = (seed) => [...seed, ...base, ...attacks.map((card) => card.id)].filter(Boolean).slice(0, 3);
    if (cpu.aiPersonality === 'aggressive' && player.hp <= Math.max(55, cpu.hp)) return fill([attacks[0]?.id, attacks[0]?.id, attacks[1]?.id]);
    if (cpu.aiPersonality === 'cautious' && cpu.hp <= (cpu.maxHp || 100) * 0.5) return fill([guard?.id, energy?.id, attacks[0]?.id]);
    if (cpu.aiPersonality === 'skirmisher' && Math.abs(cpu.x - player.x) + Math.abs(cpu.y - player.y) <= 1) return fill([move?.id, attacks[0]?.id]);
    return base;
  };

  const eventPanel = document.querySelector('#stage-event-panel');
  const eventOptions = document.querySelector('#stage-event-options');
  const eventTitle = document.querySelector('#stage-event-title');
  const eventCopy = document.querySelector('#stage-event-copy');
  const nextButton = document.querySelector('#next-battle');
  const rewardPanel = document.querySelector('#reward-panel');
  const renderStageHistory = () => {
    const list = document.querySelector('#stage-choice-list');
    if (list && state.stageRewardHistory) list.innerHTML = state.stageRewardHistory.map((entry) => `<i>${entry.stage} 층 · ${entry.name}</i>`).join('');
  };
  const chooseEvent = (event) => {
    const player = state.player;
    if (!player || state.eventChosen) return;
    state.eventChosen = true;
    if (event.id === 'camp') {
      state.pendingRecovery.hp = Math.min(state.pendingRecovery.maxHp, state.pendingRecovery.hp + 18);
      state.pendingRecovery.energy = Math.min(state.pendingRecovery.maxEnergy, state.pendingRecovery.energy + 18);
    } else if (event.id === 'training') {
      state.eventGaugeBonus = 25;
    } else if (event.id === 'forge') {
      const target = (getHand(player) || []).filter((card) => card.kind === 'attack')[Math.floor(Math.random() * Math.max(1, (getHand(player) || []).filter((card) => card.kind === 'attack').length))];
      if (target) {
        const current = state.cardEnhancements[target.id] || { level: 0, damage: 0, energyReduction: 0 };
        state.cardEnhancements[target.id] = { ...current, level: current.level + 1, damage: current.damage + 4, energyReduction: current.energyReduction + 1 };
      }
    }
    state.stageRewardHistory.push({ stage: state.eventStage, name: event.name });
    renderStageHistory();
    eventPanel.hidden = true;
    nextButton.hidden = false;
    writeLog(`${event.name} 효과를 얻었습니다.`, 'evolution');
    window.startNextBattle();
  };
  const showStageEvent = (stage) => {
    if (!eventPanel || !eventOptions) return;
    state.eventStage = stage;
    state.eventChosen = false;
    rewardPanel.hidden = true;
    nextButton.hidden = true;
    eventTitle.textContent = `${stage} 층 · 낯선 갈림길`;
    eventCopy.textContent = '다음 전투 전, 하나의 선택으로 원정을 준비하세요.';
    const events = [
      { id: 'camp', name: '야영지', description: '다음 전투 시작 체력·의욕 +18' },
      { id: 'training', name: '특훈', description: '다음 전투 진화 게이지 +25' },
      { id: 'forge', name: '기술 연마', description: '보유 공격 카드 하나를 무작위로 강화' }
    ];
    eventOptions.innerHTML = events.map((event) => `<button class="stage-event-option" type="button" data-event="${event.id}"><b>${event.name}</b><span>${event.description}</span></button>`).join('');
    eventOptions.querySelectorAll('[data-event]').forEach((button) => button.addEventListener('click', () => chooseEvent(events.find((event) => event.id === button.dataset.event))));
    eventPanel.hidden = false;
  };
  nextButton?.addEventListener('click', (event) => {
    const nextStage = (state.stage || 1) + 1;
    if (state.resultWinnerSide !== 'player' || !state.pendingStageAdvance || !state.rewardSelected || nextStage % 3 !== 0 || state.eventResolvedStage === nextStage) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    state.eventResolvedStage = nextStage;
    showStageEvent(nextStage);
  }, true);

  window.renderRoster();
})();
