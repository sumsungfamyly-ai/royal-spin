(function(){
var H=function(n,c){return '<img class="ic '+(c||'')+'" src="/img/'+n+'.png" alt="" draggable="false">'};
var Z=function(ms){return new Promise(function(z){setTimeout(z,ms)})};
var GEO={"c": [-1.2, 20.2, 41.0, 60.8, 80.1, 99.3, 118.3, 137.8, 158.3, 180.6, 202.4, 222.3, 241.6, 260.5, 279.5, 298.8, 318.2, 338.1], "h": [10.7, 10.8, 10.1, 9.7, 9.7, 9.5, 9.5, 10.0, 10.5, 11.8, 10.1, 9.8, 9.5, 9.4, 9.7, 9.6, 9.9, 10.0]},RED=[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
function toast(t){var d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(function(){d.classList.add('out')},2400);setTimeout(function(){d.remove()},2900)}
DT.durak='🃏 Дурак (онлайн)';
/* ---- плитки: Хай-Лоу с картинкой, Дурак онлайн ---- */
var _rg=renderGames;window.renderGames=function(){_rg();var g=$('#gg');
 $$('#gg .gc').forEach(function(b){if(b.textContent.indexOf('Хай-Лоу')>-1){$('.pic',b).innerHTML='<img class="tpic" src="/img/hilo_t.jpg" alt="">'}});
 var d=document.createElement('button');d.className='gc'+(cfg.games.durak?'':' off');d.innerHTML='<span class="pic">'+H('cards')+'</span>Дурак<small>онлайн с другом</small>';
 d.onclick=function(){if(!cfg.games.durak)return tg.showAlert('Игра временно отключена');toast('Выбери друга и нажми ⚔️, затем «Дурак»');nav('friends')};g.insertBefore(d,g.lastElementChild)};
/* ---- ХАЙ-ЛОУ: твоя картинка сверху ---- */
var _hr=G.hilo.r;G.hilo.r=function(){_hr();var c=$('#gbody .card');var im=document.createElement('img');im.className='hbn';im.src='/img/hilo.jpg';im.alt='';c.insertBefore(im,c.firstChild)};
/* ---- РУЛЕТКА: колесо с твоего фото + красивые ставки ---- */
G.roulette.r=function(){var sel={k:'red'},rot=0,bl=0,names={red:'Красное x2',black:'Чёрное x2',even:'Чёт x2',odd:'Нечет x2',low:'1–18 x2',high:'19–36 x2'};
 var grid='<button class="rg g" data-n="0">0</button>';for(var n=1;n<=36;n++)grid+='<button class="rg '+(RED.indexOf(n)>-1?'r':'k')+'" data-n="'+n+'">'+n+'</button>';
 $('#gbody').innerHTML='<div class="card"><div class="rwx"><img class="rdsc" src="/img/rw_disc.png" alt=""><img class="rfr" src="/img/rw_frame.png" alt=""><div class="rball"><i></i></div></div><div class="rn" id="rn">?</div>'
  +'<div class="rbt"><button class="rb red on" data-k="red">КРАСНОЕ<small>x2</small></button><button class="rb blk" data-k="black">ЧЁРНОЕ<small>x2</small></button></div>'
  +'<div class="rbt2">'+[['even','Чёт'],['odd','Нечет'],['low','1–18'],['high','19–36']].map(function(x){return '<button class="rb2" data-k="'+x[0]+'">'+x[1]+'</button>'}).join('')+'</div>'
  +'<details class="rtab"><summary>Ставка на число · x36</summary><div class="rgrid">'+grid+'</div></details><div class="rsel" id="rs"></div>'+betBox()+'<button class="go" id="go">КРУТИТЬ</button><div class="msg" id="m"></div></div>';
 var show=function(){$$('.rb,.rb2').forEach(function(b){b.classList.toggle('on',sel.k==b.dataset.k)});$$('.rg').forEach(function(b){b.classList.toggle('on',sel.k=='num'&&sel.n==+b.dataset.n)});
  $('#rs').innerHTML='Ставка: <b>'+(sel.k=='num'?'число '+sel.n+' x36':names[sel.k])+'</b>'};show();
 $$('.rb,.rb2').forEach(function(b){b.onclick=function(){sel={k:b.dataset.k};show()}});
 $$('.rg').forEach(function(b){b.onclick=function(){sel={k:'num',n:+b.dataset.n};show()}});
 $('#go').onclick=function(){play(async function(){var b=bet(),el=$('#rn');el.className='rn';el.textContent='?';$('#m').textContent='';
  var r=await api('roulette',{bet:b,kind:sel.k,num:sel.n}),k=r.color=='green'?Math.floor(Math.random()*18):Math.floor(Math.random()*9)*2+(r.color=='red'?0:1);
  var cur=((rot%360)+360)%360,tg_=GEO.c[k]+(Math.random()*2-1)*(GEO.h[k]-4),delta=((-tg_-cur)%360+360)%360;
  rot+=1800+delta;bl=-(Math.ceil((Math.abs(bl)+1500)/360)*360);
  $('.rdsc').style.transform='rotate('+rot+'deg)';$('.rball').style.transform='rotate('+bl+'deg)';await Z(4800);
  el.textContent=r.n;el.className='rn rv '+r.color;res('#m',r.win,b)})}};
/* ---- ДУРАК онлайн ---- */
var SUIT=['♠','♥','♦','♣'],RK=function(r){return r<=10?r:r==11?'J':r==12?'Q':r==13?'K':'A'};
function card(c,cls){var s=Math.floor(c/9),r=c%9+6;return '<div class="dkc'+(s==1||s==2?' rd':'')+(cls?' '+cls:'')+'" data-c="'+c+'"><b>'+RK(r)+'</b><i>'+SUIT[s]+'</i></div>'}
window.openDurak=function(id){window.curDurak=id;openGame('durak')};
G.durak={t:'Дурак',i:'🃏',d:'',r:function(){
 var id=window.curDurak,opp=null,v=null,rev,st,sel=null,prevHand=[],prevT=0,pt,mvBusy=false;
 $('#gbody').innerHTML='<div class="card dk" id="dk"><small>Загрузка…</small></div>';
 var d=document.createElement('details');d.className='how';d.innerHTML='<summary>ℹ️ Как играть</summary><p>Подкидной дурак на 36 картах, играешь с другом на ставку. Атакующий кладёт карту, защитник отбивает старшей картой той же масти или козырем. Можно подкидывать карты того же ранга, что уже на столе. Не можешь или не хочешь отбиваться, нажми «Взять». Когда колода закончилась, первый избавившийся от карт забирает банк. Зелёная подсветка показывает, какими картами можно ходить.</p>';$('#gbody').insertBefore(d,$('#gbody').firstChild);
 var oname=function(){return opp?esc(opp.nick):'Соперник'};
 var send=function(a,extra){return api(a,Object.assign({id:id},extra||{}))};
 var mv=function(m){if(mvBusy)return;mvBusy=true;send('durak_move',{mv:m}).then(function(r){mvBusy=false;sel=null;apply(r.durak)}).catch(function(e){mvBusy=false;toast(e.message)})};
 function status(){if(!v)return '';if(v.status=='pending')return v.role=='b'?'Тебя зовут сыграть в Дурака':'Ждём, когда соперник примет вызов';if(v.status=='done')return '';
  var my=v.turn==v.role,att=v.att==v.role;
  if(my&&att&&!v.table.length)return 'Твой ход: атакуй любой картой';
  if(my&&att&&v.taking)return 'Соперник берёт карты. Подкинь ещё или нажми «Готово»';
  if(my&&att)return 'Отбито! Подкинь карту того же ранга или нажми «Бито»';
  if(my)return sel!==null?'Выбери, какую карту бить':'Отбивайся или возьми карты';
  return 'Ход соперника… '+(v.last?'('+v.last+')':'')}
 function render(){var el=$('#dk');if(!el)return;
  if(v.status=='pending'||(v.status=='done'&&!v.hand)){el.innerHTML='<div class="dkst">'+(v.status=='done'?'Вызов отменён':status())+'</div><div class="dkbt">'+(v.status=='pending'&&v.role=='b'?'<button class="go" id="dka">Принять · '+fmt(v.bet)+' 🪙</button><button class="sm r" id="dkd">Отклонить</button>':v.status=='pending'?'<button class="sm r" id="dkd">Отменить вызов</button>':'')+'</div>';bind();return}
  var h='',isDone=v.status=='done',pot=v.bet*2,paid=pot-Math.floor(pot*cfg.duelFee/100);
  h+='<div class="dkh0"><span class="av">'+(opp?opp.avatar:'😎')+'</span><div class="n"><b>'+oname()+'</b><small>Ур. '+(opp?opp.level:'')+' · банк '+fmt(pot)+' 🪙</small></div><div class="dkdk"><div class="dktr">'+(v.trumpCard!=null?card(v.trumpCard,'sm'):'<span class="dks">'+SUIT[v.trump]+'</span>')+'</div><small>колода '+v.deckN+'</small></div></div>';
  h+='<div class="dko">'+Array.from({length:Math.min(v.oppN,14)}).map(function(){return '<div class="dkb"></div>'}).join('')+'<small>'+v.oppN+' карт</small></div>';
  h+='<div class="dkt" id="dkt">'+(v.table.length?v.table.map(function(pr,i){return '<div class="dkp'+(i>=prevT?' new':'')+(sel!==null&&v.legal.def[sel]&&v.legal.def[sel].indexOf(i)>-1?' tg':'')+'" data-i="'+i+'">'+card(pr[0])+(pr[1]!=null?card(pr[1]):'')+'</div>'}).join(''):'<small class="dkem">Стол пуст</small>')+'</div>';
  h+='<div class="dkst" id="dks">'+status()+'</div>';
  h+='<div class="dkhn'+(v.hand.length>7?' tight':'')+'" id="dkh">'+v.hand.map(function(c){var ok=v.legal.atk.indexOf(c)>-1||!!v.legal.def[c];return card(c,(ok?'ok':'')+(sel===c?' sel':'')+(prevHand.length&&prevHand.indexOf(c)<0?' new':''))}).join('')+'</div>';
  if(!isDone){var my=v.turn==v.role,att=v.att==v.role;
   h+='<div class="dkbt">'+(my&&!att&&v.phase=='defend'?'<button class="sm p" id="dkt1">Взять карты</button>':'')+(my&&att&&v.table.length?'<button class="sm p" id="dkp">'+(v.taking?'Готово':'Бито')+'</button>':'')+'<button class="sm r" id="dkr">Сдаться</button></div>';
   if(!my&&Date.now()-v.mv>120000)h+='<div class="dkbt"><button class="sm" id="dkc">Соперник не ходит: забрать победу</button></div>';
  }else{var w=v.w==v.role,dr=v.w=='draw';
   h+='<div class="msg '+(w?'win':dr?'':'lose')+'" id="dkm">'+(dr?'Ничья, ставки возвращены':w?'Победа! +'+fmt(paid)+' 🪙':'Ты остался дураком, −'+fmt(v.bet)+' 🪙')+'</div><div class="dkbt"><button class="sm p" id="dkre">🔁 Реванш</button><button class="sm" id="dkx">К друзьям</button></div>';
   if(w&&!render.done){render.done=1;boom();snd('win')}else if(!w&&!dr&&!render.done){render.done=1;snd('lose')}}
  el.innerHTML=h;prevHand=v.hand.slice();prevT=v.table.length;bind()}
 function bind(){var q=function(s,f){var e=$(s);if(e)e.onclick=f};
  q('#dka',function(){send('durak_accept').then(function(r){apply(r.durak)}).catch(function(e){toast(e.message)})});
  q('#dkd',function(){send('durak_decline').then(function(r){apply(r.durak)}).catch(function(e){toast(e.message)})});
  q('#dkt1',function(){mv({k:'take'})});q('#dkp',function(){mv({k:'pass'})});
  q('#dkr',function(){tg.showConfirm('Сдаться? Ставка достанется сопернику.',function(ok){if(ok)send('durak_resign').then(function(r){apply(r.durak)}).catch(function(e){toast(e.message)})})});
  q('#dkc',function(){send('durak_claim').then(function(r){apply(r.durak)}).catch(function(e){toast(e.message)})});
  q('#dkx',function(){nav('friends')});
  q('#dkre',function(){api('duel_create',{friend:v.oppId,type:'durak',bet:v.bet}).then(function(r){toast('Реванш предложен');nav('friends')}).catch(function(e){toast(e.message)})});
  $$('#dkh .dkc').forEach(function(c){c.onclick=function(){if(!v||v.status!='active'||v.turn!=v.role)return;var x=+c.dataset.c;
   if(v.att==v.role){if(v.legal.atk.indexOf(x)>-1)mv({k:'attack',c:x});else toast('Этой картой ходить нельзя')}
   else{var ix=v.legal.def[x];if(!ix)return toast('Эта карта не бьёт');if(ix.length==1)mv({k:'defend',c:x,i:ix[0]});else{sel=x;render()}}}});
  $$('#dkt .dkp.tg').forEach(function(p){p.onclick=function(){var c=sel;sel=null;mv({k:'defend',c:c,i:+p.dataset.i})}})}
 function apply(nv){if(!nv)return;if(nv.rev===rev&&nv.status===st&&v)return;v=nv;rev=nv.rev;st=nv.status;render();snd('click')}
 function poll(){clearTimeout(pt);pt=setTimeout(async function(){if(!$('#dk'))return;try{var r=await send('durak_state',{rev:rev,st:st});if(r.durak){if(r.opp)opp=r.opp;apply(r.durak)}}catch(e){}if(!v||v.status!='done')poll()},(v&&v.status=='active'&&v.turn==v.role)?4500:1300);timers.push(pt)}
 send('durak_state').then(function(r){opp=r.opp||null;apply(r.durak);poll()}).catch(function(e){$('#dk').innerHTML='<div class="msg lose">'+esc(e.message)+'</div>'})}};
/* ---- «Друзья»: список игр в Дурака ---- */
var _ds2=drawSocial;window.drawSocial=function(){_ds2();var L=soc.durak||[];var P=Object.fromEntries(soc.people.map(function(p){return [p.id,p]})),nm=function(id){return esc((P[id]&&P[id].nick)||'Игрок')};
 var c=document.createElement('div');c.className='card';
 c.innerHTML='<h3>🃏 Дурак онлайн</h3>'+(L.length?L.map(function(m){var mine=m.a==me.id,op=mine?m.b:m.a,act='';
  if(m.status=='pending')act=mine?'<small>ждём</small> <button class="sm r" data-dd="'+m.id+'">Отмена</button>':'<button class="sm p" data-da="'+m.id+'">Принять</button> <button class="sm r" data-dd="'+m.id+'">✖</button>';
  else if(m.status=='active')act='<button class="sm p" data-do="'+m.id+'">Играть</button>';
  else{var r=m.w=='x'?'отменена':m.w=='draw'?'ничья':((m.w=='a')==mine?'победа':'поражение');act='<b class="'+(r=='победа'?'win':r=='поражение'?'lose':'')+'">'+r+'</b>'}
  return '<div class="row"><div class="n"><b>🃏 '+fmt(m.bet)+' 🪙</b><small>'+(mine?'Ты → ':'')+nm(op)+(mine?'':' → ты')+'</small></div><div>'+act+'</div></div>'}).join(''):'<small>Нажми ⚔️ рядом с другом и выбери «Дурак»</small>');
 var anchor=$('#duel');$('#v-friends').insertBefore(c,anchor?anchor.nextSibling:null);
 var act=function(a,id){api(a,{id:id}).then(function(r){if(a=='durak_accept')openDurak(id);else social()}).catch(function(e){tg.showAlert(e.message)})};
 $$('[data-da]',c).forEach(function(b){b.onclick=function(){act('durak_accept',b.dataset.da)}});$$('[data-dd]',c).forEach(function(b){b.onclick=function(){act('durak_decline',b.dataset.dd)}});$$('[data-do]',c).forEach(function(b){b.onclick=function(){openDurak(b.dataset.do)}})};
if(typeof cfg!=='undefined'&&cfg)renderGames();
})();
