(function(){
var Z=function(ms){return new Promise(function(z){setTimeout(z,ms)})};
var GN={slots:'🎰 Слоты',flip:'🪙 Монетка',dice:'🎲 Кости',roulette:'🎡 Рулетка',crash:'🚀 Краш',mines:'💣 Мины',blackjack:'🃏 Блэкджек',rps:'✊ КНБ',hilo:'🔺 Хай-Лоу',duel:'⚔️ Дуэль'};
/* ---- звуки ---- */
var sndOn=true;try{sndOn=localStorage.getItem('snd')!=='0'}catch(e){}
var AC;function tone(f,d,t,v){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();var o=AC.createOscillator(),g=AC.createGain(),n=AC.currentTime;o.type=t||'sine';o.frequency.value=f;o.connect(g);g.connect(AC.destination);g.gain.setValueAtTime(v||.08,n);g.gain.exponentialRampToValueAtTime(.0001,n+d);o.start(n);o.stop(n+d)}catch(e){}}
window.snd=function(k){if(!sndOn)return;if(k=='win'){[523,659,784,1047].forEach(function(f,i){setTimeout(function(){tone(f,.25,'triangle',.1)},i*110)})}else if(k=='lose'){tone(220,.35,'sawtooth',.05);setTimeout(function(){tone(165,.45,'sawtooth',.05)},180)}else if(k=='click')tone(620,.04,'square',.03)};
document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('.go,.gc,.chips button,.opt button,nav button,.mt'))snd('click')});
var _res=res;window.res=function(a,b,c){_res(a,b,c);snd(b?'win':'lose')};
function toast(t){var d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(function(){d.classList.add('out')},2400);setTimeout(function(){d.remove()},2900)}
var _sm=setMe;window.setMe=function(m){_sm(m);if(m.lvlUp){toast('🎉 Уровень '+m.lvlUp+'! Бонус +'+(100*m.lvlUp)+' 🪙');boom();snd('win')}};
/* ---- шапка и навигация ---- */
var hq=document.createElement('button');hq.className='hq';hq.textContent='?';hq.onclick=function(){nav('faq')};$('.top').insertBefore(hq,$('#bal'));
var nb=document.createElement('button');nb.dataset.v='bonus';nb.innerHTML='<span>🎁</span>Бонусы';nb.onclick=function(){nav('bonus')};var nv=$('nav');nv.insertBefore(nb,nv.children[1]);
['bonus','faq'].forEach(function(id){var s=document.createElement('section');s.id='v-'+id;s.hidden=true;$('main').appendChild(s)});
var _nav=nav;window.nav=function(v){_nav(v);if(v=='bonus')renderBonus();if(v=='faq')renderFaq()};
/* ---- БОНУСЫ: серия, задания, достижения ---- */
function row(t,d,have,n,r,claimed,k,id){var pc=Math.round(have/n*100),ok=have>=n;
 return '<div class="qr"><div class="t"><div><b>'+t+'</b>'+(d?'<small>'+d+'</small>':'')+'</div>'+(claimed?'<small>✓ получено</small>':ok?'<button class="sm p" data-k="'+k+'" data-id="'+id+'">+'+fmt(r)+' 🪙</button>':'<small>🎁 '+fmt(r)+'</small>')+'</div><div class="bar"><i style="width:'+pc+'%"></i></div><small>'+fmt(have)+' / '+fmt(n)+'</small></div>'}
async function renderBonus(){var el=$('#v-bonus');el.innerHTML='<div class="card"><small>Загрузка…</small></div>';var r;
 try{r=await api('bonus_info')}catch(e){el.innerHTML='<div class="card"><div class="msg lose">'+esc(e.message)+'</div></div>';return}
 var B=r.bonus,cur=B.streak,done=B.can?cur%7:((cur-1)%7)+1;
 var cells=B.mults.map(function(m,i){return '<div class="stc'+(i<done?' d':'')+(B.can&&i==done?' n':'')+'"><b>'+(i+1)+'</b>'+fmt(Math.round(B.base*m))+'</div>'}).join('');
 el.innerHTML='<div class="card"><h3>🔥 Серия входов: '+cur+' дн.</h3><div class="stk">'+cells+'</div><button class="go" id="cl"'+(B.can?'':' disabled')+'>'+(B.can?'Забрать бонус':'Приходи завтра, награда больше')+'</button></div>'
  +'<div class="card"><h3>📋 Задания на сегодня</h3>'+r.quests.map(function(q){return row(q.t,'',q.have,q.n,q.r,q.claimed,'q',q.id)}).join('')+'</div>'
  +'<div class="card"><h3>🏅 Достижения</h3>'+r.ach.map(function(a){return row(a.t,a.d,a.have,a.n,a.r,a.claimed,'a',a.id)}).join('')+'</div>';
 $('#cl').onclick=function(){this.disabled=true;claim('bonus')};
 $$('#v-bonus .sm[data-k]').forEach(function(b){b.onclick=function(){b.disabled=true;claim(b.dataset.k=='q'?'quest_claim':'ach_claim',{id:b.dataset.id})}})}
var cbusy=false;function claim(a,d){if(cbusy)return;cbusy=true;api(a,d).then(function(x){cbusy=false;toast(x.msg);boom();snd('win');renderBonus()}).catch(function(e){cbusy=false;tg.showAlert(e.message);renderBonus()})}
$('#bonus').onclick=function(){nav('bonus')};
/* ---- FAQ ---- */
function renderFaq(){var F=cfg.faq||[];
 $('#v-faq').innerHTML='<button class="back" id="fb">← Назад</button><div class="card"><h3>❓ Вопросы и ответы</h3><input id="fq" placeholder="Поиск по вопросам" style="margin-bottom:10px">'+F.map(function(x){return '<details class="fa"><summary>'+esc(x.q)+'</summary><p>'+esc(x.a)+'</p></details>'}).join('')+'<div class="msg" id="fe"></div></div>';
 $('#fb').onclick=function(){nav('games')};
 $('#fq').oninput=function(){var q=this.value.toLowerCase(),n=0;$$('.fa').forEach(function(d){var ok=d.textContent.toLowerCase().indexOf(q)>-1;d.style.display=ok?'':'none';if(ok)n++});$('#fe').textContent=n?'':'Ничего не найдено'}}
/* ---- рейтинги с вкладками ---- */
var topBy='balance';
window.loadTop=async function(){var r=await api('top',{by:topBy}),lab={balance:'🪙 Баланс',xp:'⭐ Уровень',biggest:'💎 Рекорд'};
 $('#v-top').innerHTML='<div class="card"><div class="opt" id="tt">'+Object.keys(lab).map(function(k){return '<button data-b="'+k+'"'+(k==topBy?' class="on"':'')+'>'+lab[k]+'</button>'}).join('')+'</div>'+r.top.map(function(u,i){return '<div class="row"><b>'+(['🥇','🥈','🥉'][i]||(i+1)+'.')+'</b><span class="av">'+u.avatar+'</span><div class="n"><b>'+esc(u.nick)+'</b><small>Ур. '+u.level+'</small></div><b style="color:var(--g)">'+(topBy=='xp'?'Ур. '+u.value:fmt(u.value))+'</b></div>'}).join('')+'</div>';
 $$('#tt button').forEach(function(b){b.onclick=function(){topBy=b.dataset.b;loadTop()}})};
/* ---- друзья: реферальная ссылка ---- */
var _ds=drawSocial;window.drawSocial=function(){_ds();var link=cfg.bot?'https://t.me/'+cfg.bot+'?start=ref_'+me.id:'',c=document.createElement('div');c.className='card';
 c.innerHTML='<h3>📣 Пригласи друга</h3><small>Вы оба получите по '+fmt(cfg.refBonus)+' 🪙 и станете друзьями. Приглашено: <b style="color:var(--g)">'+me.refs+'</b></small>'+(link?'<div class="lnk">'+esc(link)+'</div><button class="go" id="sh">Поделиться ссылкой</button>':'<div class="msg">Ссылка появится после обновления бота</div>');
 $('#v-friends').insertBefore(c,$('#v-friends').firstChild);var sh=$('#sh');
 if(sh)sh.onclick=function(){var u='https://t.me/share/url?url='+encodeURIComponent(link)+'&text='+encodeURIComponent('Играй со мной в Royal Spin! Бонус нам обоим 🎁');try{tg.openTelegramLink(u)}catch(e){window.open(u)}}};
/* ---- профиль: звук, история, FAQ ---- */
var _pf=profile;window.profile=function(){_pf();var el=document.createElement('div');el.className='card';
 el.innerHTML='<h3>⚙️ Ещё</h3><div class="opt"><button id="sn">'+(sndOn?'🔊 Звук вкл':'🔇 Звук выкл')+'</button><button id="hs">📜 История</button><button id="fq2">❓ FAQ</button></div><div id="hl"></div>';$('#v-me').appendChild(el);
 $('#sn').onclick=function(){sndOn=!sndOn;try{localStorage.setItem('snd',sndOn?'1':'0')}catch(e){}this.textContent=sndOn?'🔊 Звук вкл':'🔇 Звук выкл'};
 $('#fq2').onclick=function(){nav('faq')};
 $('#hs').onclick=function(){api('history').then(function(r){$('#hl').innerHTML=r.hist.length?r.hist.map(function(h){var w=h.w>h.b;return '<div class="row"><div class="n"><b>'+(GN[h.g]||h.g)+'</b><small>'+new Date(h.t).toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'})+' · ставка '+fmt(h.b)+'</small></div><b class="'+(w?'win':h.w==h.b?'':'lose')+'">'+(w?'+'+fmt(h.w-h.b):h.w==h.b?'0':'−'+fmt(h.b))+'</b></div>'}).join(''):'<small>Пока пусто</small>'}).catch(function(e){tg.showAlert(e.message)})}};
/* ---- плитка и игра ХАЙ-ЛОУ ---- */
var _rg=renderGames;window.renderGames=function(){_rg();var g=$('#gg'),b=document.createElement('button');b.className='gc'+(cfg.games.hilo?'':' off');b.innerHTML='<span class="pic"><em>🔺</em></span>Хай-Лоу<small>выше или ниже</small>';
 b.onclick=function(){if(!cfg.games.hilo)return tg.showAlert('Игра временно отключена');openGame('hilo')};g.insertBefore(b,g.lastElementChild)};
G.hilo={t:'Хай-Лоу',i:'🔺',d:'',r:function(){var live=false,bt=0,SU=['♠','♥','♦','♣'],RK=function(r){return r==1?'A':r==11?'J':r==12?'Q':r==13?'K':r};
 $('#gbody').innerHTML='<div class="card"><div class="hlw"><div class="hlc" id="hc">?</div></div><div class="hls" id="hs2">Угадай: следующая карта выше или ниже?</div><div class="opt"><button id="hi" disabled>▲ Выше</button><button id="lo" disabled>▼ Ниже</button></div><button class="go" id="hcash" hidden>Забрать</button><div id="hbet">'+betBox()+'<button class="go" id="go">СТАРТ</button></div><div class="msg" id="m"></div></div>';
 var card=function(c){var s=Math.random()*4|0,h=$('#hc');h.className='hlc'+(s==1||s==2?' rd':'');h.innerHTML='<span>'+RK(c)+'</span><span>'+SU[s]+'</span>';void h.offsetWidth;h.classList.add('fl')};
 var upd=function(v){card(v.card);live=true;bt=v.bet;$('#hbet').hidden=true;$('#hi').disabled=!v.mh;$('#lo').disabled=!v.ml;
  $('#hi').innerHTML='▲ Выше'+(v.mh?'<small>x'+v.mh+'</small>':'');$('#lo').innerHTML='▼ Ниже'+(v.ml?'<small>x'+v.ml+'</small>':'');
  $('#hcash').hidden=!v.steps;$('#hcash').textContent='Забрать '+fmt(Math.floor(v.bet*v.mult))+' 🪙';$('#hs2').textContent='Текущий множитель x'+v.mult};
 var end=function(){live=false;$('#hbet').hidden=false;$('#hi').disabled=true;$('#lo').disabled=true;$('#hcash').hidden=true};
 var guess=function(d){run(async function(){try{var r=await api('hilo_guess',{dir:d});
  if(r.hilo.lost){card(r.hilo.card);end();$('#hs2').textContent='Не угадал…';res('#m',0,bt)}else upd(r.hilo)}catch(e){fail('#m',e)}})};
 $('#go').onclick=function(){run(async function(){try{var b=bet();$('#m').textContent='';var r=await api('hilo_start',{bet:b});upd(r.hilo)}catch(e){fail('#m',e)}})};
 $('#hi').onclick=function(){guess('hi')};$('#lo').onclick=function(){guess('lo')};
 $('#hcash').onclick=function(){run(async function(){try{var r=await api('hilo_cash');end();$('#hs2').textContent='Забрал x'+r.mult;res('#m',r.win,bt)}catch(e){fail('#m',e)}})};
 api('resume').then(function(r){if(r.hilo)upd(r.hilo)}).catch(function(){})}};
if(typeof cfg!=='undefined'&&cfg)renderGames();
})();
