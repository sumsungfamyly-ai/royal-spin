(function(){
var M=function(){return typeof me!=='undefined'&&me?me:{}};
var HUE={slots:42,roulette:2,wheel:330,blackjack:150,hilo:265,dice:210,flip:38,rps:175,crash:18,mines:215,plinko:250,blockblast:300,durak:140,checkers:28,connect4:205,coblast:320,comines:350,duel:350};
function tint(){var n=0;$$('#gsec [data-g]').forEach(function(b){var h=HUE[b.dataset.g];if(h!=null&&!b.style.getPropertyValue('--hue')){b.style.setProperty('--hue',h);n++}})}
function hero(){var v=$('#v-games'),m=M();if(!v||!m.id)return;var h=$('#hero');if(!h){h=document.createElement('div');h.id='hero';v.insertBefore(h,v.firstChild)}
 var lvl=m.lvl||m.level||1,xp=m.xp||0,a=m.xpFrom||0,b=m.xpTo||500,p=Math.max(0,Math.min(100,(xp-a)/Math.max(1,b-a)*100));
 h.innerHTML='<h3>Привет, '+esc(m.nick||m.name||'игрок')+'!</h3><div class="lv"><span>Уровень '+lvl+'</span><span class="bar"><i style="width:'+p+'%"></i></span><span>'+fmt(xp)+' / '+fmt(b)+'</span></div>'}
var gg=$('#gg');if(gg)new MutationObserver(tint).observe(gg,{childList:true,subtree:true});
var sm=window.setMe;if(sm)window.setMe=function(m){sm(m);hero()};
var nv=window.nav;window.nav=function(v){var r=nv.apply(this,arguments);if(!document.body.classList.contains('gfs')){var s=document.getElementById('v-'+v);if(s){s.classList.remove('enter');void s.offsetWidth;s.classList.add('enter');setTimeout(function(){s.classList.remove('enter')},800)}}hero();return r};
setTimeout(function(){hero();tint()},900);
})();
