(function(){
var og=window.openGame;window.openGame=function(g){if(!G[g]){nav(g=='duel'?'friends':'games');return}og(g)};
})();
