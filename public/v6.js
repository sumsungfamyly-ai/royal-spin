(function(){
var H=function(n,c){return '<img class="ic '+(c||'')+'" src="/img/'+n+'.png" alt="" draggable="false">'};
var Z=function(ms){return new Promise(function(z){setTimeout(z,ms)})};
var PIP={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]},FACE=[[0,0],[0,-90],[-90,0],[90,0],[0,90],[0,180]];
/* ---- защита от зависаний сети ---- */
var _f=window.fetch;window.fetch=function(u,o){if(typeof u=='string'&&u.indexOf('/api/')==0&&window.AbortController){var c=new AbortController(),t=setTimeout(function(){c.abort()},15000);
 return _f(u,Object.assign({},o,{signal:c.signal})).then(function(r){clearTimeout(t);return r},function(){clearTimeout(t);throw new Error('Нет связи с сервером, попробуй ещё раз')})}return _f(u,o)};
/* ---- вместо смайлика 🪙 везде картинка-монета ---- */
function coin(n){if(n.nodeType==3){if(n.nodeValue.indexOf('🪙')>-1&&n.parentNode){var s=n.nodeValue.split('🪙'),f=document.createDocumentFragment();s.forEach(function(t,i){if(t)f.appendChild(document.createTextNode(t));if(i<s.length-1){var im=document.createElement('img');im.src='/img/coin.png';im.className='ci';im.alt='';f.appendChild(im)}});n.parentNode.replaceChild(f,n)}}
 else if(n.nodeType==1&&n.tagName!='SCRIPT'&&n.tagName!='TEXTAREA'){var w=document.createTreeWalker(n,NodeFilter.SHOW_TEXT),a=[],x;while(x=w.nextNode())if(x.nodeValue.indexOf('🪙')>-1)a.push(x);a.forEach(coin)}}
new MutationObserver(function(ms){ms.forEach(function(m){if(m.type=='characterData')coin(m.target);else m.addedNodes.forEach(coin)})}).observe(document.body,{childList:true,subtree:true,characterData:true});
coin(document.body);
/* ---- сообщения о результате ---- */
window.res=function(el,win,bet){var m=$(el);if(!m)return;
 if(win>bet){m.className='msg win';m.textContent='Выигрыш +'+fmt(win)+' 🪙';hap('success');if(win>=bet*5)boom();snd('win')}
 else if(win==bet&&bet>0){m.className='msg';m.textContent='Ставка возвращена';snd('click')}
 else if(win>0){m.className='msg lose';m.textContent='Возврат +'+fmt(win)+' 🪙 (чистыми −'+fmt(bet-win)+')';hap('error');snd('lose')}
 else{m.className='msg lose';m.textContent='Проигрыш −'+fmt(bet)+' 🪙';hap('error');snd('lose')}};
/* ---- тема ---- */
var theme='dark';try{theme=localStorage.getItem('theme')||'dark'}catch(e){}
var th=document.createElement('button');th.className='thm';$('.top').insertBefore(th,$('#bal'));
function applyTheme(){document.documentElement.classList.toggle('light',theme=='light');th.textContent=theme=='light'?'🌙':'☀️';try{tg.setHeaderColor(theme=='light'?'#f3ecfb':'#0b0613')}catch(e){}}
function flipTheme(){theme=theme=='light'?'dark':'light';try{localStorage.setItem('theme',theme)}catch(e){}applyTheme()}
th.onclick=flipTheme;applyTheme();
var _p6=profile;window.profile=function(){_p6();var b=document.createElement('button');b.className='sm';b.style.cssText='width:100%;margin-top:8px';b.id='tb';b.textContent=theme=='light'?'🌙 Тёмная тема':'☀️ Светлая тема';
 b.onclick=function(){flipTheme();b.textContent=theme=='light'?'🌙 Тёмная тема':'☀️ Светлая тема'};$('#v-me .card:last-child').appendChild(b)};
/* ---- «Как играть» в каждой игре ---- */
var HOW={slots:'Выбери ставку и нажми «Крутить». Три одинаковых символа дают крупный выигрыш по таблице ниже. Два одинаковых символа возвращают часть ставки.',
flip:'Выбери сторону: доллар или пики. Поставь фишки и брось монету. Угадал — получишь ставку x2.',
dice:'Выбери «Меньше» или «Больше» и число на ползунке. Если выпавшее число (от 0 до 100) оказалось на твоей стороне — выигрыш. Чем меньше шанс, тем выше множитель.',
roulette:'Ставь на цвет, чёт/нечет или половину поля (выплата x2), либо на конкретное число от 0 до 36 (выплата x36). Колесо крутится, шарик выбирает число.',
crash:'Нажми «Старт»: ракета взлетает, множитель растёт. Нажми «Забрать» до того, как она улетит, и получишь ставку, умноженную на множитель. Не успел — ставка сгорает.',
mines:'Выбери число мин (от 1 до 24) и нажми «Старт». Открывай клетки: каждая безопасная повышает множитель. «Забрать» — получить выигрыш. Наступил на мину — ставка проиграна.',
blackjack:'Набери 21 очко или ближе к нему, чем дилер, но не больше. Картинки стоят 10, туз 1 или 11. «Ещё» — взять карту, «Хватит» — остановиться, «x2» — удвоить ставку и взять одну карту. Блэкджек платит x2.5.',
rps:'Выбери руку: камень бьёт ножницы, ножницы бьют бумагу, бумага бьёт камень. Победа платит x1.94, при ничьей ставка возвращается.',
hilo:'Угадай, будет ли следующая карта выше или ниже текущей. Каждый верный ответ повышает множитель, забрать выигрыш можно в любой момент. Если карты равны, ход проигран.'};
var _og=openGame;window.openGame=function(g){_og(g);var t=g=='wheel'?'Бесплатная попытка доступна раз в сутки. Платная попытка стоит '+fmt(cfg.wheelCost)+' фишек: шанс на крупный приз ниже, зато призы очень щедрые, до '+fmt(Math.max.apply(null,cfg.wheel2))+'.':HOW[g];
 if(t){var d=document.createElement('details');d.className='how';d.innerHTML='<summary>ℹ️ Как играть</summary><p>'+t+'</p>';$('#gbody').insertBefore(d,$('#gbody').firstChild)}};
/* ---- СЛОТЫ: пары тоже платят ---- */
G.slots.r=function(){var CH=84,N=24,SY=cfg.symbols.map(function(x){return x.s});
 $('#gbody').innerHTML='<div class="card"><div class="reels3">'+[0,1,2].map(function(){return '<div class="rw"><div class="rs"><div>🎰</div></div></div>'}).join('')+'</div>'+betBox()+'<button class="go" id="go">КРУТИТЬ</button><div class="msg" id="m"></div></div>'
  +'<div class="card"><small>3 одинаковых символа</small><table>'+cfg.symbols.map(function(x){return '<tr><td>'+x.s+' '+x.s+' '+x.s+'</td><td>x'+x.m+'</td></tr>'}).join('')+'</table><small style="display:block;margin-top:8px">2 одинаковых символа (возврат части ставки)</small><table>'+cfg.symbols.map(function(x){return '<tr><td>'+x.s+' '+x.s+'</td><td>x'+(x.p||0)+'</td></tr>'}).join('')+'</table></div>';
 $('#go').onclick=function(){play(async function(){var b=bet();$('#m').textContent='';$$('.rw').forEach(function(w){w.classList.remove('hit')});
  var r=await api('slots',{bet:b});
  $$('.rs').forEach(function(s,i){var h='<div>'+s.lastElementChild.textContent+'</div>';for(var k=1;k<N-1;k++)h+='<div>'+SY[Math.random()*SY.length|0]+'</div>';h+='<div>'+r.reels[i]+'</div>';
   s.style.transition='none';s.style.transform='translate3d(0,0,0)';s.innerHTML=h;void s.offsetWidth;
   s.style.transition='transform '+(1.5+i*.55)+'s cubic-bezier(.12,.8,.22,1.03)';s.style.transform='translate3d(0,-'+((N-1)*CH)+'px,0)'});
  await Z(1500+2*550+300);var w=$$('.rw');r.hit.forEach(function(i){w[i].classList.add('hit')});
  res('#m',r.win,b);if(r.kind=='pair')$('#m').textContent='Пара! '+$('#m').textContent})}};
/* ---- МОНЕТКА: доллар / пики ---- */
var _fl=G.flip.r;G.flip.r=function(){_fl();var b=$$('#sd button');b[0].textContent='$ Доллар';b[1].textContent='♠ Пики'};
/* ---- КОСТИ: крупный бросок, кубики показывают результат ---- */
function dz(c){var h='';for(var f=1;f<=6;f++){h+='<div class="cf4 g'+f+'">';for(var i=0;i<9;i++)h+='<i'+(PIP[f].indexOf(i)>-1?' class="p"':'')+'></i>';h+='</div>'}return '<div class="dz '+c+'"><div class="sd"></div><div class="sc"><div class="cb4">'+h+'</div></div></div>'}
G.dice.r=function(){var mode='under',st=[[0,0],[0,0]];
 $('#gbody').innerHTML='<div class="card"><div class="tbl">'+dz('a')+dz('b')+'</div><div class="big" id="roll">--</div><div class="opt" id="md"><button class="on" data-m="under">Меньше</button><button data-m="over">Больше</button></div><input type="range" id="tg" min="2" max="98" value="50"><div style="text-align:center;margin:8px 0" id="info"></div>'+betBox()+'<button class="go" id="go">БРОСИТЬ</button><div class="msg" id="m"></div></div>';
 var info=function(){var t=+$('#tg').value,ch=mode=='under'?t:100-t;$('#info').innerHTML=(mode=='under'?'Выпадет меньше ':'Выпадет больше ')+'<b>'+t+'</b> · шанс <b>'+ch+'%</b> · <b style="color:var(--g)">x'+((100-cfg.edge)/ch).toFixed(2)+'</b>'};info();$('#tg').oninput=info;sel('#md',function(b){mode=b.dataset.m;info()});
 $('#go').onclick=function(){play(async function(){var b=bet();$('#m').textContent='';$('#roll').textContent='…';
  var r=await api('dice',{bet:b,mode:mode,target:+$('#tg').value});
  var d1=Math.min(6,1+Math.floor(r.roll/100*6)),d2=1+(Math.floor(r.roll*100)%6),ds=[d1,d2];
  $$('.dz').forEach(function(z){z.classList.remove('thr');void z.offsetWidth;z.classList.add('thr')});
  $$('.cb4').forEach(function(c,i){var k=ds[i]-1;st[i][0]+=1440;st[i][1]+=1440+i*360;c.style.transform='rotateX('+(st[i][0]+FACE[k][0]-18)+'deg) rotateY('+(st[i][1]+FACE[k][1]+22)+'deg)'});
  await Z(2500);var el=$('#roll');el.textContent=r.roll.toFixed(2).padStart(5,'0');el.classList.remove('rv');void el.offsetWidth;el.classList.add('rv');res('#m',r.win,b)})}};
/* ---- РУЛЕТКА: нельзя ставить на пустое число ---- */
document.addEventListener('click',function(e){var g=e.target.closest&&e.target.closest('#go');if(!g||!$('#ko'))return;var on=$('#ko button.on');
 if(on&&on.dataset.k=='num'){var v=$('#num').value;if(v===''||+v<0||+v>36){e.stopPropagation();e.preventDefault();fail('#m',new Error('Введи число от 0 до 36'))}}},true);
/* ---- КРАШ: быстрая ракета и 3D-линия ---- */
G.crash.r=function(){var K=0.25,W=680,Hh=380;
 $('#gbody').innerHTML='<div class="card"><div class="big" id="cm">1.00x</div><canvas id="cv" width="'+W+'" height="'+Hh+'"></canvas>'+betBox()+'<button class="go" id="go">СТАРТ</button><div class="msg" id="m"></div></div>';
 var cx=$('#cv').getContext('2d'),on=false,t0=0,pv=0,mf=function(t){return Math.exp(K*t)};
 var grid=function(){cx.strokeStyle='rgba(167,139,250,.28)';cx.lineWidth=1.5;var vy=Hh*.42,vx=W/2;
  for(var i=0;i<=12;i++){var y=vy+(Hh-vy)*Math.pow(i/12,2);cx.beginPath();cx.moveTo(0,y);cx.lineTo(W,y);cx.stroke()}
  for(var j=-10;j<=10;j++){cx.beginPath();cx.moveTo(vx+j*10,vy);cx.lineTo(vx+j*95,Hh);cx.stroke()}};
 var draw=function(t,mode){var m=mf(t),tmax=Math.max(5,t*1.1),mmax=Math.max(2,m*1.2),pts=[],N=60,x0=34,y0=Hh-44,pw=W-100,ph=Hh-120,i;
  for(i=0;i<=N;i++){var tt=t*i/N;pts.push([x0+tt/tmax*pw,y0-(mf(tt)-1)/(mmax-1)*ph])}
  var bg=cx.createLinearGradient(0,0,0,Hh);bg.addColorStop(0,'#1a0c33');bg.addColorStop(1,'#0b0613');cx.fillStyle=bg;cx.fillRect(0,0,W,Hh);grid();
  var col=mode=='crash'?['#ff5a5a','#7f1d1d']:mode=='cash'?['#4ade80','#14532d']:['#ffd75e','#a16207'],dx=18,dy=-14;
  cx.beginPath();pts.forEach(function(p,k){k?cx.lineTo(p[0],p[1]):cx.moveTo(p[0],p[1])});for(i=N;i>=0;i--)cx.lineTo(pts[i][0]+dx,pts[i][1]+dy);cx.closePath();
  var gr=cx.createLinearGradient(0,y0,0,y0-ph);gr.addColorStop(0,col[1]);gr.addColorStop(1,col[0]);cx.globalAlpha=.6;cx.fillStyle=gr;cx.fill();cx.globalAlpha=1;
  cx.beginPath();pts.forEach(function(p,k){k?cx.lineTo(p[0]+dx,p[1]+dy):cx.moveTo(p[0]+dx,p[1]+dy)});cx.strokeStyle=col[1];cx.lineWidth=3;cx.stroke();
  cx.beginPath();pts.forEach(function(p,k){k?cx.lineTo(p[0],p[1]):cx.moveTo(p[0],p[1])});if(!window.FXLITE){cx.shadowColor=col[0];cx.shadowBlur=16}cx.lineWidth=7;cx.lineCap='round';cx.strokeStyle=col[0];cx.stroke();cx.shadowBlur=0;
  var e=pts[N],q=pts[N-1]||e,ang=Math.atan2(e[1]-q[1],e[0]-q[0]);cx.save();cx.translate(e[0]+dx/2,e[1]+dy/2);if(mode!='crash')cx.rotate(ang+Math.PI/4);
  cx.font=(mode=='crash'?'64px':'44px')+' sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText(mode=='crash'?'💥':'🚀',0,0);cx.restore()};
 draw(0,'idle');
 var stop=function(){on=false;clearInterval(pv);$('#go').textContent='СТАРТ'};
 var tick=function(){if(!on||!$('#cv'))return;var t=(Date.now()-t0)/1000;$('#cm').textContent=mf(t).toFixed(2)+'x';draw(t,'run');requestAnimationFrame(tick)};
 var crashed=function(cp){stop();draw(Math.log(cp)/K,'crash');$('#cm').textContent=cp.toFixed(2)+'x';$('#cm').style.color='var(--bad)';again();$('#m').className='msg lose';$('#m').textContent='Ракета улетела!';hap('error');snd('lose')};
 var start=function(){on=true;$('#go').textContent='ЗАБРАТЬ';$('#cm').style.color='var(--g)';requestAnimationFrame(tick);
  pv=setInterval(async function(){try{var r=await api('crash_poll');if(r.crashed)crashed(r.cp);else if(r.idle)stop()}catch(e){}},450);timers.push(pv)};
 $('#go').onclick=function(){run(async function(){try{if(!on){$('#m').textContent='';await api('crash_start',{bet:bet()});t0=Date.now();start()}
  else{var b=bet(),r=await api('crash_cash');if(r.crashed)crashed(r.cp);else{stop();draw(Math.log(r.m)/K,'cash');$('#cm').textContent=r.m.toFixed(2)+'x';res('#m',r.win,b)}}}catch(e){fail('#m',e)}})};
 api('crash_poll').then(function(r){if(r.m){t0=Date.now()-r.t*1000;start()}}).catch(function(){})};
var again=function(){var e=document.createElement('div');e.className='flash';document.body.appendChild(e);setTimeout(function(){e.remove()},600)};
/* ---- МИНЫ: любое число мин ---- */
G.mines.r=function(){var cnt=3,live=false,bt=0,tl='';
 for(var i=0;i<25;i++)tl+='<div class="mt" data-i="'+i+'"><i><b class="fr"></b><b class="bk"></b></i></div>';
 $('#gbody').innerHTML='<div class="card"><div class="msg" id="mi" style="margin:0 0 10px">Выбери число мин и ставку</div><div class="mg" id="mg">'+tl+'</div><div style="margin-top:12px;text-align:center">Мин на поле: <b id="mn" style="color:var(--g)">3</b> <small id="m1"></small></div><input type="range" id="mr" min="1" max="24" value="3"><div class="opt" id="mc" style="margin-top:6px">'+[1,3,5,10,15,24].map(function(n){return '<button data-n="'+n+'">'+n+'</button>'}).join('')+'</div>'+betBox()+'<button class="go" id="go">СТАРТ</button><div class="msg" id="m"></div></div>';
 var T=function(i){return $('#mg .mt[data-i="'+i+'"]')},open=function(i,m){var t=T(i);$('.bk',t).textContent=m?'💣':'💎';t.className='mt o'+(m?' m':'')};
 var setCnt=function(n){if(live)return;cnt=n;$('#mr').value=n;$('#mn').textContent=n;$('#m1').textContent='· 1-я клетка x'+((100-cfg.edge)/100*25/(25-n)).toFixed(2);$$('#mc button').forEach(function(b){b.classList.toggle('on',+b.dataset.n==n)})};
 setCnt(3);$('#mr').oninput=function(){setCnt(+this.value)};$$('#mc button').forEach(function(b){b.onclick=function(){setCnt(+b.dataset.n)}});
 var setLive=function(v){live=v;$('#go').textContent=v?'ЗАБРАТЬ':'СТАРТ';$('#mg').className='mg'+(v?' live':'');$('#mr').disabled=v};
 var rest=function(ms){var k=0;ms.forEach(function(i){if(T(i).className.indexOf('o')<0)setTimeout(function(){open(i,1)},(k++)*150)})};
 var blast=function(){again();var g=$('#mg');g.classList.remove('shake');void g.offsetWidth;g.classList.add('shake')};
 $('#mg').onclick=function(e){var t=e.target.closest('.mt');if(!t||!live||t.className.indexOf('o')>-1)return;run(async function(){try{var i=+t.dataset.i,r=await api('mines_open',{i:i});
  if(r.boom){open(i,1);blast();rest(r.mines);setLive(false);$('#mi').textContent='Бум!';res('#m',0,bt)}
  else{open(i,0);hap('success');if(r.cashed){rest(r.mines);setLive(false);res('#m',r.win,bt)}else $('#mi').textContent='x'+r.mult+' · забрать '+fmt(Math.floor(bt*r.mult))+' 🪙'}}catch(x){fail('#m',x)}})};
 $('#go').onclick=function(){run(async function(){try{
  if(!live){bt=bet();await api('mines_start',{bet:bt,count:cnt});$$('#mg .mt').forEach(function(t){t.className='mt';$('.bk',t).textContent=''});$('#m').textContent='';setLive(true);$('#mi').textContent='Открывай клетки, не попадись на мину'}
  else{var r=await api('mines_cash');rest(r.mines);setLive(false);$('#mi').textContent='x'+r.mult;res('#m',r.win,bt)}}catch(x){fail('#m',x)}})};
 api('resume').then(function(r){if(r.mines){bt=r.mines.bet;setCnt(r.mines.cnt);r.mines.open.forEach(function(i){open(i,0)});setLive(true);$('#mi').textContent='x'+r.mines.mult+' · забрать '+fmt(Math.floor(bt*r.mines.mult))+' 🪙'}}).catch(function(){})};
/* ---- КОЛЕСО: бесплатное и платное ---- */
G.wheel.r=function(){var mode='free',rot=0;$('#gbody').innerHTML='<div id="wc"></div>';
 var K=function(v){return v>=1000?(v/1000)+'K':''+v};
 var wheelHTML=function(P){var n=P.length,sg=360/n,gr='conic-gradient('+P.map(function(_,i){return (i%2?'#fff4e6':'#c81e3a')+' '+(i*sg)+'deg '+((i+1)*sg)+'deg'}).join(',')+')',bl='',i;
  var lb=P.map(function(v,i){return '<span style="color:'+(i%2?'#7f1d1d':'#fff')+';transform:rotate('+(i*sg+sg/2)+'deg) translateY(-92px)">'+K(v)+'</span>'}).join('');
  for(i=0;i<16;i++)bl+='<b class="wb'+(i%2?' o':'')+'" style="transform:rotate('+(i*22.5)+'deg) translateY(-131px)"></b>';
  return '<div class="wh" id="wh"><div class="wring"></div>'+bl+'<div class="wf" id="wf" style="background:'+gr+',#c81e3a">'+lb+'</div><div class="hub"></div><div class="wp"></div></div>'};
 var render=function(){var P=mode=='free'?cfg.wheel:cfg.wheel2,hint=mode=='free'?(me.wheelIn>0?'Следующая бесплатная попытка через '+Math.ceil(me.wheelIn/3600000)+' ч.':'Бесплатная попытка раз в сутки'):'Шанс на крупный приз ниже, зато призы до '+fmt(Math.max.apply(null,P))+' 🪙';rot=0;
  $('#wc').innerHTML='<div class="card curt"><div class="opt" id="wt"><button data-w="free"'+(mode=='free'?' class="on"':'')+'>Бесплатно</button><button data-w="paid"'+(mode=='paid'?' class="on"':'')+'>За '+fmt(cfg.wheelCost)+' 🪙</button></div>'+wheelHTML(P)+'<button class="go" id="go">'+(mode=='free'?'КРУТИТЬ БЕСПЛАТНО':'КРУТИТЬ ЗА '+fmt(cfg.wheelCost))+'</button><div class="msg" id="m" style="color:#fff">'+hint+'</div></div>';
  $$('#wt button').forEach(function(b){b.onclick=function(){if(busy)return;mode=b.dataset.w;render()}});
  $('#go').onclick=function(){play(async function(){var P2=mode=='free'?cfg.wheel:cfg.wheel2,sg=360/P2.length,r=await api(mode=='free'?'wheel':'wheel_paid'),cur=rot%360,delta=((-(r.idx*sg+sg/2)-cur)%360+360)%360;
   rot+=2160+delta;$('#wh').classList.add('spin');$('#wf').style.transform='rotate('+rot+'deg)';await Z(5200);$('#wh').classList.remove('spin');
   res('#m',r.prize,mode=='free'?0:cfg.wheelCost);if(r.prize>=3000)boom()})}};
 render()};
if(typeof cfg!=='undefined'&&cfg)renderGames();
if(typeof me!=='undefined'&&me)setMe(me);
})();
