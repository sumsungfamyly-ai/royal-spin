(function(){
var COL=['#e05d5d','#e0a23c','#58b36b','#4a8fe0','#9b6be0','#d85fa8'],R=Math.random;
function layer(cls){var o=document.createElement('div');o.className='fxo '+cls;document.body.appendChild(o);setTimeout(function(){o.classList.add('out')},3400);setTimeout(function(){o.remove()},4100);return o}
function rain(o,n,mk){for(var i=0;i<n;i++){var p=document.createElement('span');p.className='fxp';mk(p,i);p.style.left=R()*100+'vw';p.style.setProperty('--dx',(R()*160-80)+'px');p.style.setProperty('--dr',(R()*900-300)+'deg');p.style.animationDuration=(1.8+R()*2)+'s';p.style.animationDelay=(R()*.9)+'s';o.appendChild(p)}}
function banner(o,em,t,s){var d=document.createElement('div');d.className='fxt';d.innerHTML=(em?'<i class="fxe">'+em+'</i>':'')+'<b>'+t+'</b><span>'+s+'</span>';o.appendChild(d)}
function snd2(k){try{snd(k)}catch(e){}}
function vib(p){try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}}
var STY={coins:['🪙','💰'],stars:['⭐','✨','🌟'],hearts:['💎','💖','✨'],fireworks:['🎆','🎇','💥','✨']};
function extra(l,st){var g=STY[st];if(!g)return;if(st=='fireworks'){for(var i=0;i<12;i++){var b=document.createElement('span');b.className='fxb';b.textContent=g[i%g.length];b.style.cssText='left:'+(8+R()*84)+'vw;top:'+(10+R()*55)+'vh;font-size:'+(36+R()*40)+'px;animation-delay:'+(R()*1.4)+'s';l.appendChild(b)}}else rain(l,36,function(p,i){p.textContent=g[i%g.length];p.style.fontSize=(20+R()*22)+'px'})}
window.fx={
 party:function(st){var l=layer('win');snd2('win');extra(l,st||window.FXN)},
 win:function(o){o=o||{};var l=layer('win'),k=o.kind;snd2('win');vib([30,40,30,40,80]);
  if(k=='bb'){var g=document.getElementById('bbg');if(g){g.classList.add('wv')}rain(l,46,function(p,i){var s=14+R()*18;p.style.cssText+='width:'+s+'px;height:'+s+'px;border-radius:5px;background:'+COL[i%6]+';box-shadow:inset 0 -3px 0 rgba(0,0,0,.25),inset 0 2px 0 rgba(255,255,255,.4)'});banner(l,'🧩',o.title||'Победа',o.sub||'')}
  else if(k=='dk'){var S=['♠','♥','♦','♣'];rain(l,40,function(p,i){p.textContent=S[i%4];p.style.fontSize=(22+R()*26)+'px';p.style.color=i%4==1||i%4==2?'#ff5a6e':'#ffe9a8';p.style.textShadow='0 0 12px rgba(255,211,110,.8)'});banner(l,'👑',o.title||'Победа',o.sub||'')}
  else{rain(l,window.FXN?0:30,function(p){p.textContent='🪙';p.style.fontSize=(18+R()*20)+'px'});banner(l,'',o.title||'Победа',o.sub||'')}},
 lose:function(o){o=o||{};var l=layer('lose'),k=o.kind;snd2('lose');vib([120,60,120]);
  if(k=='bb'){var g=document.getElementById('bbg');if(g)$$('#bbg div').forEach(function(c,i){c.style.setProperty('--dx',(R()*80-40)+'px');c.style.setProperty('--dr',(R()*160-80)+'deg');c.style.animationDelay=((i%8)*.04+R()*.4)+'s';c.classList.add('dp')});setTimeout(function(){banner(l,'💥',o.title||'Не повезло',o.sub||'')},450)}
  else if(k=='dk'){var d=document.getElementById('dk');if(d)d.classList.add('lz');rain(l,26,function(p,i){p.textContent=['♠','♣','🃏','💨'][i%4];p.style.fontSize=(20+R()*22)+'px';p.style.color='#6b6580';p.style.opacity=.8});banner(l,'🤡',o.title||'Поражение',o.sub||'')}
  else{banner(l,'',o.title||'Не повезло',o.sub||'')}}};
/* Дурак: реагируем на итог партии, не трогая сам движок */
var mo=new MutationObserver(function(){var m=document.getElementById('dkm'),d=document.getElementById('dk');if(!m||!d||d.dataset.fx||!/msg/.test(m.className))return;
 var amt=((m.textContent.match(/\d[\d\s]*/)||[''])[0]).trim();
 if(/win/.test(m.className)){d.dataset.fx=1;d.classList.add('wn');fx.win({kind:'dk',title:'Победа!',sub:'+'+amt+' 🪙'})}
 else if(/lose/.test(m.className)){d.dataset.fx=1;fx.lose({kind:'dk',title:'Ты — дурак!',sub:'−'+amt+' 🪙'})}});
mo.observe(document.body,{childList:true,subtree:true});
})();
