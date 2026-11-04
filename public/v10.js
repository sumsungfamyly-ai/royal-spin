(function(){
var by='balance',lab={balance:'Баланс',xp:'Уровень',biggest:'Рекорд'};
var topRequest=0;
window.loadingSkeleton=function(rows){return '<div class="card loading-card" aria-hidden="true"><div class="skeleton sk-title"></div>'+Array.from({length:rows},function(){return '<div class="skeleton-row"><i class="skeleton sk-avatar"></i><span><i class="skeleton sk-line"></i><i class="skeleton sk-short"></i></span><i class="skeleton sk-value"></i></div>'}).join('')+'</div>'};
var featureIcons={
 tournament:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M21 13h22v12a11 11 0 0 1-22 0V13Z" fill="#ffd45c"/><path d="M21 18h-9v5a11 11 0 0 0 12 11M43 18h9v5a11 11 0 0 1-12 11" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="M32 36v10m-9 5h18m-14-5h10" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="m32 17 2 4 4 .6-3 3 .7 4.2-3.7-2-3.7 2L29 24.6l-3-3 4-.6 2-4Z" fill="#ff7a45"/></svg>',
 achievements:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="m32 7 6.5 13.2 14.5 2.1-10.5 10.2L45 47l-13-6.8L19 47l2.5-14.5L11 22.3l14.5-2.1L32 7Z" fill="#ff7b55"/><circle cx="32" cy="27" r="8" fill="#ffd45c"/><path d="m23 43-3 14 12-6 12 6-3-14" fill="#55c8ff"/></svg>',
 seasonal:'<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="11" y="14" width="42" height="39" rx="8" fill="#fff"/><path d="M11 23h42" stroke="#ff6685" stroke-width="7"/><path d="M22 9v10m20-10v10" stroke="#ffd45c" stroke-width="5" stroke-linecap="round"/><path d="m23 37 6 6 13-13" fill="none" stroke="#39c98a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 history:'<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="33" r="23" fill="#7b6cff"/><circle cx="32" cy="33" r="16" fill="#fff"/><path d="M32 22v12l9 5" fill="none" stroke="#ff6685" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 13 9 20l9 1" fill="none" stroke="#ffd45c" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};
var featureTiles='<section class="feature-hub" id="feature-hub" aria-label="Разделы казино"><h3>ТВОИ ЦЕЛИ</h3><div class="feature-grid">'
 +'<button class="feature-tile ft-tournament" data-feature="tournament"><span class="feature-art">'+featureIcons.tournament+'</span><b>Турнир</b><small>Сравни себя с игроками</small></button>'
 +'<button class="feature-tile ft-achievements" data-feature="achievements"><span class="feature-art">'+featureIcons.achievements+'</span><b>Награды</b><small>Собери все достижения</small></button>'
 +'<button class="feature-tile ft-seasonal" data-feature="seasonal"><span class="feature-art">'+featureIcons.seasonal+'</span><b>Задания сезона</b><small>Выполняй и забирай призы</small></button>'
 +'<button class="feature-tile ft-history" data-feature="history"><span class="feature-art">'+featureIcons.history+'</span><b>История игр</b><small>Смотри последние раунды</small></button>'
 +'</div></section>';
function goFeature(feature){
 if(feature==='tournament'){nav('top');return}
 if(feature==='history'){nav('me');if(window.openHistory)window.openHistory();return}
 window.featureAnchor=feature==='achievements'?'achievements':'season-quests';nav('bonus');
}
var originalRenderGames=window.renderGames;
window.renderGames=function(){originalRenderGames();var gg=$('#gg');if(!gg)return;var hub=$('#feature-hub');if(!hub){gg.insertAdjacentHTML('afterend',featureTiles);hub=$('#feature-hub')}hub.querySelectorAll('[data-feature]').forEach(function(button){button.onclick=function(){goFeature(button.dataset.feature)}})};
if(window.renderBonus){var originalRenderBonus=window.renderBonus;window.renderBonus=async function(){await originalRenderBonus();var id=window.featureAnchor;if(!id)return;window.featureAnchor=null;var target=document.getElementById(id);if(target)target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'})}}
function toast(t){var d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(function(){d.classList.add('out')},2400);setTimeout(function(){d.remove()},2900)}
window.loadTop=async function(){var el=$('#v-top'),r,request=++topRequest;el.setAttribute('aria-busy','true');el.innerHTML=window.loadingSkeleton(5);
 try{r=await api('top',{by:by})}catch(e){if(request!==topRequest)return;el.removeAttribute('aria-busy');el.innerHTML='<div class="card"><div class="msg lose">'+esc(e.message)+'</div></div>';return}
 if(request!==topRequest)return;
 var st=me.lb,card='';
 if(!r.open){
  card='<div class="card lbs"><h3>Участие в рейтинге</h3>'+(st=='approved'?'<div class="lbt"><b>Ты в рейтинге</b><small>Место #'+r.rank+' из '+r.total+'</small></div><button class="sm r" id="lbx">Выйти из рейтинга</button>'
   :st=='pending'?'<div class="lbt"><b>Заявка на рассмотрении</b><small>Администратор скоро её проверит</small></div><button class="sm r" id="lbx">Отозвать заявку</button>'
   :st=='rejected'?'<div class="lbt"><b>Заявка отклонена</b><small>'+(me.lbNote?'Причина: '+esc(me.lbNote):'Повторно подать можно через сутки')+'</small></div><button class="sm p" id="lba">Подать снова</button>'
   :'<div class="lbt"><b>Тебя пока нет в рейтинге</b><small>Подай заявку, администратор её рассмотрит</small></div><button class="sm p" id="lba">Подать заявку</button>')+'</div>'}
 el.removeAttribute('aria-busy');el.innerHTML=card+'<div class="card"><div class="opt" id="tt">'+Object.keys(lab).map(function(k){return '<button data-b="'+k+'"'+(k==by?' class="on"':'')+'>'+lab[k]+'</button>'}).join('')+'</div>'
  +(r.top.length?r.top.map(function(u,i){return '<div class="row'+(u.me?' mine':'')+'"><b class="rk'+(i<3?' t'+(i+1):'')+'">'+(i+1)+'</b><span class="av">'+esc(u.avatar)+'</span><div class="n"><b>'+esc(u.nick)+(u.me?' · ты':'')+'</b><small>Ур. '+u.level+'</small></div><b style="color:var(--g)">'+(by=='xp'?'Ур. '+u.value:fmt(u.value))+'</b></div>'}).join(''):'<div class="gnone">Рейтинг пока пуст</div>')+'</div>';
 $$('#tt button').forEach(function(b){b.onclick=function(){by=b.dataset.b;loadTop()}});
 var act=function(a){return function(){api(a).then(function(x){if(x.msg)toast(x.msg);loadTop()}).catch(function(e){toast(e.message)})}};
 var ap=$('#lba'),lx=$('#lbx');if(ap)ap.onclick=act('lb_apply');if(lx)lx.onclick=act('lb_leave')};
})();
