(function(){
/* Полноэкранные игры: пока идёт раунд или партия, выйти нельзя. Закончить можно только игрой, «Забрать» или «Сдаться». */
var RS=window.RS={src:{},locked:false,cur:null};
var ACTK={mines:'mines',hilo:'hilo',blackjack:'bj',crash:'crash',blockblast:'bb'};
var INST={slots:1,flip:1,dice:1,roulette:1,rps:1,plinko:1,wheel:1,wheel_paid:1};
function bar(){if(document.getElementById('glb'))return;var b=document.createElement('div');b.id='glb';b.textContent='🔒 Игра идёт, доиграй до конца';document.body.appendChild(b)}
function apply(){var on=Object.keys(RS.src).some(function(k){return RS.src[k]});if(on===RS.locked)return;RS.locked=on;document.body.classList.toggle('glock',on);bar();
 try{var w=Telegram.WebApp;on?w.enableClosingConfirmation():w.disableClosingConfirmation()}catch(e){}}
RS.set=function(k,v){if(window.__QA)return;RS.src[k]=!!v;apply()};
function block(){var v=document.getElementById('v-game');if(v){v.classList.remove('glshake');void v.offsetWidth;v.classList.add('glshake')}try{Telegram.WebApp.HapticFeedback.notificationOccurred('warning')}catch(e){}}
function leave(){RS.cur=null;RS.src={};apply();document.body.classList.remove('gfs')}
var og=window.openGame;window.openGame=function(g){if(RS.locked&&RS.cur&&g!==RS.cur){block();return}
 if(g!==RS.cur){RS.src={};apply()}RS.cur=g;document.body.classList.add('gfs');og(g)};
var nv=window.nav;window.nav=function(v){if(RS.locked&&v!=='game'){block();return}if(v!=='game')leave();return nv.apply(this,arguments)};
var vg=document.getElementById('v-game');if(vg)new MutationObserver(function(){if(vg.hidden&&!RS.locked)leave()}).observe(vg,{attributes:true,attributeFilter:['hidden']});
/* следим за ответами сервера: какие раунды идут */
var f=window.fetch,first=true;
window.fetch=function(u,o){var p=f.apply(this,arguments),a='';
 try{if(String(u).indexOf('/api/game')>-1){a=(JSON.parse(o.body)||{}).action||'';if(INST[a])RS.set('anim',true);
  p.then(function(r){r.clone().json().then(function(j){
   if(j.act&&RS.cur&&ACTK[RS.cur])RS.set('solo',!!j.act[ACTK[RS.cur]]);
   if(j.durak&&j.durak.status&&RS.cur==='durak')RS.set('dk',j.durak.status==='active');
   if(INST[a])setTimeout(function(){RS.set('anim',false)},a=='plinko'?3300:2300);
   if(first&&(j.cfg||j.act)&&typeof cfg!=='undefined'&&cfg){first=false;resume(j)}
  }).catch(function(){})}).catch(function(){if(INST[a])RS.set('anim',false)})}}catch(e){}
 return p};
/* первый ответ me мог уйти раньше, чем подключился этот скрипт, поэтому спрашиваем сами */
setTimeout(function(){if(first&&typeof api==='function')api('me').catch(function(){})},1400);
/* вернуться в незаконченную игру после перезапуска приложения */
function resume(j){setTimeout(function(){if(RS.cur)return;var a=j.act||{},k=a.bb?'blockblast':a.mines?'mines':a.hilo?'hilo':a.bj?'blackjack':null;
 if(k)return openGame(k);
 api('bg_list').then(function(r){var x=(r.list||[]).filter(function(m){return m.status=='active'})[0];if(x&&!RS.cur)return bgOpen(x.game,x.id);
  return api('social').then(function(s){var d=(s.durak||[]).filter(function(m){return m.status=='active'})[0];if(d&&!RS.cur)openDurak(d.id)})}).catch(function(){})},700)}
})();
