(function(){
var H=function(n,c){return '<img class="ic '+(c||'')+'" src="/img/'+n+'.png" alt="" draggable="false">'};
var SV={rocket:'<path d="M12 2.5c3.2 2.2 4.6 5.2 4.6 8.5 0 1.4-.3 2.7-.9 4H8.3c-.6-1.3-.9-2.6-.9-4 0-3.3 1.4-6.3 4.6-8.5z"/><circle cx="12" cy="9.5" r="1.6"/><path d="M8.3 15l-3 3.5.2-4.2L7.4 12.6M15.7 15l3 3.5-.2-4.2-1.9-1.7M10.2 18.5c.4 1.4 1 2.5 1.8 3.5.8-1 1.4-2.1 1.8-3.5"/>',
bomb:'<circle cx="10.5" cy="14" r="6.5"/><path d="M15.2 9.3l2.4-2.4M17.6 6.9l1.4-.3M17.6 6.9l.2-1.5M20 3.6l.7-1.6M21 5.4l1.6-.4M19.2 2.4l-.3-1.3"/>',
cards:'<rect x="3" y="5.5" width="11" height="15" rx="2" transform="rotate(-9 8.5 13)"/><rect x="10" y="3.5" width="11" height="15" rx="2" transform="rotate(8 15.5 11)"/><path d="M15.5 8.2l1.3 1.8-1.3 1.8-1.3-1.8z"/>',
swords:'<path d="M5 3l8.5 8.5M5 3v3.5M5 3h3.5M19 3l-8.5 8.5M19 3v3.5M19 3h-3.5M8 13l-3.5 3.5M5 16.5l-1.5 1.5 2.5 2.5L7.5 19M16 13l3.5 3.5M19 16.5l1.5 1.5-2.5 2.5L16.5 19"/>',
plinko:'<circle cx="12" cy="5" r="1.6"/><circle cx="8" cy="11" r="1.6"/><circle cx="16" cy="11" r="1.6"/><circle cx="4.5" cy="17" r="1.6"/><circle cx="12" cy="17" r="1.6"/><circle cx="19.5" cy="17" r="1.6"/>',
blast:'<rect x="3" y="3" width="8" height="8" rx="1.6"/><rect x="13" y="3" width="8" height="8" rx="1.6"/><rect x="3" y="13" width="8" height="8" rx="1.6"/><path d="M13 17h8M17 13v8"/>',
checkers:'<circle cx="7" cy="7" r="3"/><circle cx="17" cy="7" r="3"/><circle cx="12" cy="12" r="3"/><circle cx="7" cy="17" r="3"/><circle cx="17" cy="17" r="3"/>',
c4:'<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8" cy="9" r="1.4"/><circle cx="12" cy="9" r="1.4"/><circle cx="16" cy="9" r="1.4"/><circle cx="8" cy="15" r="1.4"/><circle cx="12" cy="15" r="1.4"/><circle cx="16" cy="15" r="1.4"/>',
search:'<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>'};
var svg=function(k,c){return '<svg class="'+(c||'svgic')+'" viewBox="0 0 24 24" aria-hidden="true">'+SV[k]+'</svg>'};
function toast(t){var d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(function(){d.classList.add('out')},2400);setTimeout(function(){d.remove()},2900)}
var CATS=[['all','Все'],['auto','Автоматы'],['cards','Карты'],['dice','Кости и монеты'],['fast','Скорость'],['friends','С друзьями']];
var SEC={auto:'Автоматы и колёса',cards:'Карточные игры',dice:'Кости и монеты',fast:'Скоростные',friends:'С друзьями'};
var GM=[
 {k:'slots',t:'Слоты',d:'до x150',img:'slot',cat:'auto'},{k:'roulette',t:'Рулетка',d:'x2 · x36',img:'roulette',cat:'auto'},{k:'wheel',t:'Колесо',d:'раз в сутки',img:'wheel',cat:'auto'},
 {k:'blackjack',t:'Блэкджек',d:'выплата x2.5',img:'cards',cat:'cards'},{k:'hilo',t:'Хай-Лоу',d:'выше или ниже',photo:'hilo_t.jpg',cat:'cards'},
 {k:'dice',t:'Кости',d:'сумма двух',img:'dice_white',cat:'dice'},{k:'flip',t:'Монетка',d:'доллар или пики',img:'coin',cat:'dice'},{k:'rps',t:'КНБ',d:'камень·ножницы',img:'hand_p',cat:'dice'},
 {k:'plinko',t:'Плинко',d:'до x260',svg:'plinko',cat:'fast'},{k:'blockblast',t:'Блок Бласт',d:'до x25',svg:'blast',cat:'fast'},
 {k:'crash',t:'Краш',d:'забери вовремя',svg:'rocket',cat:'fast'},{k:'mines',t:'Мины',d:'до x1000',svg:'bomb',cat:'fast'},
 {k:'durak',t:'Дурак',d:'с ботом и друзьями',svg:'cards',cat:'friends',tags:['cards']},{k:'checkers',t:'Шашки',d:'онлайн и с ботом',svg:'checkers',cat:'friends'},{k:'connect4',t:'Четыре в ряд',d:'онлайн и с ботом',svg:'c4',cat:'friends'},
 {k:'duel',t:'Дуэли',d:'кости, карта, КНБ',svg:'swords',cat:'friends'}];
var tab='all',q='';
var rec=function(){try{return JSON.parse(localStorage.getItem('recent')||'[]')}catch(e){return[]}};
function remember(k){try{var r=rec().filter(function(x){return x!=k});r.unshift(k);localStorage.setItem('recent',JSON.stringify(r.slice(0,4)))}catch(e){}}
function icon(g,cls){return g.photo?'<img class="tpic" src="/img/'+g.photo+'" alt="">':g.img?H(g.img):svg(g.svg)}
function tile(g){var off=!(g.k=='duel'||g.k=='durak'?(g.k=='duel'||cfg.games.durak):cfg.games[g.k]);
 return '<button class="gc'+(off?' off':'')+'" data-g="'+g.k+'"><span class="pic">'+icon(g)+'</span><b>'+g.t+'</b><small>'+g.d+'</small></button>'}
function match(g){if(q){var s=q.toLowerCase();return (g.t+' '+g.d).toLowerCase().indexOf(s)>-1}return tab=='all'||g.cat==tab||(g.tags&&g.tags.indexOf(tab)>-1)}
function open_(k){if(k=='duel')return nav('friends');if(k=='durak'){if(!cfg.games.durak)return tg.showAlert('Игра временно отключена');if(window.durakMenu)return window.durakMenu();toast('Выбери друга и нажми ⚔️, затем «Дурак»');return nav('friends')}
 if(!cfg.games[k])return tg.showAlert('Игра временно отключена');remember(k);openGame(k)}
function draw(){var box=$('#gsec');if(!box)return;var list=GM.filter(match),h='';
 var recs=(!q&&tab=='all')?rec().map(function(k){return GM.filter(function(g){return g.k==k})[0]}).filter(Boolean):[];
 if(recs.length)h+='<div class="sh"><span>Недавние</span></div><div class="rcs">'+recs.map(function(g){return '<button class="rcb" data-g="'+g.k+'"><span class="pic">'+icon(g)+'</span>'+g.t+'</button>'}).join('')+'</div>';
 if(!list.length)h+='<div class="gnone">Ничего не найдено</div>';
 else if(q)h+='<div class="sh"><span>Результаты</span><i>'+list.length+'</i></div><div class="sg">'+list.map(tile).join('')+'</div>';
 else if(tab!='all')h+='<div class="sh"><span>'+(SEC[tab]||'')+'</span><i>'+list.length+'</i></div><div class="sg">'+list.map(tile).join('')+'</div>';
 else Object.keys(SEC).forEach(function(c){var l=list.filter(function(g){return g.cat==c});if(l.length)h+='<div class="sh"><span>'+SEC[c]+'</span><i>'+l.length+'</i></div><div class="sg">'+l.map(tile).join('')+'</div>'});
 box.innerHTML=h;$$('#gsec [data-g]').forEach(function(b){b.onclick=function(){open_(b.dataset.g)}})}
window.renderGames=function(){var gg=$('#gg');if(!gg||typeof cfg==='undefined'||!cfg)return;gg.className='';
 gg.innerHTML='<div class="gsr">'+svg('search','gsi')+'<input id="gs" placeholder="Найти игру" autocomplete="off" value="'+q.replace(/"/g,'')+'"></div><div class="cats" id="cats">'+CATS.map(function(c){return '<button class="ct'+(c[0]==tab?' on':'')+'" data-c="'+c[0]+'">'+c[1]+'</button>'}).join('')+'</div><div id="gsec"></div>';
 $$('#cats .ct').forEach(function(b){b.onclick=function(){tab=b.dataset.c;q='';$('#gs').value='';$$('#cats .ct').forEach(function(x){x.classList.toggle('on',x==b)});draw()}});
 $('#gs').oninput=function(){q=this.value.trim();draw()};
 var bn=$('#bonus');if(bn&&bn.parentNode&&bn.nextElementSibling!==gg)bn.parentNode.insertBefore(bn,gg);draw()};
var _nav9=nav;window.nav=function(v){_nav9(v);if(v=='games'&&typeof cfg!=='undefined'&&cfg&&$('#gsec'))draw()};
if(typeof cfg!=='undefined'&&cfg)renderGames();
})();
