(() => {
  const REWARD_POOL = [
    { id: 'front2', name: '\uC55E 2\uCE78', ko: '\uC815\uBA74\uC73C\uB85C \uB450 \uCE78 \uC774\uB3D9', icon: '\u21E5', kind: 'move', priority: 3, energy: 0, label: '\uC55E 2\uCE78', dx: 2, dy: 0, relative: 'front' },
    { id: 'up2', name: '\uC704 2\uCE78', ko: '\uC704\uB85C \uB450 \uCE78 \uC774\uB3D9', icon: '\u21C8', kind: 'move', priority: 3, energy: 0, label: '\uC704 2\uCE78', dx: 0, dy: -2 },
    { id: 'down2', name: '\uC544\uB798 2\uCE78', ko: '\uC544\uB798\uB85C \uB450 \uCE78 \uC774\uB3D9', icon: '\u21CA', kind: 'move', priority: 3, energy: 0, label: '\uC544\uB798 2\uCE78', dx: 0, dy: 2 },
    { id: 'diag-front-up', name: '\uB300\uAC01\uC120 \uC704', ko: '\uC815\uBA74 \uC704\uB85C \uB300\uAC01\uC120 \uC774\uB3D9', icon: '\u2197', kind: 'move', priority: 3, energy: 0, label: '\uB300\uAC01\uC120 \uC704', dx: 1, dy: -1, relative: 'front-diagonal' },
    { id: 'diag-front-down', name: '\uB300\uAC01\uC120 \uC544\uB798', ko: '\uC815\uBA74 \uC544\uB798\uB85C \uB300\uAC01\uC120 \uC774\uB3D9', icon: '\u2198', kind: 'move', priority: 3, energy: 0, label: '\uB300\uAC01\uC120 \uC544\uB798', dx: 1, dy: 1, relative: 'front-diagonal' },
    { id: 'max-hp-10', name: '\uCCB4\uB825 \uAC15\uD654', ko: '\uCD5C\uB300 \uCCB4\uB825 +10', icon: '\u2665', kind: 'upgrade', priority: 6, energy: 0, label: '\uCCB4\uB825 +10', upgrade: 'maxHp', amount: 10 },
    { id: 'max-energy-10', name: '\uC758\uC695 \uAC15\uD654', ko: '\uCD5C\uB300 \uC758\uC695 +10', icon: '\u26A1', kind: 'upgrade', priority: 6, energy: 0, label: '\uC758\uC695 +10', upgrade: 'maxEnergy', amount: 10 },
    { id: 'impact-crash', name: '\uAC15\uD0C0', ko: '\uAC15\uB825\uD55C \uCDA9\uB3CC', icon: '\u2739', kind: 'attack', priority: 5, energy: 25, label: '\uAC15\uD0C0', damage: 38, range: 1 },
    { id: 'pulse-shot', name: '\uD30C\uB3D9\uD0C4', ko: '\uBA40\uB9AC \uBC1C\uC0AC\uD558\uB294 \uD30C\uB3D9', icon: '\u2248', kind: 'attack', priority: 3, energy: 28, label: '\uD30C\uB3D9\uD0C4', damage: 36, range: 3 },
    { id: 'wide-burst', name: '\uD3ED\uBC1C \uD0C0\uACA9', ko: '\uB113\uAC8C \uD37C\uC9C0\uB294 \uD0C0\uACA9', icon: '\u2736', kind: 'attack', priority: 4, energy: 22, label: '\uD3ED\uBC1C \uD0C0\uACA9', damage: 32, range: 2 }
  ];

  state.playerBonusCards = state.playerBonusCards || [];
  state.cardEnhancements = state.cardEnhancements || {};
  state.playerMaxHp = state.playerMaxHp || 100;
  state.playerMaxEnergy = state.playerMaxEnergy || 100;
  state.pendingRecovery = null;
  state.rewardOffers = [];
  state.rewardSelected = null;
  state.stage = state.stage || 1;
  state.pendingStageAdvance = false;
  state.stageRewardHistory = state.stageRewardHistory || [];

  const ownedIds = () => new Set([
    ...(state.player?.attacks || []).map((card) => card.id),
    ...state.playerBonusCards.map((card) => card.id)
  ]);
  const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
  const enhancedCard = (card) => {
    if (!card) return card;
    const enhancement = state.cardEnhancements[card.id];
    if (!enhancement) return card;
    return {
      ...card,
      name: enhancement.level ? `${card.name} +${enhancement.level}` : card.name,
      label: enhancement.level ? `${card.label || card.name} +${enhancement.level}` : card.label,
      damage: Number.isFinite(card.damage) ? card.damage + (enhancement.damage || 0) : card.damage,
      energy: Math.max(0, (card.energy || 0) - (enhancement.energyReduction || 0)),
      priority: (card.priority || 0) + (enhancement.priority || 0)
    };
  };
  window.enhancedCard = enhancedCard;

  const cardByIdOriginal = window.cardById;
  window.cardById = (id) => enhancedCard(state.playerBonusCards.find((card) => card.id === id) || cardByIdOriginal?.(id));

  const getHandOriginal = window.getHand;
  window.getHand = (fighter) => {
    const base = getHandOriginal?.(fighter) || [];
    if (fighter?.side !== 'player') return base;
    return [...base, ...state.playerBonusCards].map(enhancedCard);
  };

  window.projectedEnergyForQueue = (queue) => {
    if (!state.player) return 0;
    let energy = state.player.energy;
    const maxEnergy = state.player.maxEnergy || state.playerMaxEnergy || 100;
    queue.forEach((id) => {
      const card = window.cardById(id);
      if (!card) return;
      energy = card.kind === 'energy' ? clamp(energy + card.restore, 0, maxEnergy) : Math.max(0, energy - card.energy);
    });
    return energy;
  };

  const movementDeltaOriginal = window.getMovementDelta;
  const movementDelta = (fighter, card) => {
    if (card?.relative === 'front') return { dx: fighter.side === 'player' ? 2 : -2, dy: 0 };
    if (card?.relative === 'front-diagonal') return { dx: fighter.side === 'player' ? card.dx : -card.dx, dy: card.dy };
    return movementDeltaOriginal?.(fighter, card) || { dx: card?.dx || 0, dy: card?.dy || 0 };
  };
  window.getMovementDelta = movementDelta;

  const showActionPreviewOriginal = window.showActionPreview;
  window.showActionPreview = (fighter, card) => {
    if (card?.kind === 'move' && (card.relative === 'front' || card.relative === 'front-diagonal')) {
      showActionPreviewOriginal?.(fighter, { ...card, ...movementDelta(fighter, card) });
      return;
    }
    showActionPreviewOriginal?.(fighter, card);
  };

  const resolveActionOriginal = window.resolveAction;
  window.resolveAction = (fighter, card) => {
    if (card?.kind === 'upgrade') {
      const amount = card.amount || 10;
      window.animateCombatAction?.(fighter, fighter, card, true);
      if (card.upgrade === 'maxHp') {
        fighter.maxHp = (fighter.maxHp || 100) + amount;
        fighter.hp = Math.min(fighter.maxHp, fighter.hp + amount);
        if (fighter.side === 'player') state.playerMaxHp = fighter.maxHp;
        writeLog(`${fighter.name}\uC758 \uCD5C\uB300 \uCCB4\uB825\uC774 ${amount}\uC99D\uAC00\uD588\uC2B5\uB2C8\uB2E4.`, 'evolution');
      } else if (card.upgrade === 'maxEnergy') {
        fighter.maxEnergy = (fighter.maxEnergy || 100) + amount;
        fighter.energy = Math.min(fighter.maxEnergy, fighter.energy + amount);
        if (fighter.side === 'player') state.playerMaxEnergy = fighter.maxEnergy;
        writeLog(`${fighter.name}\uC758 \uCD5C\uB300 \uC758\uC695\uC774 ${amount}\uC99D\uAC00\uD588\uC2B5\uB2C8\uB2E4.`, 'energy');
      }
      renderBattle();
      return;
    }
    const actionCard = card?.kind === 'move' && (card.relative === 'front' || card.relative === 'front-diagonal')
      ? { ...card, ...movementDelta(fighter, card) }
      : card;
    resolveActionOriginal?.(fighter, actionCard);
  };

  const rewardPanel = document.querySelector('#reward-panel');
  const rewardOptions = document.querySelector('#reward-options');
  const nextButton = document.querySelector('#next-battle');

  const hideReward = () => {
    if (rewardPanel) rewardPanel.hidden = true;
    if (nextButton) { nextButton.disabled = false; nextButton.innerHTML = '\uB2E4\uC74C \uC804\uD22C <span>→</span>'; }
  };

  const renderStageRewards = () => {
    const list = document.querySelector('#stage-choice-list');
    if (!list) return;
    if (!state.stageRewardHistory.length) {
      list.textContent = '\uC544\uC9C1 \uC120\uD0DD\uD55C \uBCF4\uC0C1\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.';
      return;
    }
    list.innerHTML = state.stageRewardHistory.map((entry) => `<i>${entry.stage} \uCE35 · ${entry.name}</i>`).join('');
  };

  const resetRunState = () => {
    state.playerBonusCards = [];
    state.cardEnhancements = {};
    state.playerMaxHp = 100;
    state.playerMaxEnergy = 100;
    state.pendingRecovery = null;
    state.rewardOffers = [];
    state.rewardSelected = null;
    state.stage = 1;
    state.pendingStageAdvance = false;
    state.stageRewardHistory = [];
    state.resultWinnerSide = null;
    state.score = 0;
    state.battleScore = 0;
    state.winStreak = 0;
    window.updateScore?.();
    hideReward();
    renderStageRewards();
  };
  window.resetRunState = resetRunState;

  const selectReward = (id) => {
    if (state.rewardSelected) return;
    const reward = state.rewardOffers.find((card) => card.id === id);
    if (!reward) return;
    state.rewardSelected = reward.id;
    if (reward.kind === 'card-upgrade') {
      const enhanced = state.cardEnhancements[reward.targetCardId] || { level: 0, damage: 0, energyReduction: 0, priority: 0 };
      state.cardEnhancements[reward.targetCardId] = {
        ...enhanced,
        level: enhanced.level + 1,
        damage: enhanced.damage + 6,
        energyReduction: enhanced.energyReduction + 2
      };
    } else if (reward.kind === 'upgrade') {
      const amount = reward.amount || 10;
      const maxKey = reward.upgrade === 'maxHp' ? 'maxHp' : 'maxEnergy';
      const currentKey = reward.upgrade === 'maxHp' ? 'hp' : 'energy';
      const stateMaxKey = reward.upgrade === 'maxHp' ? 'playerMaxHp' : 'playerMaxEnergy';
      state[stateMaxKey] = (state[stateMaxKey] || 100) + amount;
      if (state.player) {
        state.player[maxKey] = state[stateMaxKey];
        state.player[currentKey] = Math.min(state.player[maxKey], state.player[currentKey] + amount);
      }
      if (state.pendingRecovery) {
        state.pendingRecovery[maxKey] = state[stateMaxKey];
        state.pendingRecovery[currentKey] = Math.min(state[stateMaxKey], state.pendingRecovery[currentKey] + amount);
      }
    } else {
      state.playerBonusCards.push({ ...reward });
    }
    state.stageRewardHistory.push({ stage: state.stage || 1, name: reward.ko || reward.name });
    renderStageRewards();
    document.querySelectorAll('.reward-card').forEach((button) => button.classList.toggle('selected', button.dataset.reward === id));
    if (nextButton) { nextButton.disabled = false; nextButton.innerHTML = '\uB2E4\uC74C \uC804\uD22C <span>→</span>'; }
    const message = reward.kind === 'upgrade'
      ? `${reward.name} \uC2A4\uD0EF\uC774 \uC601\uAD6C \uC801\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`
      : reward.kind === 'card-upgrade'
        ? `${reward.name} \uCE74\uB4DC\uB97C \uAC15\uD654\uD588\uC2B5\uB2C8\uB2E4.`
        : `${reward.name} \uCE74\uB4DC\uB97C \uD68D\uB4DD\uD588\uC2B5\uB2C8\uB2E4.`;
    writeLog(message, 'evolution');
  };

  const showReward = () => {
    const fighter = state.player;
    if (!fighter || !rewardPanel || !rewardOptions) return;
    const maxHp = fighter.maxHp || state.playerMaxHp || 100;
    const maxEnergy = fighter.maxEnergy || state.playerMaxEnergy || 100;
    state.pendingRecovery = {
      hp: clamp(fighter.hp + 30, 0, maxHp),
      energy: clamp(fighter.energy + 30, 0, maxEnergy),
      maxHp,
      maxEnergy
    };
    state.pendingStageAdvance = true;
    const upgradeOffers = shuffle((getHand(fighter) || [])
      .filter((card) => card.kind === 'attack')
      .map((card) => ({
        id: `card-upgrade:${card.id}`,
        targetCardId: card.id,
        name: `${card.name} \uAC15\uD654`,
        ko: `\uD53C\uD574 +6 · \uC758\uC695 -2 (${card.name})`,
        icon: '\u2726',
        kind: 'card-upgrade'
      }))).slice(0, 4);
    state.rewardOffers = shuffle([...REWARD_POOL.filter((card) => !ownedIds().has(card.id)), ...upgradeOffers]).slice(0, 3);
    state.rewardSelected = null;
    rewardOptions.innerHTML = state.rewardOffers.map((card) => {
      const role = card.kind === 'attack' ? '\uACF5\uACA9' : card.kind === 'move' ? '\uC774\uB3D9' : card.kind === 'card-upgrade' ? '\uCE74\uB4DC \uAC15\uD654' : '\uC2A4\uD0EF \uAC15\uD654';
      const stat = card.kind === 'attack' ? `\uD53C\uD574 ${card.damage} · \uC758\uC695 ${card.energy} · \uC0AC\uAC70\uB9AC ${card.range} · \uC6B0\uC120 ${card.priority}` : card.ko;
      return `<button type="button" class="reward-card ${card.kind}" data-reward="${card.id}"><span class="card-badge">${role}</span><span class="card-icon">${card.icon}</span><strong>${card.name}</strong><small>${stat}</small></button>`;
    }).join('');
    rewardOptions.querySelectorAll('[data-reward]').forEach((button) => button.addEventListener('click', () => selectReward(button.dataset.reward)));
    rewardPanel.hidden = false;
    if (nextButton) { nextButton.disabled = true; nextButton.innerHTML = '\uCE74\uB4DC\uB97C \uC120\uD0DD\uD558\uC138\uC694'; }
  };

  const originalFinishBattle = window.finishBattle;
  window.finishBattle = (winner) => {
    hideReward();
    if (winner?.side !== 'player') {
      state.pendingStageAdvance = false;
      state.stage = 1;
      if (nextButton) {
        nextButton.disabled = false;
        nextButton.innerHTML = '\uB2E4\uC2DC \uC2DC\uC791 <span>↻</span>';
      }
    }
    originalFinishBattle?.(winner);
    setTimeout(() => {
      if (winner?.side === 'player') {
        showReward();
      }
    }, 760);
  };

  const applyPersistentStats = () => {
    if (!state.player) return;
    state.player.maxHp = state.playerMaxHp || 100;
    state.player.maxEnergy = state.playerMaxEnergy || 100;
    if (state.pendingRecovery) {
      state.player.hp = Math.min(state.player.maxHp, state.pendingRecovery.hp);
      state.player.energy = Math.min(state.player.maxEnergy, state.pendingRecovery.energy);
      state.pendingRecovery = null;
    }
    renderBattle();
  };

  const updateStage = () => {
    const stage = document.querySelector('#stage-number');
    if (stage) stage.textContent = `${state.stage || 1} \uCE35`;
  };

  const advanceStage = () => {
    if (!state.pendingStageAdvance) return;
    state.stage = (state.stage || 1) + 1;
    state.pendingStageAdvance = false;
  };

  const applyStageDifficulty = () => {
    const enemy = state.cpu;
    if (!enemy) return;
    const level = Math.max(0, (state.stage || 1) - 1);
    const attackScale = 1 + level * 0.08;
    enemy.stage = state.stage || 1;
    enemy.maxHp = 100 + level * 12;
    enemy.hp = enemy.maxHp;
    enemy.maxEnergy = 100 + level * 8;
    enemy.energy = enemy.maxEnergy;
    enemy.attacks = (enemy.attacks || []).map((card) => {
      const baseDamage = Number.isFinite(card.stageBaseDamage) ? card.stageBaseDamage : card.damage;
      return Number.isFinite(baseDamage) ? { ...card, stageBaseDamage: baseDamage, damage: Math.round(baseDamage * attackScale) } : card;
    });
    updateStage();
  };

  const startNextBattleOriginal = window.startNextBattle;
  window.startNextBattle = (...args) => {
    advanceStage();
    const result = startNextBattleOriginal?.(...args);
    applyPersistentStats();
    applyStageDifficulty();
    return result;
  };

  nextButton?.addEventListener('click', () => setTimeout(() => {
    if (state.resultWinnerSide !== 'player') return;
    advanceStage();
    applyPersistentStats();
    applyStageDifficulty();
  }, 0));
  document.querySelector('.brand')?.addEventListener('click', () => {
    resetRunState();
  });

  updateStage();
  hideReward();
  renderStageRewards();
})();
