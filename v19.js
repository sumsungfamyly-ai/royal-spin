(function(){
var M=function(){return typeof me!=='undefined'&&me?me:{}};
var GM=[['checkers','♟️','Шашки','дуэль или командой против бота'],['connect4','🔴','Четыре в ряд','дуэль или командой против бота'],['coblast','🧩','Блок Бласт вдвоём','дуэль или командой против бота'],['comines','💣','Мины вдвоём','дуэль или командой против бота'],['durak','🃏','Дурак','дуэль или командой против бота'],['duel','⚔️','Дуэль','кости, карта или КНБ']];
var DT={dice:'🎲 Кости',card:'🃏 Старшая карта',rps:'✊ Камень-ножницы-бумага'},RP={r:'✊',p:'✋',s:'✌️'};
function copy(t){try{navigator.clipboard.writeText(t);return true}catch(e){return false}}
function act(a,d){return api(a,d).then(function(r){if(r.msg)tg.showAlert(r.msg);social();return r}).catch(function(e){tg.showAlert(e.message)})}
/* ---- меню «Добавить друга» ---- */
function addSheet(){bgBox('<h3>Добавить друга</h3><div class="myid">Твой ID<br><b>'+M().id+'</b></div><div class="bi"><input id="fid" inputmode="numeric" placeholder="ID друга"><button class="p" id="fadd2">Добавить</button></div><button id="fcp">📋 Скопировать мой ID</button>',function(m){
 m.querySelector('#fadd2').onclick=function(){var v=m.querySelector('#fid').value;if(!v)return;m.remove();act('friend_add',{id:v})};
 m.querySelector('#fcp').onclick=function(){var ok=copy(String(M().id));m.remove();tg.showAlert(ok?'ID скопирован. Отправь его другу, он вводит его у себя в «Добавить».':'Твой ID: '+M().id)}})}
/* ---- меню «Играть» ---- */
function playSheet(f){var P=window.__P||{},n=(P[f]&&P[f].nick)||'друг',list=GM.filter(function(g){return cfg.games[g[0]]!==false});
 bgBox('<h3>Играть с '+esc(n)+'</h3>'+list.map(function(g){return'<button data-g="'+g[0]+'">'+g[1]+' '+g[2]+'<span class="sm2">'+g[3]+'</span></button>'}).join(''),function(m){m.querySelectorAll('[data-g]').forEach(function(b){b.onclick=function(){var k=b.dataset.g;m.remove();
  if(k=='durak')bgModePick(function(mode){bgPickBet('Ставка каждого игрока',function(bt,mm){api('duel_create',{friend:f,type:'durak',bet:bt,mode:mode}).then(function(r){mm.remove();tg.showAlert(r.msg||'Вызов отправлен');social()}).catch(function(e){mm.remove();tg.showAlert(e.message)})})});
  else if(k=='duel')bgBox('<h3>Во что сыграть?</h3>'+Object.keys(DT).map(function(t){return'<button data-t2="'+t+'">'+DT[t]+'</button>'}).join(''),function(m2){m2.querySelectorAll('[data-t2]').forEach(function(bb){bb.onclick=function(){var t=bb.dataset.t2;m2.remove();bgModePick(function(mode){bgPickBet('Ставка каждого игрока',function(bt,mm){api('duel_create',{friend:f,type:t,bet:bt,mode:mode}).then(function(r){mm.remove();tg.showAlert(r.msg||'Вызов отправлен');social()}).catch(function(e){mm.remove();tg.showAlert(e.message)})})})}})});
  else bgModePick(function(mode){bgInvite(k,f,mode)})}})})}
function moreSheet(f){var P=window.__P||{},n=(P[f]&&P[f].nick)||'Друг';bgBox('<h3>'+esc(n)+'</h3><button class="p" id="mp">Играть</button><button class="dng" id="mr">Удалить из друзей</button>',function(m){
 m.querySelector('#mp').onclick=function(){m.remove();playSheet(f)};
 m.querySelector('#mr').onclick=function(){m.remove();tg.showConfirm('Удалить '+n+' из друзей?',function(ok){if(ok)act('friend_remove',{id:f})})}})}
/* ---- вкладка ---- */
window.drawSocial=function(){
 var P={};soc.people.forEach(function(p){P[p.id]=p});window.__P=P;
 var liveRps=(soc.matches||[]).find(function(m){return m.type=='rps'&&m.status=='active'});
 if(window.__rpsMatchId&&(!liveRps||window.__rpsMatchId!=='duel-'+liveRps.id)){setMatchLive(window.__rpsMatchId,false);window.__rpsMatchId=null}
 if(liveRps){window.__rpsMatchId='duel-'+liveRps.id;setMatchLive(window.__rpsMatchId,true)}
 var nm=function(id){return id==me.id?'Ты':id=='bot'?'🤖 Бот':esc((P[id]&&P[id].nick)||'Игрок')};
 var fr=soc.friends.map(function(id){return P[id]}).filter(Boolean).sort(function(a,b){return (b.online?1:0)-(a.online?1:0)});
 var link=cfg.bot?'https://t.me/'+cfg.bot+'?start=ref_'+me.id:'';
 var h='<div class="fhd"><div><h2>Друзья</h2><small>Играй вместе и соревнуйся</small></div><button class="fadd" id="fadd">＋ Добавить</button></div>';
 if(soc.requests.length)h+='<div class="fcard freq"><h3>Заявки в друзья</h3>'+soc.requests.map(function(id){return'<div class="ffr"><span class="fav">'+((P[id]&&P[id].avatar)||'😎')+'</span><div class="fn"><b>'+nm(id)+'</b><small>хочет дружить</small></div><button class="ok" data-fa="'+id+'">Принять</button><button class="no" data-fd="'+id+'">✕</button></div>'}).join('')+'</div>';
 h+='<div class="fcard">'+(fr.length?'<h3>Мои друзья · '+fr.length+'</h3>'+fr.map(function(f){return'<div class="ffr"><span class="fav">'+esc(f.avatar||'😎')+'<i class="'+(f.online?'on':'')+'"></i></span><div class="fn"><b>'+esc(f.nick)+'</b><small>Ур. '+f.level+' · '+(f.online?'в сети':'не в сети')+'</small></div><button class="fplay" data-pl="'+f.id+'">Играть</button><button class="fmore" data-mo="'+f.id+'" aria-label="Ещё">⋯</button></div>'}).join(''):'<div class="femp"><span>👋</span><p>Пока здесь пусто. Добавь друга по ID или пригласи по ссылке, вы оба получите бонус.</p><button class="fadd" id="fadd3">＋ Добавить друга</button></div>')+'</div>';
 h+='<div class="fcard"><div class="fref"><span>🎁</span><div><b>Пригласи друга</b><small>Вы оба получите по '+fmt(cfg.refBonus)+' 🪙. Приглашено: '+(me.refs||0)+'</small></div>'+(link?'<button id="fsh">Ссылка</button>':'')+'</div></div>';
 h+='<div class="fcard"><h3>Партии</h3><div id="fgm"><small>Загрузка…</small></div></div>';
 $('#v-friends').innerHTML=h;
 var q=function(s){return $(s)};q('#fadd').onclick=addSheet;if(q('#fadd3'))q('#fadd3').onclick=addSheet;
 if(q('#fsh'))q('#fsh').onclick=function(){var u='https://t.me/share/url?url='+encodeURIComponent(link)+'&text='+encodeURIComponent('Играй со мной в Royal Spin! Бонус нам обоим 🎁');try{tg.openTelegramLink(u)}catch(e){window.open(u)}};
 $$('[data-fa]').forEach(function(b){b.onclick=function(){act('friend_accept',{id:b.dataset.fa})}});$$('[data-fd]').forEach(function(b){b.onclick=function(){act('friend_decline',{id:b.dataset.fd})}});
 $$('[data-pl]').forEach(function(b){b.onclick=function(){playSheet(b.dataset.pl)}});$$('[data-mo]').forEach(function(b){b.onclick=function(){moreSheet(b.dataset.mo)}});
 /* партии: дураки, дуэли, настолки */
 var rows=[],bd=function(t,c){return'<span class="bdg'+(c?' my':'')+'">'+t+'</span>'};
 (soc.durak||[]).filter(function(m){return m.status!='done'||m.w}).slice(0,6).forEach(function(m){var mine=m.mode=='coop'||m.a==me.id,creator=m.a==me.id,op=m.mode=='coop'?(creator?m.partner:m.a):mine?m.b:m.a,right='';
  if(m.status=='pending')right=creator?'<button class="g" data-dd="'+m.id+'">Отмена</button>':'<button data-da="'+m.id+'">Принять</button><button class="g" data-dd="'+m.id+'">✕</button>';
  else if(m.status=='active')right='<button data-do="'+m.id+'">Играть</button>';
  else{var r=m.w=='x'?'Отменена':m.w=='draw'?'Ничья':m.w=='coop'?'Командная победа':m.w=='loss'?'Командное поражение':((m.w=='a')==mine?'Победа':'Поражение');right='<b class="'+(r.indexOf('Побед')>-1?'win':r.indexOf('Пораж')>-1?'lose':'')+'">'+r+'</b>'}
  rows.push('<div class="fgr"><span>🃏</span><div><b>'+(m.mode=='coop'?'Дурак · команда':'Дурак')+'</b><small>'+nm(op)+(m.mode=='coop'?' · против бота':'')+' · '+fmt(m.bet)+' 🪙</small></div>'+right+'</div>')});
 soc.matches.slice(0,6).forEach(function(m){var mineA=m.a==me.id,coop=m.mode=='coop',op=coop?(mineA?m.partner:m.a):mineA?m.b:m.a,right='';
  if(m.status=='pending')right=mineA?'<button class="g" data-dd2="'+m.id+'">Отмена</button>':'<button data-da2="'+m.id+'">Принять</button><button class="g" data-dd2="'+m.id+'">✕</button>';
  else if(m.status=='active'){var role=coop?(mineA?'a':'p'):mineA?'a':'b';right=m.moves[role]?bd('ждём'):['r','p','s'].map(function(x){return'<button class="g" data-mv="'+m.id+':'+x+'">'+RP[x]+'</button>'}).join('');right+='<button class="g" data-rs="'+m.id+'">Сдаться</button>'}
  else if(m.w=='x')right=bd('Отменена');
  else{var role=coop?'coop':mineA?'a':'b',w=m.w,label=coop?(w=='coop'?'Командная победа':w=='draw'?'Ничья':'Командное поражение'):!w?'Ничья':w==role?'Победа':'Поражение';right='<b class="'+(label.indexOf('Побед')>-1?'win':label.indexOf('Пораж')>-1?'lose':'')+'">'+label+'</b>'}
  rows.push('<div class="fgr"><span>⚔️</span><div><b>'+(DT[m.type]||'Дуэль')+(coop?' · команда':'')+'</b><small>'+nm(op)+(coop?' · против бота':'')+' · '+fmt(m.bet)+' 🪙</small></div>'+right+'</div>')});
 var box=$('#fgm');
 function paint(bg){var all=bg.concat(rows);box.innerHTML=all.length?all.join(''):'<small>Здесь появятся твои партии. Нажми «Играть» рядом с другом.</small>';
  $$('[data-da]',box).forEach(function(b){b.onclick=function(){api('durak_accept',{id:b.dataset.da}).then(function(){openDurak(b.dataset.da)}).catch(function(e){tg.showAlert(e.message)})}});
  $$('[data-dd]',box).forEach(function(b){b.onclick=function(){act('durak_decline',{id:b.dataset.dd})}});$$('[data-do]',box).forEach(function(b){b.onclick=function(){openDurak(b.dataset.do)}});
  $$('[data-da2]',box).forEach(function(b){b.onclick=function(){act('duel_accept',{id:b.dataset.da2})}});$$('[data-dd2]',box).forEach(function(b){b.onclick=function(){act('duel_decline',{id:b.dataset.dd2})}});
  $$('[data-mv]',box).forEach(function(b){b.onclick=function(){var s=b.dataset.mv.split(':');act('duel_move',{id:s[0],move:s[1]})}});
  $$('[data-rs]',box).forEach(function(b){b.onclick=function(){tg.showConfirm('Сдаться? Ставка будет потеряна.',function(ok){if(ok)act('duel_resign',{id:b.dataset.rs})})}});
  $$('[data-bgo]',box).forEach(function(b){b.onclick=function(){bgOpen(b.dataset.k,b.dataset.bgo)}})}
 paint([]);
 api('bg_list').then(function(r){var NAMES={checkers:['♟️','Шашки'],connect4:['🔴','Четыре в ряд'],coblast:['🧩','Блок Бласт вдвоём'],comines:['💣','Мины вдвоём']};
  var bg=r.list.filter(function(x){return x.status!='done'||Date.now()>0}).slice(0,8).map(function(x){var N=NAMES[x.game]||['🎮',x.game],st=x.status=='pending'?(x.role=='b'?'Приглашение':'Ждёт ответа'):x.status=='active'?(x.turn==x.role?'Твой ход':'Ход соперника'):(x.w=='coop'?'Командная победа':x.w=='loss'?'Команда проиграла':x.w=='draw'?'Ничья':x.w=='x'?'Отменена':x.w==x.role?'Победа':'Поражение');
   return'<div class="fgr"><span>'+N[0]+'</span><div><b>'+N[1]+'</b><small>'+esc((x.opp&&x.opp.nick)||'Игрок')+' · '+fmt(x.bet)+' 🪙</small></div><button class="'+(st=='Твой ход'||st=='Приглашение'?'':'g')+'" data-k="'+x.game+'" data-bgo="'+x.id+'">'+st+'</button></div>'});
  if($('#fgm'))paint(bg.filter(function(s,i){return i<8}))}).catch(function(){})};
/* ---- админка внутри приложения ---- */
function openAdmin(){if($('#adm'))return;var o=document.createElement('div');o.id='adm';o.innerHTML='<div class="admb"><b>🛠 Админ-панель</b><button id="admx">✕ Закрыть</button></div><iframe src="/admin?tg=1"></iframe>';document.body.appendChild(o);$('#admx').onclick=function(){o.remove()}}
var v=$('#v-me');new MutationObserver(function(){if(!$('#admc')&&v.children.length&&M().admin){var d=document.createElement('div');d.className='card';d.id='admc';d.innerHTML='<span>🛠</span><div><b>Админ-панель</b><small>Статистика, игроки, настройки игр</small></div><span>›</span>';d.onclick=openAdmin;v.appendChild(d)}}).observe(v,{childList:true});
/* ---- Плинко: ровная сетка в пикселях ---- */
var PL=function(r,e){var k={low:[6,2.5],mid:[40,3],high:[260,3.6]}[r],P=[1,12,66,220,495,792,924,792,495,220,66,12,1].map(function(x){return x/4096}),w=P.map(function(_,i){return .3+k[0]*Math.pow(Math.abs(i-6)/6,k[1])}),t=w.reduce(function(s,x,i){return s+x*P[i]},0);return w.map(function(x){return Math.floor(x/t*(1-e/100)*100)/100})};
var fm=function(x){return x>=100?String(Math.round(x)):x>=10?x.toFixed(0):x>=1?x.toFixed(1):x.toFixed(2)};
G.plinko={t:'Плинко',i:'🔮',d:'до x260',r:function(){var risk='mid';
 $('#gbody').innerHTML='<div class="card"><div class="plw"><div class="plb" id="plb"><span class="plm">▼</span></div><div class="pls" id="pls"></div></div><div class="opt" id="rk"><button data-r="low">Низкий</button><button data-r="mid" class="on">Средний</button><button data-r="high">Высокий</button></div>'+betBox()+'<button class="go" id="go">БРОСИТЬ ШАР</button><div class="msg" id="m"></div></div>';
 var board=$('#plb'),W=Math.min(board.clientWidth||340,440),sp=Math.floor(W/14.4),top=30,H=Math.round(W*.98),rowH=(H-top-20)/12,pg=[];
 board.style.height=H+'px';board.style.width=W+'px';
 for(var r=0;r<12;r++){pg[r]=[];for(var j=0;j<r+3;j++){var p=document.createElement('i');p.style.left=(W/2+(j-(r+2)/2)*sp)+'px';p.style.top=(top+r*rowH)+'px';board.appendChild(p);pg[r][j]=p}}
 var sl=$('#pls');sl.style.width=(13*sp)+'px';
 function slots(){var m=PL(risk,cfg.edge);sl.style.gridTemplateColumns='repeat(13,'+sp+'px)';sl.innerHTML=m.map(function(x){return'<b class="'+(x>=50?'x':x>=10?'h':x>=2?'m':x>=1?'l':'n')+'">'+fm(x)+'</b>'}).join('')}slots();
 sel('#rk',function(b){risk=b.dataset.r;slots()});
 $('#go').onclick=function(){run(async function(){var b=bet();$('#m').textContent='';$$('#pls b').forEach(function(x){x.classList.remove('hit')});$$('#plb u').forEach(function(x){x.remove()});
  try{var r=await api('plinko',{bet:b,risk:risk}),ball=document.createElement('u'),k=0;ball.style.left=(W/2)+'px';ball.style.top='12px';board.appendChild(ball);await sleep(80);
   for(var i=0;i<12;i++){var peg=pg[i][k+1];if(peg){ball.style.left=peg.style.left;ball.style.top=peg.style.top;await sleep(95);peg.classList.add('hit')}k+=r.path[i];ball.style.left=(W/2+(k-(i+1)/2)*sp)+'px';ball.style.top=(top+i*rowH+rowH*.5)+'px';await sleep(120)}
   var target=$$('#pls b')[r.slot],br=board.getBoundingClientRect(),tr=target.getBoundingClientRect();ball.style.left=(tr.left+tr.width/2-br.left)+'px';ball.style.top=(H-10)+'px';await sleep(260);target.classList.add('hit');res('#m',r.win,b)}catch(e){fail('#m',e)}})}}};
})();
