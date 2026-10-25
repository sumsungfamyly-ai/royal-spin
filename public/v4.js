(function(){
var H=function(n,c){return '<img class="ic '+(c||'')+'" src="/img/'+n+'.png" alt="" draggable="false">'};
var Z=function(ms){return new Promise(function(z){setTimeout(z,ms)})};
var PIP={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]},FACE=[[0,0],[0,-90],[-90,0],[90,0],[0,90],[0,180]];
/* баланс не «спойлерит» результат, пока идёт анимация */
var hold=0,shown=null;
function paint(){var b=$('#bal'),up=shown!==null&&me.balance>shown;shown=me.balance;b.innerHTML=H('coin')+'<span>'+fmt(me.balance)+'</span>';if(up){b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop')}}
window.setMe=function(m){me=m;if(!hold)paint()};
var play=function(fn,el){run(async function(){hold=1;try{await fn()}catch(e){fail(el||'#m',e)}finally{hold=0;paint()}})};
window.play=play;
var again=function(){var e=document.createElement('div');e.className='flash';document.body.appendChild(e);setTimeout(function(){e.remove()},600)};
/* ---- плитки ---- */
var TL=[['slots','slot','Слоты','до x150'],['crash',0,'Краш','забери вовремя'],['mines',0,'Мины','до x1000'],['blackjack','cards','Блэкджек','выплата x2.5'],['roulette','roulette','Рулетка','x2 · x36'],['dice','dice_white','Кости','свой шанс'],['flip','coin','Монетка','x2'],['rps','hand_p','Камень·Ножницы','x1.94'],['wheel','wheel','Колесо','раз в сутки'],['duel','chips','Дуэли','с друзьями']],EM={crash:'🚀',mines:'💣'};
window.renderGames=function(){
 $('#gg').innerHTML=TL.map(function(t){var on=t[0]=='duel'||cfg.games[t[0]];return '<button class="gc'+(on?'':' off')+'" data-g="'+t[0]+'"><span class="pic">'+(t[1]?H(t[1]):'<em>'+EM[t[0]]+'</em>')+'</span>'+t[2]+'<small>'+t[3]+'</small></button>'}).join('');
 $$('#gg .gc').forEach(function(b){
  b.onclick=function(){var g=b.dataset.g;if(g=='duel')return nav('friends');if(!cfg.games[g])return tg.showAlert('Игра временно отключена');openGame(g)};
  var mv=function(e){if(window.FXLITE)return;var r=b.getBoundingClientRect(),t=e.touches?e.touches[0]:e,x=(t.clientX-r.left)/r.width-.5,y=(t.clientY-r.top)/r.height-.5;b.style.transform='perspective(600px) rotateY('+(x*20)+'deg) rotateX('+(-y*20)+'deg) scale(1.04)'};
  var rs=function(){b.style.transform=''};
  b.addEventListener('pointermove',mv);b.addEventListener('touchmove',mv,{passive:true});['pointerleave','pointerup','pointercancel','touchend'].forEach(function(ev){b.addEventListener(ev,rs)});
 });
};
/* ---- СЛОТЫ: плавные барабаны, остановка по очереди ---- */
G.slots.r=function(){var CH=84,N=24,SY=cfg.symbols.map(function(x){return x.s});
 $('#gbody').innerHTML='<div class="card"><div class="reels3">'+[0,1,2].map(function(){return '<div class="rw"><div class="rs"><div>🎰</div></div></div>'}).join('')+'</div>'+betBox()+'<button class="go" id="go">КРУТИТЬ</button><div class="msg" id="m"></div></div><div class="card"><small>3 одинаковых символа</small><table>'+cfg.symbols.map(function(x){return '<tr><td>'+x.s+' '+x.s+' '+x.s+'</td><td>x'+x.m+'</td></tr>'}).join('')+'</table></div>';
 $('#go').onclick=function(){play(async function(){var b=bet();$('#m').textContent='';$$('.rw').forEach(function(w){w.classList.remove('hit')});
  var r=await api('slots',{bet:b});
  $$('.rs').forEach(function(s,i){var h='<div>'+s.lastElementChild.textContent+'</div>';for(var k=1;k<N-1;k++)h+='<div>'+SY[Math.random()*SY.length|0]+'</div>';h+='<div>'+r.reels[i]+'</div>';
   s.style.transition='none';s.style.transform='translate3d(0,0,0)';s.innerHTML=h;void s.offsetWidth;
   s.style.transition='transform '+(1.5+i*.55)+'s cubic-bezier(.12,.8,.22,1.03)';s.style.transform='translate3d(0,-'+((N-1)*CH)+'px,0)'});
  await Z(1500+2*550+300);if(r.win)$$('.rw').forEach(function(w){w.classList.add('hit')});res('#m',r.win,b)})}};
/* ---- МОНЕТКА: подброс ---- */
G.flip.r=function(){var side='heads',a=0;
 $('#gbody').innerHTML='<div class="card"><div class="c3"><div class="c3i" id="c3i"><div>'+H('coin')+'</div><div class="bk">'+H('chip_black')+'</div></div></div><div class="opt" id="sd"><button class="on" data-s="heads">🦅 Орёл</button><button data-s="tails">🔘 Решка</button></div>'+betBox()+'<button class="go" id="go">БРОСИТЬ · x2</button><div class="msg" id="m"></div></div>';
 sel('#sd',function(b){side=b.dataset.s});
 $('#go').onclick=function(){play(async function(){var b=bet();$('#m').textContent='';var r=await api('flip',{bet:b,side:side}),end=r.result=='heads'?0:180;
  a+=1800+(((end-(a%360))%360)+360)%360;var w=$('.c3');w.classList.remove('toss');void w.offsetWidth;w.classList.add('toss');$('#c3i').style.transform='rotateX('+a+'deg)';await Z(1800);res('#m',r.win,b)})}};
/* ---- КОСТИ: бросок на стол ---- */
function dz(c){var h='';for(var f=1;f<=6;f++){h+='<div class="cf4 g'+f+'">';for(var i=0;i<9;i++)h+='<i'+(PIP[f].indexOf(i)>-1?' class="p"':'')+'></i>';h+='</div>'}return '<div class="dz '+c+'"><div class="sd"></div><div class="sc"><div class="cb4">'+h+'</div></div></div>'}
G.dice.r=function(){var mode='under',st=[[0,0],[0,0]];
 $('#gbody').innerHTML='<div class="card"><div class="tbl">'+dz('a')+dz('b')+'</div><div class="big" id="roll">--</div><div class="opt" id="md"><button class="on" data-m="under">Меньше</button><button data-m="over">Больше</button></div><input type="range" id="tg" min="2" max="98" value="50"><div style="text-align:center;margin:8px 0" id="info"></div>'+betBox()+'<button class="go" id="go">БРОСИТЬ</button><div class="msg" id="m"></div></div>';
 var info=function(){var t=+$('#tg').value,ch=mode=='under'?t:100-t;$('#info').innerHTML=(mode=='under'?'Выпадет меньше ':'Выпадет больше ')+'<b>'+t+'</b> · шанс <b>'+ch+'%</b> · <b style="color:var(--g)">x'+((100-cfg.edge)/ch).toFixed(2)+'</b>'};info();$('#tg').oninput=info;sel('#md',function(b){mode=b.dataset.m;info()});
 $('#go').onclick=function(){play(async function(){var b=bet();$('#m').textContent='';$('#roll').textContent='…';
  var r=await api('dice',{bet:b,mode:mode,target:+$('#tg').value});
  $$('.dz').forEach(function(z){z.classList.remove('thr');void z.offsetWidth;z.classList.add('thr')});
  $$('.cb4').forEach(function(c,i){var k=Math.floor(Math.random()*6);st[i][0]+=1080;st[i][1]+=1080+i*180;c.style.transform='rotateX('+(st[i][0]+FACE[k][0]-24)+'deg) rotateY('+(st[i][1]+FACE[k][1]+30)+'deg)'});
  await Z(1750);var el=$('#roll');el.textContent=r.roll.toFixed(2).padStart(5,'0');el.classList.remove('rv');void el.offsetWidth;el.classList.add('rv');res('#m',r.win,b)})}};
/* ---- РУЛЕТКА: плавное колесо и шарик ---- */
G.roulette.r=function(){var kind='red',w=0,bl=0,K=[['red','🔴 Красное'],['black','⚫ Чёрное'],['even','Чёт'],['odd','Нечет'],['low','1-18'],['high','19-36'],['num','Число x36']];
 $('#gbody').innerHTML='<div class="card"><div class="rl"><div class="tilt">'+H('roulette','wi')+'<div class="ball"><i></i></div></div></div><div class="rn" id="rn">?</div><div class="opt" id="ko">'+K.map(function(k){return '<button data-k="'+k[0]+'"'+(k[0]=='red'?' class="on"':'')+'>'+k[1]+'</button>'}).join('')+'</div><input type="number" id="num" min="0" max="36" placeholder="Число 0–36" hidden style="margin-bottom:8px">'+betBox()+'<button class="go" id="go">КРУТИТЬ</button><div class="msg" id="m"></div></div>';
 sel('#ko',function(b){kind=b.dataset.k;$('#num').hidden=kind!='num'});
 $('#go').onclick=function(){play(async function(){var b=bet(),el=$('#rn');el.className='rn';el.textContent='?';$('#m').textContent='';
  var r=await api('roulette',{bet:b,kind:kind,num:$('#num').value});w+=1440+Math.random()*360;bl-=2160+Math.random()*360;
  $('.wi').style.transform='rotate('+w+'deg)';$('.ball').style.transform='rotate('+bl+'deg)';await Z(4500);
  el.textContent=r.n;el.className='rn rv '+r.color;res('#m',r.win,b)})}};
/* ---- МИНЫ: 3D-подсветка ---- */
G.mines.r=function(){var cnt=3,live=false,bt=0,tl='';
 for(var i=0;i<25;i++)tl+='<div class="mt" data-i="'+i+'"><i><b class="fr"></b><b class="bk"></b></i></div>';
 $('#gbody').innerHTML='<div class="card"><div class="msg" id="mi" style="margin:0 0 10px">Выбери число мин и ставку</div><div class="mg" id="mg">'+tl+'</div><div class="opt" id="mc" style="margin-top:12px">'+[1,3,5,10].map(function(n){return '<button data-n="'+n+'"'+(n==3?' class="on"':'')+'>'+n+' 💣</button>'}).join('')+'</div>'+betBox()+'<button class="go" id="go">СТАРТ</button><div class="msg" id="m"></div></div>';
 var T=function(i){return $('#mg .mt[data-i="'+i+'"]')},open=function(i,m){var t=T(i);$('.bk',t).textContent=m?'💣':'💎';t.className='mt o'+(m?' m':'')};
 var setLive=function(v){live=v;$('#go').textContent=v?'ЗАБРАТЬ':'СТАРТ';$('#mg').className='mg'+(v?' live':'')};
 var rest=function(ms){var k=0;ms.forEach(function(i){if(T(i).className.indexOf('o')<0)setTimeout(function(){open(i,1)},(k++)*150)})};
 var blast=function(){again();var g=$('#mg');g.classList.remove('shake');void g.offsetWidth;g.classList.add('shake')};
 sel('#mc',function(b){if(!live)cnt=+b.dataset.n});
 $('#mg').onclick=function(e){var t=e.target.closest('.mt');if(!t||!live||t.className.indexOf('o')>-1)return;run(async function(){try{var i=+t.dataset.i,r=await api('mines_open',{i:i});
  if(r.boom){open(i,1);blast();rest(r.mines);setLive(false);$('#mi').textContent='Бум!';res('#m',0,bt)}
  else{open(i,0);hap('success');if(r.cashed){rest(r.mines);setLive(false);res('#m',r.win,bt)}else $('#mi').textContent='x'+r.mult+' · забрать '+fmt(Math.floor(bt*r.mult))}}catch(x){fail('#m',x)}})};
 $('#go').onclick=function(){run(async function(){try{
  if(!live){bt=bet();await api('mines_start',{bet:bt,count:cnt});$$('#mg .mt').forEach(function(t){t.className='mt';$('.bk',t).textContent=''});$('#m').textContent='';setLive(true);$('#mi').textContent='Открывай клетки, не попадись на мину'}
  else{var r=await api('mines_cash');rest(r.mines);setLive(false);$('#mi').textContent='x'+r.mult;res('#m',r.win,bt)}}catch(x){fail('#m',x)}})};
 api('resume').then(function(r){if(r.mines){bt=r.mines.bet;cnt=r.mines.cnt;r.mines.open.forEach(function(i){open(i,0)});setLive(true);$('#mi').textContent='x'+r.mines.mult+' · забрать '+fmt(Math.floor(bt*r.mines.mult))}}).catch(function(){})};
/* ---- КАМЕНЬ-НОЖНИЦЫ-БУМАГА против бота ---- */
G.rps={t:'КНБ',i:'✊',d:'',r:function(){var mv='r',N={r:'hand_r',p:'hand_p',s:'hand_s'};
 $('#gbody').innerHTML='<div class="card"><div class="rps"><div class="hd bot"><div class="hw">'+H('hand_r')+'</div><small>Бот</small></div><div class="hd mine"><div class="hw">'+H('hand_r')+'</div><small>Ты</small></div></div><div class="opt" id="hp"><button class="on" data-m="r">'+H('hand_r')+'</button><button data-m="p">'+H('hand_p')+'</button><button data-m="s">'+H('hand_s')+'</button></div>'+betBox()+'<button class="go" id="go">ИГРАТЬ · x'+(2*(1-cfg.edge/100)).toFixed(2)+'</button><div class="msg" id="m"></div></div>';
 sel('#hp',function(b){mv=b.dataset.m});
 $('#go').onclick=function(){play(async function(){var b=bet(),hs=$$('.hd');$('#m').textContent='';
  var r=await api('rps',{bet:b,move:mv});
  hs.forEach(function(h){h.className=h.className.replace(/ ?(win|lose|rv|sh)/g,'');$('.ic',h).src='/img/hand_r.png'});void hs[0].offsetWidth;hs.forEach(function(h){h.classList.add('sh')});
  await Z(1400);hs.forEach(function(h){h.classList.remove('sh')});
  $('.ic',hs[0]).src='/img/'+N[r.bot]+'.png';$('.ic',hs[1]).src='/img/'+N[mv]+'.png';hs.forEach(function(h){h.classList.add('rv')});
  if(r.res=='win'){hs[1].classList.add('win');hs[0].classList.add('lose')}else if(r.res=='lose'){hs[0].classList.add('win');hs[1].classList.add('lose')}
  await Z(650);if(r.res=='draw'){$('#m').className='msg';$('#m').textContent='Ничья, ставка возвращена'}else res('#m',r.win,b)})}}};
RP.r=H('hand_r');RP.p=H('hand_p');RP.s=H('hand_s');
/* ---- БЛЭКДЖЕК: раздача и открытие карты дилера ---- */
G.blackjack.r=function(){
 $('#gbody').innerHTML='<div class="card"><small>Дилер <b id="dv"></b></small><div class="hand" id="dh"></div><small>Ты <b id="pv"></b></small><div class="hand" id="ph"></div><div id="bb">'+betBox()+'<button class="go" id="go">РАЗДАТЬ</button></div><div id="ba" hidden><div class="opt"><button id="hit">Ещё</button><button id="std">Хватит</button><button id="dbl">x2</button></div></div><div class="msg" id="m"></div></div>';
 var SU=['♠','♥','♦','♣'],RK=function(r){return r==1?'A':r==11?'J':r==12?'Q':r==13?'K':r},MS={win:'Победа!',blackjack:'Блэкджек! x2.5',push:'Ничья, ставка возвращена',lose:'Проигрыш'};
 var cards=function(h,hide){return h.map(function(c){return '<div class="pc'+(c.s==1||c.s==2?' rd':'')+'"><span>'+RK(c.r)+'</span><span>'+SU[c.s]+'</span></div>'}).join('')+(hide?'<div class="pc bk"></div>':'')};
 var render=function(v){$('#dh').innerHTML=cards(v.dealer,true);$('#ph').innerHTML=cards(v.player);$('#pv').textContent=v.pv;$('#dv').textContent='';$('#bb').hidden=true;$('#ba').hidden=false;$('#dbl').hidden=v.player.length>2;$('#m').textContent=''};
 var finish=async function(v){$('#ph').innerHTML=cards(v.player);$('#pv').textContent=v.pv;$('#ba').hidden=true;
  $('#dh').innerHTML=cards(v.dealer.slice(0,1),true);await Z(600);
  for(var k=2;k<=v.dealer.length;k++){$('#dh').innerHTML=cards(v.dealer.slice(0,k),false);await Z(650)}
  $('#dv').textContent=v.dv;$('#bb').hidden=false;var m=$('#m'),w=v.win>0&&v.res!='push';m.className='msg '+(w?'win':v.res=='push'?'':'lose');m.textContent=MS[v.res]+(w?' · +'+fmt(v.win)+' 🪙':'');hap(w?'success':'error');if(v.res=='win'||v.res=='blackjack')boom()};
 var act=function(a,d){play(async function(){var r=await api(a,d);if(r.bj.done)await finish(r.bj);else render(r.bj)})};
 $('#go').onclick=function(){act('bj_start',{bet:bet()})};$('#hit').onclick=function(){act('bj_hit')};$('#std').onclick=function(){act('bj_stand')};$('#dbl').onclick=function(){act('bj_double')};
 api('resume').then(function(r){if(r.bj)render(r.bj)}).catch(function(){})};
/* ---- КРАШ: плавный полёт ---- */
G.crash.r=function(){
 $('#gbody').innerHTML='<div class="card"><div class="big" id="cm">1.00x</div><div class="rocket" id="rk">🚀</div>'+betBox()+'<button class="go" id="go">СТАРТ</button><div class="msg" id="m"></div></div>';
 var on=false,t0=0,pv;
 var stop=function(){on=false;clearInterval(pv);$('#go').textContent='СТАРТ'};
 var tick=function(){if(!on||!$('#cm'))return;var m=Math.exp(0.1*(Date.now()-t0)/1000);$('#cm').textContent=m.toFixed(2)+'x';$('#rk').style.transform='translate3d('+Math.min(m*10,230)+'px,-'+Math.min((m-1)*25,44)+'px,0) rotate(-12deg)';requestAnimationFrame(tick)};
 var crashed=function(cp){stop();$('#cm').textContent=cp.toFixed(2)+'x';$('#cm').style.color='var(--bad)';$('#rk').textContent='💥';$('#rk').className='rocket boomx';again();$('#m').className='msg lose';$('#m').textContent='Ракета улетела!';hap('error')};
 var start=function(){on=true;$('#go').textContent='ЗАБРАТЬ';$('#cm').style.color='var(--g)';$('#rk').textContent='🚀';$('#rk').className='rocket';requestAnimationFrame(tick);pv=setInterval(async function(){try{var r=await api('crash_poll');if(r.crashed)crashed(r.cp);else if(r.idle)stop()}catch(e){}},700);timers.push(pv)};
 $('#go').onclick=function(){run(async function(){try{if(!on){$('#m').textContent='';await api('crash_start',{bet:bet()});t0=Date.now();start()}else{var r=await api('crash_cash');if(r.crashed)crashed(r.cp);else{stop();$('#cm').textContent=r.m.toFixed(2)+'x';res('#m',r.win,bet())}}}catch(e){fail('#m',e)}})};
 api('crash_poll').then(function(r){if(r.m){t0=Date.now()-r.t*1000;start()}}).catch(function(){})};
/* ---- КОЛЕСО ФОРТУНЫ ---- */
G.wheel.r=function(){var P=cfg.wheel,n=P.length,sg=360/n,rot=0;
 var gr='conic-gradient('+P.map(function(_,i){return (i%2?'#fff4e6':'#c81e3a')+' '+(i*sg)+'deg '+((i+1)*sg)+'deg'}).join(',')+')';
 var lb=P.map(function(v,i){return '<span style="color:'+(i%2?'#7f1d1d':'#fff')+';transform:rotate('+(i*sg+sg/2)+'deg) translateY(-92px)">'+v+'</span>'}).join('');
 var bl='';for(var i=0;i<16;i++)bl+='<b class="wb'+(i%2?' o':'')+'" style="transform:rotate('+(i*22.5)+'deg) translateY(-131px)"></b>';
 $('#gbody').innerHTML='<div class="card curt"><div class="wh" id="wh"><div class="wring"></div>'+bl+'<div class="wf" id="wf" style="background:'+gr+',#c81e3a">'+lb+'</div><div class="hub"></div><div class="wp"></div></div><button class="go" id="go">КРУТИТЬ</button><div class="msg" id="m" style="color:#fff">'+(me.wheelIn>0?'Следующая попытка через '+Math.ceil(me.wheelIn/3600000)+' ч.':'Бесплатная попытка раз в сутки')+'</div></div>';
 $('#go').onclick=function(){play(async function(){var r=await api('wheel'),cur=rot%360,delta=((-(r.idx*sg+sg/2)-cur)%360+360)%360;rot+=2160+delta;$('#wh').classList.add('spin');$('#wf').style.transform='rotate('+rot+'deg)';await Z(5200);$('#wh').classList.remove('spin');
  var m=$('#m');m.className='msg win';m.textContent='Выигрыш +'+fmt(r.prize)+' 🪙';hap('success');boom()})}};
if(typeof cfg!=='undefined'&&cfg)renderGames();
if(typeof me!=='undefined'&&me)paint();
})();
