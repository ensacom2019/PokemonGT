(() => {
  const getBattleType = (fighter) => {
    const raw = `${fighter?.className || ''} ${fighter?.type || ''} ${fighter?.ko || ''}`.toLowerCase();
    if (raw.includes('grass') || raw.includes('\uD480')) return 'grass';
    if (raw.includes('water') || raw.includes('\uBB3C')) return 'water';
    if (raw.includes('fire') || raw.includes('\uBD88\uAF43')) return 'fire';
    return 'neutral';
  };
  const strongAgainst = { grass: 'water', water: 'fire', fire: 'grass' };
  window.getBattleType = getBattleType;
  window.getTypeMultiplier = (attacker, defender) => getBattleType(attacker) !== 'neutral' && strongAgainst[getBattleType(attacker)] === getBattleType(defender) ? 1.5 : 1;

  const previewClasses = ['action-preview-move', 'action-preview-guard', 'action-preview-attack', 'action-preview-target'];
  const cellAt = (x, y) => [...document.querySelectorAll('#battle-grid .grid-cell')].find((cell) => Number(cell.dataset.x) === x && Number(cell.dataset.y) === y);

  window.clearActionPreview = () => {
    document.querySelectorAll('#battle-grid .grid-cell').forEach((cell) => cell.classList.remove(...previewClasses));
  };

  window.showActionPreview = (fighter, card) => {
    window.clearActionPreview?.();
    if (!fighter || !card) return;

    if (card.kind === 'move') {
      const x = clamp(fighter.x + card.dx, 0, 5);
      const y = clamp(fighter.y + card.dy, 0, 4);
      cellAt(x, y)?.classList.add('action-preview-move');
      return;
    }

    if (card.kind === 'guard') {
      cellAt(fighter.x, fighter.y)?.classList.add('action-preview-guard');
      return;
    }

    if (card.kind === 'attack') {
      const pattern = cardRangePattern(card);
      for (let y = 0; y < 5; y += 1) {
        for (let x = 0; x < 6; x += 1) {
          let dx = x - fighter.x;
          const dy = y - fighter.y;
          if (fighter.side === 'cpu') dx = -dx;
          if (Math.abs(dx) > 1 || Math.abs(dy) > 1) continue;
          if (pattern.includes((dy + 1) * 3 + (dx + 1))) {
            cellAt(x, y)?.classList.add('action-preview-attack');
          }
        }
      }
      const target = opponentOf(fighter);
      if (attackPatternContains(fighter, target, card)) {
        cellAt(target.x, target.y)?.classList.add('action-preview-target');
      }
    }
  };
})();

(() => {
  const moveLabel = '\uC774\uB3D9';
  const attackLabel = '\uAE30\uC220';
  const guardLabel = '\uBC29\uC5B4';
  const energyLabel = '\uD68C\uBCF5';

  window.renderHand = function renderHandClean() {
    const hand = $('#card-hand');
    const energyAfterQueue = projectedEnergyForQueue(state.queue);
    hand.innerHTML = getHand(state.player).map((card) => {
      const queued = state.queue.includes(card.id);
      const canAfford = queued || card.energy <= energyAfterQueue;
      const unavailable = state.executing || !canAfford;
      const role = card.kind === 'attack' ? attackLabel : card.kind === 'move' ? moveLabel : card.kind === 'guard' ? guardLabel : energyLabel;
      const range = card.kind === 'attack' ? '' : card.kind === 'move' ? '\uBC94\uC704 1\uCE78' : '\uC790\uC2E0';
      const art = card.kind === 'attack' ? `<img class="card-character-art" src="${state.player.image}" alt="" />` : '';
      const forecast = card.kind === 'attack' && !queued && card.energy > state.player.energy && energyAfterQueue >= card.energy ? '<span class="energy-forecast">\uCDA9\uC804 \uBC18\uC601</span>' : '';
      const stats = `<div class="card-stats"><span class="card-stat-line"><b>DM</b><strong>${card.kind === 'attack' ? String(card.damage).padStart(2, '0') : '00'}</strong></span><span class="card-stat-line"><b>EN</b><strong>${String(card.energy).padStart(2, '0')}</strong></span></div>`;
      const miniGrid = `<span class="card-mini-range ${card.kind}" aria-label="3\u00D73 \uBC94\uC704 \uD45C\uC2DC">${miniRangeCells(card)}</span>`;
      return `<button class="action-card ${card.kind} ${queued ? 'queued' : ''} ${state.previewCard === card.id ? 'previewed' : ''}" data-card="${card.id}" ${unavailable ? 'disabled' : ''} aria-label="${card.name}, ${card.ko}">${art}<span class="card-badge">${role}</span>${forecast}<span class="card-icon">${card.icon}</span><span class="card-name">${card.name}</span><span class="card-korean">${card.ko}</span><span class="card-range">${range ? `${range} \u00B7 ` : ''}\uC6B0\uC120 ${card.priority}</span><div class="card-footer">${stats}${miniGrid}</div></button>`;
    }).join('');
    document.querySelectorAll('#card-hand [data-card]').forEach((button) => {
      button.addEventListener('click', () => toggleCard(button.dataset.card));
    });
  };

  window.resolveAction = function resolveActionClean(fighter, card) {
    if (fighter.hp <= 0) return;
    applyHazard(fighter);
    if (fighter.hp <= 0) return;
    fighter.guarding = false;
    if (fighter.energy < card.energy) {
      writeLog(`${fighter.name}\uC758 ${card.name} \uC2E4\uD328 — \uC758\uC695\uC774 \uBD80\uC871\uD569\uB2C8\uB2E4.`);
      return;
    }
    fighter.energy = clamp(fighter.energy - card.energy, 0, fighter.maxEnergy || 100);
    const target = opponentOf(fighter);
    if (card.kind === 'move') {
      window.animateCombatAction?.(fighter, target, card, true);
      if (canMove(fighter, card)) {
        fighter.x = clamp(fighter.x + card.dx, 0, 5);
        fighter.y = clamp(fighter.y + card.dy, 0, 4);
        writeLog(`${fighter.name}\uC774(\uAC00) ${card.ko} \u2192 (${fighter.x + 1}, ${fighter.y + 1})`);
      } else writeLog(`${fighter.name}\uC758 ${card.name} — \uC774\uB3D9\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.`);
    } else if (card.kind === 'guard') {
      window.animateCombatAction?.(fighter, fighter, card, true);
      fighter.guarding = true;
      writeLog(`${fighter.name}\uC774(\uAC00) \uBC29\uC5B4 \uD0DC\uC138! \uB2E4\uC74C \uD53C\uD574 50% \uAC10\uC18C.`);
    } else if (card.kind === 'energy') {
      window.animateCombatAction?.(fighter, fighter, card, true);
      fighter.energy = clamp(fighter.energy + card.restore, 0, fighter.maxEnergy || 100);
      writeLog(`${fighter.name}\uC774(\uAC00) \uC758\uC695\uC744 ${card.restore} \uD68C\uBCF5\uD588\uC2B5\uB2C8\uB2E4.`, 'energy');
    } else if (card.kind === 'attack') {
      const hit = attackPatternContains(fighter, target, card);
      window.animateCombatAction?.(fighter, target, card, hit);
      if (hit) {
        const typeMultiplier = window.getTypeMultiplier?.(fighter, target) || 1;
        const damage = Math.round(card.damage * typeMultiplier * (window.getGuardMultiplier?.(target) ?? (target.guarding ? 0.5 : 1)));
        target.hp = clamp(target.hp - damage, 0, target.maxHp || 100);
        const matchupText = typeMultiplier > 1 ? ' \uC0C1\uC131 \uC6B0\uC704! (1.5\uBC30)' : '';
        writeLog(`${fighter.name}\uC758 ${card.name}! ${target.name}\uC5D0\uAC8C ${damage} \uB370\uBBF8\uC9C0.${matchupText}`, 'attack');
        if (target.hp === 0) finishBattle(fighter);
      } else writeLog(`${fighter.name}\uC758 ${card.name} — \uACF5\uACA9 \uBC94\uC704 \uBC16\uC785\uB2C8\uB2E4.`);
    }
  };
})();

(() => {
  const pointFor = (fighter) => {
    const grid = document.querySelector('#battle-grid');
    if (!grid) return null;
    const cell = [...grid.querySelectorAll('.grid-cell')].find((item) => Number(item.dataset.x) === fighter.x && Number(item.dataset.y) === fighter.y);
    if (!cell) return null;
    const gridRect = grid.getBoundingClientRect();
    const cellRect = cell.getBoundingClientRect();
    return {
      x: cellRect.left - gridRect.left + cellRect.width / 2,
      y: cellRect.top - gridRect.top + cellRect.height / 2
    };
  };

  const themeFor = (fighter) => {
    const type = window.getBattleType?.(fighter) || String(fighter.type || '').toLowerCase();
    if (type.includes('fire')) return 'fire';
    if (type.includes('water')) return 'water';
    if (type.includes('grass')) return 'grass';
    return 'neutral';
  };

  const removeLater = (element, delay = 600) => setTimeout(() => element.remove(), delay);
  window.animateCombatAction = (fighter, target, card, hit) => {
    const grid = document.querySelector('#battle-grid');
    const layer = grid?.querySelector('.combat-effects');
    if (!grid || !layer) return;
    const from = pointFor(fighter);
    const to = pointFor(target);
    if (!from || !to) return;
    const theme = themeFor(fighter);
    const token = grid.querySelector(`.fighter-token.${fighter.side}`);
    if (token) {
      token.style.setProperty('--lunge-x', fighter.side === 'player' ? '12px' : '-12px');
      token.classList.remove('is-attacking', 'is-hit');
      void token.offsetWidth;
      token.classList.add('is-attacking');
      setTimeout(() => token.classList.remove('is-attacking'), 760);
    }

    if (card.kind === 'attack') {
      const projectile = document.createElement('span');
      projectile.className = `skill-projectile ${theme}`;
      projectile.textContent = card.icon || '✦';
      projectile.style.left = `${from.x}px`;
      projectile.style.top = `${from.y}px`;
      projectile.style.setProperty('--travel-x', `${to.x - from.x}px`);
      projectile.style.setProperty('--travel-y', `${to.y - from.y}px`);
      layer.append(projectile);
      setTimeout(() => {
        projectile.remove();
        const impact = document.createElement('span');
        impact.className = `impact-effect ${theme} ${hit ? 'hit' : 'miss'}`;
        impact.textContent = hit ? '✹' : '×';
        impact.style.left = `${to.x}px`;
        impact.style.top = `${to.y}px`;
        layer.append(impact);
        removeLater(impact, 500);
        if (hit) {
          const targetToken = grid.querySelector(`.fighter-token.${target.side}`);
          if (targetToken) {
            targetToken.style.setProperty('--hit-x', target.side === 'player' ? '-7px' : '7px');
            targetToken.classList.remove('is-hit');
            void targetToken.offsetWidth;
            targetToken.classList.add('is-hit');
            setTimeout(() => targetToken.classList.remove('is-hit'), 720);
          }
        }
      }, 520);
      return;
    }

    const selfEffect = document.createElement('span');
    selfEffect.className = `self-effect ${card.kind} ${theme}`;
    selfEffect.textContent = card.kind === 'energy' ? '✦' : card.kind === 'guard' ? '◈' : card.icon || '→';
    selfEffect.style.left = `${from.x}px`;
    selfEffect.style.top = `${from.y}px`;
    layer.append(selfEffect);
    removeLater(selfEffect, 760);
  };
})();

(() => {
  window.toggleCard = function toggleCardOncePerRound(id) {
    if (state.executing) return;
    if (state.queue.includes(id)) {
      toast('\uAC19\uC740 \uCE74\uB4DC\uB294 \uB77C\uC6B4\uB4DC\uB2F9 \uD55C \uBC88\uB9CC \uC120\uD0DD\uD560 \uC218 \uC788\uC5B4\uC694.');
      return;
    }
    if (state.queue.length >= 3) {
      toast('\uCE74\uB4DC\uB294 \uC815\uD655\uD788 3\uC7A5\uAE4C\uC9C0 \uC120\uD0DD\uD560 \uC218 \uC788\uC5B4\uC694.');
      return;
    }
    state.previewCard = id;
    state.queue.push(id);
    renderBattle();
  };

  window.renderQueue = function renderQueueRepeatable() {
    const queue = $('#player-queue');
    queue.innerHTML = [0, 1, 2].map((index) => {
      const card = cardById(state.queue[index]);
      return card
        ? `<button type="button" class="queue-slot filled" data-queue-index="${index}" title="\uC774 \uCE74\uB4DC \uBE44\uC6B0\uAE30"><b>0${index + 1}</b><span>${card.icon} ${card.label}</span></button>`
        : `<div class="queue-slot"><b>0${index + 1}</b><span>\uBE44\uC5B4 \uC788\uC74C</span></div>`;
    }).join('');
    queue.querySelectorAll('[data-queue-index]').forEach((button) => button.addEventListener('click', () => {
      if (state.executing) return;
      state.queue.splice(Number(button.dataset.queueIndex), 1);
      state.previewCard = state.queue[state.queue.length - 1] || null;
      renderBattle();
    }));
    $('#advance-round').disabled = state.queue.length !== 3 || state.gameOver || state.executing;
  };

  window.chooseCpuQueue = function chooseCpuQueueOncePerRound() {
    const all = getHand(state.cpu);
    const result = [];
    if (state.cpu.energy < 35) {
      const energyCard = all.find((card) => card.kind === 'energy');
      if (energyCard) result.push(energyCard.id);
    }
    while (result.length < 3) {
      const remaining = all.filter((card) => !result.includes(card.id));
      if (!remaining.length) break;
      result.push(remaining[Math.floor(Math.random() * remaining.length)].id);
    }
    return result;
  };

  window.renderHand = function renderHandRepeatable() {
    const hand = $('#card-hand');
    const energyAfterQueue = projectedEnergyForQueue(state.queue);
    hand.innerHTML = getHand(state.player).map((card) => {
      const queuedCount = state.queue.filter((id) => id === card.id).length;
      const canAfford = card.energy <= energyAfterQueue;
      const unavailable = state.executing || queuedCount > 0 || state.queue.length >= 3 || !canAfford;
      const role = card.kind === 'attack' ? '\uAE30\uC220' : card.kind === 'move' ? '\uC774\uB3D9' : card.kind === 'guard' ? '\uBC29\uC5B4' : card.kind === 'evolution' ? '\uC9C4\uD654' : card.kind === 'upgrade' ? '\uAC15\uD654' : '\uD68C\uBCF5';
      const range = card.kind === 'attack' ? '' : card.kind === 'move' ? (card.id === 'back2' ? '\uB4A4\uB85C 2\uCE78' : '\uBC94\uC704 1\uCE78') : card.kind === 'evolution' ? '\uC9C4\uD654 \uAC00\uB2A5' : '\uC790\uC2E0';
      const art = card.kind === 'attack' ? `<img class="card-character-art" src="${state.player.image}" alt="" />` : '';
      const forecast = card.kind === 'attack' && queuedCount === 0 && card.energy > state.player.energy && energyAfterQueue >= card.energy ? '<span class="energy-forecast">\uCDA9\uC804 \uBC18\uC601</span>' : '';
      const count = queuedCount > 0 ? `<span class="card-count">×${queuedCount}</span>` : '';
      const stats = `<div class="card-stats"><span class="card-stat-line"><b>DM</b><strong>${card.kind === 'attack' ? String(card.damage).padStart(2, '0') : '00'}</strong></span><span class="card-stat-line"><b>EN</b><strong>${String(card.energy).padStart(2, '0')}</strong></span></div>`;
      const miniGrid = `<span class="card-mini-range ${card.kind}" aria-label="3\u00D73 \uBC94\uC704 \uD45C\uC2DC">${miniRangeCells(card)}</span>`;
      return `<button class="action-card ${card.kind} ${queuedCount ? 'queued' : ''} ${state.previewCard === card.id ? 'previewed' : ''}" data-card="${card.id}" ${unavailable ? 'disabled' : ''} aria-label="${card.name}, ${card.ko}">${art}<span class="card-badge">${role}</span>${count}${forecast}<span class="card-icon">${card.icon}</span><span class="card-name">${card.name}</span><span class="card-korean">${card.ko}</span><span class="card-range">${range ? `${range} \u00B7 ` : ''}\uC6B0\uC120 ${card.priority}</span><div class="card-footer">${stats}${miniGrid}</div></button>`;
    }).join('');
    document.querySelectorAll('#card-hand [data-card]').forEach((button) => {
      button.addEventListener('click', () => toggleCard(button.dataset.card));
    });
  };
})();

(() => {
  const brand = document.querySelector('.brand');
  brand?.addEventListener('click', (event) => {
    event.preventDefault();
    state.gameOver = true;
    state.executing = false;
    state.queue = [];
    state.cpuQueue = [];
    state.previewCard = null;
    showScreen('start');
  });
})();
