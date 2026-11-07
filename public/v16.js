(function(){
var M=function(){return typeof me!=='undefined'&&me?me:{}};
/* ---- полоса загрузки и заставка ---- */
var bar=document.createElement('div');bar.id='ldb';document.body.appendChild(bar);
var f=window.fetch,pend=0,tm;window.fetch=function(){pend++;clearTimeout(tm);tm=setTimeout(function(){if(pend>0)bar.classList.add('on')},200);return f.apply(this,arguments).finally(function(){pend--;if(!pend){clearTimeout(tm);bar.classList.remove('on')}})};
var spl=document.getElementById('spl'),spi=document.getElementById('spi'),t0=Date.now(),pr=8;
var iv=setInterval(function(){pr=Math.min(90,pr+(90-pr)*.12);if(spi)spi.style.width=pr+'%';
 if((document.querySelectorAll('#gg *').length>0&&Date.now()-t0>900)||Date.now()-t0>7000){clearInterval(iv);if(spi)spi.style.width='100%';setTimeout(function(){if(spl){spl.classList.add('out');setTimeout(function(){spl.remove()},600)}},250)}},120);
/* ---- применение купленного ---- */
window.EQ={};window.FXN='';
function nm(id){return id?id.slice(2):''}
function applyEq(eq){window.EQ=eq||{};var h=document.documentElement,b=document.body;
 [['th','theme'],['cs','chip']].forEach(function(p){var v=nm(EQ[p[1]]);v?h.dataset[p[0]]=v:delete h.dataset[p[0]]});
 var fr=nm(EQ.frame);fr?b.dataset.fr=fr:delete b.dataset.fr;window.FXN=nm(EQ.fx)}
var _s=window.setMe;window.setMe=function(m){_s(m);if(m&&m.eq)applyEq(m.eq)};
var _b=window.boom;window.boom=function(e){if(window.FXN&&window.fx&&fx.party)fx.party(window.FXN);else _b(e)};
/* ---- вкладка Магазин ---- */
var nv=$('nav'),me_=nv.querySelector('button[data-v="me"]'),btn=document.createElement('button');btn.dataset.v='shop';btn.innerHTML='<span>🛍️</span>Магазин';nv.insertBefore(btn,me_);btn.onclick=function(){nav('shop')};
var sec=document.createElement('section');sec.id='v-shop';sec.hidden=true;$('main').appendChild(sec);
var _n=window.nav;window.nav=function(v){_n(v);if(v=='shop')shop()};
var CATS=[['frame','🖼️ Рамки'],['chip','🪙 Фишки'],['theme','🎨 Темы'],['fx','✨ Эффекты']],TH={sunset:'linear-gradient(135deg,#ff8a4c,#ff508c,#7a4be0)',neon:'linear-gradient(135deg,#00ffe6,#ff00aa,#503cff)',emerald:'linear-gradient(135deg,#1fbf7a,#00b4c8,#d2ff78)',midnight:'linear-gradient(135deg,#3c50c8,#1e145a,#ffd36e)'},FXE={coins:'🪙💰🪙',stars:'⭐✨🌟',hearts:'💎💖✨',fireworks:'🎆🎇💥'};
var S=null,cat='frame';
function shop(){sec.innerHTML='<div class="card"><small>Загрузка…</small></div>';api('shop').then(function(r){S=r.shop;draw()}).catch(function(e){sec.innerHTML='<div class="card">'+esc(e.message)+'</div>'})}
function pv(it){var n=nm(it.id);
 if(it.cat=='frame')return'<span class="av fr-'+n+'" style="width:60px;height:60px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.1);font-size:30px">'+esc(M().avatar||'😎')+'</span>';
 if(it.cat=='chip')return'<span class="chp" data-c="1" style="'+({emerald:'background-image:linear-gradient(115deg,#9bffd0,#1fbf7a,#d6ffe9,#1fbf7a)',ruby:'background-image:linear-gradient(115deg,#ffb3bd,#e0394e,#ffd1d6,#e0394e)',sapphire:'background-image:linear-gradient(115deg,#b3d4ff,#2f6fd6,#d6e7ff,#2f6fd6)',holo:'background-image:linear-gradient(115deg,#ff8fd8,#7dffd1,#7db8ff,#ffd36e,#c49bff)'}[n])+'">1 000 🪙</span>';
 if(it.cat=='theme')return'<div class="shsw" style="background:'+TH[n]+'"></div>';
 return'<span style="font-size:30px">'+FXE[n]+'</span>'}
function card(it){var own=it.id===''||S.own.indexOf(it.id)>-1,on=(S.eq[it.cat]||'')===it.id,can=M().balance>=it.price;
 var b=on?'<button class="sec" disabled>Надето ✓</button>':own?'<button class="sec" data-e="'+it.id+'">Надеть</button>':'<button data-b="'+it.id+'"'+(can?'':' disabled')+'>'+fmt(it.price)+' 🪙</button>';
 return'<div class="shc'+(on?' eq':'')+'"><div class="shpv">'+(it.id===''?'<span style="font-size:30px;opacity:.6">∅</span>':pv(it))+'</div><b>'+esc(it.name)+'</b>'+b+(it.cat=='fx'&&it.id?'<button class="sec" data-p="'+nm(it.id)+'">Посмотреть</button>':'')+'</div>'}
function draw(){var items=[{id:'',cat:cat,name:'Стандарт',price:0}].concat(S.items.filter(function(i){return i.cat==cat}));
 sec.innerHTML='<div class="shh"><h2>🛍️ Магазин</h2><b>'+fmt(M().balance||0)+' 🪙</b></div><div class="sht">'+CATS.map(function(c){return'<button data-t="'+c[0]+'"'+(c[0]==cat?' class="on"':'')+'>'+c[1]+'</button>'}).join('')+'</div><div class="shg">'+items.map(card).join('')+'</div>';
 sec.querySelectorAll('[data-t]').forEach(function(x){x.onclick=function(){cat=x.dataset.t;draw()}});
 sec.querySelectorAll('[data-p]').forEach(function(x){x.onclick=function(){fx.party(x.dataset.p)}});
 sec.querySelectorAll('[data-b]').forEach(function(x){x.onclick=function(){x.disabled=true;api('shop_buy',{id:x.dataset.b}).then(function(r){S=r.shop;draw();try{fx.party(window.FXN||'coins')}catch(e){}}).catch(function(e){x.disabled=false;tg.showAlert(e.message)})}});
 sec.querySelectorAll('[data-e]').forEach(function(x){x.onclick=function(){api('shop_eq',{id:x.dataset.e,cat:cat}).then(function(r){S=r.shop;draw()}).catch(function(e){tg.showAlert(e.message)})}});
}
/* ---- уведомления в профиле ---- */
var v=$('#v-me');new MutationObserver(function(){if(!$('#ntf')&&v.children.length&&M().id){var d=document.createElement('div');d.className='card';d.id='ntf';d.innerHTML='<div><b>🔔 Умные уведомления</b><small>Напоминания о бонусе и серии, приглашения друзей. Не чаще раза в сутки.</small></div><button class="swt'+(M().notif!==false?' on':'')+'" id="ntb"></button>';v.appendChild(d);$('#ntb').onclick=function(){var on=!this.classList.contains('on');this.classList.toggle('on',on);api('notif_set',{on:on}).catch(function(){})}}}).observe(v,{childList:true});
})();
