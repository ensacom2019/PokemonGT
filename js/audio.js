(() => {
  const AUDIO_ROOT = 'assets/audio/';
  const SFX = {
    select: 'card-select.ogg', confirm: 'confirm.ogg',
    attack: 'attack.ogg', hit: 'hit.ogg', guard: 'guard.ogg', energy: 'energy.ogg',
    evolution: 'evolution.ogg', hazard: 'hazard.ogg'
  };
  const bgm = new Audio(`${AUDIO_ROOT}battle-theme.mp3`);
  bgm.preload = 'metadata';
  bgm.loop = true;
  bgm.volume = 0.2;
  let enabled = localStorage.getItem('pokemon-g-audio') !== 'off';

  const play = (name, volume = 0.45) => {
    if (!enabled || !SFX[name]) return;
    const sound = new Audio(`${AUDIO_ROOT}${SFX[name]}`);
    sound.volume = volume;
    sound.play().catch(() => {});
  };

  const startBgm = () => {
    if (!enabled || !bgm.paused) return;
    bgm.play().catch(() => {});
  };

  const renderToggle = () => {
    const button = document.querySelector('#sound-toggle');
    if (!button) return;
    button.textContent = enabled ? '소리 켜짐' : '소리 꺼짐';
    button.setAttribute('aria-pressed', String(enabled));
  };

  const header = document.querySelector('.site-header');
  if (header) {
    const button = document.createElement('button');
    button.id = 'sound-toggle';
    button.className = 'sound-toggle';
    button.type = 'button';
    button.title = '배경음과 효과음 켜기 또는 끄기';
    button.addEventListener('click', () => {
      enabled = !enabled;
      localStorage.setItem('pokemon-g-audio', enabled ? 'on' : 'off');
      if (enabled) startBgm(); else bgm.pause();
      renderToggle();
    });
    header.append(button);
    renderToggle();
  }

  document.addEventListener('pointerdown', startBgm, { passive: true });

  const originalShowScreen = window.showScreen;
  window.showScreen = (name, ...args) => {
    if (name === 'start') {
      bgm.pause();
      bgm.currentTime = 0;
    }
    return originalShowScreen?.(name, ...args);
  };

  document.addEventListener('click', (event) => {
    const target = event.target.closest('button, .pokemon-card');
    if (!target || target.id === 'sound-toggle') return;
    if (target.matches('.action-card, .pokemon-card')) play('select', 0.35);
    else if (target.matches('#advance-round, #confirm-selection, #next-battle, [data-reward], [data-event]')) play('confirm', 0.45);
  });

  const originalResolveAction = window.resolveAction;
  window.resolveAction = (fighter, card) => {
    if (!fighter || !card) return originalResolveAction?.(fighter, card);
    const target = opponentOf(fighter);
    const before = { hp: fighter.hp, targetHp: target?.hp, energy: fighter.energy };
    const result = originalResolveAction?.(fighter, card);
    if (fighter.hp < before.hp) play('hazard', 0.48);
    if (card.kind === 'attack') {
      if (target?.hp < before.targetHp) { play('attack', 0.48); setTimeout(() => play('hit', 0.4), 130); }
      else play('hazard', 0.24);
    } else if (card.kind === 'guard' && fighter.guarding) play('guard', 0.42);
    else if (card.kind === 'energy' && fighter.energy > before.energy) play('energy', 0.42);
    else if (card.kind === 'evolution' && fighter.evolved) play('evolution', 0.52);
    return result;
  };

  const originalFinishBattle = window.finishBattle;
  window.finishBattle = (winner) => {
    if (!state.gameOver) play(winner?.side === 'player' ? 'confirm' : 'hazard', 0.58);
    return originalFinishBattle?.(winner);
  };
})();
