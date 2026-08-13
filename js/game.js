const POKEMON = [
  { id:'bulbasaur', name:'BULBASAUR', ko:'이상해씨', gen:'GEN I / GRASS', type:'GRASS', emoji:'🌱', image:'assets/pokemon/bulbasaur.png', className:'grass', stats:'균형형' },
  { id:'charmander', name:'CHARMANDER', ko:'파이리', gen:'GEN I / FIRE', type:'FIRE', emoji:'🔥', image:'assets/pokemon/charmander.png', className:'fire', stats:'공격형' },
  { id:'squirtle', name:'SQUIRTLE', ko:'꼬부기', gen:'GEN I / WATER', type:'WATER', emoji:'💧', image:'assets/pokemon/squirtle.png', className:'water', stats:'방어형' },
  { id:'chikorita', name:'CHIKORITA', ko:'치코리타', gen:'GEN II / GRASS', type:'GRASS', emoji:'🍃', image:'assets/pokemon/chikorita.png', className:'grass', stats:'회복형' },
  { id:'cyndaquil', name:'CYNDAQUIL', ko:'브케인', gen:'GEN II / FIRE', type:'FIRE', emoji:'🦔', image:'assets/pokemon/cyndaquil.png', className:'fire', stats:'기습형' },
  { id:'totodile', name:'TOTODILE', ko:'리아코', gen:'GEN II / WATER', type:'WATER', emoji:'🐊', image:'assets/pokemon/totodile.png', className:'water', stats:'돌진형' },
];

const CARDS = [
  { id:'up', name:'MOVE UP', ko:'위로 이동', icon:'↑', kind:'move', priority:3, energy:0, label:'UP', dx:0, dy:-1 },
  { id:'down', name:'MOVE DOWN', ko:'아래로 이동', icon:'↓', kind:'move', priority:3, energy:0, label:'DOWN', dx:0, dy:1 },
  { id:'left', name:'MOVE LEFT', ko:'왼쪽 이동', icon:'←', kind:'move', priority:3, energy:0, label:'LEFT', dx:-1, dy:0 },
  { id:'right', name:'MOVE RIGHT', ko:'오른쪽 이동', icon:'→', kind:'move', priority:3, energy:0, label:'RIGHT', dx:1, dy:0 },
  { id:'guard', name:'GUARD', ko:'피해 50% 감소', icon:'◈', kind:'guard', priority:5, energy:5, label:'GUARD', defense:true },
  { id:'tackle', name:'TACKLE', ko:'몸통박치기', icon:'✦', kind:'attack', priority:4, energy:18, label:'TACKLE', damage:22, range:1 },
  { id:'ember', name:'EMBER', ko:'불꽃세례', icon:'☄', kind:'attack', priority:4, energy:24, label:'EMBER', damage:28, range:2 },
  { id:'watergun', name:'WATER GUN', ko:'물대포', icon:'≈', kind:'attack', priority:3, energy:26, label:'WATER GUN', damage:32, range:3 },
  { id:'energy', name:'ENERGY UP', ko:'의욕 +30', icon:'⚡', kind:'energy', priority:2, energy:0, label:'ENERGY UP', restore:30 },
];

const $ = (selector) => document.querySelector(selector);
const state = { screen:'start', selected:null, player:null, cpu:null, round:1, turn:0, hazard:new Set(), queue:[], cpuQueue:[], lastFirst:'player', log:[], gameOver:false, executing:false, previewCard:null };
const screens = { start:$('#screen-start'), select:$('#screen-select'), battle:$('#screen-battle'), result:$('#screen-result') };

function resetBattleActionHistory() {
  const priority = $('#priority-list');
  if (priority) priority.innerHTML = '<span class="empty-message">\uCE74\uB4DC \uC120\uD0DD \uD6C4<br />\uD134 \uC21C\uC11C\uAC00 \uD45C\uC2DC\uB429\uB2C8\uB2E4.</span>';
  window.clearActionPreview?.();
}

function showScreen(name) { Object.entries(screens).forEach(([key, el]) => { el.hidden = key !== name; el.classList.toggle('active', key === name); }); state.screen = name; window.scrollTo({top:0, behavior:'smooth'}); }
function formatHp(value) { return Math.max(0, Math.round(value)); }
function clamp(value,min,max) { return Math.max(min,Math.min(max,value)); }
function pokemonById(id) { return POKEMON.find((item) => item.id === id); }
function cardById(id) { return CARDS.find((item) => item.id === id); }
function writeLog(message, tone='') { const log = $('#battle-log'); log.innerHTML = `<span class="log-prefix">SYSTEM //</span> <span class="${tone}">${message}</span>`; }
function toast(message) { const el=$('#toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove('show'),2200); }

function renderRoster() {
  $('#pokemon-roster').innerHTML = POKEMON.map((pokemon) => `<button class="pokemon-card ${pokemon.className}" data-pokemon="${pokemon.id}" aria-pressed="false"><span class="gen">${pokemon.gen}</span><span class="type">${pokemon.type}</span><span class="card-emoji"><img src="${pokemon.image}" alt="${pokemon.name}" /></span><h3>${pokemon.name}</h3><p>${pokemon.ko} · ${pokemon.stats}</p></button>`).join('');
  document.querySelectorAll('[data-pokemon]').forEach((button) => button.addEventListener('click', () => selectPokemon(button.dataset.pokemon)));
}
function selectPokemon(id) { state.selected=id; document.querySelectorAll('[data-pokemon]').forEach((button)=>{ const selected=button.dataset.pokemon===id; button.classList.toggle('selected',selected); button.setAttribute('aria-pressed',String(selected)); }); const pokemon=pokemonById(id); $('#selection-status').innerHTML=`선택 완료 <strong>${pokemon.name}</strong> · ${pokemon.ko}`; $('#confirm-selection').disabled=false; }

function createFighter(pokemon, side, cell) { return { ...pokemon, side, maxHp:100, maxEnergy:100, hp:100, energy:100, x:cell.x, y:cell.y, guarding:false, acted:false }; }
function startNextBattle() {
  const selected=pokemonById(state.selected);
  if(!selected){ renderRoster(); showScreen('select'); return; }
  const opponents=POKEMON.filter((pokemon)=>pokemon.id!==selected.id && (!state.cpu || pokemon.id!==state.cpu.id));
  const cpu=opponents[0] || POKEMON.find((pokemon)=>pokemon.id!==selected.id);
  state.player=createFighter(selected,'player',{x:1,y:2});
  state.cpu=createFighter(cpu,'cpu',{x:4,y:2});
  state.round=1; state.turn=0; state.hazard=new Set(); state.queue=[]; state.cpuQueue=[];
  state.lastFirst='player'; state.gameOver=false; state.executing=false; state.previewCard=null;
  resetBattleActionHistory();
  state.mapTheme=['grassland','forest','lake'][Math.floor(Math.random()*3)];
  renderBattle(); showScreen('battle'); writeLog(`${selected.name} 출전! 새로운 상대 ${cpu.name}이(가) 등장했습니다.`);
}
function startBattle() { const selected=pokemonById(state.selected); const opponents=POKEMON.filter((pokemon)=>pokemon.id!==selected.id); const cpu=opponents[(POKEMON.findIndex((pokemon)=>pokemon.id===selected.id)+2)%opponents.length]; state.player=createFighter(selected,'player',{x:1,y:2}); state.cpu=createFighter(cpu,'cpu',{x:4,y:2}); state.round=1; state.turn=0; state.hazard=new Set(); state.queue=[]; state.cpuQueue=[]; state.lastFirst='player'; state.gameOver=false; state.executing=false; state.previewCard=null; resetBattleActionHistory(); state.mapTheme=['grassland','forest','lake'][Math.floor(Math.random()*3)]; renderBattle(); showScreen('battle'); writeLog(`${selected.name} 출전! 카드를 고르면 3×3 범위가 표시됩니다.`); }
function renderHud(fighter, selector) { const el=$(selector); const hp=formatHp(fighter.hp); const en=formatHp(fighter.energy); el.innerHTML=`<div class="fighter-main"><div class="fighter-avatar"><img class="fighter-art" src="${fighter.image}" alt="${fighter.name}" /></div><div><strong class="fighter-name">${fighter.name}</strong><span class="fighter-generation">${fighter.ko} · ${fighter.type}</span></div></div><div class="meter-labels"><span>HP <strong>${hp}/100</strong></span><span>EN <strong>${en}/100</strong></span></div><div class="meter"><i style="width:${hp}%"></i></div><div class="meter energy"><i style="width:${en}%"></i></div>`; }
function renderBattle() { renderHud(state.player,'#player-hud'); renderHud(state.cpu,'#cpu-hud'); $('#round-number').textContent=String(state.round).padStart(2,'0'); $('#round-state').textContent=state.executing?'EXECUTING':state.queue.length===3?'READY TO EXECUTE':'CARD PHASE'; $('#hazard-count').textContent=`HAZARDS ${String(state.hazard.size).padStart(2,'0')}`; $('#turn-counter').textContent=`TURNS ${String(state.turn).padStart(2,'0')}`; renderGrid(); renderRangeLabel(); renderHand(); renderQueue(); renderCpuQueue(); }
function renderRangeLabel() { const label=$('#range-label'); const card=cardById(state.previewCard); if(!label)return; if(!card){label.textContent='RANGE PREVIEW: NONE';label.className='';return;} const kind=card.kind==='attack'?'ATTACK':card.kind==='move'?'MOVE':'SELF'; label.textContent=`3×3 ${kind} RANGE / ${card.name}`; label.className=`range-label ${card.kind}`; }
function renderGrid() { const grid=$('#battle-grid'); grid.innerHTML=''; const preview=cardById(state.previewCard); for(let y=0;y<5;y++){ for(let x=0;x<6;x++){ const cell=document.createElement('div'); cell.className='grid-cell'; cell.setAttribute('role','gridcell'); cell.dataset.x=x; cell.dataset.y=y; const key=`${x},${y}`; if(state.hazard.has(key)) cell.classList.add('burning'); if(x===1&&y===2)cell.classList.add('player-start'); if(x===4&&y===2)cell.classList.add('cpu-start'); if(preview&&Math.abs(x-state.player.x)<=1&&Math.abs(y-state.player.y)<=1){ cell.classList.add('range-window'); const dx=x-state.player.x; const dy=y-state.player.y; if(dx===0&&dy===0)cell.classList.add('range-origin'); if(preview.kind==='move'&&dx===preview.dx&&dy===preview.dy)cell.classList.add('range-valid'); if(preview.kind==='attack'&&!(dx===0&&dy===0)&&Math.abs(dx)+Math.abs(dy)<=preview.range)cell.classList.add('range-valid'); if(x===state.cpu.x&&y===state.cpu.y)cell.classList.add('range-target'); } if(state.player.x===x&&state.player.y===y) cell.innerHTML=`<div class="fighter-token player" title="${state.player.name}"><img class="token-art" src="${state.player.image}" alt="${state.player.name}" /></div>`; if(state.cpu.x===x&&state.cpu.y===y) cell.innerHTML+=`<div class="fighter-token cpu" title="${state.cpu.name}"><img class="token-art" src="${state.cpu.image}" alt="${state.cpu.name}" /></div>`; grid.append(cell); } } }
function renderHand() { const hand=$('#card-hand'); hand.innerHTML=CARDS.map((card)=>{ const queued=state.queue.includes(card.id); const unavailable=state.executing||card.energy>state.player.energy || (card.kind==='attack'&&state.player.energy<card.energy); return `<button class="action-card ${card.kind} ${queued?'queued':''} ${state.previewCard===card.id?'previewed':''}" data-card="${card.id}" ${unavailable?'disabled':''} aria-label="${card.name}, ${card.ko}"><span class="card-icon">${card.icon}</span><span class="card-name">${card.name}</span><span class="card-korean">${card.ko}</span><span class="card-stats"><b>${card.kind==='attack'?`DM ${card.damage}`:'DM 00'}</b><span>EN ${card.energy}</span></span></button>`; }).join(''); document.querySelectorAll('#card-hand [data-card]').forEach((button)=>{ button.addEventListener('mouseenter',()=>setRangePreview(button.dataset.card)); button.addEventListener('focus',()=>setRangePreview(button.dataset.card)); button.addEventListener('click',()=>toggleCard(button.dataset.card)); }); }
function renderQueue() { $('#player-queue').innerHTML=[0,1,2].map((index)=>{ const card=cardById(state.queue[index]); return card?`<div class="queue-slot filled"><b>0${index+1}</b><span>${card.icon} ${card.label}</span></div>`:`<div class="queue-slot"><b>0${index+1}</b><span>EMPTY</span></div>`; }).join(''); $('#advance-round').disabled=state.queue.length!==3 || state.gameOver || state.executing; }
function renderCpuQueue() { $('#cpu-queue').innerHTML=state.cpuQueue.length?state.cpuQueue.map((id,index)=>{const card=cardById(id);return `<div class="cpu-action"><span class="cpu-index">0${index+1}</span><span class="cpu-icon">${card.icon}</span><div><b class="cpu-name">${card.name}</b><small>${card.ko}</small></div></div>`;}).join(''):'<div class="empty-message">상대의 작전은<br />카드 실행 시 공개됩니다.</div>'; }
function setRangePreview(id) { if(state.executing)return; state.previewCard=id; renderGrid(); renderRangeLabel(); }
function toggleCard(id) { if(state.executing)return; state.previewCard=id; if(state.queue.includes(id)){state.queue=state.queue.filter((item)=>item!==id);} else if(state.queue.length<3){state.queue.push(id);} else {toast('카드는 정확히 3장만 선택할 수 있어요.');} renderBattle(); }
function clearQueue() { if(state.executing)return; state.queue=[]; state.previewCard=null; renderBattle(); writeLog('카드 큐를 비웠습니다.'); }

function chooseCpuQueue() { const distance=Math.abs(state.cpu.x-state.player.x)+Math.abs(state.cpu.y-state.player.y); let pool=['guard','energy','tackle','ember','watergun']; if(distance>3) pool.push('left','right','up','down'); const result=[]; while(result.length<3){ const id=pool[Math.floor(Math.random()*pool.length)]; if(!result.includes(id))result.push(id); } return result; }
function actionPriority(fighter, card) { return { priority:card.priority, energy:fighter.energy, hp:fighter.hp, side:fighter.side }; }
function compareActions(a,b) { const left=actionPriority(a.fighter,a.card); const right=actionPriority(b.fighter,b.card); if(left.priority!==right.priority)return right.priority-left.priority; if(left.energy!==right.energy)return right.energy-left.energy; if(left.hp!==right.hp)return right.hp-left.hp; if(left.side===state.lastFirst)return -1; return 1; }
function findFighter(side) { return side==='player'?state.player:state.cpu; }
function opponentOf(fighter) { return fighter.side==='player'?state.cpu:state.player; }
function applyHazard(fighter) { if(state.hazard.has(`${fighter.x},${fighter.y}`)&&fighter.hp>0){ fighter.hp=clamp(fighter.hp-20,0,100); writeLog(`${fighter.name}가 불타는 타일에서 20 데미지를 입었습니다.`, 'hazard'); return true; } return false; }
function canMove(fighter, card) { const nx=clamp(fighter.x+card.dx,0,5); const ny=clamp(fighter.y+card.dy,0,4); if(nx===fighter.x&&ny===fighter.y)return false; const opponent=opponentOf(fighter); if(nx===opponent.x&&ny===opponent.y)return false; return true; }
function resolveAction(fighter, card) { if(fighter.hp<=0)return; applyHazard(fighter); if(fighter.hp<=0)return; fighter.guarding=false; if(fighter.energy<card.energy){ writeLog(`${fighter.name}의 ${card.name} 실패 — 의욕이 부족합니다.`); return; } fighter.energy=clamp(fighter.energy-card.energy,0,100); const target=opponentOf(fighter); if(card.kind==='move'){ if(canMove(fighter,card)){fighter.x=clamp(fighter.x+card.dx,0,5);fighter.y=clamp(fighter.y+card.dy,0,4);writeLog(`${fighter.name}이(가) ${card.ko} → (${fighter.x+1}, ${fighter.y+1})`);}else writeLog(`${fighter.name}의 ${card.name} — 이동할 수 없습니다.`); } else if(card.kind==='guard'){ fighter.guarding=true; writeLog(`${fighter.name}이(가) 방어 태세! 다음 피해 50% 감소.`); } else if(card.kind==='energy'){ fighter.energy=clamp(fighter.energy+card.restore,0,100); writeLog(`${fighter.name}이(가) 에너지를 ${card.restore} 회복했습니다.`, 'energy'); } else if(card.kind==='attack'){ const distance=Math.abs(fighter.x-target.x)+Math.abs(fighter.y-target.y); if(distance<=card.range){ const damage=Math.round(card.damage*(target.guarding?.5:1)); target.hp=clamp(target.hp-damage,0,100); writeLog(`${fighter.name}의 ${card.name}! ${target.name}에게 ${damage} 데미지.`, 'attack'); if(target.hp===0)finishBattle(fighter); } else writeLog(`${fighter.name}의 ${card.name} — 사정거리 밖입니다.`); } }
function finishBattle(winner) { if(state.gameOver)return; state.gameOver=true; state.executing=false; const loser=opponentOf(winner); setTimeout(()=>{ $('#result-word').textContent=winner.side==='player'?'CHAMPION':'DEFEATED'; $('#result-summary').innerHTML=`<div class="result-stat"><span>WINNER</span><strong>${winner.name}</strong></div><div class="result-stat"><span>ROUNDS</span><strong>${String(state.round).padStart(2,'0')}</strong></div><div class="result-stat"><span>FINAL HP</span><strong>${formatHp(winner.hp)}</strong></div>`; showScreen('result'); },700); writeLog(`${loser.name}의 HP가 0이 되었습니다. ${winner.name} 승리!`, 'attack'); }
function growHazards() { const amount=1+Math.floor(Math.random()*3); const candidates=[]; for(let y=0;y<5;y++)for(let x=0;x<6;x++){const key=`${x},${y}`; if(!state.hazard.has(key)&&!(x===state.player.x&&y===state.player.y)&&!(x===state.cpu.x&&y===state.cpu.y))candidates.push(key);} for(let i=0;i<amount&&candidates.length;i++){ const index=Math.floor(Math.random()*candidates.length); state.hazard.add(candidates.splice(index,1)[0]); } return amount; }
function renderPriority(actions) { $('#priority-list').innerHTML=actions.map((entry,index)=>`<div class="priority-entry ${entry.fighter.side==='cpu'?'cpu':''}"><b>0${index+1}</b><strong>${entry.fighter.emoji}</strong><span>${entry.fighter.name} · ${entry.card.name}</span></div>`).join(''); }
function executeRound() { if(state.queue.length!==3||state.gameOver||state.executing)return; state.executing=true; state.previewCard=null; state.cpuQueue=chooseCpuQueue(); renderCpuQueue(); const actions=[]; for(let index=0;index<3;index++){actions.push({fighter:state.player,card:cardById(state.queue[index])},{fighter:state.cpu,card:cardById(state.cpuQueue[index])});} actions.sort(compareActions); renderPriority(actions); $('#round-state').textContent='EXECUTING'; $('#advance-round').disabled=true; let cursor=0; const timer=setInterval(()=>{ if(cursor>=actions.length||state.gameOver){clearInterval(timer);if(!state.gameOver)finishRound();return;} const current=actions[cursor]; state.lastFirst=current.fighter.side; state.turn++; resolveAction(current.fighter,current.card); renderBattle(); cursor++; },520); }
function finishRound() { const amount=growHazards(); state.round++; state.queue=[]; state.cpuQueue=[]; state.player.guarding=false; state.cpu.guarding=false; state.executing=false; renderBattle(); $('#round-state').textContent='CARD PHASE'; writeLog(`라운드 종료. 새로운 불타는 타일 ${amount}개가 생겼습니다. 다음 세 장을 선택하세요.`, 'hazard'); }

document.querySelectorAll('[data-action="go-select"]').forEach((button)=>button.addEventListener('click',()=>{if(button.closest('#screen-result')){if(state.resultWinnerSide==='cpu'){window.resetRunState?.();state.selected=null;state.player=null;state.cpu=null;renderRoster();$('#selection-status').textContent='파트너를 선택하세요';$('#confirm-selection').disabled=true;showScreen('select');return;}startNextBattle();return;} renderRoster(); state.selected=null; $('#selection-status').textContent='파트너를 선택하세요'; $('#confirm-selection').disabled=true; showScreen('select');}));
$('#confirm-selection').addEventListener('click',startBattle); $('#clear-queue').addEventListener('click',clearQueue); $('#advance-round').addEventListener('click',executeRound);
// Character-specific signature attacks. Utility cards stay shared, but every
// fighter now has a private three-card attack kit used by both sides.
const CHARACTER_ATTACKS = {
  bulbasaur: [
    { id:'bulbasaur-vine-whip', name:'VINE WHIP', ko:'Vine lash', icon:'〰', kind:'attack', priority:4, energy:18, label:'VINE WHIP', damage:24, range:2 },
    { id:'bulbasaur-razor-leaf', name:'RAZOR LEAF', ko:'Leaf blades', icon:'✦', kind:'attack', priority:4, energy:24, label:'RAZOR LEAF', damage:30, range:3 },
    { id:'bulbasaur-seed-bomb', name:'SEED BOMB', ko:'Seed blast', icon:'✹', kind:'attack', priority:3, energy:30, label:'SEED BOMB', damage:38, range:2 },
  ],
  charmander: [
    { id:'charmander-ember', name:'EMBER', ko:'Flame sparks', icon:'☄', kind:'attack', priority:4, energy:19, label:'EMBER', damage:26, range:2 },
    { id:'charmander-fire-fang', name:'FIRE FANG', ko:'Burning bite', icon:'🔥', kind:'attack', priority:5, energy:24, label:'FIRE FANG', damage:34, range:1 },
    { id:'charmander-flamethrower', name:'FLAMETHROWER', ko:'Flame stream', icon:'♨', kind:'attack', priority:3, energy:32, label:'FLAMETHROWER', damage:40, range:3 },
  ],
  squirtle: [
    { id:'squirtle-water-gun', name:'WATER GUN', ko:'Water shot', icon:'≈', kind:'attack', priority:4, energy:18, label:'WATER GUN', damage:22, range:3 },
    { id:'squirtle-bite', name:'BITE', ko:'Lockjaw', icon:'◈', kind:'attack', priority:5, energy:22, label:'BITE', damage:30, range:1 },
    { id:'squirtle-aqua-tail', name:'AQUA TAIL', ko:'Tidal strike', icon:'↯', kind:'attack', priority:3, energy:29, label:'AQUA TAIL', damage:38, range:2 },
  ],
  chikorita: [
    { id:'chikorita-razor-leaf', name:'RAZOR LEAF', ko:'Leaf blades', icon:'✦', kind:'attack', priority:4, energy:19, label:'RAZOR LEAF', damage:22, range:3 },
    { id:'chikorita-magical-leaf', name:'MAGICAL LEAF', ko:'Guided leaves', icon:'✧', kind:'attack', priority:4, energy:25, label:'MAGICAL LEAF', damage:29, range:3 },
    { id:'chikorita-petal-dance', name:'PETAL DANCE', ko:'Petal storm', icon:'❋', kind:'attack', priority:3, energy:33, label:'PETAL DANCE', damage:42, range:2 },
  ],
  cyndaquil: [
    { id:'cyndaquil-ember', name:'EMBER', ko:'Flame sparks', icon:'☄', kind:'attack', priority:4, energy:19, label:'EMBER', damage:25, range:2 },
    { id:'cyndaquil-flame-wheel', name:'FLAME WHEEL', ko:'Rolling flame', icon:'◉', kind:'attack', priority:5, energy:24, label:'FLAME WHEEL', damage:35, range:1 },
    { id:'cyndaquil-flamethrower', name:'FLAMETHROWER', ko:'Flame stream', icon:'♨', kind:'attack', priority:3, energy:32, label:'FLAMETHROWER', damage:40, range:3 },
  ],
  totodile: [
    { id:'totodile-water-gun', name:'WATER GUN', ko:'Water shot', icon:'≈', kind:'attack', priority:4, energy:18, label:'WATER GUN', damage:23, range:3 },
    { id:'totodile-bite', name:'BITE', ko:'Lockjaw', icon:'◈', kind:'attack', priority:5, energy:23, label:'BITE', damage:33, range:1 },
    { id:'totodile-aqua-tail', name:'AQUA TAIL', ko:'Tidal strike', icon:'↯', kind:'attack', priority:3, energy:30, label:'AQUA TAIL', damage:41, range:2 },
  ],
};

const KOREAN_POKEMON = {
  bulbasaur:{name:'이상해씨',ko:'풀 타입',gen:'1세대 / 풀',type:'풀',stats:'균형형'},
  charmander:{name:'파이리',ko:'불꽃 타입',gen:'1세대 / 불꽃',type:'불꽃',stats:'공격형'},
  squirtle:{name:'꼬부기',ko:'물 타입',gen:'1세대 / 물',type:'물',stats:'방어형'},
  chikorita:{name:'치코리타',ko:'풀 타입',gen:'2세대 / 풀',type:'풀',stats:'회복형'},
  cyndaquil:{name:'브케인',ko:'불꽃 타입',gen:'2세대 / 불꽃',type:'불꽃',stats:'기습형'},
  totodile:{name:'리아코',ko:'물 타입',gen:'2세대 / 물',type:'물',stats:'돌진형'},
};
const KOREAN_CARDS = {
  up:{name:'위로 이동',ko:'위쪽 칸으로 이동',label:'위로'}, down:{name:'아래로 이동',ko:'아래쪽 칸으로 이동',label:'아래로'},
  left:{name:'왼쪽 이동',ko:'왼쪽 칸으로 이동',label:'왼쪽'}, right:{name:'오른쪽 이동',ko:'오른쪽 칸으로 이동',label:'오른쪽'},
  guard:{name:'방어',ko:'피해 50% 감소',label:'방어'}, energy:{name:'의욕 회복',ko:'의욕 +20',label:'회복',priority:6},
};
const KOREAN_ATTACKS = {
  'bulbasaur-vine-whip':['덩굴채찍','덩굴로 공격'], 'bulbasaur-razor-leaf':['잎날가르기','날카로운 잎'], 'bulbasaur-seed-bomb':['씨폭탄','씨앗 폭발'],
  'charmander-ember':['불꽃세례','작은 불꽃'], 'charmander-fire-fang':['불꽃엄니','불꽃 이빨'], 'charmander-flamethrower':['화염방사','화염 분사'],
  'squirtle-water-gun':['물대포','강한 물줄기'], 'squirtle-bite':['물기','강력한 물기'], 'squirtle-aqua-tail':['아쿠아테일','물의 꼬리'],
  'chikorita-razor-leaf':['잎날가르기','날카로운 잎'], 'chikorita-magical-leaf':['매지컬리프','유도 잎사귀'], 'chikorita-petal-dance':['꽃잎댄스','꽃잎 폭풍'],
  'cyndaquil-ember':['불꽃세례','작은 불꽃'], 'cyndaquil-flame-wheel':['화염바퀴','회전 불꽃'], 'cyndaquil-flamethrower':['화염방사','화염 분사'],
  'totodile-water-gun':['물대포','강한 물줄기'], 'totodile-bite':['물기','강력한 물기'], 'totodile-aqua-tail':['아쿠아테일','물의 꼬리'],
};
POKEMON.forEach((pokemon) => { Object.assign(pokemon, KOREAN_POKEMON[pokemon.id]); pokemon.attacks = CHARACTER_ATTACKS[pokemon.id] || []; pokemon.image = `assets/pokemon/pixel/${pokemon.id}.png`; });
CARDS.forEach((card) => { if (KOREAN_CARDS[card.id]) Object.assign(card, KOREAN_CARDS[card.id]); });
Object.values(CHARACTER_ATTACKS).flat().forEach((card) => { const korean=KOREAN_ATTACKS[card.id]; if (korean) { card.name=korean[0]; card.ko=korean[1]; card.label=korean[0]; } });

function getAllCards() { return [...CARDS.filter((card) => card.kind !== 'attack'), ...POKEMON.flatMap((pokemon) => pokemon.attacks)]; }
function getHand(fighter) { return [...CARDS.filter((card) => card.kind !== 'attack'), ...fighter.attacks]; }
function cardById(id) { return getAllCards().find((card) => card.id === id); }

function renderRoster() {
  $('#pokemon-roster').innerHTML = POKEMON.map((pokemon) => `<button class="pokemon-card ${pokemon.className}" data-pokemon="${pokemon.id}" aria-pressed="false"><span class="gen">${pokemon.gen}</span><span class="type">${pokemon.type}</span><span class="card-emoji"><img src="${pokemon.image}" alt="${pokemon.name}" /></span><h3>${pokemon.name}</h3><p>${pokemon.ko} · ${pokemon.stats}</p><span class="signature-skill">SIGNATURE // ${pokemon.attacks[0].name}</span></button>`).join('');
  document.querySelectorAll('[data-pokemon]').forEach((button) => button.addEventListener('click', () => selectPokemon(button.dataset.pokemon)));
}

function renderHand() {
  const hand = $('#card-hand');
  hand.innerHTML = getHand(state.player).map((card) => { const queued=state.queue.includes(card.id); const unavailable=state.executing||card.energy>state.player.energy; return `<button class="action-card ${card.kind} ${queued?'queued':''} ${state.previewCard===card.id?'previewed':''}" data-card="${card.id}" ${unavailable?'disabled':''} aria-label="${card.name}, ${card.ko}"><span class="card-icon">${card.icon}</span><span class="card-name">${card.name}</span><span class="card-korean">${card.ko}</span><span class="card-stats"><b>${card.kind==='attack'?`DM ${card.damage}`:'DM 00'}</b><span>EN ${card.energy}</span></span></button>`; }).join('');
  document.querySelectorAll('#card-hand [data-card]').forEach((button) => { button.addEventListener('mouseenter', () => setRangePreview(button.dataset.card)); button.addEventListener('focus', () => setRangePreview(button.dataset.card)); button.addEventListener('click', () => toggleCard(button.dataset.card)); });
}

function updateHudValues(fighter, selector) {
  const hud=$(selector); if(!hud)return;
  const hp=formatHp(fighter.hp); const en=formatHp(fighter.energy);
  const values=hud.querySelectorAll('.meter-labels strong');
  const meters=hud.querySelectorAll('.meter i');
  if(values[0])values[0].textContent=`${hp}/100`;
  if(values[1])values[1].textContent=`${en}/100`;
  if(meters[0])meters[0].style.width=`${hp}%`;
  if(meters[1])meters[1].style.width=`${en}%`;
}

function updateGridPositions() {
  const grid=$('#battle-grid');
  if(!grid)return;
  const cells=[...grid.querySelectorAll('.grid-cell')];
  const playerToken=grid.querySelector('.fighter-token.player');
  const cpuToken=grid.querySelector('.fighter-token.cpu');
  const playerCell=cells.find((cell)=>Number(cell.dataset.x)===state.player.x&&Number(cell.dataset.y)===state.player.y);
  const cpuCell=cells.find((cell)=>Number(cell.dataset.x)===state.cpu.x&&Number(cell.dataset.y)===state.cpu.y);
  if(playerToken&&playerCell)playerCell.append(playerToken);
  if(cpuToken&&cpuCell)cpuCell.append(cpuToken);
}

function updateActionVisuals() {
  updateHudValues(state.player,'#player-hud');
  updateHudValues(state.cpu,'#cpu-hud');
  $('#turn-counter').textContent=`턴 ${String(state.turn).padStart(2,'0')}`;
  $('#round-state').textContent='실행 중';
  updateGridPositions();
}

function executeRound() {
  if(state.queue.length!==3||state.gameOver||state.executing)return;
  state.executing=true; state.previewCard=null; state.cpuQueue=chooseCpuQueue();
  renderHand(); renderCpuQueue();
  const actions=[];
  for(let index=0;index<3;index++){
    const slotActions=[
      {fighter:state.player,card:cardById(state.queue[index]),slot:index},
      {fighter:state.cpu,card:cardById(state.cpuQueue[index]),slot:index}
    ];
    // 카드 슬롯은 반드시 1번 → 2번 → 3번으로 진행하고, 같은 슬롯 안에서만 우선순위를 적용한다.
    slotActions.sort(compareActions);
    actions.push(...slotActions);
  }
  renderPriority(actions); $('#round-state').textContent='실행 중'; $('#advance-round').disabled=true;
  let cursor=0;
  const runNextAction=()=>{
    if(cursor>=actions.length||state.gameOver){
      window.clearActionPreview?.();
      if(!state.gameOver)finishRound();
      return;
    }
    const current=actions[cursor];
    state.lastFirst=current.fighter.side;
    window.showActionPreview?.(current.fighter,current.card);
      setTimeout(()=>{
      if(state.gameOver){ window.clearActionPreview?.(); return; }
      state.turn++;
      resolveAction(current.fighter,current.card);
      updateActionVisuals();
      window.clearActionPreview?.();
      cursor++;
      setTimeout(runNextAction,620);
    },420);
  };
  runNextAction();
}

function chooseCpuQueue() {
  const pool = getHand(state.cpu).filter((card) => card.energy <= state.cpu.energy).map((card) => card.id);
  const result = [];
  while (result.length < 3) { const id = pool[Math.floor(Math.random() * pool.length)]; if (!result.includes(id)) result.push(id); }
  return result;
}

renderRoster();
showScreen('start');

// 한글 UI 최종 렌더러
function writeLog(message, tone='') { const log=$('#battle-log'); log.innerHTML=`<span class="log-prefix">시스템 //</span> <span class="${tone}">${message}</span>`; }
function renderRoster() { $('#pokemon-roster').innerHTML=POKEMON.map((pokemon)=>`<button class="pokemon-card ${pokemon.className}" data-pokemon="${pokemon.id}" aria-pressed="false"><span class="gen">${pokemon.gen}</span><span class="type">${pokemon.type}</span><span class="card-emoji"><img src="${pokemon.image}" alt="${pokemon.name}" /></span><h3>${pokemon.name}</h3><p>${pokemon.ko} · ${pokemon.stats}</p><span class="signature-skill">대표 기술 · ${pokemon.attacks[0].name}</span></button>`).join(''); document.querySelectorAll('[data-pokemon]').forEach((button)=>button.addEventListener('click',()=>selectPokemon(button.dataset.pokemon))); }
function renderRangeLabel() { const label=$('#range-label'); const card=cardById(state.previewCard); if(!label)return; if(!card){label.textContent='범위 미리보기: 없음';label.className='';return;} const kind=card.kind==='attack'?'공격':card.kind==='move'?'이동':'자신'; label.textContent=`3×3 ${kind} 범위 / ${card.name}`; label.className=`range-label ${card.kind}`; }
function renderHud(fighter, selector) { const el=$(selector); const hp=formatHp(fighter.hp); const en=formatHp(fighter.energy); el.innerHTML=`<div class="fighter-main"><div class="fighter-avatar"><img class="fighter-art" src="${fighter.image}" alt="${fighter.name}" /></div><div><strong class="fighter-name">${fighter.name}</strong><span class="fighter-generation">${fighter.ko} · ${fighter.type}</span></div></div><div class="meter-labels"><span>체력 <strong>${hp}/100</strong></span><span>의욕 <strong>${en}/100</strong></span></div><div class="meter"><i style="width:${hp}%"></i></div><div class="meter energy"><i style="width:${en}%"></i></div>`; }
function renderQueue() { $('#player-queue').innerHTML=[0,1,2].map((index)=>{const card=cardById(state.queue[index]);return card?`<div class="queue-slot filled"><b>0${index+1}</b><span>${card.icon} ${card.label}</span></div>`:`<div class="queue-slot"><b>0${index+1}</b><span>비어 있음</span></div>`;}).join(''); $('#advance-round').disabled=state.queue.length!==3||state.gameOver||state.executing; }
function renderHand() { const hand=$('#card-hand'); hand.innerHTML=getHand(state.player).map((card)=>{const queued=state.queue.includes(card.id);const unavailable=state.executing||card.energy>state.player.energy;return `<button class="action-card ${card.kind} ${queued?'queued':''} ${state.previewCard===card.id?'previewed':''}" data-card="${card.id}" ${unavailable?'disabled':''} aria-label="${card.name}, ${card.ko}"><span class="card-icon">${card.icon}</span><span class="card-name">${card.name}</span><span class="card-korean">${card.ko}</span><span class="card-stats"><b>${card.kind==='attack'?`공격 ${card.damage}`:'공격 00'}</b><span>의욕 ${card.energy}</span></span></button>`;}).join(''); document.querySelectorAll('#card-hand [data-card]').forEach((button)=>{button.addEventListener('mouseenter',()=>setRangePreview(button.dataset.card));button.addEventListener('focus',()=>setRangePreview(button.dataset.card));button.addEventListener('click',()=>toggleCard(button.dataset.card));}); }
function renderBattle() { renderHud(state.player,'#player-hud'); renderHud(state.cpu,'#cpu-hud'); $('#round-number').textContent=String(state.round).padStart(2,'0'); $('#round-state').textContent=state.executing?'실행 중':state.queue.length===3?'실행 준비':'카드 선택'; $('#hazard-count').textContent=`위험 칸 ${String(state.hazard.size).padStart(2,'0')}`; $('#turn-counter').textContent=`턴 ${String(state.turn).padStart(2,'0')}`; renderGrid(); renderRangeLabel(); renderHand(); renderQueue(); renderCpuQueue(); }
function finishBattle(winner) { if(state.gameOver)return; state.gameOver=true; state.executing=false; state.resultWinnerSide=winner.side; const loser=opponentOf(winner); setTimeout(()=>{ $('#result-word').textContent=winner.side==='player'?'승리!':'패배!'; $('#result-summary').innerHTML=`<div class="result-stat"><span>승자</span><strong>${winner.name}</strong></div><div class="result-stat"><span>라운드</span><strong>${String(state.round).padStart(2,'0')}</strong></div><div class="result-stat"><span>남은 체력</span><strong>${formatHp(winner.hp)}</strong></div>`; showScreen('result'); },700); writeLog(`${loser.name}의 체력이 0이 되었습니다. ${winner.name} 승리!`, 'attack'); }
function executeRound() { if(state.queue.length!==3||state.gameOver||state.executing)return; state.executing=true; state.previewCard=null; state.cpuQueue=chooseCpuQueue(); renderCpuQueue(); const actions=[]; for(let index=0;index<3;index++){actions.push({fighter:state.player,card:cardById(state.queue[index])},{fighter:state.cpu,card:cardById(state.cpuQueue[index])});} actions.sort(compareActions); renderPriority(actions); $('#round-state').textContent='실행 중'; $('#advance-round').disabled=true; let cursor=0; const timer=setInterval(()=>{if(cursor>=actions.length||state.gameOver){clearInterval(timer);if(!state.gameOver)finishRound();return;} const current=actions[cursor];state.lastFirst=current.fighter.side;state.turn++;resolveAction(current.fighter,current.card);renderBattle();cursor++;},520); }
function finishRound() { const amount=growHazards(); state.round++; state.queue=[]; state.cpuQueue=[]; state.player.guarding=false; state.cpu.guarding=false; state.executing=false; state.previewCard=null; renderBattle(); writeLog(`라운드 종료. 새로운 불타는 타일 ${amount}개가 생겼습니다. 다음 세 장을 선택하세요.`, 'hazard'); }
function renderHand() {
  const hand = $('#card-hand');
  hand.innerHTML = getHand(state.player).map((card) => {
    const queued = state.queue.includes(card.id);
    const unavailable = state.executing || card.energy > state.player.energy;
    const role = card.kind === 'attack' ? '기술' : card.kind === 'move' ? '이동' : card.kind === 'guard' ? '방어' : '회복';
    const range = card.kind === 'attack' ? `사거리 ${card.range}` : card.kind === 'move' ? '범위 1칸' : '자신';
    const art = card.kind === 'attack' ? `<img class="card-character-art" src="${state.player.image}" alt="" />` : '';
    return `<button class="action-card ${card.kind} ${queued?'queued':''} ${state.previewCard===card.id?'previewed':''}" data-card="${card.id}" ${unavailable?'disabled':''} aria-label="${card.name}, ${card.ko}">${art}<span class="card-badge">${role}</span><span class="card-icon">${card.icon}</span><span class="card-name">${card.name}</span><span class="card-korean">${card.ko}</span><span class="card-range">${range} · 우선 ${card.priority}</span><span class="card-stats"><b>${card.kind==='attack'?`공격 ${card.damage}`:'공격 00'}</b><span>의욕 ${card.energy}</span></span></button>`;
  }).join('');
  document.querySelectorAll('#card-hand [data-card]').forEach((button) => { button.addEventListener('mouseenter', () => setRangePreview(button.dataset.card)); button.addEventListener('focus', () => setRangePreview(button.dataset.card)); button.addEventListener('click', () => toggleCard(button.dataset.card)); });
}
function executeRound() {
  if(state.queue.length!==3||state.gameOver||state.executing)return;
  state.executing=true; state.previewCard=null; state.cpuQueue=chooseCpuQueue();
  renderHand(); renderCpuQueue();
  const actions=[];
  for(let index=0;index<3;index++){
    const slotActions=[
      {fighter:state.player,card:cardById(state.queue[index]),slot:index},
      {fighter:state.cpu,card:cardById(state.cpuQueue[index]),slot:index}
    ];
    // 카드 슬롯은 반드시 1번 → 2번 → 3번으로 진행하고, 같은 슬롯 안에서만 우선순위를 적용한다.
    slotActions.sort(compareActions);
    actions.push(...slotActions);
  }
  renderPriority(actions); $('#round-state').textContent='실행 중'; $('#advance-round').disabled=true;
  let cursor=0;
  const runNextAction=()=>{
    if(cursor>=actions.length||state.gameOver){
      window.clearActionPreview?.();
      if(!state.gameOver)finishRound();
      return;
    }
    const current=actions[cursor];
    state.lastFirst=current.fighter.side;
    window.showActionPreview?.(current.fighter,current.card);
    setTimeout(()=>{
      if(state.gameOver){ window.clearActionPreview?.(); return; }
      state.turn++;
      resolveAction(current.fighter,current.card);
      updateActionVisuals();
      window.clearActionPreview?.();
      cursor++;
      setTimeout(runNextAction,220);
    },300);
  };
  runNextAction();
}
function projectedEnergyForQueue(queue=state.queue) {
  let energy=state.player.energy;
  queue.forEach((id)=>{ const card=cardById(id); if(!card)return; if(card.kind==='energy')energy=clamp(energy+card.restore,0,100); else energy=Math.max(0,energy-card.energy); });
  return energy;
}

function renderHand() {
  const hand=$('#card-hand');
  const energyAfterQueue=projectedEnergyForQueue(state.queue);
  hand.innerHTML=getHand(state.player).map((card)=>{
    const queued=state.queue.includes(card.id);
    const canAfford=queued||card.energy<=energyAfterQueue;
    const unavailable=state.executing||!canAfford;
    const role=card.kind==='attack'?'기술':card.kind==='move'?'이동':card.kind==='guard'?'방어':'회복';
    const range=card.kind==='attack'?`사거리 ${card.range}`:card.kind==='move'?'범위 1칸':'자신';
    const art=card.kind==='attack'?`<img class="card-character-art" src="${state.player.image}" alt="" />`:'';
    const forecast=card.kind==='attack'&&!queued&&card.energy>state.player.energy&&energyAfterQueue>=card.energy?'<span class="energy-forecast">충전 반영</span>':'';
    return `<button class="action-card ${card.kind} ${queued?'queued':''} ${state.previewCard===card.id?'previewed':''}" data-card="${card.id}" ${unavailable?'disabled':''} aria-label="${card.name}, ${card.ko}">${art}<span class="card-badge">${role}</span>${forecast}<span class="card-icon">${card.icon}</span><span class="card-name">${card.name}</span><span class="card-korean">${card.ko}</span><span class="card-range">${range} · 우선 ${card.priority}</span><span class="card-stats"><b>${card.kind==='attack'?`공격 ${card.damage}`:'공격 00'}</b><span>의욕 ${card.energy}</span></span></button>`;
  }).join('');
  document.querySelectorAll('#card-hand [data-card]').forEach((button)=>{button.addEventListener('mouseenter',()=>setRangePreview(button.dataset.card));button.addEventListener('focus',()=>setRangePreview(button.dataset.card));button.addEventListener('click',()=>toggleCard(button.dataset.card));});
}

// Final card renderer: use escaped Korean literals so the UI cannot regress into mojibake.
function renderHand() {
  const hand=$('#card-hand');
  const energyAfterQueue=projectedEnergyForQueue(state.queue);
  hand.innerHTML=getHand(state.player).map((card)=>{
    const queued=state.queue.includes(card.id);
    const canAfford=queued||card.energy<=energyAfterQueue;
    const unavailable=state.executing||!canAfford;
    const role=card.kind==='attack'?'\uAE30\uC220':card.kind==='move'?'\uC774\uB3D9':card.kind==='guard'?'\uBC29\uC5B4':'\uD68C\uBCF5';
    const range=card.kind==='attack'?`\uC0AC\uAC70\uB9AC ${card.range}`:card.kind==='move'?'\uBC94\uC704 1\uCE78':'\uC790\uC2E0';
    const art=card.kind==='attack'?`<img class="card-character-art" src="${state.player.image}" alt="" />`:'';
    const forecast=card.kind==='attack'&&!queued&&card.energy>state.player.energy&&energyAfterQueue>=card.energy?'<span class="energy-forecast">\uCDA9\uC804 \uBC18\uC601</span>':'';
    const stats=`<div class="card-stats"><span class="card-stat-line"><b>DM</b><strong>${card.kind==='attack'?String(card.damage).padStart(2,'0'):'00'}</strong></span><span class="card-stat-line"><b>EN</b><strong>${String(card.energy).padStart(2,'0')}</strong></span></div>`;
    const miniGrid=`<span class="card-mini-range ${card.kind}" aria-label="3\u00D73 \uBC94\uC704 \uD45C\uC2DC">${miniRangeCells(card)}</span>`;
    return `<button class="action-card ${card.kind} ${queued?'queued':''} ${state.previewCard===card.id?'previewed':''}" data-card="${card.id}" ${unavailable?'disabled':''} aria-label="${card.name}, ${card.ko}">${art}<span class="card-badge">${role}</span>${forecast}<span class="card-icon">${card.icon}</span><span class="card-name">${card.name}</span><span class="card-korean">${card.ko}</span><span class="card-range">${range} \u00B7 \uC6B0\uC120 ${card.priority}</span><div class="card-footer">${stats}${miniGrid}</div></button>`;
  }).join('');
  document.querySelectorAll('#card-hand [data-card]').forEach((button)=>{button.addEventListener('mouseenter',()=>setRangePreview(button.dataset.card));button.addEventListener('focus',()=>setRangePreview(button.dataset.card));button.addEventListener('click',()=>toggleCard(button.dataset.card));});
}

function chooseCpuQueue() {
  const all=getHand(state.cpu); const pool=all.map((card)=>card.id); const result=[];
  if(state.cpu.energy<35){const energyCard=all.find((card)=>card.kind==='energy');if(energyCard)result.push(energyCard.id);}
  while(result.length<3){const id=pool[Math.floor(Math.random()*pool.length)];if(!result.includes(id))result.push(id);}
  return result;
}

const ATTACK_PATTERN_OVERRIDES = {
  'bulbasaur-vine-whip':[5], 'bulbasaur-razor-leaf':[2,5,8], 'bulbasaur-seed-bomb':[0,1,2],
  'charmander-ember':[2,5,8], 'charmander-fire-fang':[5], 'charmander-flamethrower':[1,2,5,8],
  'squirtle-water-gun':[2,5,8], 'squirtle-bite':[5], 'squirtle-aqua-tail':[0,3,6],
  'chikorita-razor-leaf':[2,5,8], 'chikorita-magical-leaf':[0,1,2,5,8], 'chikorita-petal-dance':[0,1,2,3,5,6,7,8],
  'cyndaquil-ember':[2,5,8], 'cyndaquil-flame-wheel':[5], 'cyndaquil-flamethrower':[1,2,5,8],
  'totodile-water-gun':[2,5,8], 'totodile-bite':[5], 'totodile-aqua-tail':[0,3,6],
  'treecko-absorb':[1,4,7], 'treecko-quick-attack':[5], 'treecko-leaf-blade':[2,6],
  'torchic-peck':[5], 'torchic-ember':[2,5,8], 'torchic-blaze-kick':[2,5,8],
  'mudkip-water-gun':[2,5,8], 'mudkip-tackle':[5], 'mudkip-mud-bomb':[0,1,2],
  'impact-crash':[5], 'pulse-shot':[0,1,2,5,8], 'wide-burst':[1,3,4,5,7],
  'venusaur-petal-blizzard':[0,1,2,3,5,6,7,8], 'charizard-dragon-claw':[2,5,8], 'blastoise-surf':[0,1,2,3,4,5,6,7,8],
  'meganium-flower-bloom':[0,1,2,3,5,6,7,8], 'typhlosion-eruption':[1,4,7], 'feraligatr-waterfall':[2,5,8],
  'sceptile-leaf-storm':[0,1,2,3,5,6,7,8], 'blaziken-blaze-storm':[1,2,5,8], 'swampert-hydro-cannon':[0,1,2,3,4,5,6,7,8]
};

function cardRangePattern(card) {
  if(!card)return [];
  if(card.kind==='move') {
    const dx=Math.sign(card.dx||0); const dy=Math.sign(card.dy||0);
    const direction={up:1,down:7,left:3,right:5}[card.id];
    if(direction!==undefined)return [direction];
    if(dx!==0||dy!==0)return [(dy+1)*3+(dx+1)];
    return [];
  }
  if(card.kind==='attack') {
    if(Array.isArray(card.pattern)) return card.pattern;
    return ATTACK_PATTERN_OVERRIDES[card.id] || {1:[5],2:[2,5,8],3:[0,1,2,5,8]}[Math.min(3,card.range||1)] || [5];
  }
  return [];
}

function miniRangeCells(card) {
  const cells=Array(9).fill('window');
  cells[4]='origin';
  cardRangePattern(card).forEach((index)=>{cells[index]='active';});
  return cells.map((className)=>`<i class="${className}"></i>`).join('');
}

function renderGrid() {
  const grid=$('#battle-grid');
  if(!grid)return;
  grid.innerHTML='';
  const backgroundNames=['grassland','forest','lake'];
  grid.dataset.theme=state.mapTheme||backgroundNames[0];
  const board=document.createElement('div');
  board.className='grid-board';
  for(let y=0;y<5;y++) {
    for(let x=0;x<6;x++) {
      const cell=document.createElement('div');
      cell.className='grid-cell';
      cell.setAttribute('role','gridcell');
      cell.dataset.x=x; cell.dataset.y=y;
      const key=`${x},${y}`;
      if(state.hazard.has(key))cell.classList.add('burning');
      if(x===1&&y===2)cell.classList.add('player-start');
      if(x===4&&y===2)cell.classList.add('cpu-start');
      if(state.player.x===x&&state.player.y===y)cell.innerHTML=`<div class="fighter-token player" data-pokemon="${state.player.evolutionId||state.player.id}" title="${state.player.name}"><img class="token-art" src="${state.player.image}" alt="${state.player.name}" /></div>`;
      if(state.cpu.x===x&&state.cpu.y===y)cell.innerHTML+=`<div class="fighter-token cpu" data-pokemon="${state.cpu.evolutionId||state.cpu.id}" title="${state.cpu.name}"><img class="token-art" src="${state.cpu.image}" alt="${state.cpu.name}" /></div>`;
      board.append(cell);
    }
  }
  const effects=document.createElement('div');
  effects.className='combat-effects';
  effects.setAttribute('aria-hidden','true');
  grid.append(board,effects);
}

function attackPatternContains(fighter,target,card) {
  let dx=target.x-fighter.x; const dy=target.y-fighter.y;
  if(fighter.side==='cpu')dx=-dx;
  if(Math.abs(dx)>1||Math.abs(dy)>1)return false;
  return cardRangePattern(card).includes((dy+1)*3+(dx+1));
}

function resolveAction(fighter, card) {
  if(fighter.hp<=0)return;
  applyHazard(fighter);
  if(fighter.hp<=0){
    finishBattle(opponentOf(fighter));
    return;
  }
  fighter.guarding=false;
  if(fighter.energy<card.energy){writeLog(`${fighter.name}의 ${card.name} 실패 — 의욕이 부족합니다.`);return;}
  fighter.energy=clamp(fighter.energy-card.energy,0,100);
  const target=opponentOf(fighter);
  if(card.kind==='move') {
    if(canMove(fighter,card)){fighter.x=clamp(fighter.x+card.dx,0,5);fighter.y=clamp(fighter.y+card.dy,0,4);writeLog(`${fighter.name}이(가) ${card.ko} → (${fighter.x+1}, ${fighter.y+1})`);}
    else writeLog(`${fighter.name}의 ${card.name} — 이동할 수 없습니다.`);
  } else if(card.kind==='guard') {
    fighter.guarding=true; writeLog(`${fighter.name}이(가) 방어 태세! 다음 피해 50% 감소.`);
  } else if(card.kind==='energy') {
    fighter.energy=clamp(fighter.energy+card.restore,0,100); writeLog(`${fighter.name}이(가) 의욕을 ${card.restore} 회복했습니다.`, 'energy');
  } else if(card.kind==='attack') {
    if(attackPatternContains(fighter,target,card)) {
      const damage=Math.round(card.damage*(target.guarding?.5:1));
      target.hp=clamp(target.hp-damage,0,100);
      writeLog(`${fighter.name}의 ${card.name}! ${target.name}에게 ${damage} 데미지.`, 'attack');
      if(target.hp===0)finishBattle(fighter);
    } else writeLog(`${fighter.name}의 ${card.name} — 공격 범위 밖입니다.`);
  }
}

function miniRangeCells(card) {
  const cells=Array(9).fill('window');
  cells[4]='origin';
  cardRangePattern(card).forEach((index)=>{cells[index]='active';});
  return cells.map((className)=>`<i class="${className}"></i>`).join('');
}

function renderHand() {
  const hand=$('#card-hand');
  const energyAfterQueue=projectedEnergyForQueue(state.queue);
  hand.innerHTML=getHand(state.player).map((card)=>{
    const queued=state.queue.includes(card.id);
    const canAfford=queued||card.energy<=energyAfterQueue;
    const unavailable=state.executing||!canAfford;
    const role=card.kind==='attack'?'기술':card.kind==='move'?'이동':card.kind==='guard'?'방어':'회복';
    const range=card.kind==='attack'?`사거리 ${card.range}`:card.kind==='move'?'범위 1칸':'자신';
    const art=card.kind==='attack'?`<img class="card-character-art" src="${state.player.image}" alt="" />`:'';
    const forecast=card.kind==='attack'&&!queued&&card.energy>state.player.energy&&energyAfterQueue>=card.energy?'<span class="energy-forecast">충전 반영</span>':'';
    const stats=`<div class="card-stats"><span class="card-stat-line"><b>DM</b><strong>${card.kind==='attack'?String(card.damage).padStart(2,'0'):'00'}</strong></span><span class="card-stat-line"><b>EN</b><strong>${String(card.energy).padStart(2,'0')}</strong></span></div>`;
    const miniGrid=`<span class="card-mini-range ${card.kind}" aria-label="3×3 범위 표시">${miniRangeCells(card)}</span>`;
    return `<button class="action-card ${card.kind} ${queued?'queued':''} ${state.previewCard===card.id?'previewed':''}" data-card="${card.id}" ${unavailable?'disabled':''} aria-label="${card.name}, ${card.ko}">${art}<span class="card-badge">${role}</span>${forecast}<span class="card-icon">${card.icon}</span><span class="card-name">${card.name}</span><span class="card-korean">${card.ko}</span><span class="card-range">${range} · 우선 ${card.priority}</span><div class="card-footer">${stats}${miniGrid}</div></button>`;
  }).join('');
  document.querySelectorAll('#card-hand [data-card]').forEach((button)=>{button.addEventListener('mouseenter',()=>setRangePreview(button.dataset.card));button.addEventListener('focus',()=>setRangePreview(button.dataset.card));button.addEventListener('click',()=>toggleCard(button.dataset.card));});
}
