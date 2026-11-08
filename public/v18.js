(function(){
var M=function(){return typeof me!=='undefined'&&me?me:{}};
var INFO={checkers:{t:'Шашки',i:'♟️',how:'Русские шашки. Фигуры ходят по диагонали вперёд, бить можно вперёд и назад, бить обязательно. Дойдёшь до последней линии, станешь дамкой: она ходит и бьёт на любое расстояние. Побеждает тот, кто съел или запер все фигуры соперника. Победа забирает банк, комиссия идёт казино.'},connect4:{t:'Четыре в ряд',i:'🔴',how:'Сбрасывай фишки по очереди в колонки. Кто первым выстроит четыре своих фишки в ряд по горизонтали, вертикали или диагонали, тот забирает банк. Если поле заполнено, ничья и ставки возвращаются.'}};
try{HOW.checkers=INFO.checkers.how;HOW.connect4=INFO.connect4.how}catch(e){}
function box(h,f){var m=document.getElementById('dkm');if(m)m.remove();m=document.createElement('div');m.id='dkm';m.innerHTML='<div>'+h+'</div>';m.onclick=function(e){if(e.target==m)m.remove()};document.body.appendChild(m);f&&f(m)}
function bets(){return[cfg.minBet,Math.min(cfg.maxBet,Math.max(cfg.minBet,100)),Math.min(cfg.maxBet,Math.max(cfg.minBet,500)),Math.min(cfg.maxBet,Math.max(cfg.minBet,2000))].filter(function(x,i,a){return a.indexOf(x)==i})}
function pickBet(title,cb){box('<h3>'+title+'</h3>'+bets().map(function(x){return'<button data-b="'+x+'">'+fmt(x)+' 🪙</button>'}).join(''),function(m){m.querySelectorAll('[data-b]').forEach(function(b){b.onclick=function(){b.disabled=true;cb(+b.dataset.b,m)}})})}
function friendPick(cb){api('social').then(function(r){var fs=(r.friends||[]).map(String),list=(r.people||[]).filter(function(p){return fs.indexOf(String(p.id))>-1});
 if(!list.length)return tg.showAlert('Сначала добавь друзей во вкладке «Друзья»');
 box('<h3>Выбери друга</h3>'+list.map(function(p){return'<button data-f="'+p.id+'">'+esc(p.avatar||'👤')+' '+esc(p.nick||p.name||'Игрок')+'</button>'}).join(''),function(m){m.querySelectorAll('[data-f]').forEach(function(b){b.onclick=function(){m.remove();cb(b.dataset.f)}})})}).catch(function(e){tg.showAlert(e.message)})}
var timer=null;function stop(){clearInterval(timer);timer=null}
function make(key){var I=INFO[key];return{t:I.t,i:I.i,d:'онлайн и с ботом',r:function(){stop();lobby(key)}}}
function lobby(key){var I=INFO[key];
 $('#gbody').innerHTML='<div class="card bgl"><div class="bgh"><span class="bgi">'+I.i+'</span><b>'+I.t+'</b></div><button class="go" id="bgb">🤖 Играть с ботом</button><button class="go sec2" id="bgf">👥 Играть с другом</button><h4>Мои партии</h4><div id="bgls"><small>Загрузка…</small></div></div>';
 $('#bgb').onclick=function(){pickBet('Ставка против бота',function(b,m){api('bg_bot',{game:key,bet:b}).then(function(r){m.remove();open(key,r.bg.id)}).catch(function(e){m.remove();tg.showAlert(e.message)})})};
 $('#bgf').onclick=function(){friendPick(function(f){pickBet('Ставка',function(b,m){api('bg_invite',{game:key,friend:f,bet:b}).then(function(r){m.remove();open(key,r.bg.id)}).catch(function(e){m.remove();tg.showAlert(e.message)})})})};
 function load(){api('bg_list').then(function(r){var el=$('#bgls');if(!el)return;var ls=r.list.filter(function(x){return x.game==key});
  el.innerHTML=ls.length?ls.map(function(x){var st=x.status=='pending'?(x.role=='b'?'inv':'wait'):x.status=='active'?(x.turn==x.role?'my':'opp'):'done',lb={inv:'Приглашение',wait:'Ждёт ответа',my:'Твой ход',opp:'Ход соперника',done:x.w=='draw'?'Ничья':x.w=='x'?'Отменена':x.w==x.role?'Победа':'Поражение'}[st];
   return'<div class="bgr" data-o="'+x.id+'"><span class="av">'+esc(x.opp.avatar||'👤')+'</span><div><b>'+esc(x.opp.nick||'Игрок')+'</b><small>Ставка '+fmt(x.bet)+' 🪙</small></div>'+(st=='inv'?'<button class="ok" data-a="'+x.id+'">Принять</button><button class="no" data-d="'+x.id+'">✕</button>':'<span class="bd'+(st=='my'?' my':'')+'">'+lb+'</span>')+'</div>'}).join(''):'<small>Пока нет партий. Сыграй с ботом или позови друга.</small>';
  el.querySelectorAll('[data-o]').forEach(function(x){x.onclick=function(){open(key,x.dataset.o)}});
  el.querySelectorAll('[data-a]').forEach(function(x){x.onclick=function(e){e.stopPropagation();api('bg_accept',{id:x.dataset.a}).then(function(){open(key,x.dataset.a)}).catch(function(er){tg.showAlert(er.message)})}});
  el.querySelectorAll('[data-d]').forEach(function(x){x.onclick=function(e){e.stopPropagation();api('bg_decline',{id:x.dataset.d}).then(load).catch(function(er){tg.showAlert(er.message)})}})}).catch(function(){})}
 load();timer=setInterval(function(){if(!$('#bgls'))return stop();load()},6000)}
/* ---- партия ---- */
function open(key,id){stop();var V=null,O=null,sel=null,busy=false,fxd=false;
 $('#gbody').innerHTML='<div class="card" id="bgv"><small>Загрузка…</small></div>';
 function apply(r){var ch=!V||r.bg.rev!=V.rev||r.bg.status!=V.status;V=r.bg;if(r.opp)O=r.opp;if(ch){sel=null;draw()}}
 function pull(){if(!$('#bgv'))return stop();if(busy)return;api('bg_state',{id:id}).then(apply).catch(function(){})}
 function size(){return Math.floor(Math.min(innerWidth-48,440,innerHeight*.55))}
 function draw(){var el=$('#bgv');if(!el)return;var my=V.status=='active'&&V.turn==V.role,done=V.status=='done',pend=V.status=='pending',oppN=O?(O.nick||'Игрок'):'Соперник',pot=V.bet*2;
  var st=pend?(V.role=='a'?'Ждём ответа соперника…':'Тебя приглашают в партию'):done?(V.w=='draw'?'Ничья, ставки возвращены':V.w=='x'?'Партия отменена':V.w==V.role?'Ты победил!':'Ты проиграл'):my?(key=='checkers'&&V.legal[0]&&V.legal[0].c.length?'Твой ход. Бить обязательно!':'Твой ход'):'Ход соперника…';
  var h='<div class="bgm"><span class="av">'+esc((O&&O.avatar)||'👤')+'</span><div><b>'+esc(oppN)+'</b><small>Ставка '+fmt(V.bet)+' · банк '+fmt(pot)+' 🪙</small></div></div><div class="bgst'+(my?' my':'')+'">'+st+'</div>';
  if(!pend)h+=key=='checkers'?ckHtml():c4Html();
  if(key=='connect4'&&!pend&&!done)h+='<div class="c4hint">Ты играешь '+(V.role=='a'?'красными 🔴':'жёлтыми 🟡')+'</div>';
  h+='<div class="bgact">';
  if(pend&&V.role=='b')h+='<button class="ok" id="bga" style="background:#2ee08a;color:#07210f;border:0">Принять</button><button id="bgd">Отклонить</button>';
  else if(pend)h+='<button class="dng" id="bgr">Отменить</button>';
  else if(!done){h+='<button class="dng" id="bgr">Сдаться</button>';if(!my&&V.oppId!='bot'&&Date.now()-V.mv>6e5)h+='<button id="bgc">Забрать победу</button>'}
  else h+='<button id="bgn">Новая партия</button>';
  h+='<button id="bgx">К списку</button></div>';el.innerHTML=h;fit();bind();
  if(done&&!fxd){fxd=true;var win=V.w==V.role,paid=Math.floor(pot*(1-(cfg.duelFee||0)/100));if(window.fx){if(win)fx.win({kind:key=='checkers'?'dk':'bb',title:'Победа!',sub:'+'+fmt(paid)+' 🪙'});else if(V.w!='draw'&&V.w!='x')fx.lose({kind:'gen',title:'Поражение',sub:'−'+fmt(V.bet)+' 🪙'})}}}
  function fit(){var b=$('.ckb,.c4b');if(b){var s=size();b.style.width=s+'px';b.style.height=(key=='checkers'?s:Math.round(s*6/7))+'px'}}
  function act(a,p){busy=true;return api(a,p).then(function(r){busy=false;apply(r);if(!r.opp&&O==null)pull()}).catch(function(e){busy=false;tg.showAlert(e.message);pull()})}
  function bind(){var q=function(s){return $(s)};
   q('#bga')&&(q('#bga').onclick=function(){act('bg_accept',{id:id})});q('#bgd')&&(q('#bgd').onclick=function(){api('bg_decline',{id:id}).then(function(){G[key].r()})});
   q('#bgr')&&(q('#bgr').onclick=function(){var f=function(ok){if(ok)act('bg_resign',{id:id})};tg.showConfirm(V.status=='pending'?'Отменить приглашение?':'Сдаться? Ставка достанется сопернику.',f)});
   q('#bgc')&&(q('#bgc').onclick=function(){act('bg_claim',{id:id})});q('#bgn')&&(q('#bgn').onclick=function(){G[key].r()});q('#bgx').onclick=function(){G[key].r()};
   if(key=='checkers')$$('.ckb i').forEach(function(c){c.onclick=function(){cell(+c.dataset.i)}});else $$('.c4b i').forEach(function(c){c.onclick=function(){drop(+c.dataset.i%7)}})}
  /* шашки */
  function ckHtml(){var flip=V.role=='b',bd=V.st.bd,my=V.status=='active'&&V.turn==V.role,L=V.legal||[],last=V.st.last||[],o='<div class="ckb'+(my?' my':'')+'">';
   for(var vi=0;vi<64;vi++){var i=flip?63-vi:vi,r=(i/8)|0,c=i%8,d=(r+c)%2==1,pc=bd[i],cl=(d?'d':'')+(last.indexOf(i)>-1?' lm':'')+(my&&sel===i?' sl':'');
    if(my&&sel!==null&&L.some(function(m){return m.p[0]==sel&&m.p[m.p.length-1]==i}))cl+=' tg';else if(my&&sel===null&&L.some(function(m){return m.p[0]==i}))cl+=' sc';
    o+='<i class="'+cl+'" data-i="'+i+'">'+(pc?'<b class="pc '+(pc<=2?'pa':'pb')+(pc%2==0?' k':'')+'"></b>':'')+'</i>'}return o+'</div>'}
  function cell(i){if(busy||!V||V.status!='active'||V.turn!=V.role)return;var L=V.legal;
   if(sel!==null){var k=-1;L.forEach(function(m,j){if(k<0&&m.p[0]==sel&&m.p[m.p.length-1]==i)k=j});if(k>-1){act('bg_move',{id:id,mv:{i:k}});sel=null;return}}
   sel=L.some(function(m){return m.p[0]==i})?i:null;draw()}
  /* четыре в ряд */
  function c4Html(){var g=V.st.g,last=V.st.last,my=V.status=='active'&&V.turn==V.role,win=V.status=='done'?c4line(g):[],o='<div class="c4b'+(my?' my':'')+'">';
   for(var i=0;i<42;i++){var v=g[i],r=(i/7)|0;o+='<i data-i="'+i+'" class="'+(win.indexOf(i)>-1?'w ':'')+(last===i?'lm':'')+'">'+(v?'<b class="'+(v==1?'r':'y')+'" style="--dr:'+(r+1)+'"></b>':'')+'</i>'}return o+'</div>'}
  function c4line(g){var D=[[0,1],[1,0],[1,1],[1,-1]];for(var r=0;r<6;r++)for(var c=0;c<7;c++){var v=g[r*7+c];if(!v)continue;for(var k=0;k<4;k++){var dr=D[k][0],dc=D[k][1],o=[r*7+c];for(var s=1;s<4;s++){var rr=r+dr*s,cc=c+dc*s;if(rr<0||rr>5||cc<0||cc>6||g[rr*7+cc]!=v)break;o.push(rr*7+cc)}if(o.length==4)return o}}return[]}
  function drop(c){if(busy||!V||V.status!='active'||V.turn!=V.role)return;if(V.legal.indexOf(c)<0)return;act('bg_move',{id:id,mv:{c:c}})}
 api('bg_state',{id:id}).then(function(r){apply(r);timer=setInterval(function(){if(!V||V.status=='done'&&timer)return;if(V.status=='done')return stop();pull()},2500)}).catch(function(e){$('#bgv').innerHTML='<small>'+esc(e.message)+'</small>'})}
G.checkers=make('checkers');G.connect4=make('connect4');
})();
