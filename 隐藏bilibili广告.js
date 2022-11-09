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

(function () {
    var main = function () {
        var loop_num = 0, stop_num = 0;
        function classArray(arr) {
            let ads = [];
            arr.forEach(e => { ads.push(...document.getElementsByClassName(e)) });
            return ads;
        }
        var stop = setInterval(function () {
            var loop_valid = false;
            var ads = classArray([
                'ad-report', //bilibili-视频-广告
                'slide-ad-exp', //bilibili-视频-广告
                'pop-live-small-mode', //bilibili-视频-mini直播
                'eva-banner', //bilibili-横向广告
                'banner-card', //bilibili-横向广告-老版
                'gg-floor-module', //bilibili-番剧
                'activity-banner', //bilibili-活动
                'bili-dyn-ads', //bilibili-动态广告
				'reply-notice', //bilibili-通知
				'', //bilibili-
            ]);/*
            if (/[https\:\/\/www\.bilibili\.com]{24,25}/.test(url)) stop_num = 1; //首页
            if (url.includes('member.bilibili.com/york')) stop_num = 1; //投稿视频界面
            if (url.includes('bilibili.com/video')) stop_num = 2; //视频页删除多次*/
            for (var ad of ads) {
                ad.style.display != 'none' && (loop_valid = true, ad.style.display='none')
            }
            // loop_valid && (loop_num++, console.log('隐藏一次'));
            if (url.includes('bilibili.com/video')) ads.length == 0 && clearInterval(stop);
			else clearInterval(stop);
        }, 1000);
    }
	window.onload = main;
	//main();
    var url = document.URL;
    url = url.slice(0, url.indexOf('?')); //url除参
    if (url.includes('bilibili.com/video')) { //bilivideo页面内跳转时，使用节点监听
        var Mobs = new MutationObserver(main);
        var node = document.getElementsByClassName('bpx-player-loading-panel')[0];
        var stop = setInterval(() => {
            if (node) clearInterval(stop), Mobs.observe(node, { childList: true, subtree: true });
            else node = document.getElementsByClassName('bpx-player-loading-panel')[0];
        }, 100);
    }
})();
