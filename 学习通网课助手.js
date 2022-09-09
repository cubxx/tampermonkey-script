// ==UserScript==
// @name         学习通网课助手
// @namespace    https://github.com/cubxx
// @version      0.1
// @description  try to take over the world!
// @author       Cubxx
// @match      https://mooc1.chaoxing.com/*
// @icon         https://mooc.chaoxing.com/favicon.ico
// @grant        none
// ==/UserScript==

(function() {
    //自动下一节
    if(document.URL.includes('mycourse/studentstudy?')){
        window.onload=()=>{
            var lis=document.getElementsByClassName('posCatalog_select'); //右侧菜单所有元素
            var c=lis.length;
            for(var i=0;i<lis.length;i++){
                //if(lis[i].childElementCount==3 && lis[i].children[1].value=='1'){ c=i; break;} //获取第一个未完成任务点
                if(lis[i].className.includes('posCatalog_active')){ c=i; break;} //获取当前选中任务点
            }
            //lis[c].children[0].click();
            setInterval(()=>{ //自动向下
                var last=parseInt(sessionStorage.getItem('last'));
                var time=parseInt(sessionStorage.getItem('time'));
                if((last && time>=last) || lis[c].childElementCount==1){
                    //if(c<lis.length && lis[c].childElementCount!=3){
                    c++;
                    if(lis[c].childElementCount==1) c++;
                    lis[c].children[0].click();
                    sessionStorage.setItem('time',0);
                }
            },5*1000); //每5s检查一次
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
                sessionStorage.setItem('last',last);
                //v.currentTime=last-10;
            }
            //静音
            //var vol=document.getElementsByClassName('vjs-mute-control vjs-control vjs-button vjs-vol-3')[0]; if(vol) vol.click();
            v.volume=0;
            //暂停
            //v.pause = null;
            //解锁进度条
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
            sessionStorage.setItem('time',v.currentTime);
            if(last&&last-10<=v.currentTime){
                v.playbackRate=1;
            }else{ v.playbackRate=4;}
        },2000)
    } //*/

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