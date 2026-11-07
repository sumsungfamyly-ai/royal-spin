(function(){
function box(h,f){var m=document.getElementById('dkm');if(m)m.remove();m=document.createElement('div');m.id='dkm';m.innerHTML='<div>'+h+'</div>';m.onclick=function(e){if(e.target==m)m.remove()};document.body.appendChild(m);f&&f(m)}
window.durakMenu=function(){box('<h3>🃏 Дурак</h3><button class="p" id="dkb">🤖 Играть с ботом</button><button id="dkf">👥 С другом онлайн</button>',function(m){
 m.querySelector('#dkf').onclick=function(){m.remove();toast2('Выбери друга и нажми ⚔️, затем «Дурак»');nav('friends')};
 m.querySelector('#dkb').onclick=function(){var s=[cfg.minBet,Math.min(cfg.maxBet,Math.max(cfg.minBet,100)),Math.min(cfg.maxBet,Math.max(cfg.minBet,500)),Math.min(cfg.maxBet,Math.max(cfg.minBet,2000))].filter(function(x,i,a){return a.indexOf(x)==i});
  box('<h3>Ставка против бота</h3>'+s.map(function(x){return'<button data-b="'+x+'">'+fmt(x)+' 🪙</button>'}).join(''),function(m2){m2.querySelectorAll('[data-b]').forEach(function(b){b.onclick=function(){b.disabled=true;api('durak_bot',{bet:+b.dataset.b}).then(function(r){m2.remove();openDurak(r.durakId)}).catch(function(e){b.disabled=false;tg.showAlert(e.message)})}})})}})};
function toast2(t){var d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(function(){d.remove()},2600)}
})();
