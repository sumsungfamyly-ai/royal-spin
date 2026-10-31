(function(){
var by='balance',lab={balance:'Баланс',xp:'Уровень',biggest:'Рекорд'};
function toast(t){var d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(function(){d.classList.add('out')},2400);setTimeout(function(){d.remove()},2900)}
window.loadTop=async function(){var el=$('#v-top'),r;
 try{r=await api('top',{by:by})}catch(e){el.innerHTML='<div class="card"><div class="msg lose">'+esc(e.message)+'</div></div>';return}
 var st=me.lb,card='';
 if(!r.open){
  card='<div class="card lbs"><h3>Участие в рейтинге</h3>'+(st=='approved'?'<div class="lbt"><b>Ты в рейтинге</b><small>Место #'+r.rank+' из '+r.total+'</small></div><button class="sm r" id="lbx">Выйти из рейтинга</button>'
   :st=='pending'?'<div class="lbt"><b>Заявка на рассмотрении</b><small>Администратор скоро её проверит</small></div><button class="sm r" id="lbx">Отозвать заявку</button>'
   :st=='rejected'?'<div class="lbt"><b>Заявка отклонена</b><small>'+(me.lbNote?'Причина: '+esc(me.lbNote):'Повторно подать можно через сутки')+'</small></div><button class="sm p" id="lba">Подать снова</button>'
   :'<div class="lbt"><b>Тебя пока нет в рейтинге</b><small>Подай заявку, администратор её рассмотрит</small></div><button class="sm p" id="lba">Подать заявку</button>')+'</div>'}
 el.innerHTML=card+'<div class="card"><div class="opt" id="tt">'+Object.keys(lab).map(function(k){return '<button data-b="'+k+'"'+(k==by?' class="on"':'')+'>'+lab[k]+'</button>'}).join('')+'</div>'
  +(r.top.length?r.top.map(function(u,i){return '<div class="row'+(u.me?' mine':'')+'"><b class="rk'+(i<3?' t'+(i+1):'')+'">'+(i+1)+'</b><span class="av">'+esc(u.avatar)+'</span><div class="n"><b>'+esc(u.nick)+(u.me?' · ты':'')+'</b><small>Ур. '+u.level+'</small></div><b style="color:var(--g)">'+(by=='xp'?'Ур. '+u.value:fmt(u.value))+'</b></div>'}).join(''):'<div class="gnone">Рейтинг пока пуст</div>')+'</div>';
 $$('#tt button').forEach(function(b){b.onclick=function(){by=b.dataset.b;loadTop()}});
 var act=function(a){return function(){api(a).then(function(x){if(x.msg)toast(x.msg);loadTop()}).catch(function(e){toast(e.message)})}};
 var ap=$('#lba'),lx=$('#lbx');if(ap)ap.onclick=act('lb_apply');if(lx)lx.onclick=act('lb_leave')};
})();
