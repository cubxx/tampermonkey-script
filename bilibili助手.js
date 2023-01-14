// ==UserScript==
// @name         bilibili助手
// @namespace    https://github.com/cubxx
// @version      0.1
// @description  阿巴阿巴阿巴阿巴
// @author       Cubxx
// @match        https://*.bilibili.com/*
// @icon         https://www.bilibili.com/favicon.ico
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    //加载完DOM后
    const _onload = window.onload;
    window.onload = function (...e) {
        _onload && _onload(e);
        delAds();
    };

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

    //删首页 推广、赛事
    async function delHomePart() {
        let main = document.getElementsByTagName('main')[0];
        main.children[2].style.display = 'none';
        main.children[3].style.display = 'none';
    }

    // 节点监听
    async function nodeListener(node, func) {
        let stop = setInterval(() => {
            if (node) {
                new MutationObserver(func).observe(node, {
                    childList: true,
                    subtree: true
                });
                clearInterval(stop);
            }
        }, 100);
    }
    if (/www.bilibili.com\/$/.test(document.URL)) {
        nodeListener(document.getElementsByTagName('main')[0], delHomePart);
    }

    // 视频功能
    if (/www.bilibili.com\/video\/?[\s\S]*/.test(document.URL)) {
        // bilivideo页面内跳转
        nodeListener(document.getElementsByClassName('bpx-player-loading-panel')[0], delAds);

        // 搬运至 Mfuns
        document.getElementsByClassName('bpx-player-top-issue')[0].appendChild(
            Object.assign(document.createElement('span'), {
                className: 'bpx-player-top-issue-icon',
                title: '搬运',
                style: 'width:12px; height:12px; background-color:#ccc; border-right:1px solid #000;',
                onclick: function () {
                    let mfun = 'https://www.mfuns1.cn',
                        url = document.URL,
                        vid = url.slice(url.indexOf('video/') + 6, url.indexOf('?')),
                        stop = false;
                    if (vid.slice(-1) == '/')
                        vid = vid.slice(0, -1);
                    if (vid) {
                        let win = window.open(mfun);
                        //发送vid
                        let key = setInterval(() => {
                            win.postMessage(vid, mfun);
                            console.log('发送', vid);
                            stop && clearInterval(key);
                        }, 1e3);
                        //监听信号
                        window.addEventListener('message', e => {
                            if (e.origin == mfun && e.data == 'OK') {
                                console.log('停止发送');
                                stop = true;
                                //window.open('about:blank','_self').close();
                            }
                        });
                    } else
                        alert('Err: vid is null');
                }
            }));

        // 视频截图
        document.getElementsByClassName('bpx-player-top-issue')[0].appendChild(
            Object.assign(document.createElement('span'), {
                className: 'bpx-player-top-issue-icon',
                title: '截图',
                style: 'width:12px; height:12px; background-color:#ccc; border-right:1px solid #000;',
                onclick: function () {
                    let canvas = {},
                        elm = document.getElementsByClassName('bpx-player-video-wrap')[0].children[0];
                    switch (elm.tagName) {
                        case 'VIDEO': {
                            canvas = document.createElement('canvas');
                            [canvas.width, canvas.height] = [elm.videoWidth, elm.videoHeight];
                            canvas.getContext('2d').drawImage(elm, 0, 0);
                            break;
                        }
                        case 'BWP-VIDEO': {
                            canvas = elm;
                            break;
                        }
                        default:
                            console.log('不认识的tagName呢\t', elm.tagName);
                    }
                    const win = window.open('', '_blank');
                    win.document.write(Object.assign(new Image(), {
                        src: canvas.toDataURL('images/png')
                    }).outerHTML);
                    win.document.close();
                }
            }));
    }
})();
