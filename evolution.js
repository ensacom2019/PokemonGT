(() => {
  const EVOLUTION_THRESHOLD = 100;
  const EVOLUTION_CARD_ID = 'evolution';
  const BACKSTEP_CARD_ID = 'back2';

  const EVOLUTION_DATA = {
    bulbasaur: {
      id: 'venusaur', name: '\uC774\uC0C1\uD574\uAF43', ko: '\uC774\uC0C1\uD574\uAF43', type: '\uD480', className: 'grass', image: 'assets/pokemon/evolved/venusaur.png',
      attack: { id: 'venusaur-petal-blizzard', name: '\uAF43\uC78E\uD3ED\uD48D', ko: '\uD654\uB824\uD55C \uAF43\uC78E \uD3ED\uD48D', icon: '\u2748', kind: 'attack', priority: 4, energy: 36, label: '\uAF43\uC78E\uD3ED\uD48D', damage: 55, range: 2 },
      upgrades: { 'bulbasaur-vine-whip': { name: '\uB369\uAD74\uCC44\uCC0D+', ko: '\uAC15\uB825\uD55C \uB369\uAD74', damage: 30, energy: 20, range: 2 }, 'bulbasaur-razor-leaf': { name: '\uC78E\uB0A0\uAC00\uB974\uAE30+', ko: '\uBE60\uB974\uAC8C \uB3CC\uC544\uC624\uB294 \uC78E', damage: 39, energy: 25, range: 3 }, 'bulbasaur-seed-bomb': { name: '\uC528\uD3ED\uD0C4+', ko: '\uD3ED\uBC1C\uD558\uB294 \uC528\uC557', damage: 50, energy: 32, range: 3 } }
    },
    charmander: {
      id: 'charizard', name: '\uB9AC\uC790\uBABD', ko: '\uB9AC\uC790\uBABD', type: '\uBD88\uAF43', className: 'fire', image: 'assets/pokemon/evolved/charizard.png',
      attack: { id: 'charizard-dragon-claw', name: '\uB4DC\uB798\uACE4\uD06C\uB8E8', ko: '\uD558\uB298\uC744 \uAC00\uB974\uB294 \uD1B5\uCC30', icon: '\u2694', kind: 'attack', priority: 5, energy: 38, label: '\uB4DC\uB798\uACE4\uD06C\uB8E8', damage: 58, range: 2 },
      upgrades: { 'charmander-ember': { name: '\uBD88\uAF43\uC138\uB840+', ko: '\uD06C\uACE0 \uB728\uAC70\uC6B4 \uBD88\uAF43', damage: 32, energy: 20, range: 3 }, 'charmander-fire-fang': { name: '\uBD88\uAF43\uC5C4\uB2C8+', ko: '\uD654\uC5FC\uC73C\uB85C \uBB34\uB294 \uC774\uBE68', damage: 42, energy: 27, range: 2 }, 'charmander-flamethrower': { name: '\uD654\uC5FC\uBC29\uC0AC+', ko: '\uB113\uAC8C \uD3B8 \uD654\uC5FC \uBD84\uC0AC', damage: 55, energy: 36, range: 3 } }
    },
    squirtle: {
      id: 'blastoise', name: '\uAC70\uBD81\uC655', ko: '\uAC70\uBD81\uC655', type: '\uBB3C', className: 'water', image: 'assets/pokemon/evolved/blastoise.png',
      attack: { id: 'blastoise-surf', name: '\uD30C\uB3C4\uD0C0\uAE30', ko: '\uD070 \uD30C\uB3C4\uB85C \uB36E\uCE58\uAE30', icon: '\u2248', kind: 'attack', priority: 4, energy: 40, label: '\uD30C\uB3C4\uD0C0\uAE30', damage: 60, range: 3 },
      upgrades: { 'squirtle-water-gun': { name: '\uBB3C\uB300\uD3EC+', ko: '\uC555\uCD95\uB41C \uBB3C\uC904\uAE30', damage: 31, energy: 20, range: 3 }, 'squirtle-bite': { name: '\uBB3C\uAE30+', ko: '\uB354 \uAC15\uB825\uD55C \uBB3C\uAE30', damage: 38, energy: 26, range: 2 }, 'squirtle-aqua-tail': { name: '\uC544\uCFE0\uC544\uD14C\uC77C+', ko: '\uC18C\uC6A9\uB3CC\uC774 \uBB3C\uAF2C\uB9AC', damage: 52, energy: 34, range: 3 } }
    },
    chikorita: {
      id: 'meganium', name: '\uBA54\uAC00\uB2C8\uC6C0', ko: '\uBA54\uAC00\uB2C8\uC6C0', type: '\uD480', className: 'grass', image: 'assets/pokemon/evolved/meganium.png',
      attack: { id: 'meganium-flower-bloom', name: '\uBA54\uAC00\uB2C8\uC6C0\uC758 \uAF43', ko: '\uD5A5\uAE30\uB85C \uAC00\uB4DD\uD55C \uAF43\uC78E', icon: '\u273F', kind: 'attack', priority: 4, energy: 40, label: '\uBA54\uAC00\uB2C8\uC6C0\uC758 \uAF43', damage: 60, range: 2 },
      upgrades: { 'chikorita-razor-leaf': { name: '\uC78E\uB0A0\uAC00\uB974\uAE30+', ko: '\uBE60\uB974\uAC8C \uB3CC\uC544\uC624\uB294 \uC78E', damage: 30, energy: 20, range: 3 }, 'chikorita-magical-leaf': { name: '\uB9E4\uC9C0\uCEEC\uB9AC\uD504+', ko: '\uC720\uB3C4\uB418\uB294 \uB9C8\uBC95 \uC78E', damage: 40, energy: 27, range: 3 }, 'chikorita-petal-dance': { name: '\uAF43\uC78E\uB304\uC2A4+', ko: '\uD3ED\uD48D\uCC98\uB7FC \uBAB0\uC544\uCE58\uB294 \uAF43', damage: 56, energy: 37, range: 3 } }
    },
    cyndaquil: {
      id: 'typhlosion', name: '\uBE14\uB808\uC774\uBC94', ko: '\uBE14\uB808\uC774\uBC94', type: '\uBD88\uAF43', className: 'fire', image: 'assets/pokemon/evolved/typhlosion.png',
      attack: { id: 'typhlosion-eruption', name: '\uBD84\uD654', ko: '\uC9C0\uBA74\uC744 \uB6AB\uACE0 \uD130\uC9C0\uB294 \uBD84\uD654', icon: '\u2739', kind: 'attack', priority: 4, energy: 42, label: '\uBD84\uD654', damage: 64, range: 3 },
      upgrades: { 'cyndaquil-ember': { name: '\uBD88\uAF43\uC138\uB840+', ko: '\uD06C\uACE0 \uB728\uAC70\uC6B4 \uBD88\uAF43', damage: 32, energy: 20, range: 3 }, 'cyndaquil-flame-wheel': { name: '\uBD88\uAF43\uBC14\uD034+', ko: '\uD68C\uC804\uD558\uB294 \uBD88\uAF43', damage: 43, energy: 28, range: 2 }, 'cyndaquil-flamethrower': { name: '\uD654\uC5FC\uBC29\uC0AC+', ko: '\uB113\uAC8C \uD3B8 \uD654\uC5FC \uBD84\uC0AC', damage: 54, energy: 36, range: 3 } }
    },
    totodile: {
      id: 'feraligatr', name: '\uC7A5\uD06C\uB85C\uB2E4\uC77C', ko: '\uC7A5\uD06C\uB85C\uB2E4\uC77C', type: '\uBB3C', className: 'water', image: 'assets/pokemon/evolved/feraligatr.png',
      attack: { id: 'feraligatr-waterfall', name: '\uD3ED\uD3EC\uC624\uB974\uAE30', ko: '\uD3ED\uD3EC\uCC98\uB7FC \uB36E\uCE58\uB294 \uBB3C', icon: '\u21C8', kind: 'attack', priority: 4, energy: 40, label: '\uD3ED\uD3EC\uC624\uB974\uAE30', damage: 62, range: 2 },
      upgrades: { 'totodile-water-gun': { name: '\uBB3C\uB300\uD3EC+', ko: '\uC555\uCD95\uB41C \uBB3C\uC904\uAE30', damage: 31, energy: 20, range: 3 }, 'totodile-bite': { name: '\uBB3C\uAE30+', ko: '\uB354 \uAC15\uB825\uD55C \uBB3C\uAE30', damage: 41, energy: 26, range: 2 }, 'totodile-aqua-tail': { name: '\uC544\uCFE0\uC544\uD14C\uC77C+', ko: '\uC18C\uC6A9\uB3CC\uC774 \uBB3C\uAF2C\uB9AC', damage: 54, energy: 34, range: 3 } }
    }
  };

  const EVOLUTION_CARD = { id: EVOLUTION_CARD_ID, name: '\uC9C4\uD654', ko: '\uC9C4\uD654\uD558\uC5EC \uAC15\uD654', icon: '\u2726', kind: 'evolution', priority: 7, energy: 0, label: '\uC9C4\uD654' };
  const BACKSTEP_CARD = { id: BACKSTEP_CARD_ID, name: '\uB4A4\uB85C 2\uCE78', ko: '\uB4A4\uB85C \uB450 \uCE78 \uC774\uB3D9', icon: '\u21C7', kind: 'move', priority: 3, energy: 0, label: '\uB4A4\uB85C 2\uCE78', dx: -2, dy: 0, relative: 'back' };

  if (!CARDS.some((card) => card.id === BACKSTEP_CARD_ID)) CARDS.push(BACKSTEP_CARD);
  if (!CARDS.some((card) => card.id === EVOLUTION_CARD_ID)) CARDS.push(EVOLUTION_CARD);
  const guardCard = CARDS.find((card) => card.id === 'guard');
  if (guardCard) guardCard.ko = '\uD53C\uD574 50% \uAC10\uC18C';
  const energyCard = CARDS.find((card) => card.id === 'energy');
  if (energyCard) { energyCard.ko = '\uC758\uC695 +30'; energyCard.restore = 30; }

  const ensureFighter = (fighter) => {
    if (!fighter) return fighter;
    if (!Number.isFinite(fighter.evolutionGauge)) fighter.evolutionGauge = 0;
    if (typeof fighter.evolved !== 'boolean') fighter.evolved = false;
    if (typeof fighter.evolutionReady !== 'boolean') fighter.evolutionReady = false;
    if (!fighter.baseId) fighter.baseId = fighter.id;
    return fighter;
  };

  const typeOf = (fighter) => String(fighter?.className || fighter?.type || '').toLowerCase();
  const chargeEvolution = (fighter, amount, reason = '') => {
    ensureFighter(fighter);
    if (!fighter || fighter.evolved || amount <= 0) return;
    const before = fighter.evolutionGauge;
    fighter.evolutionGauge = clamp(fighter.evolutionGauge + amount, 0, EVOLUTION_THRESHOLD);
    if (!fighter.evolutionReady && fighter.evolutionGauge >= EVOLUTION_THRESHOLD) {
      fighter.evolutionReady = true;
      writeLog(`${fighter.name}\uC758 \uC9C4\uD654 \uAC8C\uC774\uC9C0\uAC00 \uAC00\uB4DD \uCC28\uC9C4\uD654 \uCE74\uB4DC\uAC00 \uCD94\uAC00\uB429\uB2C8\uB2E4.`, 'evolution');
    } else if (before !== fighter.evolutionGauge && reason === 'round') {
      writeLog(`\uB77C\uC6B4\uB4DC \uC885\uB8CC \uC9C4\uD654 \uAC8C\uC774\uC9C0 +${amount}.`, 'evolution');
    }
  };

  const movementDelta = (fighter, card) => {
    if (card?.relative === 'back') return { dx: fighter.side === 'player' ? -2 : 2, dy: 0 };
    return { dx: card?.dx || 0, dy: card?.dy || 0 };
  };
  const canMoveFromCard = (fighter, card) => {
    const delta = movementDelta(fighter, card);
    const nx = clamp(fighter.x + delta.dx, 0, 5);
    const ny = clamp(fighter.y + delta.dy, 0, 4);
    if (nx === fighter.x && ny === fighter.y) return false;
    const target = opponentOf(fighter);
    return !(nx === target.x && ny === target.y);
  };

  window.evolutionData = EVOLUTION_DATA;
  window.ensureFighter = ensureFighter;
  window.chargeEvolution = chargeEvolution;
  window.getMovementDelta = movementDelta;
  window.getEvolutionType = typeOf;

  const originalCardById = window.cardById;
  window.cardById = (id) => {
    const fighters = [state.player, state.cpu].filter(Boolean);
    for (const fighter of fighters) {
      const found = fighter.attacks?.find((card) => card.id === id);
      if (found) return found;
    }
    return originalCardById ? originalCardById(id) : CARDS.find((card) => card.id === id);
  };

  window.getHand = (fighter) => {
    ensureFighter(fighter);
    const utilities = CARDS.filter((card) => card.kind !== 'attack' && (card.kind !== 'evolution' || (fighter.evolutionReady && !fighter.evolved)) && (card.id !== BACKSTEP_CARD_ID || fighter.evolved));
    return [...utilities, ...(fighter.attacks || [])];
  };

  const originalRangePattern = window.cardRangePattern;
  window.cardRangePattern = (card) => card?.id === BACKSTEP_CARD_ID ? [3] : (originalRangePattern ? originalRangePattern(card) : []);

  const originalShowActionPreview = window.showActionPreview;
  window.showActionPreview = (fighter, card) => {
    if (card?.id === BACKSTEP_CARD_ID) {
      window.clearActionPreview?.();
      const delta = movementDelta(fighter, card);
      const x = clamp(fighter.x + delta.dx, 0, 5);
      const y = clamp(fighter.y + delta.dy, 0, 4);
      document.querySelectorAll('#battle-grid .grid-cell').forEach((cell) => {
        if (Number(cell.dataset.x) === x && Number(cell.dataset.y) === y) cell.classList.add('action-preview-move');
      });
      return;
    }
    originalShowActionPreview?.(fighter, card);
  };

  const originalRenderHud = window.renderHud;
  window.renderHud = (fighter, selector) => {
    ensureFighter(fighter);
    const maxHp = fighter.maxHp || 100; const maxEnergy = fighter.maxEnergy || 100;
    const hp = formatHp(fighter.hp); const energy = formatHp(fighter.energy); const gauge = formatHp(fighter.evolutionGauge);
    const status = fighter.evolved ? '\uC9C4\uD654 \uC644\uB8CC' : fighter.evolutionReady ? '\uC9C4\uD654 \uAC00\uB2A5' : '\uCDA9\uC804 \uC911';
    const typeName = ({ grass: '\uD480', fire: '\uBD88\uAF43', water: '\uBB3C' })[String(fighter.className || fighter.type || '').toLowerCase()] || fighter.type;
    const hudName = /^[A-Z][A-Z .'-]*$/.test(fighter.name || '') ? fighter.ko : fighter.name;
    const hudType = /\uD0C0\uC785$/.test(fighter.ko || '') ? fighter.ko : `${typeName} \uD0C0\uC785`;
    const el = $(selector);
    if (!el) return originalRenderHud?.(fighter, selector);
    el.innerHTML = `<div class="fighter-main"><div class="fighter-avatar"><img class="fighter-art" src="${fighter.image}" alt="${hudName}" /></div><div><strong class="fighter-name">${hudName}</strong><span class="fighter-generation">${hudType}</span></div></div><div class="meter-labels"><span>\uCCB4\uB825 <strong>${hp}/${maxHp}</strong></span><span>\uC758\uC695 <strong>${energy}/${maxEnergy}</strong></span></div><div class="meter"><i style="width:${Math.min(100, hp / maxHp * 100)}%"></i></div><div class="meter energy"><i style="width:${Math.min(100, energy / maxEnergy * 100)}%"></i></div><div class="evolution-label"><span>\uC9C4\uD654 <strong class="evolution-value">${gauge}/100</strong></span><span class="evolution-status">${status}</span></div><div class="meter evolution"><i style="width:${gauge}%"></i></div>`;
  };

  const originalUpdateHudValues = window.updateHudValues;
  window.updateHudValues = (fighter, selector) => {
    ensureFighter(fighter);
    const hud = $(selector);
    if (!hud) return originalUpdateHudValues?.(fighter, selector);
    const values = hud.querySelectorAll('.meter-labels strong');
    const meters = hud.querySelectorAll('.meter i');
    const maxHp = fighter.maxHp || 100; const maxEnergy = fighter.maxEnergy || 100;
    if (values[0]) values[0].textContent = `${formatHp(fighter.hp)}/${maxHp}`;
    if (values[1]) values[1].textContent = `${formatHp(fighter.energy)}/${maxEnergy}`;
    if (meters[0]) meters[0].style.width = `${Math.min(100, formatHp(fighter.hp) / maxHp * 100)}%`;
    if (meters[1]) meters[1].style.width = `${Math.min(100, formatHp(fighter.energy) / maxEnergy * 100)}%`;
    const evolutionValue = hud.querySelector('.evolution-value');
    const evolutionMeter = hud.querySelector('.meter.evolution i');
    const evolutionStatus = hud.querySelector('.evolution-status');
    if (evolutionValue) evolutionValue.textContent = `${formatHp(fighter.evolutionGauge)}/100`;
    if (evolutionMeter) evolutionMeter.style.width = `${formatHp(fighter.evolutionGauge)}%`;
    if (evolutionStatus) evolutionStatus.textContent = fighter.evolved ? '\uC9C4\uD654 \uC644\uB8CC' : fighter.evolutionReady ? '\uC9C4\uD654 \uAC00\uB2A5' : '\uCDA9\uC804 \uC911';
  };

  const evolveFighter = (fighter) => {
    ensureFighter(fighter);
    const data = EVOLUTION_DATA[fighter.baseId];
    if (!data || fighter.evolved || !fighter.evolutionReady) return false;
    fighter.attacks = (fighter.attacks || []).map((card) => ({ ...card, ...(data.upgrades[card.id] || {}) }));
    if (!fighter.attacks.some((card) => card.id === data.attack.id)) fighter.attacks.push({ ...data.attack });
    fighter.id = data.id;
    fighter.evolutionId = data.id;
    fighter.name = data.name;
    fighter.ko = data.ko;
    fighter.type = data.type;
    fighter.className = data.className;
    fighter.image = data.image;
    fighter.evolved = true;
    fighter.evolutionReady = false;
    writeLog(`${fighter.name}\uC73C\uB85C \uC9C4\uD654! \uAE30\uC220\uC774 \uAC15\uD654\uB418\uACE0 \uC0C8 \uAE30\uC220\uC774 \uCD94\uAC00\uB429\uB2C8\uB2E4.`, 'evolution');
    renderBattle();
    return true;
  };
  window.evolveFighter = evolveFighter;

  const originalResolveAction = window.resolveAction;
  window.resolveAction = (fighter, card) => {
    ensureFighter(fighter);
    const target = opponentOf(fighter);
    ensureFighter(target);
    if (card?.kind === 'evolution') {
      if (fighter.evolutionReady) {
        window.animateCombatAction?.(fighter, fighter, card, true);
        evolveFighter(fighter);
      } else writeLog(`${fighter.name}\uC758 \uC9C4\uD654 \uAC8C\uC774\uC9C0\uAC00 \uBD80\uC871\uD569\uB2C8\uB2E4.`);
      return;
    }
    const beforeSelfHp = fighter.hp;
    const beforeTargetHp = target.hp;
    const actionCard = card?.id === BACKSTEP_CARD_ID ? { ...card, ...movementDelta(fighter, card) } : card;
    originalResolveAction?.(fighter, actionCard);
    const selfDamage = Math.max(0, beforeSelfHp - fighter.hp);
    const dealtDamage = Math.max(0, beforeTargetHp - target.hp);
    if (selfDamage > 0) chargeEvolution(fighter, Math.max(5, Math.round(selfDamage * 0.45)), 'damage');
    if (dealtDamage > 0) {
      chargeEvolution(fighter, Math.max(8, Math.round(dealtDamage * 0.6)), 'damage');
      chargeEvolution(target, Math.max(5, Math.round(dealtDamage * 0.45)), 'damage');
    }
  };

  const originalFinishRound = window.finishRound;
  window.finishRound = () => {
    [state.player, state.cpu].forEach((fighter) => {
      if (!fighter) return;
      fighter.energy = clamp(fighter.energy + 5, 0, 100);
    });
    chargeEvolution(state.player, 5, 'round');
    chargeEvolution(state.cpu, 5, 'round');
    writeLog('\uB77C\uC6B4\uB4DC \uC885\uB8CC. \uC591\uCABD \uC758\uC695 +5.', 'energy');
    originalFinishRound?.();
  };

  const originalRenderCpuQueue = window.renderCpuQueue;
  window.renderCpuQueue = () => {
    originalRenderCpuQueue?.();
    state.cpuQueue.forEach((id, index) => {
      if (id !== BACKSTEP_CARD_ID) return;
      const icon = document.querySelectorAll('#cpu-queue .cpu-action .cpu-icon')[index];
      if (icon) icon.textContent = '\u21C9';
    });
  };

  const originalToggleCard = window.toggleCard;
  window.toggleCard = (id) => {
    if (id === EVOLUTION_CARD_ID && state.queue.includes(id)) return;
    originalToggleCard?.(id);
  };

  const originalRenderRoster = window.renderRoster;
  window.renderRoster = () => {
    const roster = $('#pokemon-roster');
    if (!roster) return originalRenderRoster?.();
    roster.innerHTML = POKEMON.map((pokemon) => {
      const evolution = EVOLUTION_DATA[pokemon.id];
      return `<button class="pokemon-card ${pokemon.className}" data-pokemon="${pokemon.id}" aria-pressed="false"><span class="gen">${pokemon.gen}</span><span class="type">${pokemon.type}</span><div class="roster-art-pair"><span class="roster-art-stage"><small>\uD604\uC7AC</small><img src="${pokemon.image}" alt="${pokemon.name}" /></span><b class="roster-evolution-arrow">\u2192</b><span class="roster-art-stage evolved"><small>\uC9C4\uD654</small><img src="${evolution.image}" alt="${evolution.name}" /></span></div><h3>${pokemon.name}</h3><p>${pokemon.ko} · ${pokemon.stats}</p><span class="roster-evolution-name">\u2192 ${evolution.ko}</span><span class="signature-skill">\uB300\uD45C \uAE30\uC220 · ${pokemon.attacks[0].name}</span></button>`;
    }).join('');
    document.querySelectorAll('[data-pokemon]').forEach((button) => button.addEventListener('click', () => selectPokemon(button.dataset.pokemon)));
  };
})();

(() => {
  const BACKSTEP_ID = 'back2';
  const moveFor = (fighter, card) => window.getMovementDelta?.(fighter, card) || { dx: card.dx || 0, dy: card.dy || 0 };
  const hazardAt = (x, y) => state.hazard?.has(`${x},${y}`);
  const distanceBetween = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  const virtualFighter = (fighter, position) => ({ ...fighter, ...position });

  const movementScore = (fighter, target, card, position) => {
    const delta = moveFor(fighter, card);
    const nx = clamp(position.x + delta.dx, 0, 5);
    const ny = clamp(position.y + delta.dy, 0, 4);
    if (nx === position.x && ny === position.y) return -10000;
    if (nx === target.x && ny === target.y) return -10000;
    const before = distanceBetween(position, target);
    const after = distanceBetween({ x: nx, y: ny }, target);
    let score = (before - after) * 100;
    if (hazardAt(nx, ny)) score -= 280;
    if (hazardAt(position.x, position.y)) score += 180;
    if (card.id === BACKSTEP_ID) score += before <= 1 ? 210 : -120;
    return score;
  };

  const scoreCard = (fighter, target, card, position, cards) => {
    if (card.energy > position.energy) return -10000;
    if (card.kind === 'evolution') return position.evolutionReady ? 1500 : -10000;
    if (card.kind === 'move') return movementScore(fighter, target, card, position);
    if (card.kind === 'attack') {
      const attacker = virtualFighter(fighter, position);
      const hit = attackPatternContains(attacker, target, card);
      if (!hit) return -80 + (position.x === target.x || position.y === target.y ? 12 : 0);
      const multiplier = window.getTypeMultiplier?.(attacker, target) || 1;
      const finishing = target.hp <= card.damage * multiplier;
      const pressured = target.hp <= 40;
      return 500 + card.damage * 2 + card.priority * 8 + (multiplier > 1 ? 140 : 0) + (finishing ? 550 : pressured ? 220 : 0);
    }
    if (card.kind === 'guard') return position.hp <= 38 ? 430 : position.hp <= 62 ? 165 : 35;
    if (card.kind === 'energy') return position.energy <= 32 ? 410 : position.energy <= 58 ? 175 : -70;
    return 0;
  };

  const applyVirtual = (fighter, card, position) => {
    position.energy = clamp(position.energy - card.energy, 0, 100);
    if (card.kind === 'move') {
      const delta = moveFor(fighter, card);
      position.x = clamp(position.x + delta.dx, 0, 5);
      position.y = clamp(position.y + delta.dy, 0, 4);
    } else if (card.kind === 'energy') {
      position.energy = clamp(position.energy + card.restore, 0, 100);
    } else if (card.kind === 'evolution') {
      position.evolutionReady = false;
      position.evolved = true;
    }
  };

  window.chooseCpuQueue = () => {
    const fighter = state.cpu;
    const target = state.player;
    if (!fighter || !target) return [];
    ensureFighter(fighter);
    const cards = getHand(fighter);
    const position = { x: fighter.x, y: fighter.y, hp: fighter.hp, energy: fighter.energy, evolutionReady: fighter.evolutionReady, evolved: fighter.evolved };
    const selected = [];
    for (let slot = 0; slot < 3; slot += 1) {
      const candidates = cards.filter((card) => card.kind !== 'evolution' || !selected.includes(card.id));
      let best = candidates[0];
      let bestScore = -Infinity;
      candidates.forEach((card) => {
        const score = scoreCard(fighter, target, card, position, cards) + (3 - slot) * (card.priority || 0);
        if (score > bestScore) { best = card; bestScore = score; }
      });
      if (!best) break;
      selected.push(best.id);
      applyVirtual(fighter, best, position);
    }

    return selected;
  };
})();
