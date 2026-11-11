(function(){
var x=document.createElement('button');x.id='fsx';x.textContent='✕';document.body.appendChild(x);
x.onclick=function(){nav('games')};
var og=window.openGame;window.openGame=function(g){document.body.classList.toggle('fs',g=='blockblast');og(g)};
var v=document.getElementById('v-game');if(v)new MutationObserver(function(){if(v.hidden)document.body.classList.remove('fs')}).observe(v,{attributes:true,attributeFilter:['hidden']});
})();
