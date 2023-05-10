// ==UserScript==
// @name         bilibili助手
// @namespace    bili_helper
// @version      0.1
// @description  null
// @author       Cubxx
// @match        https://*.bilibili.com/*
// @exclude     https://api.bilibili.com/*
// @exclude     https://api.vc.bilibili.com/*
// @require    https://cubxx.github.io/$tm.js
// @icon         https://www.bilibili.com/favicon.ico
// @grant        none
// ==/UserScript==

(async function () {
    'use strict';
    // 删除广告
    async function delAds() {
        function classArray(arr) {
            let ads = [];
            arr.forEach(e => ads.push(...document.getElementsByClassName(e)));
            return ads;
        }
        let stop = setInterval(function () {
            let ads = classArray([
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
            ]);
            for (let ad of ads) ad.style.display = 'none';
            if (document.URL.includes('bilibili.com/video'))
                ads.length == 0 && clearInterval(stop);
            else clearInterval(stop);
        }, 1000);
    }
    $tm.onloadFuncs.push(delAds);

    //删首页 推广、赛事
    $tm.urlFunc(/www.bilibili.com\/$/, () => {
        $('main').nodeListener(async function () {
            let main = $('main');
            main.children[2].style.display = 'none';
            main.children[3].style.display = 'none';
        });
    });

    // 视频功能
    function vtip(text) {
        let elm = $(`#tip_${text}`);
        if (elm) {
            (typeof elm.stop == 'number') && clearTimeout(elm.stop);
            elm.del();
        } else {
            $('.bpx-player-tooltip-area').appendChild($tm.addElms([{
                tag: 'div', className: 'bpx-player-tooltip-item', id: `tip_${text}`,
                style: `position: relative;top: -310px;margin: auto;visibility: visible;opacity: 1;`,
                innerHTML: `<div class="bpx-player-tooltip-title">${text}</div>`,
                del() { this.stop = setTimeout(() => this.remove(), 2.5e3); },
            }])[0]).del();
        }
    }
    function buttonGroup(configs) {
        return $tm.onloadFuncs.push(e => $('#bilibili-player').insertBefore(
            $tm.addElmsGroup({
                box: {
                    id: '视频功能组', tag: 'div',
                    style: `position: absolute;left: -10px;top: 0px;z-index: 0;
                        display: flex;flex-direction: column;
                        border-radius: 5px;border: 1px solid #888;
                        opacity: 0.4;transition: 300ms`,
                    onmouseenter() { this.style.opacity = '1'; this.style.left = '-' + getComputedStyle(this).width },
                    onmouseleave() { this.style.opacity = '0.4'; this.style.left = '-10px' },
                },
                arr: configs,
                defaults: {
                    tag: 'input', type: 'button',
                    style: `border-radius: 5px;border: none;border-bottom: 1px solid #aaa;padding: 5px 10px;
                        background-color: #eee;font-size: 15px;outline: none;`,
                    init() {
                        this.title = this.name;
                        this.value = this.name;
                        return this
                    }
                }
            }), $('#bilibili-player').children[0]));
    }
    $tm.urlFunc(/www.bilibili.com\/video/, () => {
        // 页面内跳转
        $('.bpx-player-loading-panel').nodeListener(delAds, { childList: true, subtree: true, attributes: true });
        // sm号换为nico视频
        $('#v_desc').nodeListener(function () {
            this.$('a', 1).forEach(a => {
                if (a.innerText.slice(0, 2) == 'sm') a.setValue('href', `https://www.nicovideo.jp/watch/${a.innerText}`);
            });
        });
        // 功能组
        if (!__INITIAL_STATE__.videoData) throw 'window.__INITIAL_STATE__.videoData 失效';
        buttonGroup([{
            name: '搬运',
            onclick() {
                const mfun = 'https://www.mfuns1.cn', vid = __INITIAL_STATE__.videoData.bvid;
                let stop = false;
                if (vid) {
                    const win = window.open(mfun),
                        key = setInterval(() => {
                            win.postMessage(vid, mfun);
                            vtip(`发送${vid}`);
                            if (win.closed || stop) vtip('停止发送'), clearInterval(key);
                        }, 1e3);
                    window.addEventListener('message', e => {
                        if (e.origin == mfun && e.data == 'OK') stop = true;
                    });
                } else throw 'vid is null';
            }
        }, {
            name: '截图',
            onclick() {
                (function (elm) {
                    switch (elm.tagName) {
                        case 'VIDEO': return Object.assign(document.createElement('canvas'), {
                            width: elm.videoWidth, height: elm.videoHeight,
                            init() { this.getContext('2d').drawImage(elm, 0, 0); return this }
                        }).init();
                        case 'BWP-VIDEO': return elm.getRenderCanvas();
                        default: console.log('不认识的tag呢', elm.tagName)
                    }
                })($('.bpx-player-video-wrap>*')).toBlob(blob => {
                    navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(e => vtip('已截图'));
                }, 'image/png');
            }
        }, {
            name: '封面',
            onclick() { open(__INITIAL_STATE__.videoData.pic) }
        }]);
    });
    $tm.urlFunc(/www.bilibili.com\/bangumi/, () => {
        $('#bilibili-player').nodeListener(function () { this.$('.bpx-player-toast-wrap').style.display = 'none' });
        buttonGroup([{
            name: '截图',
            onclick() {
                (function (elm) {
                    switch (elm.tagName) {
                        case 'VIDEO': return Object.assign(document.createElement('canvas'), {
                            width: elm.videoWidth, height: elm.videoHeight,
                            init() { this.getContext('2d').drawImage(elm, 0, 0); return this }
                        }).init();
                        case 'BWP-VIDEO': return elm.getRenderCanvas();
                        default: console.log('不认识的tag呢', elm.tagName)
                    }
                })($('.bpx-player-video-wrap>*')).toBlob(blob => {
                    navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(e => vtip('已截图'));
                }, 'image/png');
            }
        }]);
    });
})();
