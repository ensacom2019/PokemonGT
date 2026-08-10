(() => {
  const GEN3 = [
    {
      id: 'treecko', name: '\uB098\uBB34\uC9C0\uAE30', ko: '\uD480 \uD0C0\uC785', gen: '3\uC138\uB300 / \uD480', type: '\uD480', className: 'grass', stats: '\uAE30\uBBFC\uD615', signatureSkill: '\uB9AC\uD504\uBE14\uB808\uC774\uB4DC', image: 'assets/pokemon/pixel/treecko.png',
      attacks: [
        { id: 'treecko-absorb', name: '\uD761\uC218', ko: '\uC0DD\uAE30\uB97C \uBE7C\uC557\uB294 \uC78E', icon: '\u2737', kind: 'attack', priority: 4, energy: 18, label: '\uD761\uC218', damage: 22, range: 3 },
        { id: 'treecko-quick-attack', name: '\uC804\uAD11\uC11D\uD654', ko: '\uBE60\uB978 \uB3CC\uC9C4', icon: '\u27A4', kind: 'attack', priority: 5, energy: 21, label: '\uC804\uAD11\uC11D\uD654', damage: 30, range: 1 },
        { id: 'treecko-leaf-blade', name: '\uB9AC\uD504\uBE14\uB808\uC774\uB4DC', ko: '\uB0A0\uCE74\uB85C\uC6B4 \uC78E\uC758 \uCE7C\uB0A0', icon: '\u2726', kind: 'attack', priority: 3, energy: 31, label: '\uB9AC\uD504\uBE14\uB808\uC774\uB4DC', damage: 40, range: 2 }
      ]
    },
    {
      id: 'torchic', name: '\uC544\uCC28\uBAA8', ko: '\uBD88\uAF43 \uD0C0\uC785', gen: '3\uC138\uB300 / \uBD88\uAF43', type: '\uBD88\uAF43', className: 'fire', stats: '\uC5F0\uD0C0\uD615', signatureSkill: '\uBE14\uB808\uC774\uC988\uD0A5', image: 'assets/pokemon/pixel/torchic.png',
      attacks: [
        { id: 'torchic-peck', name: '\uCABC', ko: '\uBD80\uB9AC\uB85C \uCC0C\uB974\uAE30', icon: '\u27A4', kind: 'attack', priority: 5, energy: 20, label: '\uCABC', damage: 28, range: 1 },
        { id: 'torchic-ember', name: '\uBD88\uAF43\uC138\uB840', ko: '\uC791\uC740 \uBD88\uAF43', icon: '\u2623', kind: 'attack', priority: 4, energy: 19, label: '\uBD88\uAF43\uC138\uB840', damage: 26, range: 2 },
        { id: 'torchic-blaze-kick', name: '\uBE14\uB808\uC774\uC988\uD0A5', ko: '\uBD88\uD0C0\uB294 \uBC1C\uCC28\uAE30', icon: '\uD83D\uDD25', kind: 'attack', priority: 3, energy: 33, label: '\uBE14\uB808\uC774\uC988\uD0A5', damage: 42, range: 2 }
      ]
    },
    {
      id: 'mudkip', name: '\uBB3C\uC9F1\uC774', ko: '\uBB3C \uD0C0\uC785', gen: '3\uC138\uB300 / \uBB3C', type: '\uBB3C', className: 'water', stats: '\uADE0\uD615\uD615', signatureSkill: '\uBA38\uB4DC\uBD04', image: 'assets/pokemon/pixel/mudkip.png',
      attacks: [
        { id: 'mudkip-water-gun', name: '\uBB3C\uB300\uD3EC', ko: '\uAC15\uD55C \uBB3C\uC904\uAE30', icon: '\u2248', kind: 'attack', priority: 4, energy: 18, label: '\uBB3C\uB300\uD3EC', damage: 22, range: 3 },
        { id: 'mudkip-tackle', name: '\uBAB8\uD1B5\uBC15\uCE58\uAE30', ko: '\uBB35\uC9C1\uD55C \uBAB8\uD1B5\uBC15\uCE58\uAE30', icon: '\u2726', kind: 'attack', priority: 5, energy: 22, label: '\uBAB8\uD1B5\uBC15\uCE58\uAE30', damage: 32, range: 1 },
        { id: 'mudkip-mud-bomb', name: '\uBA38\uB4DC\uBD04', ko: '\uC9C4\uD761 \uD3ED\uBC1C', icon: '\u25CF', kind: 'attack', priority: 3, energy: 31, label: '\uBA38\uB4DC\uBD04', damage: 38, range: 3 }
      ]
    }
  ];

  const signatureSkills = {
    bulbasaur: '\uC528\uD3ED\uD0C4',
    charmander: '\uD654\uC5FC\uBC29\uC0AC',
    squirtle: '\uC544\uCFE0\uC544\uD14C\uC77C',
    chikorita: '\uAF43\uC78E\uB304\uC2A4',
    cyndaquil: '\uD654\uC5FC\uBC14\uD034',
    totodile: '\uC544\uCFE0\uC544\uD14C\uC77C',
    treecko: '\uB9AC\uD504\uBE14\uB808\uC774\uB4DC',
    torchic: '\uBE14\uB808\uC774\uC988\uD0A5',
    mudkip: '\uBA38\uB4DC\uBD04'
  };

  GEN3.forEach((pokemon) => {
    if (!POKEMON.some((item) => item.id === pokemon.id)) POKEMON.push(pokemon);
  });
  POKEMON.forEach((pokemon) => {
    pokemon.signatureSkill = signatureSkills[pokemon.id] || pokemon.attacks?.at(-1)?.name;
  });

  const evolutions = window.evolutionData;
  if (evolutions) Object.assign(evolutions, {
    treecko: {
      id: 'sceptile', name: '\uB098\uBB34\uD0B9', ko: '\uB098\uBB34\uD0B9', type: '\uD480', className: 'grass', image: 'assets/pokemon/evolved/sceptile.png',
      attack: { id: 'sceptile-leaf-storm', name: '\uD3ED\uD48D', ko: '\uB300\uC9C0\uB97C \uB36E\uB294 \uC78E\uC758 \uD3ED\uD48D', icon: '\u2739', kind: 'attack', priority: 4, energy: 38, label: '\uD3ED\uD48D', damage: 58, range: 3 },
      upgrades: { 'treecko-absorb': { name: '\uD761\uC218+', ko: '\uC0DD\uBA85\uB825\uC744 \uBE7C\uC557\uB294 \uC78E', damage: 28, energy: 20, range: 3 }, 'treecko-quick-attack': { name: '\uC804\uAD11\uC11D\uD654+', ko: '\uBC14\uB78C\uCC98\uB7FC \uBE60\uB978 \uB3CC\uC9C4', damage: 36, energy: 24, range: 2 }, 'treecko-leaf-blade': { name: '\uB9AC\uD504\uBE14\uB808\uC774\uB4DC+', ko: '\uAC15\uB825\uD55C \uC78E\uC758 \uCE7C\uB0A0', damage: 50, energy: 34, range: 3 } }
    },
    torchic: {
      id: 'blaziken', name: '\uBC88\uCE58\uCF54', ko: '\uBC88\uCE58\uCF54', type: '\uBD88\uAF43', className: 'fire', image: 'assets/pokemon/evolved/blaziken.png',
      attack: { id: 'blaziken-blaze-storm', name: '\uD654\uC5FC\uD0C0\uACA9', ko: '\uD654\uC5FC\uC73C\uB85C \uBAB0\uC544\uCE58\uB294 \uD0C0\uACA9', icon: '\uD83D\uDD25', kind: 'attack', priority: 4, energy: 40, label: '\uD654\uC5FC\uD0C0\uACA9', damage: 62, range: 2 },
      upgrades: { 'torchic-peck': { name: '\uCABC+', ko: '\uAC15\uB825\uD55C \uBD80\uB9AC \uCC0C\uB974\uAE30', damage: 36, energy: 24, range: 2 }, 'torchic-ember': { name: '\uBD88\uAF43\uC138\uB840+', ko: '\uD06C\uACE0 \uB728\uAC70\uC6B4 \uBD88\uAF43', damage: 34, energy: 22, range: 3 }, 'torchic-blaze-kick': { name: '\uBE14\uB808\uC774\uC988\uD0A5+', ko: '\uD654\uC5FC\uC744 \uB450\uB978 \uBC1C\uCC28\uAE30', damage: 54, energy: 36, range: 3 } }
    },
    mudkip: {
      id: 'swampert', name: '\uB300\uCC28\uB7C9', ko: '\uB300\uCC28\uB7C9', type: '\uBB3C', className: 'water', image: 'assets/pokemon/evolved/swampert.png',
      attack: { id: 'swampert-hydro-cannon', name: '\uD558\uC774\uB4DC\uB85C\uCE94', ko: '\uAC70\uB300\uD55C \uBB3C\uB300\uD3EC', icon: '\u2248', kind: 'attack', priority: 4, energy: 42, label: '\uD558\uC774\uB4DC\uB85C\uCE94', damage: 64, range: 3 },
      upgrades: { 'mudkip-water-gun': { name: '\uBB3C\uB300\uD3EC+', ko: '\uC555\uCD95\uB41C \uBB3C\uC904\uAE30', damage: 31, energy: 20, range: 3 }, 'mudkip-tackle': { name: '\uBAB8\uD1B5\uBC15\uCE58\uAE30+', ko: '\uB354 \uBB35\uC9C1\uD55C \uCDA9\uB3CC', damage: 39, energy: 24, range: 2 }, 'mudkip-mud-bomb': { name: '\uBA38\uB4DC\uBD04+', ko: '\uB113\uAC8C \uD37C\uC9C0\uB294 \uC9C4\uD761 \uD3ED\uBC1C', damage: 52, energy: 34, range: 3 } }
    }
  });

  const originalRenderRoster = window.renderRoster;
  window.renderRoster = () => {
    const roster = document.querySelector('#pokemon-roster');
    if (!roster) return originalRenderRoster?.();
    roster.innerHTML = POKEMON.map((pokemon) => {
      const evolution = window.evolutionData?.[pokemon.id];
      if (!evolution) return '';
      return `<button class="pokemon-card ${pokemon.className}" data-pokemon="${pokemon.id}" aria-pressed="false"><span class="gen">${pokemon.gen}</span><span class="type">${pokemon.type}</span><div class="roster-art-pair"><span class="roster-art-stage"><small>현재</small><img src="${pokemon.image}" alt="${pokemon.name}" /></span><b class="roster-evolution-arrow">→</b><span class="roster-art-stage evolved"><small>진화</small><img src="${evolution.image}" alt="${evolution.name}" /></span></div><h3>${pokemon.name}</h3><p>${pokemon.ko} · ${pokemon.stats}</p><span class="roster-evolution-name">→ ${evolution.ko}</span><span class="signature-skill">대표 기술 · ${pokemon.signatureSkill || pokemon.attacks.at(-1)?.name}</span></button>`;
    }).join('');
    document.querySelectorAll('[data-pokemon]').forEach((button) => button.addEventListener('click', () => selectPokemon(button.dataset.pokemon)));
  };

  const meta = document.querySelector('.header-meta');
  if (meta) meta.textContent = '1세대 + 2세대 + 3세대';
  if (state.screen === 'select') window.renderRoster();
})();
