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
    //自动下一节
    if(document.URL.includes('mycourse/studentstudy?')){
        window.onload=()=>{
            var lis=document.getElementsByClassName('catalog_points_yi prevTips');
            var c=lis.length;
            for(var i=0;i<lis.length;i++){ //获取第一个未完成任务点
                if(lis[i].innerText=='2'){ c=i-1; break;}
            }
            setInterval(()=>{ //自动向下
                if(c<lis.length&&lis[c].innerText=='1'){
                    c++;
                    lis[c].parentElement.children[0].click();
                }
            },1000);
        }
    }

    //控制播放
    if(document.URL.includes('ananas/modules/video/index.html?v=')){
        var v;
        var last=0,n=0;
        var stop=setInterval(()=>{
            v=document.getElementById('video_html5_api');
            //拉取进度条
            var time=document.getElementsByClassName('vjs-duration-display')[0].innerHTML.split(':');
            if(time[0]!='0'){
                last=time[0]*60+parseInt(time[1]);
                //v.currentTime=last-10;
            }
            //静音
            //var vol=document.getElementsByClassName('vjs-mute-control vjs-control vjs-button vjs-vol-3')[0]; if(vol) vol.click();
            v.volume=0;
            //暂停
            //v.pause = null;
            //解锁进度条 index
            let seekbar = videojs.getComponent("SeekBar");
            seekbar.prototype.handleMouseDown = function(c){
                seekbar.prototype.__proto__.handleMouseDown.call(this,c);}
            seekbar.prototype.handleMouseMove = function(c){
                seekbar.prototype.__proto__.handleMouseMove.call(this,c);}
            seekbar.prototype.handleMouseUp = function(c){
                seekbar.prototype.__proto__.handleMouseUp .call(this,c);}
            videojs("video").off("seeked");
            //解锁鼠标
            Ext.apply=null;
            //解锁倍数
            videojs("video").playbackRate=null;
            //播放
            v.play();

            if(last&&v&&seekbar){
                clearInterval(stop);
                window.v=v;
            }
        },2000);
        //倍数控制
        setInterval(()=>{
            if(last&&last-10<=v.currentTime){
                v.playbackRate=1;
            }else{ v.playbackRate=8;}
        },1000) //*/
    }

    //模拟阅读
    if(document.URL.includes('ztnodedetailcontroller')){
        var li=document.getElementsByClassName('wh wh');
        window.onblur=null;
        setInterval(()=>{
            n++;
            if(0==n%parseInt(Math.random()*60+60)){ //每1-2min滚动一次
                window.onfocus();
                var a=li[parseInt(Math.random()*li.length)];
                if(a.tagName=='A' && Math.random()<0.1) a.click();
                window.scrollTo(0,Math.random()*10000);
            }
        },1000);
    }

})();