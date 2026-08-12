(() => {
  const FIELD_ITEMS = [
    { id: 'sitrus-berry', name: '\uC790\uB465\uC5F4\uB9E4', kind: 'heal', amount: 12, image: 'assets/items/sitrus-berry.png', description: '3\uB77C\uC6B4\uB4DC \uB3D9\uC548 \uB77C\uC6B4\uB4DC\uB9C8\uB2E4 \uCCB4\uB825 +12' },
    { id: 'x-attack', name: '\uD50C\uB7EC\uC2A4\uD30C\uC6CC', kind: 'attack', amount: 0.3, image: 'assets/items/x-attack.png', description: '3\uB77C\uC6B4\uB4DC \uB3D9\uC548 \uACF5\uACA9 \uD53C\uD574 +30%' },
    { id: 'ether', name: 'PP\uC5D0\uC774\uB4DC', kind: 'energy', amount: 15, image: 'assets/items/ether.png', description: '3\uB77C\uC6B4\uB4DC \uB3D9\uC548 \uB77C\uC6B4\uB4DC\uB9C8\uB2E4 \uC758\uC695 +15' },
    { id: 'x-defense', name: '\uB514\uD39C\uB4DC\uC5C5', kind: 'defense', amount: 0.15, image: 'assets/items/x-defense.png', description: '3\uB77C\uC6B4\uB4DC \uB3D9\uC548 \uBC29\uC5B4 \uAC10\uC18C\uC728 65%' },
  ];
  const ITEM_DURATION = 3;
  const randomInterval = () => 5 + Math.floor(Math.random() * 4);
  const currentEffects = (fighter) => fighter?.fieldItemEffects || [];
  const findEffect = (fighter, kind) => currentEffects(fighter).find((effect) => effect.kind === kind && effect.roundsLeft > 0);
  const itemAt = (fighter) => state.fieldItems?.findIndex((item) => item.x === fighter.x && item.y === fighter.y) ?? -1;

  const restore = (fighter, stat, amount) => {
    const max = stat === 'hp' ? fighter.maxHp || 100 : fighter.maxEnergy || 100;
    fighter[stat] = clamp(fighter[stat] + amount, 0, max);
  };

  const resetFieldItems = () => {
    state.fieldItems = [];
    state.nextFieldItemRound = randomInterval();
  };

  const spawnFieldItem = () => {
    const occupied = new Set((state.fieldItems || []).map((item) => `${item.x},${item.y}`));
    const candidates = [];
    for (let y = 0; y < 5; y += 1) {
      for (let x = 0; x < 6; x += 1) {
        const key = `${x},${y}`;
        if (occupied.has(key) || state.hazard?.has(key)) continue;
        if ((state.player?.x === x && state.player?.y === y) || (state.cpu?.x === x && state.cpu?.y === y)) continue;
        candidates.push({ x, y });
      }
    }
    if (!candidates.length) return;
    const position = candidates[Math.floor(Math.random() * candidates.length)];
    const item = FIELD_ITEMS[Math.floor(Math.random() * FIELD_ITEMS.length)];
    state.fieldItems = [...(state.fieldItems || []), { ...item, ...position }].slice(-2);
    writeLog(`\uC804\uC7A5\uC5D0 ${item.name}\uC774(\uAC00) \uB4F1\uC7A5\uD588\uC2B5\uB2C8\uB2E4. \uC774\uB3D9\uD574 \uD68D\uB4DD\uD558\uC138\uC694.`, 'energy');
  };

  const collectFieldItem = (fighter) => {
    const index = itemAt(fighter);
    if (index < 0 || fighter.hp <= 0) return false;
    const item = state.fieldItems[index];
    state.fieldItems.splice(index, 1);
    fighter.fieldItemEffects = currentEffects(fighter).filter((effect) => effect.kind !== item.kind);
    fighter.fieldItemEffects.push({ ...item, roundsLeft: ITEM_DURATION });
    if (item.kind === 'heal') restore(fighter, 'hp', item.amount);
    if (item.kind === 'energy') restore(fighter, 'energy', item.amount);
    writeLog(`${fighter.name}\uC774(\uAC00) ${item.name}\uC744(\uB97C) \uD68D\uB4DD! ${item.description}`, 'energy');
    renderBattle();
    return true;
  };

  const advanceEffects = (fighter) => {
    if (!fighter?.fieldItemEffects?.length) return;
    const active = [];
    fighter.fieldItemEffects.forEach((effect) => {
      effect.roundsLeft -= 1;
      if (effect.roundsLeft <= 0) {
        writeLog(`${fighter.name}\uC758 ${effect.name} \uD6A8\uACFC\uAC00 \uB05D\uB0AC\uC2B5\uB2C8\uB2E4.`);
        return;
      }
      if (effect.kind === 'heal') restore(fighter, 'hp', effect.amount);
      if (effect.kind === 'energy') restore(fighter, 'energy', effect.amount);
      if (effect.kind === 'heal' || effect.kind === 'energy') writeLog(`${fighter.name}\uC758 ${effect.name} \uD6A8\uACFC! ${effect.kind === 'heal' ? '\uCCB4\uB825' : '\uC758\uC695'} +${effect.amount}.`, 'energy');
      active.push(effect);
    });
    fighter.fieldItemEffects = active;
  };

  window.getGuardMultiplier = (fighter) => {
    if (!fighter?.guarding) return 1;
    return findEffect(fighter, 'defense') ? 0.35 : 0.5;
  };

  const originalRenderGrid = window.renderGrid;
  window.renderGrid = () => {
    originalRenderGrid?.();
    (state.fieldItems || []).forEach((item) => {
      const cell = [...document.querySelectorAll('#battle-grid .grid-cell')].find((node) => Number(node.dataset.x) === item.x && Number(node.dataset.y) === item.y);
      if (!cell) return;
      const token = document.createElement('span');
      token.className = `field-item field-item-${item.kind}`;
      token.title = `${item.name}: ${item.description}`;
      token.setAttribute('aria-label', `${item.name}: ${item.description}`);
      token.innerHTML = `<img src="${item.image}" alt="${item.name}" />`;
      cell.append(token);
    });
  };

  const originalRenderHud = window.renderHud;
  window.renderHud = (fighter, selector) => {
    originalRenderHud?.(fighter, selector);
    const hud = document.querySelector(selector);
    const effects = currentEffects(fighter);
    if (!hud || !effects.length) return;
    const list = document.createElement('div');
    list.className = 'battle-item-effects';
    list.innerHTML = effects.map((effect) => `<span class="battle-item-effect ${effect.kind}"><img src="${effect.image}" alt="" /><b>${effect.name}</b><i>${effect.roundsLeft}R</i></span>`).join('');
    hud.append(list);
  };

  const originalResolveAction = window.resolveAction;
  window.resolveAction = (fighter, card) => {
    const attackBoost = card?.kind === 'attack' ? findEffect(fighter, 'attack') : null;
    const actionCard = attackBoost ? { ...card, damage: Math.round(card.damage * (1 + attackBoost.amount)) } : card;
    const before = { x: fighter?.x, y: fighter?.y };
    const result = originalResolveAction?.(fighter, actionCard);
    if (fighter && (fighter.x !== before.x || fighter.y !== before.y)) collectFieldItem(fighter);
    return result;
  };

  const originalFinishRound = window.finishRound;
  window.finishRound = () => {
    const result = originalFinishRound?.();
    if (state.gameOver) return result;
    [state.player, state.cpu].forEach(advanceEffects);
    if (state.round >= state.nextFieldItemRound) {
      spawnFieldItem();
      state.nextFieldItemRound = state.round + randomInterval();
    }
    renderBattle();
    return result;
  };

  const originalStartBattle = window.startBattle;
  window.startBattle = (...args) => {
    resetFieldItems();
    return originalStartBattle?.(...args);
  };
  const originalStartNextBattle = window.startNextBattle;
  window.startNextBattle = (...args) => {
    resetFieldItems();
    return originalStartNextBattle?.(...args);
  };
})();
