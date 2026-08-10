(() => {
  const SCORE_PER_DAMAGE = 10;
  const EVOLUTION_SCORE = 500;
  const WIN_SCORE = 3000;
  const FAST_WIN_SCORE = 1500;
  const ROUND_PENALTY = 250;
  const HP_SCORE = 10;
  const STREAK_SCORE = 500;

  state.score = 0;
  state.battleScore = 0;
  state.winStreak = 0;

  const formatScore = (value) => String(Math.max(0, Math.round(value))).padStart(6, '0');
  const updateScore = () => {
    const score = document.querySelector('#score-number');
    if (score) score.textContent = formatScore(state.score);
  };
  const addScore = (amount) => {
    const points = Math.max(0, Math.round(amount));
    state.score += points;
    state.battleScore += points;
    updateScore();
    return points;
  };

  window.updateScore = updateScore;
  window.addScore = addScore;

  const resetBattleScore = () => {
    state.battleScore = 0;
    updateScore();
  };

  const originalStartBattle = window.startBattle;
  window.startBattle = (...args) => {
    resetBattleScore();
    return originalStartBattle?.(...args);
  };

  const originalStartNextBattle = window.startNextBattle;
  window.startNextBattle = (...args) => {
    resetBattleScore();
    return originalStartNextBattle?.(...args);
  };

  const originalResolveAction = window.resolveAction;
  window.resolveAction = (fighter, card) => {
    const target = opponentOf(fighter);
    const beforeTargetHp = target?.hp ?? 0;
    const wasEvolved = Boolean(fighter?.evolved);
    originalResolveAction?.(fighter, card);

    if (fighter?.side === 'player' && card?.kind === 'attack') {
      const dealtDamage = Math.max(0, beforeTargetHp - (target?.hp ?? beforeTargetHp));
      if (dealtDamage > 0) addScore(dealtDamage * SCORE_PER_DAMAGE);
    }
    if (fighter?.side === 'player' && card?.kind === 'evolution' && !wasEvolved && fighter.evolved) {
      addScore(EVOLUTION_SCORE);
    }
  };

  const originalFinishBattle = window.finishBattle;
  window.finishBattle = (winner) => {
    if (winner?.side === 'player' && !state.gameOver) {
      state.winStreak += 1;
      const quickWin = Math.max(0, FAST_WIN_SCORE - Math.max(0, state.round - 1) * ROUND_PENALTY);
      const survivor = Math.max(0, Math.round(winner.hp)) * HP_SCORE;
      const streak = state.winStreak > 1 ? state.winStreak * STREAK_SCORE : 0;
      addScore(WIN_SCORE + quickWin + survivor + streak);
    } else if (winner?.side !== 'player') {
      state.winStreak = 0;
    }
    originalFinishBattle?.(winner);
    setTimeout(() => {
      const summary = document.querySelector('#result-summary');
      if (!summary || summary.querySelector('.score-result')) return;
      summary.insertAdjacentHTML('beforeend', `<div class="result-stat score-result"><span>누적 점수</span><strong>${formatScore(state.score)}</strong></div>`);
    }, 760);
  };

  const brand = document.querySelector('.brand');
  brand?.addEventListener('click', () => {
    state.score = 0;
    state.battleScore = 0;
    state.winStreak = 0;
    updateScore();
  });

  updateScore();
})();
