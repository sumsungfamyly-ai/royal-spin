(function(){
var H=function(n,c){return '<img class="ic '+(c||'')+'" src="/img/'+n+'.png" alt="" draggable="false">'};
var P={games:'<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
bonus:'<path d="M20 12v8.5H4V12M3 7.5h18V12H3zM12 20.5V7.5M12 7.5H8a2.5 2.5 0 110-5c2.8 0 4 5 4 5zM12 7.5h4a2.5 2.5 0 100-5c-2.8 0-4 5-4 5z"/>',
friends:'<circle cx="9" cy="8.5" r="3.4"/><path d="M2.8 20c0-3.4 2.8-5.6 6.2-5.6s6.2 2.2 6.2 5.6"/><circle cx="17.2" cy="9.4" r="2.4"/><path d="M17.4 14.6c2.4.1 4 1.8 4 4.4"/>',
top:'<path d="M7.5 4h9v5a4.5 4.5 0 01-9 0V4zM7.5 6H4.5v1a3 3 0 003 3M16.5 6h3v1a3 3 0 01-3 3M12 13.5V17M8.5 20.5h7M9.5 17h5"/>',
me:'<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5c0-4 3.4-6.6 7.5-6.6s7.5 2.6 7.5 6.6"/>',
help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.3a2.6 2.6 0 115 .9c0 1.7-2.5 2-2.5 3.8M12 17.2v.1"/>',
sun:'<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/>',
moon:'<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/>'};
var svg=function(k){return '<svg viewBox="0 0 24 24" aria-hidden="true">'+P[k]+'</svg>'};
var short=function(n){return n>=1000?(Math.round(n/100)/10)+'K':''+n};
function toast(t){var d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(function(){d.classList.add('out')},2400);setTimeout(function(){d.remove()},2900)}
/* ---- иконки меню и шапки ---- */
$$('nav button').forEach(function(b){var k=b.dataset.v,s=$('span',b);if(s&&P[k])s.outerHTML=svg(k)});
var bb=$('nav button[data-v="bonus"]');if(bb){var dt=document.createElement('i');dt.className='ndot';bb.appendChild(dt)}
var hq=$('.hq');if(hq)hq.innerHTML=svg('help');var thm=$('.thm');
function themeIcon(){if(thm)thm.innerHTML=svg(document.documentElement.classList.contains('light')?'moon':'sun')}
if(thm){themeIcon();thm.addEventListener('click',function(){setTimeout(themeIcon,0)})}
var bg=$('.bg3d');if(bg)bg.remove();
/* ---- награда: аккуратный блик вместо конфетти ---- */
window.boom=function(){var e=document.createElement('div');e.className='glint';document.body.appendChild(e);setTimeout(function(){e.remove()},1100)};
function pop(n){var e=document.createElement('div');e.className='rpop';e.innerHTML=H('coin')+'<b>+'+fmt(n)+'</b>';document.body.appendChild(e);setTimeout(function(){e.remove()},1600);boom();snd('win')}
/* ---- ставка: табло и 3D-фишки ---- */
var DEN=[[10,'k1'],[50,'k2'],[100,'k3'],[500,'k4'],[1000,'k5']];
function mark(){var a=$('#gbody .amt')||$('.amt');var v=a?short(+a.value||0):'';$$('.rb.on,.rb2.on,.rg.on').forEach(function(e){e.dataset.bet=v})}
function enhance(){$$('input.amt').forEach(function(i){if(i.dataset.bt||typeof cfg==='undefined'||!cfg)return;i.dataset.bt=1;var card=i.parentNode,lab=document.createElement('div');lab.className='betlab';lab.textContent='Ставка';card.insertBefore(lab,i);
 var tr=document.createElement('div');tr.className='tray';
 DEN.forEach(function(d){if(d[0]>cfg.maxBet)return;var b=document.createElement('button');b.type='button';b.className='cp '+d[1];b.innerHTML='<span>'+short(d[0])+'</span>';
  b.onclick=function(){var v=(+i.value||0)+d[0];i.value=Math.max(cfg.minBet,Math.min(cfg.maxBet,v));i.dispatchEvent(new Event('input',{bubbles:true}));mark();snd('click')};tr.appendChild(b)});
 card.insertBefore(tr,i.nextSibling);mark()})}
/* ---- убираем эмодзи из заголовков (минимализм) ---- */
var EM=/^[\u{1F000}-\u{1FAFF}\u{2190}-\u{2BFF}\u2139\uFE0F\u200D\s]+/u;
function strip(){try{$$('h3,summary,.qr b,#tb,#sn,#hs,#fq2').forEach(function(e){var n=e.firstChild;if(n&&n.nodeType==3&&EM.test(n.nodeValue)){var t=n.nodeValue.replace(EM,'');if(t!==n.nodeValue)n.nodeValue=t}})}catch(e){}}
var raf=0;new MutationObserver(function(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;enhance();strip()})}).observe(document.body,{childList:true,subtree:true});
document.addEventListener('click',function(){setTimeout(mark,0)});document.addEventListener('input',mark);
/* ---- ежедневный бонус и серия: честный таймер ---- */
var hm=function(ms){var m=Math.max(0,Math.ceil(ms/60000)),h=Math.floor(m/60);return h?h+' ч '+(m%60)+' мин':(m%60)+' мин'};
var hms=function(ms){var s=Math.max(0,Math.ceil(ms/1000)),h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60,z=function(n){return (n<10?'0':'')+n};return z(h)+':'+z(m)+':'+z(x)};
var live=function(){return me?Math.max(0,me.bonusIn-(Date.now()-me.at)):1};
function homeBonus(){var b=$('#bonus');if(!b||!me)return;var rdy=live()<=0;b.className='bnr'+(rdy?' rdy':'');
 b.innerHTML='<span><b>Ежедневный бонус</b><small>'+(rdy?'Готов к получению':'Следующий через '+hm(live()))+(me.streak?' · серия '+me.streak+' дн.':'')+'</small></span><span class="bnr-c">'+(rdy?'Забрать':'›')+'</span>';
 var n=$('nav button[data-v="bonus"]');if(n)n.classList.toggle('rdy',rdy)}
var _sm=setMe;window.setMe=function(m){m.at=Date.now();_sm(m);homeBonus()};
setInterval(homeBonus,30000);if(me){me.at=me.at||Date.now();homeBonus()}
var BI=null,BAT=0,tk=0,busy2=false;
function row(t,d,have,n,r,claimed,k,id){var pc=Math.round(have/n*100),ok=have>=n;
 return '<div class="qr"><div class="t"><div><b>'+t+'</b>'+(d?'<small>'+d+'</small>':'')+'</div>'+(claimed?'<small>Получено</small>':ok?'<button class="sm p" data-k="'+k+'" data-id="'+id+'">+'+fmt(r)+'</button>':'<small>'+fmt(r)+' 🪙</small>')+'</div><div class="bar"><i style="width:'+pc+'%"></i></div><small>'+fmt(have)+' / '+fmt(n)+'</small></div>'}
function drawBonus(){var el=$('#v-bonus');if(!el||!BI)return;var B=BI.bonus,cur=B.streak,left=Math.max(0,B.left-(Date.now()-BAT)),can=left<=0,done=can?cur%7:((cur-1)%7)+1;
 var cells=B.mults.map(function(m,i){return '<div class="bzd'+(i<done?' done':'')+(can&&i==done?' next':'')+(i==6?' last':'')+'"><div class="dc">'+(i<done?'✓':(i+1))+'</div><small>'+fmt(Math.round(B.base*m))+'</small></div>'}).join('');
 var note=cur?(can?'Забери бонус в течение <b id="bbr">'+hm(Math.max(0,B.breaks-(Date.now()-BAT)))+'</b>, иначе серия сбросится':'Серия сохранится, если забрать следующий бонус в течение <b id="bbr">'+hm(Math.max(0,B.breaks-(Date.now()-BAT)))+'</b>'):'Заходи каждый день: награда растёт до 7-го дня';
 el.innerHTML='<div class="card"><h3>Ежедневный бонус</h3><div class="bz-h"><div><small>Серия входов</small><div class="bz-n">'+cur+'<span>дн.</span></div></div><div class="bz-r"><small>Следующая награда</small><b>+'+fmt(B.next)+' 🪙</b></div></div><div class="bz-track">'+cells+'</div><div class="bz-note">'+note+'</div><button class="go" id="cl"'+(can?'':' disabled')+'>'+(can?'Забрать +'+fmt(B.next):'Следующий через <span id="bcd">'+hms(left)+'</span>')+'</button></div>'
  +'<div class="card"><h3>Задания на сегодня</h3>'+BI.quests.map(function(q){return row(q.t,'',q.have,q.n,q.r,q.claimed,'q',q.id)}).join('')+'</div>'
  +'<div class="card"><h3>Достижения</h3>'+BI.ach.map(function(a){return row(a.t,a.d,a.have,a.n,a.r,a.claimed,'a',a.id)}).join('')+'</div>';
 $('#cl').onclick=function(){if(can)claim('bonus')};
 $$('#v-bonus .sm[data-k]').forEach(function(b){b.onclick=function(){claim(b.dataset.k=='q'?'quest_claim':'ach_claim',{id:b.dataset.id})}});
 clearInterval(tk);tk=setInterval(function(){if(!$('#cl')){clearInterval(tk);return}var l=Math.max(0,BI.bonus.left-(Date.now()-BAT));
  if(!can&&l<=0){drawBonus();return}var c=$('#bcd');if(c)c.textContent=hms(l);var r=$('#bbr');if(r)r.textContent=hm(Math.max(0,BI.bonus.breaks-(Date.now()-BAT)))},1000);timers.push(tk)}
function claim(a,d){if(busy2)return;busy2=true;var cl=$('#cl');if(cl&&a=='bonus')cl.disabled=true;
 api(a,d).then(function(r){busy2=false;BI=r.info;BAT=Date.now();pop(r.reward);drawBonus()}).catch(function(e){busy2=false;toast(e.message);window.renderBonus()})}
window.renderBonus=function(){var el=$('#v-bonus');if(!BI)el.innerHTML='<div class="card"><small>Загрузка…</small></div>';else drawBonus();
 api('bonus_info').then(function(r){BI=r;BAT=Date.now();drawBonus()}).catch(function(e){el.innerHTML='<div class="card"><div class="msg lose">'+esc(e.message)+'</div></div>'})};
enhance();strip();
})();
