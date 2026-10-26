(function(){
var Z=function(ms){return new Promise(function(z){setTimeout(z,ms)})};
var H=function(n,c){return '<img class="ic '+(c||'')+'" src="/img/'+n+'.png" alt="" draggable="false">'};
var P=window.play||function(fn){return run(fn)};
var PK=[8,3,1.4,0.7,0.4,0.7,1.4,3,8];
var twM=function(k){var m=1-cfg.edge/100,j;for(j=0;j<k;j++)m*=4/3;return Math.floor(m*100)/100};
var TL=[
  ['slots','slot','Слоты','до x150'],
  ['crash',0,'Краш','3D ракета'],
  ['plinko',0,'Плинко','шар и корзины'],
  ['mines',0,'Мины','до x1000'],
  ['tower',0,'Башня','8 этажей 3D'],
  ['blackjack','cards','Блэкджек','x2.5'],
  ['roulette','roulette','Рулетка','x2 · x36'],
  ['dice','dice_white','Кости','два кубика'],
  ['limbo',0,'Лимбо','свой множитель'],
  ['flip','coin','Монетка','x2'],
  ['rps','hand_p','КНБ','x1.94'],
  ['penalty',0,'Пенальти','удар 3D'],
  ['chests',0,'Сундуки','открой один'],
  ['hilo',0,'Хай-Лоу','выше / ниже'],
  ['wheel','wheel','Колесо','раз в сутки'],
  ['duel','chips','Дуэли','с друзьями']
];
var EM={crash:'🚀',mines:'💣',plinko:'🔮',tower:'🏰',limbo:'📈',penalty:'⚽',chests:'📦',hilo:'🔺'};
window.renderGames=function(){
  $('#gg').innerHTML=TL.map(function(t){var on=t[0]=='duel'||cfg.games[t[0]];
    return '<button class="gc'+(on?'':' off')+'" data-g="'+t[0]+'"><span class="pic">'+(t[1]?H(t[1]):'<em>'+EM[t[0]]+'</em>')+'</span>'+t[2]+'<small>'+t[3]+'</small></button>'}).join('');
  $$('#gg .gc').forEach(function(b){
    b.onclick=function(){var g=b.dataset.g;if(g=='duel')return nav('friends');if(!cfg.games[g])return tg.showAlert('Игра временно отключена');openGame(g)};
    var mv=function(e){if(window.FXLITE)return;var r=b.getBoundingClientRect(),t=e.touches?e.touches[0]:e,x=(t.clientX-r.left)/r.width-.5,y=(t.clientY-r.top)/r.height-.5;b.style.transform='perspective(700px) rotateY('+(x*22)+'deg) rotateX('+(-y*18)+'deg) translateZ(12px) scale(1.05)'};
    var rs=function(){b.style.transform=''};
    b.addEventListener('pointermove',mv);b.addEventListener('touchmove',mv,{passive:true});
    ['pointerleave','pointerup','pointercancel','touchend'].forEach(function(ev){b.addEventListener(ev,rs)});
  });
};

var HOW7={
  plinko:'Брось шар сверху. Он прыгает по 3D-колышкам влево и вправо и падает в корзину. Крайние корзины платят больше, центральные — чаще, но меньше.',
  tower:'На каждом этаже 4 сундука, один пустой. Выбери сундук и поднимайся выше. Множитель растёт. Забрать можно после первого удачного этажа.',
  limbo:'Поставь целевой множитель от 1.01x до 100x. Если случайное число сервера не ниже цели — ставка умножается на неё. Чем выше цель, тем реже победа.',
  penalty:'Выбери угол: лево, центр или право. Вратарь прыгает случайно. Если не угадал твой удар — гол. Выплата около x1.45.',
  chests:'Четыре 3D-сундука. Внутри случайный множитель: от пустого до x20. Открой один — остальные покажут, что в них было.'
};
var _og=openGame;window.openGame=function(g){_og(g);if(!HOW7[g])return;var t=HOW7[g],d=document.createElement('details');d.className='how';d.innerHTML='<summary>ℹ️ Как играть</summary><p>'+t+'</p>';$('#gbody').insertBefore(d,$('#gbody').firstChild)};

/* ---- ПЛИНКО ---- */
G.plinko={t:'Плинко',i:'🔮',d:'',r:function(){
  var bins=PK.map(function(m,i){return '<i class="'+(m>=3?'hi':'')+'" data-i="'+i+'">x'+m+'</i>'}).join('');
  var rows='',r,p;
  for(r=0;r<8;r++){rows+='<div class="pk-row">';for(p=0;p<r+3;p++)rows+='<span class="pk-peg"></span>';rows+='</div>'}
  $('#gbody').innerHTML='<div class="card"><div class="pk"><div class="pk-world" id="pkw">'+rows+'</div><div class="pk-ball" id="pkb"></div><div class="pk-bins">'+bins+'</div></div>'+betBox()+'<button class="go" id="go">БРОСИТЬ ШАР</button><div class="msg" id="m"></div></div>';
  $('#go').onclick=function(){P(async function(){
    var b=bet(),ball=$('#pkb');$('#m').textContent='';$$('.pk-bins i').forEach(function(x){x.classList.remove('on')});
    var resv=await api('plinko',{bet:b}),x=0,y=0,i,row,n,left;
    ball.style.transition='none';ball.style.left='50%';ball.style.top='4px';void ball.offsetWidth;
    ball.style.transition='left .16s linear,top .16s cubic-bezier(.2,.8,.3,1)';
    for(i=0;i<resv.path.length;i++){
      x+=resv.path[i]?1:-1;y=i+1;row=$('#pkw').children[i];
      n=row.children.length;left=((n-1)/2+x/2)/(n-1)*100;
      ball.style.left=left+'%';ball.style.top=(8+y*32)+'px';
      if(!window.FXLITE)await Z(170);else await Z(40);
    }
    ball.style.top='310px';ball.style.left=((resv.slot+.5)/9*100)+'%';
    await Z(window.FXLITE?80:220);
    $$('.pk-bins i')[resv.slot].classList.add('on');
    res('#m',resv.win,b);
  })};
}};

/* ---- БАШНЯ ---- */
G.tower={t:'Башня',i:'🏰',d:'',r:function(){
  var live=false,bt=0,floor=0,picks=[],html='',f,c;
  for(f=7;f>=0;f--){html+='<div class="tw-floor" data-f="'+f+'">';for(c=0;c<4;c++)html+='<button class="tw-box" data-c="'+c+'" disabled><i>📦</i></button>';html+='</div>'}
  $('#gbody').innerHTML='<div class="card"><div class="msg" id="ti">Выбери сундук на этаже. Один из четырёх пустой.</div><div class="tw"><div class="tw-stack" id="ts">'+html+'</div></div><button class="go" id="cash" hidden>Забрать</button><div id="tbet">'+betBox()+'<button class="go" id="go">СТАРТ</button></div><div class="msg" id="m"></div></div>';
  var floorEl=function(n){return $('#ts .tw-floor[data-f="'+n+'"]')};
  var paint=function(){
    $$('#ts .tw-floor').forEach(function(el){var n=+el.dataset.f;el.className='tw-floor'+(n===floor&&live?' cur':'')+(n<floor?' done':'')});
    $$('#ts .tw-box').forEach(function(b){var fl=+b.parentNode.dataset.f;b.disabled=!live||fl!==floor;b.className='tw-box'+(fl===floor&&live?' cur':'')});
    picks.forEach(function(col,i){var b=floorEl(i).querySelector('[data-c="'+col+'"]');b.classList.add('ok');$('i',b).textContent='💎'});
    $('#cash').hidden=!live||!floor;$('#cash').textContent='Забрать x'+twM(floor)+' · '+fmt(Math.floor(bt*twM(floor)));
    $('#tbet').hidden=live;$('#ti').textContent=live?('Этаж '+(floor+1)+'/8 · следующий x'+twM(floor+1)):'Выбери сундук на этаже. Один из четырёх пустой.';
  };
  var reveal=function(bombs){live=false;paint();bombs.forEach(function(col,i){var b=floorEl(i)&&floorEl(i).querySelector('[data-c="'+col+'"]');if(b&&b.className.indexOf('ok')<0){b.classList.add('bad');$('i',b).textContent='💀'}});$('#cash').hidden=true;$('#tbet').hidden=false};
  var reset=function(){$$('#ts .tw-box').forEach(function(b){b.className='tw-box';$('i',b).textContent='📦';b.disabled=true});picks=[];floor=0};
  paint();
  $('#ts').onclick=function(e){var bx=e.target.closest('.tw-box');if(!bx||bx.disabled)return;run(async function(){try{
    var r=await api('tower_pick',{col:+bx.dataset.c});
    if(r.boom){bx.classList.add('bad');$('i',bx).textContent='💀';reveal(r.bombs);res('#m',0,bt);snd('lose')}
    else if(r.cashed){picks.push(r.col);floor=8;paint();reveal(r.bombs);res('#m',r.win,bt)}
    else{picks.push(r.col);floor=r.floor;paint();hap('success');snd('click')}
  }catch(x){fail('#m',x)}})};
  $('#go').onclick=function(){run(async function(){try{bt=bet();$('#m').textContent='';await api('tower_start',{bet:bt});reset();live=true;floor=0;picks=[];paint()}catch(x){fail('#m',x)}})};
  $('#cash').onclick=function(){run(async function(){try{var r=await api('tower_cash');reveal(r.bombs);res('#m',r.win,bt)}catch(x){fail('#m',x)}})};
  api('resume').then(function(r){if(r.tower){bt=r.tower.bet;floor=r.tower.floor;picks=r.tower.picks||[];live=true;paint()}}).catch(function(){});
}};

/* ---- ЛИМБО ---- */
G.limbo={t:'Лимбо',i:'📈',d:'',r:function(){
  $('#gbody').innerHTML='<div class="card"><div class="lb-stage"><div class="lb-num" id="ln">1.00x</div></div><div style="text-align:center;margin:6px 0" id="li"></div><input type="range" id="lr" min="101" max="10000" value="200"><div class="opt" id="lq">'+[1.5,2,3,5,10,25].map(function(x){return '<button data-t="'+x+'">'+x+'x</button>'}).join('')+'</div>'+betBox()+'<button class="go" id="go">ИГРАТЬ</button><div class="msg" id="m"></div></div>';
  var tgt=2,info=function(){var t=+$('#lr').value/100,ch=(100-cfg.edge)/t;tgt=t;$('#ln').className='lb-num';$('#ln').textContent=t.toFixed(2)+'x';
    $('#li').innerHTML='Цель <b>'+t.toFixed(2)+'x</b> · шанс <b>'+ch.toFixed(1)+'%</b>';$$('#lq button').forEach(function(b){b.classList.toggle('on',+b.dataset.t==t)})};
  info();$('#lr').oninput=info;$$('#lq button').forEach(function(b){b.onclick=function(){$('#lr').value=Math.round(+b.dataset.t*100);info()}});
  $('#go').onclick=function(){P(async function(){
    var b=bet(),el=$('#ln');$('#m').textContent='';el.className='lb-num spin';
    var r=await api('limbo',{bet:b,target:tgt}),i,n=window.FXLITE?4:18;
    for(i=0;i<n;i++){el.textContent=(1+Math.random()*Math.max(tgt,2)).toFixed(2)+'x';await Z(40)}
    el.className='lb-num '+(r.win?'win':'lose');el.textContent=r.result.toFixed(2)+'x';
    res('#m',r.win,b);
  })};
}};

/* ---- ПЕНАЛЬТИ ---- */
G.penalty={t:'Пенальти',i:'⚽',d:'',r:function(){
  var side='c',move={l:'translateX(-78px)',c:'translateX(0)',r:'translateX(78px)'},kick={l:'translate(-90px,-118px) scale(.6)',c:'translate(0,-128px) scale(.55)',r:'translate(90px,-118px) scale(.6)'};
  $('#gbody').innerHTML='<div class="card"><div class="pn"><div class="pn-goal"></div><div class="pn-zones" id="pz"><button data-s="l"></button><button data-s="c" class="on"></button><button data-s="r"></button></div><div class="pn-keep" id="pkp"><b></b><s></s></div><div class="pn-ball" id="pnb"></div></div><div class="opt" id="ps"><button data-s="l">⬅️ Лево</button><button data-s="c" class="on">⬆️ Центр</button><button data-s="r">Право ➡️</button></div>'+betBox()+'<button class="go" id="go">УДАР · x'+(1.5*(1-cfg.edge/100)).toFixed(2)+'</button><div class="msg" id="m"></div></div>';
  var setS=function(s){side=s;$$('#ps button,#pz button').forEach(function(b){b.classList.toggle('on',b.dataset.s==s)})};
  $$('#ps button,#pz button').forEach(function(b){b.onclick=function(){setS(b.dataset.s)}});
  $('#go').onclick=function(){P(async function(){
    var b=bet(),keep=$('#pkp'),ball=$('#pnb');$('#m').textContent='';keep.style.transform='';ball.style.transform='';
    var r=await api('penalty',{bet:b,side:side});
    keep.style.transform=move[r.keeper];ball.style.transform=kick[r.side];
    await Z(window.FXLITE?200:600);
    if(r.scored){res('#m',r.win,b);boom()}else{res('#m',0,b)}
  })};
}};

/* ---- СУНДУКИ ---- */
G.chests={t:'Сундуки',i:'📦',d:'',r:function(){
  var html='',i;for(i=0;i<4;i++)html+='<button class="ch" data-i="'+i+'"><span class="lid"></span><span class="body">?</span></button>';
  $('#gbody').innerHTML='<div class="card"><div class="ch-row" id="cr">'+html+'</div>'+betBox()+'<div class="msg" id="m">Выбери сундук</div></div>';
  $$('#cr .ch').forEach(function(bx){bx.onclick=function(){P(async function(){
    var b=bet();$('#m').textContent='';$$('#cr .ch').forEach(function(x){x.disabled=true;x.className='ch'});
    var r=await api('chests',{bet:b,pick:+bx.dataset.i});
    $$('#cr .ch').forEach(function(x,k){
      x.classList.add('open');if(k===r.pick)x.classList.add('pick');else x.classList.add('miss');
      $('.body',x).textContent=r.prizes[k]?'x'+r.prizes[k]:'пусто';
    });
    await Z(400);res('#m',r.win,b);
    $$('#cr .ch').forEach(function(x){x.disabled=false});
  })}});
}};

if(typeof cfg!=='undefined'&&cfg)renderGames();
})();
