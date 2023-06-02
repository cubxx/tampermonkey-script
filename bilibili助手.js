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
    document.body.style.overflow = 'auto';
    // 删除广告
    async function delAds() {
        let stop = setInterval(function () {
            const ads = [
                '.ad-report', //bilibili-视频-广告
                '.slide-ad-exp', //bilibili-视频-广告
                '.pop-live-small-mode', //bilibili-视频-mini直播
                '.eva-banner', //bilibili-横向广告
                '.banner-card', //bilibili-横向广告-老版
                '.gg-floor-module', //bilibili-番剧
                '.activity-banner', //bilibili-活动
                '#activity_vote', //bilibili-活动
                '.bili-dyn-ads', //bilibili-动态广告
                '.reply-notice', //bilibili-通知
            ].flatMap(e => [...$(e, 1)]);
            for (let ad of ads) ad.style.display = 'none';
            if (document.URL.includes('bilibili.com/video'))
                ads.length == 0 && clearInterval(stop);
            else clearInterval(stop);
        }, 1000);
    }
    $tm.onloadFuncs.push(delAds);

    //首页
    $tm.urlFunc(/www.bilibili.com\/$/, () => {
        $('main').nodeListener(async function () {
            [...this.$('section', 1)].filter(e => {
                let a = e.$('a');
                if (a) return a.id == '推广';
            }).forEach(e => e.style.display = 'none');
        });
    });

    // 视频功能
    function vtip(text, id) {
        id ??= text;
        const elm = $(`#tip_${id}`);
        if (elm) {
            (typeof elm.stop == 'number') && clearTimeout(elm.stop);
            elm.del();
        } else {
            $('.bpx-player-tooltip-area').appendChild($tm.addElms({
                arr: [{
                    tag: 'div', className: 'bpx-player-tooltip-item', id: `tip_${id}`,
                    style: `position: relative;top: -310px;margin: auto;visibility: visible;opacity: 1;`,
                    innerHTML: `<div class="bpx-player-tooltip-title">${text}</div>`,
                    del() { this.stop = setTimeout(() => this.remove(), 2.5e3); },
                }]
            })[0]).del();
        }
    }
    function buttonGroup(configs) {
        const group = $tm.addElmsGroup({
            box: {
                id: '视频功能组', tag: 'div',
                style: `position: absolute;left: -10px;top: 0px;z-index: 0;
                        display: flex;flex-direction: column;align-items: stretch;
                        border-radius: 5px;border: 1px solid #888;
                        opacity: 0.4;transition: 300ms;`,
                onmouseenter() { this.style.opacity = '1'; this.style.left = '-' + getComputedStyle(this).width },
                onmouseleave() { this.style.opacity = '0.4'; this.style.left = '-10px' },
            },
            arr: configs,
            defaults: {
                tag: 'input', type: 'button',
                style: `border-radius: 5px;border: none;border-bottom: 1px solid #aaa;padding: 5px 10px;
                        background-color: #eee;font-size: 15px;outline: none;`,
                init() {
                    this.name ??= '';
                    this.title ||= this.name;
                    this.value ||= this.name;
                    this.style.cssText += this.addStyle;
                    return this
                }
            }
        });
        $tm.onloadFuncs.push(e => $('#bilibili-player').insertBefore(group, $('#bilibili-player').children[0]));
        return group;
    }
    $tm.urlFunc(/www.bilibili.com\/video/, () => {
        // 页面内跳转
        $('.bpx-player-loading-panel').nodeListener(delAds, { childList: true, subtree: true, attributes: true });
        // sm号换为nico视频
        $('#v_desc')?.nodeListener(function () {
            this.$('a', 1).forEach(a => {
                if (a.innerText.slice(0, 2) == 'sm') a.setValue('href', `https://www.nicovideo.jp/watch/${a.innerText}`);
            });
        });
        // 宽屏模式
        $('.bpx-player-control-bottom-right').nodeListener(function () {
            const broad = $('.bpx-player-ctrl-btn[aria-label=宽屏]'),
                clarity = $('.bpx-player-ctrl-btn[aria-label=清晰度]');
            const light = $('.bui-checkbox-input[aria-label=关灯模式]');
            if (broad) return broad.onclick = function (e) {
                light.click(); //开关灯
                clarity.$(`li[data-value="${[16, 64][+light.checked]}"]`).click(); //720p/360p
            };
        }, { childList: true });
        // 功能组
        if (!__INITIAL_STATE__.videoData) throw 'window.__INITIAL_STATE__.videoData 失效';
        const buttonGrp = buttonGroup([{
            name: '搬运',
            onclick() {
                $tm.postMessage({
                    url: 'https://www.mfuns1.cn',
                    data: __INITIAL_STATE__.videoData.bvid,
                    signal: 'OK',
                    func(d) { vtip(`发送${d}`) },
                }).then(e => vtip('停止发送'));
            }
        }, {
            name: '截图',
            onclick() {
                const _this = this;
                !function () {
                    const elm = $('.bpx-player-video-wrap>*');
                    switch (elm.tagName) {
                        case 'VIDEO': return Object.assign(document.createElement('canvas'), {
                            width: elm.videoWidth, height: elm.videoHeight,
                            init() { this.getContext('2d').drawImage(elm, 0, 0); return this }
                        }).init();
                        case 'BWP-VIDEO': return elm.getRenderCanvas();
                        default: console.log('不认识的tag呢', elm.tagName);
                    }
                }().toBlob(blob => {
                    _this.mode ?
                        $tm.addElms({ arr: [{ tag: 'a', download: `${prompt('文件名:') || '截图'}.png`, href: URL.createObjectURL(blob), }] })[0].click() :
                        navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(e => vtip('已截图'));
                }, 'image/png');
            }
        }, {
            name: '封面',
            onclick() { open(__INITIAL_STATE__.videoData.pic) },
        }, {
            name: '下载',
            onclick() {
                const arr = [
                    'https://bilibili.iiilab.com/?hao.su',
                    'https://www.yiuios.com/tool/bilibili',
                    'https://xbeibeix.com/api/bilibili/',
                ];
                navigator.clipboard.writeText(location.href).then(e => { open(arr[Math.floor(Math.random() * arr.length)]) })
            },
        }, {
            name: '设置',
            onclick() {
                setPanel.style.display = setPanel.style.display ? '' : 'none';
                buttonGrp.onmouseenter();
            },
        }]);
        const setPanel = $tm.addElmsGroup({
            box: { title: '设置面板', style: 'display: none;' },
            arr: [{
                box: { title: '播放速度', },
                arr: [{
                    box: {},
                    arr: [{
                        tag: 'input', type: 'range',
                        step: '0.1', min: '0', max: '3', value: '1',
                        inputHandler() {
                            const v = +this.value;
                            $('.bpx-player-video-wrap>*').playbackRate = v;
                            return v.toFixed(1);
                        },
                        ondblclick() { this.max = prompt('max:') || '3' },
                    }],
                }]
            }, {
                box: { title: '截图设置', },
                arr: [{
                    box: { style: 'display: flex;justify-content: space-evenly;' },
                    arr: [
                        { value: '剪贴板', mode: 0, checked: true },
                        { value: '本地', mode: 1 }
                    ],
                    defaults: {
                        tag: 'input', type: 'radio', name: 'capture',
                        inputHandler() {
                            buttonGrp.$('input[title=截图]').mode = this.mode;
                            return this.value;
                        }
                    }
                }]
            }],
            defaults: {
                style: 'display: flex;flex-direction: column;padding: 5px;border-top: 1px dashed;',
                init() {
                    this.innerHTML = `<label style="display: flex;justify-content: space-between;">${this.title}<code></code></label>${this.innerHTML}`;
                }
            }
        });
        setPanel.addEventListener('input', e => { e.target.parentElement.parentElement.$('label>code').innerHTML = e.target.inputHandler?.() ?? '空'; });
        buttonGrp.appendChild(setPanel);
    });

    //番剧
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

    //选中动态文字不跳转
    window.addEventListener('click', e => {
        if (!e.target.parentElement.className.includes('bili-rich-text')) return;
        // e.stopImmediatePropagation();
        e.stopPropagation();
        // e.preventDefault();
    }, true);

})();
