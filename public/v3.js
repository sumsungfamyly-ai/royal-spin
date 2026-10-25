(function(){
var H=function(n,c){return '<img class="ic '+(c||'')+'" src="/img/'+n+'.png" alt="" draggable="false">'};
var Z=function(ms){return new Promise(function(z){setTimeout(z,ms)})};
/* ---- режим эффектов (авто подстраивается под слабые устройства) ---- */
var fx='auto';try{fx=localStorage.getItem('fx')||'auto'}catch(e){}
var weak=(navigator.deviceMemory&&navigator.deviceMemory<=2)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=3)||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
function applyFx(){window.FXLITE=fx==='lite'||(fx==='auto'&&weak);document.documentElement.classList.toggle('lite',!!window.FXLITE)}applyFx();
/* ---- фон и шапка ---- */
var bg=document.createElement('div');bg.className='bg3d';
['chip_red','coin','crown','dice','chip_black','heart'].forEach(function(n,i){bg.innerHTML+='<img class="ic" src="/img/'+n+'.png" alt="" style="left:'+(4+i*16)+'%;top:'+(8+(i*37)%72)+'%;width:'+(40+(i%3)*14)+'px;animation-delay:-'+(i*2)+'s">'});
document.body.insertBefore(bg,document.body.firstChild);
document.querySelector('.logo').innerHTML=H('crown')+' ROYAL SPIN';
var bn=$('#bonus');bn.className='go bn';bn.innerHTML=H('gift')+'<span>Ежедневный бонус</span>';
window.setMe=function(m){var up=me&&m.balance>me.balance;me=m;var b=$('#bal');b.innerHTML=H('coin')+'<span>'+fmt(m.balance)+'</span>';if(up){b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop')}};
window.boom=function(){var n=window.FXLITE?6:20;for(var i=0;i<n;i++){var s=document.createElement('span');s.className='cf';s.innerHTML=H(['chip_red','coin','chip_black'][i%3]);s.style.left=Math.random()*100+'vw';s.style.animationDuration=1.3+Math.random()*1.5+'s';s.style.transform='scale('+(.5+Math.random()*.7)+')';document.body.appendChild(s);setTimeout(function(x){return function(){x.remove()}}(s),3200)}};
/* ---- плитки игр с 3D-наклоном ---- */
var TL=[['slots','slot','Слоты','до x150'],['crash',0,'Краш','забери вовремя'],['mines',0,'Мины','до x1000'],['blackjack','cards','Блэкджек','выплата x2.5'],['roulette','roulette','Рулетка','x2 · x36'],['dice','dice','Кости','свой шанс'],['flip','coin','Монетка','x2'],['wheel','gift','Колесо','раз в сутки'],['duel','chips','Дуэли','с друзьями']],EM={crash:'🚀',mines:'💣'};
window.renderGames=function(){
 $('#gg').innerHTML=TL.map(function(t){var on=t[0]=='duel'||cfg.games[t[0]];return '<button class="gc'+(on?'':' off')+'" data-g="'+t[0]+'"><span class="pic">'+(t[1]?H(t[1]):'<em>'+EM[t[0]]+'</em>')+'</span>'+t[2]+'<small>'+t[3]+'</small></button>'}).join('');
 $$('#gg .gc').forEach(function(b){
  b.onclick=function(){var g=b.dataset.g;if(g=='duel')return nav('friends');if(!cfg.games[g])return tg.showAlert('Игра временно отключена');openGame(g)};
  var mv=function(e){if(window.FXLITE)return;var r=b.getBoundingClientRect(),t=e.touches?e.touches[0]:e,x=(t.clientX-r.left)/r.width-.5,y=(t.clientY-r.top)/r.height-.5;b.style.transform='perspective(600px) rotateY('+(x*20)+'deg) rotateX('+(-y*20)+'deg) scale(1.04)'};
  var rs=function(){b.style.transform=''};
  b.addEventListener('pointermove',mv);b.addEventListener('touchmove',mv,{passive:true});['pointerleave','pointerup','pointercancel','touchend'].forEach(function(ev){b.addEventListener(ev,rs)});
 });
};
/* ---- настройка эффектов в профиле ---- */
var _pr=profile;window.profile=function(){_pr();var c=document.createElement('div');c.className='card';
 c.innerHTML='<h3>✨ Эффекты</h3><div class="opt" id="fxo"><button data-m="auto">Авто</button><button data-m="max">Макс</button><button data-m="lite">Лёгкий</button></div><small>«Лёгкий» отключает 3D и фоновые анимации, если приложение тормозит.</small>';
 $('#v-me').appendChild(c);var mk=function(){$$('#fxo button').forEach(function(b){b.classList.toggle('on',b.dataset.m==fx)})};mk();
 $$('#fxo button').forEach(function(b){b.onclick=function(){fx=b.dataset.m;try{localStorage.setItem('fx',fx)}catch(e){}applyFx();mk();renderGames()}})};
/* ---- 3D монета ---- */
G.flip.r=function(){var side='heads',a=0;
 $('#gbody').innerHTML='<div class="card"><div class="c3"><div class="c3i" id="c3i"><div>'+H('coin')+'</div><div class="bk">'+H('chip_black')+'</div></div></div><div class="opt" id="sd"><button class="on" data-s="heads">🦅 Орёл</button><button data-s="tails">🔘 Решка</button></div>'+betBox()+'<button class="go" id="go">БРОСИТЬ · x2</button><div class="msg" id="m"></div></div>';
 sel('#sd',function(b){side=b.dataset.s});
 $('#go').onclick=function(){run(async function(){var b=bet();$('#m').textContent='';
  try{var r=await api('flip',{bet:b,side:side}),end=r.result=='heads'?0:180;a+=1440+(((end-(a%360))%360)+360)%360;$('#c3i').style.transform='rotateY('+a+'deg)';await Z(1250);res('#m',r.win,b)}catch(e){fail('#m',e)}})}};
/* ---- 3D кубики к костям ---- */
var PIP={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]},FACE=[[0,0],[0,-90],[-90,0],[90,0],[0,90],[0,180]];
function cube(){var h='';for(var f=1;f<=6;f++){h+='<div class="cf3 f'+f+'">';for(var i=0;i<9;i++)h+='<i'+(PIP[f].indexOf(i)>-1?' class="p"':'')+'></i>';h+='</div>'}return '<div class="sc"><div class="cube">'+h+'</div></div>'}
var _dr=G.dice.r;G.dice.r=function(){_dr();var box=document.createElement('div');box.className='cubes';box.innerHTML=cube()+cube();var card=$('#gbody .card');card.insertBefore(box,card.firstChild);
 var st=[[0,0],[0,0]],cs=$$('.cube',box);
 var show=function(){cs.forEach(function(c,i){var k=Math.floor(Math.random()*6);st[i][0]+=720;st[i][1]+=720;c.style.transform='rotateX('+(st[i][0]+FACE[k][0]-24)+'deg) rotateY('+(st[i][1]+FACE[k][1]+30)+'deg)'})};
 $('#go').addEventListener('click',function(){if(!busy)show()})};
/* ---- 3D колесо рулетки ---- */
var _rr=G.roulette.r;G.roulette.r=function(){_rr();var box=document.createElement('div');box.className='w3';box.innerHTML='<div class="w3i">'+H('roulette')+'</div>';var card=$('#gbody .card');card.insertBefore(box,card.firstChild);
 var w=0,img=$('img',box);$('#go').addEventListener('click',function(){if(busy)return;w+=1080+Math.random()*360;img.style.transform='rotate('+w+'deg)'})};
/* ---- МИНЫ ---- */
G.mines={t:'Мины',i:'💣',d:'',r:function(){var cnt=3,live=false,bt=0,tl='';
 for(var i=0;i<25;i++)tl+='<div class="mt" data-i="'+i+'"><i><b class="fr"></b><b class="bk"></b></i></div>';
 $('#gbody').innerHTML='<div class="card"><div class="msg" id="mi" style="margin:0 0 10px">Выбери число мин и ставку</div><div class="mg" id="mg">'+tl+'</div><div class="opt" id="mc" style="margin-top:12px">'+[1,3,5,10].map(function(n){return '<button data-n="'+n+'"'+(n==3?' class="on"':'')+'>'+n+' 💣</button>'}).join('')+'</div>'+betBox()+'<button class="go" id="go">СТАРТ</button><div class="msg" id="m"></div></div>';
 var T=function(i){return $('#mg .mt[data-i="'+i+'"]')},open=function(i,m){var t=T(i);$('.bk',t).textContent=m?'💣':'💎';t.className='mt o'+(m?' m':'')};
 var live_=function(v){live=v;$('#go').textContent=v?'ЗАБРАТЬ':'СТАРТ'};
 var shown=function(ms){ms.forEach(function(i){if(T(i).className.indexOf('o')<0)open(i,1)})};
 sel('#mc',function(b){if(!live)cnt=+b.dataset.n});
 $('#mg').onclick=function(e){var t=e.target.closest('.mt');if(!t||!live||t.className.indexOf('o')>-1)return;run(async function(){try{var i=+t.dataset.i,r=await api('mines_open',{i:i});
  if(r.boom){open(i,1);shown(r.mines);live_(false);$('#mi').textContent='Бум!';res('#m',0,bt)}
  else{open(i,0);if(r.cashed){shown(r.mines);live_(false);res('#m',r.win,bt)}else $('#mi').textContent='x'+r.mult+' · забрать '+fmt(Math.floor(bt*r.mult))}}catch(x){fail('#m',x)}})};
 $('#go').onclick=function(){run(async function(){try{
  if(!live){bt=bet();await api('mines_start',{bet:bt,count:cnt});$$('#mg .mt').forEach(function(t){t.className='mt';$('.bk',t).textContent=''});$('#m').textContent='';live_(true);$('#mi').textContent='Открывай клетки, не попадись на мину'}
  else{var r=await api('mines_cash');shown(r.mines);live_(false);$('#mi').textContent='x'+r.mult;res('#m',r.win,bt)}}catch(x){fail('#m',x)}})};
 api('resume').then(function(r){if(r.mines){bt=r.mines.bet;cnt=r.mines.cnt;r.mines.open.forEach(function(i){open(i,0)});live_(true);$('#mi').textContent='x'+r.mines.mult+' · забрать '+fmt(Math.floor(bt*r.mines.mult))}}).catch(function(){})}};
/* ---- БЛЭКДЖЕК ---- */
G.blackjack={t:'Блэкджек',i:'🃏',d:'',r:function(){
 $('#gbody').innerHTML='<div class="card"><small>Дилер <b id="dv"></b></small><div class="hand" id="dh"></div><small>Ты <b id="pv"></b></small><div class="hand" id="ph"></div><div id="bb">'+betBox()+'<button class="go" id="go">РАЗДАТЬ</button></div><div id="ba" hidden><div class="opt"><button id="hit">Ещё</button><button id="std">Хватит</button><button id="dbl">x2</button></div></div><div class="msg" id="m"></div></div>';
 var SU=['♠','♥','♦','♣'],RK=function(r){return r==1?'A':r==11?'J':r==12?'Q':r==13?'K':r};
 var cards=function(h,hide){return h.map(function(c){return '<div class="pc'+(c.s==1||c.s==2?' rd':'')+'"><span>'+RK(c.r)+'</span><span>'+SU[c.s]+'</span></div>'}).join('')+(hide?'<div class="pc bk"></div>':'')};
 var MS={win:'Победа!',blackjack:'Блэкджек! x2.5',push:'Ничья, ставка возвращена',lose:'Проигрыш'};
 var render=function(v){$('#dh').innerHTML=cards(v.dealer,!v.done);$('#ph').innerHTML=cards(v.player);$('#pv').textContent=v.pv;$('#dv').textContent=v.done?v.dv:'';
  $('#bb').hidden=!v.done;$('#ba').hidden=!!v.done;$('#dbl').hidden=v.player.length>2;
  if(v.done){var m=$('#m');m.className='msg '+(v.win>0&&v.res!='push'?'win':'lose');m.textContent=MS[v.res]+(v.win>0&&v.res!='push'?' · +'+fmt(v.win)+' 🪙':'');hap(v.win>0?'success':'error');if(v.res=='win'||v.res=='blackjack')boom()}else $('#m').textContent=''};
 var act=function(a,d){run(async function(){try{var r=await api(a,d);render(r.bj)}catch(e){fail('#m',e)}})};
 $('#go').onclick=function(){act('bj_start',{bet:bet()})};$('#hit').onclick=function(){act('bj_hit')};$('#std').onclick=function(){act('bj_stand')};$('#dbl').onclick=function(){act('bj_double')};
 api('resume').then(function(r){if(r.bj)render(r.bj)}).catch(function(){})}};
/* ---- КОЛЕСО ФОРТУНЫ ---- */
G.wheel={t:'Колесо',i:'🎁',d:'',r:function(){var P=cfg.wheel,n=P.length,sg=360/n,rot=0,cols=['#b91c1c','#1a1a1a'];
 var gr='conic-gradient('+P.map(function(_,i){return cols[i%2]+' '+(i*sg)+'deg '+((i+1)*sg)+'deg'}).join(',')+')';
 var lb=P.map(function(v,i){return '<span style="transform:rotate('+(i*sg+sg/2)+'deg) translateY(-98px)">'+v+'</span>'}).join('');
 $('#gbody').innerHTML='<div class="card"><div class="wfw"><div class="wp"></div><div class="wf" id="wf" style="background:'+gr+',#b91c1c">'+lb+'</div></div><button class="go" id="go">КРУТИТЬ</button><div class="msg" id="m">'+(me.wheelIn>0?'Следующая попытка через '+Math.ceil(me.wheelIn/3600000)+' ч.':'Бесплатная попытка раз в сутки')+'</div></div>';
 $('#go').onclick=function(){run(async function(){try{var r=await api('wheel'),cur=rot%360,delta=((-(r.idx*sg+sg/2)-cur)%360+360)%360;rot+=1800+delta;$('#wf').style.transform='rotate('+rot+'deg)';await Z(4300);
  var m=$('#m');m.className='msg win';m.textContent='Выигрыш +'+fmt(r.prize)+' 🪙';hap('success');boom()}catch(e){fail('#m',e)}})}}};
/* если конфиг уже пришёл до загрузки этого файла — перерисовать */
if(typeof cfg!=='undefined'&&cfg){renderGames()}
if(typeof me!=='undefined'&&me){setMe(me)}
})();
