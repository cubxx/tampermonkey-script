// ==UserScript==
// @name         学习通网课助手
// @namespace    https://github.com/cubxx
// @version      0.1
// @description  try to take over the world!
// @author       Cubxx
// @match      https://mooc1.chaoxing.com/*
// @icon         https://mooc1.chaoxing.com/favicon.ico
// @grant        none
// ==/UserScript==

(function() {
    if(document.URL.includes('ananas/modules/video/index.html?v=')){
        var v;
        var begin=10,n=0;
        var stop=setInterval(()=>{
            v=document.getElementById('video_html5_api');
            if(v){
                //播放
                v.play();
                //拉取进度条
                var time=document.getElementsByClassName('vjs-duration-display')[0].innerHTML.split(':');
                if(time[0]!='0'){ begin=time[0]*60+parseInt(time[1])-30; }
            }
            //静音
            var vol=document.getElementsByClassName('vjs-mute-control vjs-control vjs-button vjs-vol-3')[0]; if(vol) vol.click();
            //暂停
            v.pause = null;
            //解锁进度条 index
            let seekbar = videojs.getComponent("SeekBar");
            seekbar.prototype.handleMouseDown = function(c){
                seekbar.prototype.__proto__.handleMouseDown.call(this,c);}
            seekbar.prototype.handleMouseMove = function(c){
                seekbar.prototype.__proto__.handleMouseMove.call(this,c);}
            seekbar.prototype.handleMouseUp = function(c){
                seekbar.prototype.__proto__.handleMouseUp .call(this,c);}
            videojs("video").off("seeked");

            if(!v.pause&&v){ clearInterval(stop);}
        },1000);

        setInterval(()=>{
            if(begin==v.currentTime) v.play();
            v.playbackRate=16; //倍数
            if(n%200==0) v.currentTime+=5; //进度条
            n++;
        },1)
    } //*/

    if(document.URL.includes('ztnodedetailcontroller')){
        var li=document.getElementsByClassName('wh wh');
        window.onblur=null;
        setInterval(()=>{
            var a=li[parseInt(Math.random()*li.length)];
            if(a.tagName=='A' && Math.random()<0.1) a.click(); //0.1的概率跳转
            window.scrollTo(0,Math.random()*10000); //每10s滚动一次
        },1000*10)
    }

})();