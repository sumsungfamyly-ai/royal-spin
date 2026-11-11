(function(){
var $_=function(s,r){return(r||document).querySelector(s)};
/* ---- шторка ---- */
var bd=document.createElement('div');bd.id='shbd';document.body.appendChild(bd);
function closeSheet(){if(document.body.classList.contains('shx'))nav('games')}
bd.onclick=closeSheet;
var og=window.openGame;window.openGame=function(g){og(g);document.body.classList.add('shx');var l=$_('#v-games');if(l)l.hidden=false;var v=$_('#v-game');if(v)v.scrollTop=0};
var vg=$_('#v-game');if(vg){new MutationObserver(function(){if(vg.hidden)document.body.classList.remove('shx')}).observe(vg,{attributes:true,attributeFilter:['hidden']});
 var y0=null;vg.addEventListener('touchstart',function(e){y0=(vg.scrollTop<=0&&!document.body.classList.contains('fs')&&e.touches[0].clientY<vg.getBoundingClientRect().top+56)?e.touches[0].clientY:null},{passive:true});
 vg.addEventListener('touchmove',function(e){if(y0!==null&&e.touches[0].clientY-y0>0)vg.style.transform='translateY('+(e.touches[0].clientY-y0)+'px)'},{passive:true});
 vg.addEventListener('touchend',function(e){if(y0===null)return;var d=e.changedTouches[0].clientY-y0;vg.style.transform='';y0=null;if(d>110)closeSheet()})}
/* ---- Плинко ---- */
var PL=function(r,e){var k={low:[6,2.5],mid:[40,3],high:[260,3.6]}[r],P=[1,12,66,220,495,792,924,792,495,220,66,12,1].map(function(x){return x/4096}),w=P.map(function(_,i){return .3+k[0]*Math.pow(Math.abs(i-6)/6,k[1])}),t=w.reduce(function(s,x,i){return s+x*P[i]},0);return w.map(function(x){return Math.floor(x/t*(1-e/100)*100)/100})};
var sp=100/15,py=function(r){return 7+r*6.4};
G.plinko={t:'Плинко',i:'🔮',d:'до x260',r:function(){var risk='mid';
 $('#gbody').innerHTML='<div class="card"><div class="plb" id="plb"></div><div class="pls" id="pls"></div><div class="opt" id="rk"><button data-r="low">Низкий</button><button data-r="mid" class="on">Средний</button><button data-r="high">Высокий</button></div>'+betBox()+'<button class="go" id="go">БРОСИТЬ ШАР</button><div class="msg" id="m"></div></div>';
 var board=$('#plb');for(var r=0;r<12;r++)for(var j=0;j<r+3;j++){var i=document.createElement('i');i.style.left=(50+(j-(r+2)/2)*sp)+'%';i.style.top=py(r)+'%';board.appendChild(i)}
 function slots(){var m=PL(risk,cfg.edge);$('#pls').innerHTML=m.map(function(x){return'<b class="'+(x>=10?'h':x>=2?'m':x>=1?'l':'')+'">'+(x>=100?Math.round(x):x)+'</b>'}).join('')}slots();
 sel('#rk',function(b){risk=b.dataset.r;slots()});
 $('#go').onclick=function(){run(async function(){var b=bet();$('#m').textContent='';$$('#pls b').forEach(function(x){x.classList.remove('hit')});$$('#plb u').forEach(function(x){x.remove()});
  try{var r=await api('plinko',{bet:b,risk:risk}),ball=document.createElement('u'),k=0;ball.style.left='50%';ball.style.top='1%';board.appendChild(ball);await sleep(60);
   for(var i=0;i<12;i++){k+=r.path[i];ball.style.left=(50+(k-(i+1)/2)*sp)+'%';ball.style.top=py(i)+'%';await sleep(190)}
   ball.style.top='96%';await sleep(220);$$('#pls b')[r.slot].classList.add('hit');res('#m',r.win,b)}catch(e){fail('#m',e)}})}}};
/* ---- Блок Бласт ---- */
var SH=[[[0,0]],[[0,0],[0,1]],[[0,0],[1,0]],[[0,0],[0,1],[0,2]],[[0,0],[1,0],[2,0]],[[0,0],[0,1],[1,0],[1,1]],[[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]],[[0,0],[1,0],[1,1]],[[0,0],[0,1],[1,0]],[[0,0],[0,1],[0,2],[0,3]],[[0,0],[1,0],[2,0],[3,0]],[[0,0],[0,1],[1,1]],[[0,1],[1,0],[1,1]],[[0,0],[1,0],[2,0],[2,1]],[[0,0],[0,1],[0,2],[1,0]]];
function mini(s){var h=0,w=0;SH[s].forEach(function(c){h=Math.max(h,c[0]+1);w=Math.max(w,c[1]+1)});var o='<span style="grid-template-columns:repeat('+w+',13px)">';for(var r=0;r<h;r++)for(var c=0;c<w;c++)o+='<i'+(SH[s].some(function(q){return q[0]==r&&q[1]==c})?'':' class="e"')+'></i>';return o+'</span>'}
G.blockblast={t:'Блок Бласт',i:'🧩',d:'до x25',r:function(){var st=null,pick=-1;
 $('#gbody').innerHTML='<div class="card" id="bbc">'+betBox()+'<button class="go" id="go">НАЧАТЬ ИГРУ</button><div class="msg" id="m"></div><small>Ставь фигуры на поле 8×8. Заполненные линии сгорают и дают очки. Каждые 150 очков = x1 к ставке, максимум x25. Когда ходов нет, игра сама выплачивает выигрыш.</small></div>';
 function draw(){var c=$('#bbc');c.innerHTML='<div class="bbs"><span>Очки <b>'+st.sc+'</b></span><span>Ставка <b>'+fmt(st.bet)+'</b></span><span>x<b>'+st.mult+'</b></span></div><div class="bbg" id="bbg">'+st.bd.map(function(v){return'<div'+(v?' class="c'+v+'"':'')+'></div>'}).join('')+'</div><div class="bbp">'+st.pcs.map(function(s,i){return'<button data-i="'+i+'"'+(s===null?' disabled':'')+(i==pick?' class="on"':'')+'>'+(s===null?'':mini(s))+'</button>'}).join('')+'</div><button class="go" id="cash">ЗАБРАТЬ x'+st.mult+' ('+fmt(Math.floor(st.bet*st.mult))+')</button><div class="msg" id="m"></div>';
  $$('.bbp button').forEach(function(b){b.onclick=function(){pick=+b.dataset.i;draw()}});
  var cells=$$('#bbg div');function pos(i){var s=st.pcs[pick];if(s===null||pick<0)return null;var w=0;SH[s].forEach(function(q){w=Math.max(w,q[1]+1)});var x=Math.min(7-w+1,Math.max(0,i%8-(w>>1))),h=0;SH[s].forEach(function(q){h=Math.max(h,q[0]+1)});var y=Math.min(8-h,Math.max(0,((i/8)|0)-(h>>1)));return{x:x,y:y,s:s}}
  function ok(p){return SH[p.s].every(function(q){return !st.bd[(p.y+q[0])*8+p.x+q[1]]})}
  function prev(i){cells.forEach(function(c){c.classList.remove('pv','bad')});var p=pos(i);if(!p)return;var g=ok(p);SH[p.s].forEach(function(q){cells[(p.y+q[0])*8+p.x+q[1]].classList.add(g?'pv':'bad')})}
  cells.forEach(function(c,i){c.onmouseenter=function(){prev(i)};c.ontouchstart=function(){prev(i)};c.onclick=function(){var p=pos(i);if(!p)return toast2('Выбери фигуру');if(!ok(p))return toast2('Сюда нельзя');run(async function(){try{var r=await api('bb_move',{i:pick,x:p.x,y:p.y});pick=-1;st=Object.assign(st,r.bb);if(r.over){draw();end(r)}else draw()}catch(e){fail('#m',e)}})}});
  $('#cash').onclick=function(){run(async function(){try{var r=await api('bb_cash');st=Object.assign(st,r.bb);draw();end(r)}catch(e){fail('#m',e)}})}}
 function toast2(t){var m=$('#m');if(m){m.textContent=t;m.className='msg lose'}}
 function end(r){$$('.bbp button,#cash').forEach(function(b){b.disabled=true});res('#m',r.win,st.bet);var a=document.createElement('button');a.className='go';a.textContent='ИГРАТЬ СНОВА';a.onclick=function(){G.blockblast.r()};$('#bbc').appendChild(a)}
 function start(){return run(async function(){try{var r=await api('bb_start',{bet:bet()});st=r.bb;pick=-1;draw()}catch(e){fail('#m',e)}})}
 $('#go').onclick=start;
 api('bb_state').then(function(r){if(r.bb){st=r.bb;pick=-1;draw()}}).catch(function(){})}};
})();
