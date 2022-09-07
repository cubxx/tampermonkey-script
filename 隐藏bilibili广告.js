// ==UserScript==
// @name         隐藏bilibili广告
// @namespace    https://github.com/cubxx
// @version      0.1
// @description  阿巴阿巴阿巴阿巴
// @author       Cubxx
// @match        https://*.bilibili.com/*
// @icon         https://www.bilibili.com/favicon.ico
// @grant        none
// ==/UserScript==

(function(){
    var main=function(){
        var loop_num=0,stop_num=0 ;
        function classArray(classname){ return document.getElementsByClassName(classname) }
        var stop=setInterval(function(){
            var loop_valid=false;
            var ads=[
                ...classArray('ad-report'), //bilibili-视频-广告
                ...classArray('pop-live-small-mode'), //bilibili-视频-mini直播
                ...classArray('eva-banner'), //bilibili-横向广告
                ...classArray('banner-card'), //bilibili-横向广告-老版
                ...classArray('gg-floor-module'), //bilibili-番剧
                ...classArray('activity-banner'), //bilibili-活动
                ...classArray(''), //bilibili-
            ];
            if(/[https\:\/\/www\.bilibili\.com]{24,25}/.test(url)) stop_num=1; //首页
            if(url.includes('member.bilibili.com/york')) stop_num=1; //投稿视频界面
            if(url.includes('bilibili.com/video')) stop_num=2; //视频页删除多次
            for(var ad of ads){
                if(ad.style.display!='none'){ ad.style.display='none'; loop_valid=true;}
            }
            if(loop_valid){ loop_num++; console.log('隐藏一次');}
            if(loop_num>=stop_num){ clearInterval(stop); }
        },500);
    }
    var url=document.URL;
    url=url.slice(0,url.indexOf('?')); //url除参
    if(url.includes('bilibili.com/video')){ //bilivideo页面内跳转时，使用节点监听
        var Mobs=new MutationObserver(main);
        var node=document.getElementsByClassName('bpx-player-loading-panel')[0];
        var stop=setInterval(()=>{
            if(node){ clearInterval(stop); Mobs.observe(node, {childList: true, subtree: true}); }
            else{ node=document.getElementsByClassName('bpx-player-loading-panel')[0]; }
        },100);
    }else{ main(); }

})();
