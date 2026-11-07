(function(){
try{var w=window.Telegram&&Telegram.WebApp;if(w){w.expand&&w.expand();w.disableVerticalSwipes&&w.disableVerticalSwipes()}}catch(e){}
var SH=[[[0,0]],[[0,0],[0,1]],[[0,0],[1,0]],[[0,0],[0,1],[0,2]],[[0,0],[1,0],[2,0]],[[0,0],[0,1],[1,0],[1,1]],[[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]],[[0,0],[1,0],[1,1]],[[0,0],[0,1],[1,0]],[[0,0],[0,1],[0,2],[0,3]],[[0,0],[1,0],[2,0],[3,0]],[[0,0],[0,1],[1,1]],[[0,1],[1,0],[1,1]],[[0,0],[1,0],[2,0],[2,1]],[[0,0],[0,1],[0,2],[1,0]]];
var COL=['','#e05d5d','#e0a23c','#58b36b','#4a8fe0','#9b6be0','#d85fa8'];
var dims=function(s){var h=0,w=0;SH[s].forEach(function(q){h=Math.max(h,q[0]+1);w=Math.max(w,q[1]+1)});return{h:h,w:w}};
function mini(s,px){var d=dims(s),o='<span style="display:grid;gap:3px;grid-template-columns:repeat('+d.w+','+px+'px)">';for(var r=0;r<d.h;r++)for(var c=0;c<d.w;c++){var on=SH[s].some(function(q){return q[0]==r&&q[1]==c});o+='<i style="width:'+px+'px;height:'+px+'px;border-radius:5px;background:'+(on?COL[1+s%6]:'transparent')+(on?';box-shadow:inset 0 -2px 0 rgba(0,0,0,.25),inset 0 2px 0 rgba(255,255,255,.3)':'')+'"></i>'}return o+'</span>'}
var tip=function(t,bad){var m=$('#m');if(m){m.textContent=t;m.className='msg'+(bad?' lose':'')}};
G.blockblast={t:'Блок Бласт',i:'🧩',d:'до x25',r:function(){var st=null,busy=false;
 $('#gbody').innerHTML='<div class="card" id="bbc">'+betBox()+'<button class="go" id="go">НАЧАТЬ ИГРУ</button><div class="msg" id="m"></div><small>Перетаскивай фигуры на поле 8×8. Заполненные линии сгорают и дают очки. 150 очков = x1 к ставке, максимум x25. Когда ходов нет, выигрыш выплачивается сам.</small></div>';
 function draw(){var c=$('#bbc');
  c.innerHTML='<div class="bbs"><span>Очки <b>'+st.sc+'</b></span><span>Ставка <b>'+fmt(st.bet)+'</b></span><span>x<b>'+st.mult+'</b></span></div><div class="bbg" id="bbg">'+st.bd.map(function(v){return'<div'+(v?' class="c'+v+'"':'')+'></div>'}).join('')+'</div><div class="bbpv">Перетащи фигуру на поле</div><div class="bbp">'+st.pcs.map(function(s,i){return'<button data-i="'+i+'"'+(s===null?' disabled':'')+'>'+(s===null?'':mini(s,18))+'</button>'}).join('')+'</div><button class="go" id="cash">ЗАБРАТЬ x'+st.mult+' ('+fmt(Math.floor(st.bet*st.mult))+')</button><div class="msg" id="m"></div>';
  fit();$$('.bbp button:not(:disabled)').forEach(function(b){b.onpointerdown=function(e){drag(e,b)}});
  $('#cash').onclick=function(){if(busy)return;busy=true;api('bb_cash').then(function(r){st=Object.assign(st,r.bb);draw();end(r)}).catch(function(e){tip(e.message,1)}).then(function(){busy=false})}}
 function fit(){var g=$('#bbg');if(!g)return;var s=Math.floor(Math.min(innerWidth-24,innerHeight*.47));g.style.width=g.style.height=s+'px';g.style.margin='0 auto'}
 window.addEventListener('resize',fit);
 function drag(e,btn){if(busy)return;e.preventDefault();var s=st.pcs[+btn.dataset.i],d=dims(s),g=$('#bbg').getBoundingClientRect(),cs=(g.width-33)/8,cells=$$('#bbg div'),ghost=document.createElement('div');
  ghost.className='bbghost';ghost.style.gridTemplateColumns='repeat('+d.w+','+cs+'px)';ghost.innerHTML=SH[s].length?'':'';
  for(var r=0;r<d.h;r++)for(var c=0;c<d.w;c++){var on=SH[s].some(function(q){return q[0]==r&&q[1]==c}),i=document.createElement('i');i.style.cssText='width:'+cs+'px;height:'+cs+'px;background:'+(on?COL[1+s%6]:'transparent');ghost.appendChild(i)}
  document.body.appendChild(ghost);btn.classList.add('drag');var pos=null;
  function at(x,y){var gx=x-(d.w*cs)/2,gy=y-d.h*cs-56;ghost.style.left=gx+'px';ghost.style.top=gy+'px';
   var cx=Math.round((gx-g.left-6)/(cs+3)),cy=Math.round((gy-g.top-6)/(cs+3));cells.forEach(function(n){n.classList.remove('pv','bad')});
   var ok=SH[s].every(function(q){var R=cy+q[0],C=cx+q[1];return R>=0&&R<8&&C>=0&&C<8&&!st.bd[R*8+C]}),inb=SH[s].some(function(q){var R=cy+q[0],C=cx+q[1];return R>=0&&R<8&&C>=0&&C<8});
   pos=ok?{x:cx,y:cy}:null;if(inb)SH[s].forEach(function(q){var R=cy+q[0],C=cx+q[1];if(R>=0&&R<8&&C>=0&&C<8)cells[R*8+C].classList.add(ok?'pv':'bad')})}
  at(e.clientX,e.clientY);
  function mv(ev){at(ev.clientX,ev.clientY)}
  function up(){document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',up);ghost.remove();btn.classList.remove('drag');cells.forEach(function(n){n.classList.remove('pv','bad')});if(!pos)return;place(+btn.dataset.i,s,pos)}
  document.addEventListener('pointermove',mv);document.addEventListener('pointerup',up);document.addEventListener('pointercancel',up)}
 async function place(i,s,p){busy=true;try{var before=st.bd.slice();SH[s].forEach(function(q){before[(p.y+q[0])*8+p.x+q[1]]=1+s%6});
   var r=await api('bb_move',{i:i,x:p.x,y:p.y}),cells=$$('#bbg div');
   SH[s].forEach(function(q){var n=cells[(p.y+q[0])*8+p.x+q[1]];n.className='c'+(1+s%6)+' pop'});
   var cleared=before.map(function(v,k){return v&&!r.bb.bd[k]?k:-1}).filter(function(k){return k>=0});
   if(cleared.length){await sleep(160);cleared.forEach(function(k){cells[k].className='c'+(before[k]||1)+' fl'});await sleep(340)}
   st=Object.assign(st,r.bb);draw();if(r.over)end(r)}catch(e){tip(e.message,1)}busy=false}
 function end(r){$$('.bbp button,#cash').forEach(function(b){b.disabled=true});res('#m',r.win,st.bet);var pr=r.win-st.bet;if(window.fx){if(pr>0)fx.win({kind:'bb',title:'Отлично! x'+r.mult,sub:'+'+fmt(r.win)+' 🪙'});else if(pr<0)fx.lose({kind:'bb',title:'Нет ходов',sub:'−'+fmt(st.bet-r.win)+' 🪙'})}var a=document.createElement('button');a.className='go';a.textContent='ИГРАТЬ СНОВА';a.onclick=function(){G.blockblast.r()};$('#bbc').appendChild(a)}
 $('#go').onclick=function(){if(busy)return;busy=true;api('bb_start',{bet:bet()}).then(function(r){st=r.bb;draw()}).catch(function(e){fail('#m',e)}).then(function(){busy=false})};
 api('bb_state').then(function(r){if(r.bb){st=r.bb;draw()}}).catch(function(){})}};
})();
