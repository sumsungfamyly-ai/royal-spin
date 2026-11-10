(function(){
var M=function(){return typeof me!=='undefined'&&me?me:{}};
var INFO={checkers:{t:'Шашки',i:'♟️',how:'Русские шашки. Фигуры ходят по диагонали вперёд, бить можно вперёд и назад, бить обязательно. Дойдёшь до последней линии, станешь дамкой: она ходит и бьёт на любое расстояние. Побеждает тот, кто съел или запер все фигуры соперника. Победа забирает банк, комиссия идёт казино.'},connect4:{t:'Четыре в ряд',i:'🔴',how:'Сбрасывай фишки по очереди в колонки. Кто первым выстроит четыре своих фишки в ряд по горизонтали, вертикали или диагонали, тот забирает банк. Если поле заполнено, ничья и ставки возвращаются.'}};
INFO.coblast={t:'Блок Бласт вдвоём',i:'🧩',coop:1,how:'Совместная игра: вы с другом по очереди ставите фигуры на одно общее поле. Очки общие, 150 очков = x1 к ставке, максимум x25. Любой из вас может забрать выигрыш в любой момент, банк делится поровну. Когда ходов не осталось, игра заканчивается и выплата идёт по набранным очкам.'};
INFO.comines={t:'Мины вдвоём',i:'💣',coop:1,how:'Совместная игра: вы по очереди открываете клетки общего поля 5×5. Каждая безопасная клетка повышает общий множитель. Любой из вас может забрать выигрыш в любой момент. Если кто-то наступит на мину, проигрываете оба. Банк делится поровну.'};
var SH=[[[0,0]],[[0,0],[0,1]],[[0,0],[1,0]],[[0,0],[0,1],[0,2]],[[0,0],[1,0],[2,0]],[[0,0],[0,1],[1,0],[1,1]],[[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]],[[0,0],[1,0],[1,1]],[[0,0],[0,1],[1,0]],[[0,0],[0,1],[0,2],[0,3]],[[0,0],[1,0],[2,0],[3,0]],[[0,0],[0,1],[1,1]],[[0,1],[1,0],[1,1]],[[0,0],[1,0],[2,0],[2,1]],[[0,0],[0,1],[0,2],[1,0]]],COL=['','#e05d5d','#e0a23c','#58b36b','#4a8fe0','#9b6be0','#d85fa8'];
var dims=function(s){var h=0,w=0;SH[s].forEach(function(q){h=Math.max(h,q[0]+1);w=Math.max(w,q[1]+1)});return{h:h,w:w}};
function mini(s,px){var d=dims(s),o='<span style="display:grid;gap:3px;grid-template-columns:repeat('+d.w+','+px+'px)">';for(var r=0;r<d.h;r++)for(var c=0;c<d.w;c++){var on=SH[s].some(function(q){return q[0]==r&&q[1]==c});o+='<i style="width:'+px+'px;height:'+px+'px;border-radius:5px;background:'+(on?COL[1+s%6]:'transparent')+'"></i>'}return o+'</span>'}
try{HOW.coblast=INFO.coblast.how;HOW.comines=INFO.comines.how}catch(e){}
try{HOW.checkers=INFO.checkers.how;HOW.connect4=INFO.connect4.how}catch(e){}
function box(h,f){var m=document.getElementById('dkm');if(m)m.remove();m=document.createElement('div');m.id='dkm';m.innerHTML='<div>'+h+'</div>';m.onclick=function(e){if(e.target==m)m.remove()};document.body.appendChild(m);f&&f(m)}
function bets(){return[cfg.minBet,Math.min(cfg.maxBet,Math.max(cfg.minBet,100)),Math.min(cfg.maxBet,Math.max(cfg.minBet,500)),Math.min(cfg.maxBet,Math.max(cfg.minBet,2000))].filter(function(x,i,a){return a.indexOf(x)==i})}
function pickBet(title,cb){box('<h3>'+title+'</h3>'+bets().map(function(x){return'<button data-b="'+x+'">'+fmt(x)+' 🪙</button>'}).join(''),function(m){m.querySelectorAll('[data-b]').forEach(function(b){b.onclick=function(){b.disabled=true;cb(+b.dataset.b,m)}})})}
function optPick(cb){box('<h3>Сколько мин на поле?</h3><button data-o="3">3 мины, спокойно</button><button data-o="5">5 мин, азартно</button><button data-o="8">8 мин, на нервах</button>',function(m){m.querySelectorAll('[data-o]').forEach(function(b){b.onclick=function(){m.remove();cb(+b.dataset.o)}})})}
function friendPick(cb){api('social').then(function(r){var fs=(r.friends||[]).map(String),list=(r.people||[]).filter(function(p){return fs.indexOf(String(p.id))>-1});
 if(!list.length)return tg.showAlert('Сначала добавь друзей во вкладке «Друзья»');
 box('<h3>Выбери друга</h3>'+list.map(function(p){return'<button data-f="'+p.id+'">'+esc(p.avatar||'👤')+' '+esc(p.nick||p.name||'Игрок')+'</button>'}).join(''),function(m){m.querySelectorAll('[data-f]').forEach(function(b){b.onclick=function(){m.remove();cb(b.dataset.f)}})})}).catch(function(e){tg.showAlert(e.message)})}
var timer=null;function stop(){clearInterval(timer);timer=null}
function make(key){var I=INFO[key];return{t:I.t,i:I.i,d:I.coop?'вместе с другом':'онлайн и с ботом',r:function(){stop();lobby(key)}}}
function lobby(key){var I=INFO[key];
 $('#gbody').innerHTML='<div class="card bgl"><div class="bgh"><span class="bgi">'+I.i+'</span><b>'+I.t+'</b></div>'+(I.coop?'':'<button class="go" id="bgb">🤖 Играть с ботом</button>')+'<button class="go'+(I.coop?'':' sec2')+'" id="bgf">👥 '+(I.coop?'Играть вместе с другом':'Играть с другом')+'</button><h4>Мои партии</h4><div id="bgls"><small>Загрузка…</small></div></div>';
 if($('#bgb'))$('#bgb').onclick=function(){pickBet('Ставка против бота',function(b,m){api('bg_bot',{game:key,bet:b}).then(function(r){m.remove();open(key,r.bg.id)}).catch(function(e){m.remove();tg.showAlert(e.message)})})};
 $('#bgf').onclick=function(){friendPick(function(f){(key=='comines'?optPick:function(c){c(0)})(function(opt){pickBet('Ставка',function(b,m){api('bg_invite',{game:key,friend:f,bet:b,opt:opt}).then(function(r){m.remove();open(key,r.bg.id)}).catch(function(e){m.remove();tg.showAlert(e.message)})})})})};
 function load(){api('bg_list').then(function(r){var el=$('#bgls');if(!el)return;var ls=r.list.filter(function(x){return x.game==key});
  el.innerHTML=ls.length?ls.map(function(x){var st=x.status=='pending'?(x.role=='b'?'inv':'wait'):x.status=='active'?(x.turn==x.role?'my':'opp'):'done',lb={inv:'Приглашение',wait:'Ждёт ответа',my:'Твой ход',opp:'Ход соперника',done:x.w=='coop'?'Завершена':x.w=='draw'?'Ничья':x.w=='x'?'Отменена':x.w==x.role?'Победа':'Поражение'}[st];
   return'<div class="bgr" data-o="'+x.id+'"><span class="av">'+esc(x.opp.avatar||'👤')+'</span><div><b>'+esc(x.opp.nick||'Игрок')+'</b><small>Ставка '+fmt(x.bet)+' 🪙</small></div>'+(st=='inv'?'<button class="ok" data-a="'+x.id+'">Принять</button><button class="no" data-d="'+x.id+'">✕</button>':'<span class="bd'+(st=='my'?' my':'')+'">'+lb+'</span>')+'</div>'}).join(''):'<small>Пока нет партий. Сыграй с ботом или позови друга.</small>';
  el.querySelectorAll('[data-o]').forEach(function(x){x.onclick=function(){open(key,x.dataset.o)}});
  el.querySelectorAll('[data-a]').forEach(function(x){x.onclick=function(e){e.stopPropagation();api('bg_accept',{id:x.dataset.a}).then(function(){open(key,x.dataset.a)}).catch(function(er){tg.showAlert(er.message)})}});
  el.querySelectorAll('[data-d]').forEach(function(x){x.onclick=function(e){e.stopPropagation();api('bg_decline',{id:x.dataset.d}).then(load).catch(function(er){tg.showAlert(er.message)})}})}).catch(function(){})}
 load();timer=setInterval(function(){if(!$('#bgls'))return stop();load()},6000)}
/* ---- партия ---- */
function open(key,id){stop();var V=null,O=null,sel=null,busy=false,fxd=false,dragging=false,pend=false,lastKey='',gone=false,lastRx=0;
 $('#gbody').innerHTML='<div class="card" id="bgv"><small>Загрузка…</small></div>';
 function apply(r){if(r.same)return;var prev=V,ch=!V||r.bg.rev!=V.rev||r.bg.status!=V.status;V=r.bg;if(r.opp)O=r.opp;if(V.rx&&V.rx.r!=V.role&&V.rx.t!==lastRx&&Date.now()-V.rx.t<8000){lastRx=V.rx.t;flash(V.rx.e)}
  if(ch){sel=null;if(prev&&V.status=='active'&&V.turn==V.role&&prev.turn!=prev.role)hap('m');if(dragging)pend=true;else draw()}}
 function flash(e){var d=document.createElement('div');d.className='bgfl';d.textContent=e;document.body.appendChild(d);setTimeout(function(){d.remove()},1700)}
 function hap(k){try{tg.HapticFeedback.impactOccurred(k=='m'?'medium':'light')}catch(e){}}
 function pull(){if(!$('#bgv')){gone=true;return stop()}if(busy)return;api('bg_state',{id:id,rev:V?Math.floor(V.rev):0}).then(apply).catch(function(){})}
 function loop(){if(gone||!$('#bgv')||(V&&V.status=='done')){gone=true;return stop()}var w=V&&V.status=='active'&&V.turn==V.role?5000:V&&(V.status=='active'||V.status=='pending')?1500:4000;if(!document.hidden)pull();timer=setTimeout(loop,document.hidden?3000:w)}
 document.addEventListener('visibilitychange',function(){if(!document.hidden&&$('#bgv')&&V&&V.status!='done')pull()});
 function size(){return Math.floor(Math.min(innerWidth-48,440,innerHeight*.55))}
 function draw(){var el=$('#bgv');if(!el)return;$$('.bbghost').forEach(function(g){g.remove()});var my=V.status=='active'&&V.turn==V.role,done=V.status=='done',pend=V.status=='pending',oppN=O?(O.nick||'Игрок'):'Соперник',pot=V.bet*2;
  var st=pend?(V.role=='a'?'Ждём ответа соперника…':'Тебя приглашают в партию'):done?(V.w=='draw'?'Ничья, ставки возвращены':V.w=='x'?'Партия отменена':V.w==V.role?'Ты победил!':'Ты проиграл'):my?(key=='checkers'&&V.legal[0]&&V.legal[0].c.length?'Твой ход. Бить обязательно!':'Твой ход'):'Ход соперника…';
  if(V.coop){var S0=V.st||{};st=pend?(V.role=='a'?'Ждём ответа напарника…':'Тебя зовут играть вместе'):done?(S0.boom!=null&&S0.boom!==undefined?'💥 Мина! Проиграли оба':V.pay>V.bet?'Выиграли вместе! +'+fmt(V.pay)+' 🪙':V.pay==V.bet?'Ставка возвращена':'Итог: '+fmt(V.pay)+' 🪙 каждому'):my?'Твой ход':'Ход напарника…'}
  var h='<div class="bgm"><span class="av">'+esc((O&&O.avatar)||'👤')+'</span><div><b>'+esc(oppN)+'</b><small>Ставка '+fmt(V.bet)+' · банк '+fmt(pot)+' 🪙</small></div></div><div class="bgst'+(my?' my':'')+'">'+st+'</div>';
  if(!pend)h+=key=='checkers'?ckHtml():key=='connect4'?c4Html():key=='coblast'?cbHtml():cmHtml();
  if(key=='connect4'&&!pend&&!done)h+='<div class="c4hint">Ты играешь '+(V.role=='a'?'красными 🔴':'жёлтыми 🟡')+'</div>';
  if(V.oppId!='bot'&&!pend)h+='<div class="bgrx">'+['👍','😂','😮','😡','🔥','🤝'].map(function(e){return'<button data-rx="'+e+'">'+e+'</button>'}).join('')+'</div>';
  h+='<div class="bgact">';
  if(V.coop&&V.status=='active'){h+='<button id="bgcash" style="background:linear-gradient(115deg,#ff8fd8,#ffd36e,#7dffd1);color:#171021;border:0;font-weight:800">Забрать'+(V.st.mult?' x'+V.st.mult+' ('+fmt(Math.floor(V.bet*V.st.mult))+')':'')+'</button><button id="bgx">К списку</button></div>';el.innerHTML=h;fit();bind();return}
  if(pend&&V.role=='b')h+='<button class="ok" id="bga" style="background:#2ee08a;color:#07210f;border:0">Принять</button><button id="bgd">Отклонить</button>';
  else if(pend)h+='<button class="dng" id="bgr">Отменить</button>';
  else if(!done){h+='<button class="dng" id="bgr">Сдаться</button>';if(!my&&V.oppId!='bot'&&Date.now()-V.mv>6e5)h+='<button id="bgc">Забрать победу</button>'}
  else h+='<button id="bgn">'+(V.oppId!='bot'?'Реванш':'Новая партия')+'</button>';
  h+='<button id="bgx">К списку</button></div>';el.innerHTML=h;fit();bind();slide();
  if(done&&!fxd&&V.coop){fxd=true;if(window.fx){if(V.pay>V.bet)fx.win({kind:'bb',title:'Победа вдвоём!',sub:'+'+fmt(V.pay-V.bet)+' 🪙'});else if(V.pay<V.bet)fx.lose({kind:'gen',title:(V.st&&V.st.boom!=null)?'Подорвались!':'Не повезло',sub:'−'+fmt(V.bet-V.pay)+' 🪙'})}}
  if(done&&!fxd){fxd=true;var win=V.w==V.role,paid=Math.floor(pot*(1-(cfg.duelFee||0)/100));if(window.fx){if(win)fx.win({kind:key=='checkers'?'dk':'bb',title:'Победа!',sub:'+'+fmt(paid)+' 🪙'});else if(V.w!='draw'&&V.w!='x')fx.lose({kind:'gen',title:'Поражение',sub:'−'+fmt(V.bet)+' 🪙'})}}}
  function slide(){if(key!='checkers'||!V.st||!V.st.last||V.st.last.length<2)return;var k=V.st.last.join('>');if(k===lastKey)return;lastKey=k;var b=$('.ckb');if(!b||!b.animate)return;var from=V.st.last[0],to=V.st.last[V.st.last.length-1],s=b.clientWidth/8,sg=V.role=='b'?-1:1,el=b.querySelector('[data-i="'+to+'"] .kpc');if(el)el.animate([{transform:'translate('+((from%8-to%8)*s*sg)+'px,'+(((from/8|0)-(to/8|0))*s*sg)+'px)'},{transform:'none'}],{duration:Math.min(420,170+70*(V.st.last.length-1)),easing:'cubic-bezier(.2,.8,.2,1)'})}
  function fit(){var b=$('.ckb,.c4b,.bbg,.cmb');if(b){var s=size();b.style.width=s+'px';b.style.height=(key=='connect4'?Math.round(s*6/7):s)+'px'}}
  function act(a,p,saved){busy=true;if(O)p.o=1;hap('l');return api(a,p).then(function(r){busy=false;apply(r);if(!r.opp&&O==null)pull()}).catch(function(e){busy=false;if(saved){V=saved;draw()}tg.showAlert(e.message)})}
  function bind(){var q=function(s){return $(s)};
   q('#bga')&&(q('#bga').onclick=function(){act('bg_accept',{id:id})});q('#bgd')&&(q('#bgd').onclick=function(){api('bg_decline',{id:id}).then(function(){G[key].r()})});
   q('#bgr')&&(q('#bgr').onclick=function(){var f=function(ok){if(ok)act('bg_resign',{id:id})};tg.showConfirm(V.status=='pending'?'Отменить приглашение?':'Сдаться? Ставка достанется сопернику.',f)});
   q('#bgc')&&(q('#bgc').onclick=function(){act('bg_claim',{id:id})});q('#bgn')&&(q('#bgn').onclick=function(){if(V.oppId!='bot'&&V.status=='done'){api('bg_invite',{game:key,friend:V.oppId,bet:V.bet,opt:V.opt||0}).then(function(r){open(key,r.bg.id)}).catch(function(e){tg.showAlert(e.message)})}else G[key].r()});q('#bgx').onclick=function(){G[key].r()};$$('.bgrx [data-rx]').forEach(function(b){b.onclick=function(){flash(b.dataset.rx);api('bg_react',{id:id,e:b.dataset.rx,o:1}).catch(function(){})}});q('#bgcash')&&(q('#bgcash').onclick=function(){act('bg_cash',{id:id})});
   if(key=='comines')$$('.cmb i').forEach(function(c){c.onclick=function(){if(!busy&&V.status=='active'&&V.turn==V.role&&c.className.indexOf('op')<0)act('bg_move',{id:id,mv:{i:+c.dataset.i}})}});else if(key=='coblast')$$('.bbp button:not(:disabled)').forEach(function(b){b.onpointerdown=function(e){cbDrag(e,b)}});else if(key=='checkers')$$('.ckb i').forEach(function(c){c.onclick=function(){cell(+c.dataset.i)}});else $$('.c4b i').forEach(function(c){c.onclick=function(){drop(+c.dataset.i%7)}})}
  /* шашки */
  function ckHtml(){var flip=V.role=='b',bd=V.st.bd,my=V.status=='active'&&V.turn==V.role,L=V.legal||[],last=V.st.last||[],o='<div class="ckb'+(my?' my':'')+'">';
   for(var vi=0;vi<64;vi++){var i=flip?63-vi:vi,r=(i/8)|0,c=i%8,d=(r+c)%2==1,pc=bd[i],cl=(d?'kd':'')+(last.indexOf(i)>-1?' klm':'')+(my&&sel===i?' ksl':'');
    if(my&&sel!==null&&L.some(function(m){return m.p[0]==sel&&m.p[m.p.length-1]==i}))cl+=' ktg';else if(my&&sel===null&&L.some(function(m){return m.p[0]==i}))cl+=' ksc';
    o+='<i class="'+cl+'" data-i="'+i+'">'+(pc?'<b class="kpc '+(pc<=2?'kpa':'kpb')+(pc%2==0?' kk':'')+'"></b>':'')+'</i>'}return o+'</div>'}
  function cell(i){if(busy||!V||V.status!='active'||V.turn!=V.role)return;var L=V.legal;
   if(sel!==null){var k=-1;L.forEach(function(m,j){if(k<0&&m.p[0]==sel&&m.p[m.p.length-1]==i)k=j});if(k>-1){var m=L[k],nb=V.st.bd.slice(),pv=nb[m.p[0]],to=m.p[m.p.length-1],saved=V;nb[m.p[0]]=0;m.c.forEach(function(x){nb[x]=0});if(pv==1&&m.p.some(function(q){return(q/8|0)==0}))pv=2;if(pv==3&&m.p.some(function(q){return(q/8|0)==7}))pv=4;nb[to]=pv;V=Object.assign({},V,{st:{bd:nb,last:m.p,q:V.st.q},turn:V.role=='a'?'b':'a',legal:[]});sel=null;draw();act('bg_move',{id:id,mv:{i:k}},saved);return}}
   sel=L.some(function(m){return m.p[0]==i})?i:null;draw()}
  /* совместные */
  function cmHtml(){var S=V.st,my=V.status=='active'&&V.turn==V.role,o='<div class="bbs"><span>Мин <b>'+S.cnt+'</b></span><span>Открыто <b>'+S.open.length+'</b></span><span>x<b>'+(S.mult||0)+'</b></span></div><div class="cmb'+(my?' my':'')+'">';
   for(var i=0;i<25;i++){var op=S.open.indexOf(i)>-1,mn=S.mines&&S.mines.indexOf(i)>-1;o+='<i data-i="'+i+'" class="'+(op?'op':mn?(S.boom===i?'bm':'mn'):'')+(S.last===i&&!mn?' klm':'')+'">'+(op?'💎':mn?(S.boom===i?'💥':'💣'):'')+'</i>'}return o+'</div>'}
  function cbHtml(){var S=V.st,my=V.status=='active'&&V.turn==V.role,o='<div class="bbs"><span>Очки <b>'+S.sc+'</b></span><span>Ставка <b>'+fmt(V.bet)+'</b></span><span>x<b>'+S.mult+'</b></span></div><div class="bbg">';
   for(var i=0;i<64;i++)o+='<div class="'+(S.bd[i]?'bc'+S.bd[i]:'')+(S.last&&S.last.indexOf(i)>-1?' bpop':'')+'"></div>';
   o+='</div><div class="bbp">'+S.pcs.map(function(s,i){return'<button data-i="'+i+'"'+(s===null||!my?' disabled':'')+'>'+(s===null?'':mini(s,16))+'</button>'}).join('')+'</div>';return o}
  function cbDrag(e,btn){if(busy||!V||V.status!='active'||V.turn!=V.role)return;e.preventDefault();$$('.bbghost').forEach(function(g){g.remove()});dragging=true;var i=+btn.dataset.i,s=V.st.pcs[i],d=dims(s),g=$('.bbg').getBoundingClientRect(),cs=Math.max(14,Math.min(56,(g.width-35)/8)),cells=$$('.bbg div'),ghost=document.createElement('div'),pos=null;
   ghost.className='bbghost';ghost.style.gridTemplateColumns='repeat('+d.w+','+cs+'px)';
   for(var r=0;r<d.h;r++)for(var c=0;c<d.w;c++){var on=SH[s].some(function(q){return q[0]==r&&q[1]==c}),n=document.createElement('i');n.style.cssText='width:'+cs+'px;height:'+cs+'px;background:'+(on?COL[1+s%6]:'transparent');ghost.appendChild(n)}
   document.body.appendChild(ghost);btn.classList.add('drag');
   function at(x,y){var gx=x-(d.w*cs)/2,gy=y-d.h*cs-56;ghost.style.transform='translate3d('+Math.round(gx)+'px,'+Math.round(gy)+'px,0)';var cx=Math.round((gx-g.left-7)/(cs+3)),cy=Math.round((gy-g.top-7)/(cs+3));cells.forEach(function(n){n.classList.remove('pv','bad')});
    var S=V.st,ok=SH[s].every(function(q){var R=cy+q[0],C=cx+q[1];return R>=0&&R<8&&C>=0&&C<8&&!S.bd[R*8+C]}),inb=SH[s].some(function(q){var R=cy+q[0],C=cx+q[1];return R>=0&&R<8&&C>=0&&C<8});
    pos=ok?{x:cx,y:cy}:null;if(inb)SH[s].forEach(function(q){var R=cy+q[0],C=cx+q[1];if(R>=0&&R<8&&C>=0&&C<8)cells[R*8+C].classList.add(ok?'pv':'bad')})}
   at(e.clientX,e.clientY);function mv(ev){at(ev.clientX,ev.clientY)}
   function up(){document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',up);ghost.remove();dragging=false;btn.classList.remove('drag');cells.forEach(function(n){n.classList.remove('pv','bad')});if(pos)cbMove(i,s,pos);else if(pend){pend=false;draw()}}
   document.addEventListener('pointermove',mv);document.addEventListener('pointerup',up);document.addEventListener('pointercancel',up)}
  function cbMove(i,s,p){var S=V.st,bd=S.bd.slice(),pc=S.pcs.slice(),last=[],saved=V;SH[s].forEach(function(q){var k=(p.y+q[0])*8+p.x+q[1];bd[k]=1+s%6;last.push(k)});pc[i]=null;V=Object.assign({},V,{st:Object.assign({},S,{bd:bd,pcs:pc,last:last}),turn:V.role=='a'?'b':'a'});draw();act('bg_move',{id:id,mv:{i:i,x:p.x,y:p.y}},saved)}
  /* четыре в ряд */
  function c4Html(){var g=V.st.g,last=V.st.last,my=V.status=='active'&&V.turn==V.role,win=V.status=='done'?c4line(g):[],o='<div class="c4b'+(my?' my':'')+'">';
   for(var i=0;i<42;i++){var v=g[i],r=(i/7)|0;o+='<i data-i="'+i+'" class="'+(win.indexOf(i)>-1?'kw ':'')+(last===i?'klm':'')+'">'+(v?'<b class="'+(v==1?'r':'y')+'" style="--dr:'+(r+1)+'"></b>':'')+'</i>'}return o+'</div>'}
  function c4line(g){var D=[[0,1],[1,0],[1,1],[1,-1]];for(var r=0;r<6;r++)for(var c=0;c<7;c++){var v=g[r*7+c];if(!v)continue;for(var k=0;k<4;k++){var dr=D[k][0],dc=D[k][1],o=[r*7+c];for(var s=1;s<4;s++){var rr=r+dr*s,cc=c+dc*s;if(rr<0||rr>5||cc<0||cc>6||g[rr*7+cc]!=v)break;o.push(rr*7+cc)}if(o.length==4)return o}}return[]}
  function drop(c){if(busy||!V||V.status!='active'||V.turn!=V.role)return;if(V.legal.indexOf(c)<0)return;var g=V.st.g.slice(),r=-1;for(var k=5;k>=0;k--)if(!g[k*7+c]){r=k;break}if(r<0)return;g[r*7+c]=V.role=='a'?1:2;var saved=V;V=Object.assign({},V,{st:{g:g,last:r*7+c},turn:V.role=='a'?'b':'a',legal:[]});draw();act('bg_move',{id:id,mv:{c:c}},saved)}
 api('bg_state',{id:id}).then(function(r){apply(r);timer=setTimeout(loop,1500)}).catch(function(e){$('#bgv').innerHTML='<small>'+esc(e.message)+'</small>'})}
window.bgBox=box;window.bgPickBet=pickBet;window.bgOpen=function(key,id){nav('games');openGame(key);open(key,id)};
window.bgInvite=function(key,f){(key=='comines'?optPick:function(c){c(0)})(function(opt){pickBet('Ставка',function(b,m){api('bg_invite',{game:key,friend:f,bet:b,opt:opt}).then(function(r){m.remove();window.bgOpen(key,r.bg.id)}).catch(function(e){m.remove();tg.showAlert(e.message)})})})};
G.checkers=make('checkers');G.connect4=make('connect4');G.coblast=make('coblast');G.comines=make('comines');
})();
