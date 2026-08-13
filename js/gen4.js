(() => {
  const GEN4 = [
    {
      id:'turtwig', name:'\uBAA8\uBD80\uAE30', ko:'\uD480 \uD0C0\uC785', gen:'4\uC138\uB300 / \uD480', type:'\uD480', emoji:'\uD83C\uDF31', className:'grass', stats:'\uBC29\uC5B4\uD615', signatureSkill:'\uC5D0\uB108\uC9C0\uBCFC', image:'assets/pokemon/pixel/turtwig.png',
      attacks:[
        { id:'turtwig-razor-leaf', name:'\uC78E\uB0A0\uAC00\uB974\uAE30', ko:'\uC815\uBA74\uC73C\uB85C \uB0A0\uB9AC\uB294 \uC78E', icon:'\u2726', kind:'attack', priority:4, energy:19, label:'\uC78E\uB0A0\uAC00\uB974\uAE30', damage:24, range:3, pattern:[2,5,8] },
        { id:'turtwig-bite', name:'\uBB3C\uAE30', ko:'\uBC14\uB85C \uC55E\uC5D0\uC11C \uAE68\uBB34\uAE30', icon:'\u25C6', kind:'attack', priority:5, energy:23, label:'\uBB3C\uAE30', damage:32, range:1, pattern:[5] },
        { id:'turtwig-energy-ball', name:'\uC5D0\uB108\uC9C0\uBCFC', ko:'\uC55E\uC11C \uD130\uC9C0\uB294 \uD480\uC758 \uC751\uC9D1\uCCB4', icon:'\u25CF', kind:'attack', priority:3, energy:32, label:'\uC5D0\uB108\uC9C0\uBCFC', damage:40, range:3, pattern:[0,1,2] }
      ]
    },
    {
      id:'chimchar', name:'\uBD88\uAF43\uC22D\uC774', ko:'\uBD88\uAF43 \uD0C0\uC785', gen:'4\uC138\uB300 / \uBD88\uAF43', type:'\uBD88\uAF43', emoji:'\uD83D\uDD25', className:'fire', stats:'\uAE30\uB3D9\uD615', signatureSkill:'\uD30C\uC774\uC5B4\uD380\uCE58', image:'assets/pokemon/pixel/chimchar.png',
      attacks:[
        { id:'chimchar-scratch', name:'\uD560\uD034\uAE30', ko:'\uBE60\uB974\uAC8C \uADFC\uC811 \uD0C0\uACA9', icon:'\u2739', kind:'attack', priority:5, energy:21, label:'\uD560\uD034\uAE30', damage:30, range:1, pattern:[5] },
        { id:'chimchar-ember', name:'\uBD88\uAF43\uC138\uB840', ko:'\uC55E\uC73C\uB85C \uD37C\uC9C0\uB294 \uBD88\uAF43', icon:'\uD83D\uDD25', kind:'attack', priority:4, energy:19, label:'\uBD88\uAF43\uC138\uB840', damage:26, range:2, pattern:[2,5,8] },
        { id:'chimchar-fire-punch', name:'\uD30C\uC774\uC5B4\uD380\uCE58', ko:'\uC55E\uC904\uC744 \uD5E4\uC9D1\uB294 \uBD88\uAF43 \uC8FC\uBA39', icon:'\u2737', kind:'attack', priority:3, energy:32, label:'\uD30C\uC774\uC5B4\uD380\uCE58', damage:41, range:2, pattern:[1,2,5,8] }
      ]
    },
    {
      id:'piplup', name:'\uD33D\uB3C4\uB9AC', ko:'\uBB3C \uD0C0\uC785', gen:'4\uC138\uB300 / \uBB3C', type:'\uBB3C', emoji:'\uD83D\uDCA7', className:'water', stats:'\uC6D0\uAC70\uB9AC\uD615', signatureSkill:'\uAC70\uD488\uAD11\uC120', image:'assets/pokemon/pixel/piplup.png',
      attacks:[
        { id:'piplup-peck', name:'\uCABC', ko:'\uC55E\uC5D0\uC11C \uCC0C\uB974\uB294 \uBD80\uB9AC', icon:'\u25B6', kind:'attack', priority:5, energy:21, label:'\uCABC', damage:29, range:1, pattern:[5] },
        { id:'piplup-water-gun', name:'\uBB3C\uB300\uD3EC', ko:'\uC815\uBA74 \uC138 \uCE78\uC744 \uB530\uB77C\uAC00\uB294 \uBB3C\uC904\uAE30', icon:'\u2248', kind:'attack', priority:4, energy:18, label:'\uBB3C\uB300\uD3EC', damage:23, range:3, pattern:[2,5,8] },
        { id:'piplup-bubble-beam', name:'\uAC70\uD488\uAD11\uC120', ko:'\uC55E\uC5D0\uC11C \uD130\uC9C0\uB294 \uAC70\uD488 \uD30C\uB3D9', icon:'\u25CB', kind:'attack', priority:3, energy:31, label:'\uAC70\uD488\uAD11\uC120', damage:39, range:3, pattern:[0,1,2,5,8] }
      ]
    }
  ];

  GEN4.forEach((pokemon) => { if (!POKEMON.some((item) => item.id === pokemon.id)) POKEMON.push(pokemon); });

  if (window.evolutionData) Object.assign(window.evolutionData, {
    turtwig:{ id:'torterra', name:'\uD1A0\uB300\uBD80\uAE30', ko:'\uD1A0\uB300\uBD80\uAE30', type:'\uD480', className:'grass', image:'assets/pokemon/evolved/torterra.png', attack:{ id:'torterra-wood-hammer', name:'\uC6B0\uB4DC\uD574\uBA38', ko:'\uC8FC\uBCC0\uC744 \uD754\uB4DC\uB294 \uAC70\uB300\uD55C \uBC15\uCE58\uAE30', icon:'\u2739', kind:'attack', priority:3, energy:41, label:'\uC6B0\uB4DC\uD574\uBA38', damage:61, range:2, pattern:[1,3,4,5,7] }, upgrades:{ 'turtwig-razor-leaf':{ name:'\uC78E\uB0A0\uAC00\uB974\uAE30+', ko:'\uB354 \uB113\uAC8C \uB0A0\uB9AC\uB294 \uC78E', damage:31, energy:21, range:3 }, 'turtwig-bite':{ name:'\uBB3C\uAE30+', ko:'\uC138\uAC8C \uBB3C\uC5B4 \uC81C\uCE58\uAE30', damage:41, energy:26, range:2 }, 'turtwig-energy-ball':{ name:'\uC5D0\uB108\uC9C0\uBCFC+', ko:'\uB113\uAC8C \uD130\uC9C0\uB294 \uD480\uC758 \uC751\uC9D1\uCCB4', damage:53, energy:35, range:3 } } },
    chimchar:{ id:'infernape', name:'\uCD08\uC5FC\uBABD', ko:'\uCD08\uC5FC\uBABD', type:'\uBD88\uAF43', className:'fire', image:'assets/pokemon/evolved/infernape.png', attack:{ id:'infernape-close-combat', name:'\uC778\uD30C\uC774\uD2B8', ko:'\uC8FC\uBCC0\uAE4C\uC9C0 \uB5A8\uC5B4\uB728\uB9AC\uB294 \uB09C\uD0C0', icon:'\u2694', kind:'attack', priority:5, energy:39, label:'\uC778\uD30C\uC774\uD2B8', damage:58, range:1, pattern:[3,4,5,7] }, upgrades:{ 'chimchar-scratch':{ name:'\uD560\uD034\uAE30+', ko:'\uB354 \uBE60\uB978 \uADFC\uC811 \uD0C0\uACA9', damage:38, energy:23, range:2 }, 'chimchar-ember':{ name:'\uBD88\uAF43\uC138\uB840+', ko:'\uB354 \uB728\uAC70\uC6B4 \uC815\uBA74 \uBD88\uAF43', damage:34, energy:22, range:3 }, 'chimchar-fire-punch':{ name:'\uD30C\uC774\uC5B4\uD380\uCE58+', ko:'\uC55E\uC904\uC744 \uBD88\uD0DC\uC6B0\uB294 \uC8FC\uBA39', damage:54, energy:35, range:3 } } },
    piplup:{ id:'empoleon', name:'\uC5E0\uD398\uB974\uD2B8', ko:'\uC5E0\uD398\uB974\uD2B8', type:'\uBB3C', className:'water', image:'assets/pokemon/evolved/empoleon.png', attack:{ id:'empoleon-hydro-pump', name:'\uD558\uC774\uB4DC\uB85C\uD380\uD504', ko:'\uB113\uAC8C \uD3B8 \uACE0\uC555 \uBB3C\uB300\uD3EC', icon:'\u2248', kind:'attack', priority:3, energy:42, label:'\uD558\uC774\uB4DC\uB85C\uD380\uD504', damage:63, range:3, pattern:[0,1,2,3,4,5,6,7,8] }, upgrades:{ 'piplup-peck':{ name:'\uCABC+', ko:'\uB354 \uB0A0\uCE74\uB85C\uC6B4 \uBD80\uB9AC \uCC0C\uB974\uAE30', damage:37, energy:23, range:2 }, 'piplup-water-gun':{ name:'\uBB3C\uB300\uD3EC+', ko:'\uC555\uCD95\uB41C \uC815\uBA74 \uBB3C\uC904\uAE30', damage:31, energy:20, range:3 }, 'piplup-bubble-beam':{ name:'\uAC70\uD488\uAD11\uC120+', ko:'\uB113\uAC8C \uD130\uC9C0\uB294 \uAC70\uD488 \uD30C\uB3D9', damage:52, energy:34, range:3 } } }
  });

  const generation = (pokemon) => Number(String(pokemon.gen || '').match(/\d+/)?.[0] || 0);
  const makeRosterCard = (pokemon) => {
    const evolution = window.evolutionData?.[pokemon.id];
    if (!evolution) return '';
    return `<button class="pokemon-card ${pokemon.className}" data-pokemon="${pokemon.id}" aria-pressed="false"><span class="gen">${pokemon.gen}</span><span class="type">${pokemon.type}</span><div class="roster-art-pair"><span class="roster-art-stage"><small>\uD604\uC7AC</small><img src="${pokemon.image}" alt="${pokemon.name}" /></span><b class="roster-evolution-arrow">\u2192</b><span class="roster-art-stage evolved"><small>\uC9C4\uD654</small><img src="${evolution.image}" alt="${evolution.name}" /></span></div><h3>${pokemon.name}</h3><p>${pokemon.ko} \u00B7 ${pokemon.stats}</p><span class="roster-evolution-name">\u2192 ${evolution.ko}</span><span class="signature-skill">\uB300\uD45C \uAE30\uC220 \u00B7 ${pokemon.signatureSkill || pokemon.attacks.at(-1)?.name}</span></button>`;
  };

  window.renderRoster = () => {
    const roster = document.querySelector('#pokemon-roster');
    if (!roster) return;
    const typeOrder = ['grass', 'fire', 'water'];
    const rosterOrder = typeOrder.flatMap((type) => POKEMON
      .filter((pokemon) => pokemon.className === type)
      .sort((left, right) => generation(left) - generation(right)));
    roster.className = 'generation-roster compact-roster';
    roster.innerHTML = rosterOrder.map(makeRosterCard).join('');
    document.querySelectorAll('#pokemon-roster [data-pokemon]').forEach((button) => button.addEventListener('click', () => selectPokemon(button.dataset.pokemon)));
  };

  const meta = document.querySelector('.header-meta');
  if (meta) meta.textContent = '1\uC138\uB300 + 2\uC138\uB300 + 3\uC138\uB300 + 4\uC138\uB300';
  if (state.screen === 'select') window.renderRoster();
})();
