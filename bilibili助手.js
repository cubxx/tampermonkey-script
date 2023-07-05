// ==UserScript==
// @name         bilibili助手
// @namespace    bili_helper
// @version      0.1
// @description  null
// @author       Cubxx
// @match        https://*.bilibili.com/*
// @exclude     https://api.bilibili.com/*
// @exclude     https://api.vc.bilibili.com/*
// @require     https://cubxx.github.io/My-Tampermonkey-Script/$tm.js
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
                '.ad-report', //视频-广告
                '.slide-ad-exp', //视频-广告
                '.pop-live-small-mode', //视频-mini直播
                '.eva-banner', //横向广告
                '.banner-card', //横向广告-老版
                '.gg-floor-module', //番剧
                '.activity-banner', //活动
                '#activity_vote', //活动
                '.bili-dyn-ads', //动态广告
                '.reply-notice', //通知
                '.vip-wrap', //大会员
            ].flatMap(e => $(e, 1));
            for (let ad of ads) ad.style.display = 'none';
            if (document.URL.includes('bilibili.com/video'))
                ads.length == 0 && clearInterval(stop);
            else clearInterval(stop);
        }, 1e2);
    }
    $tm.onload = delAds;

    //首页
    $tm.urlFunc(/www.bilibili.com\/$/, () => {
        $('main').nodeListener(async function () {
            this.$('section', 1).filter(e => {
                let a = e.$('a');
                if (a) return a.id == '推广';
            }).forEach(e => e.style.display = 'none');
        });
    });

    // 视频功能
    function vtip(text, sign) {
        sign ??= text;
        const area = $('.bpx-player-tooltip-area');
        const elm = area.$('.bpx-player-tooltip-item', 1).find(e => e.sign == sign)
            ?? area.appendChild($tm.addElms({
                arr: [{
                    tag: 'div', className: 'bpx-player-tooltip-item', sign,
                    style: `position: relative;top: -310px;margin: auto;visibility: visible;opacity: 1;`,
                    innerHTML: `<div class="bpx-player-tooltip-title"></div>`,
                    update(text) {
                        elm.$('.bpx-player-tooltip-title').innerHTML = text;
                        this.stop && clearTimeout(this.stop);
                        this.stop = setTimeout(() => this.remove(), 2.5e3);
                    },
                }]
            })[0]);
        elm.update(text);
    }
    function buttonGroup(configs) {
        const group = $tm.addElmsGroup({
            box: {
                id: '视频功能组',
                style: `position: absolute;left: -10px;top: 0px;z-index: 0;
                        display: flex;flex-direction: column;align-items: stretch;
                        border-radius: 5px;border: 1px solid #888;
                        opacity: 0.4;transition: 300ms;`,
                onmouseenter() { this.style.opacity = '1'; this.style.left = '-' + getComputedStyle(this).width; },
                onmouseleave() { this.style.opacity = '0.4'; this.style.left = '-10px'; },
                update() {
                    this.children.forEach(e => {
                        const btn = e.$('input');
                        btn.panel = e.panel = e.$('div[title=参数面板]');
                        btn.panel.btn = btn;
                        btn.update?.();
                    });
                },
                debug() {
                    $tm.onload = () => {
                        this.onmouseenter();
                        this.onmouseleave = null;
                    };
                }
            },
            arr: configs.map(e => {
                //参数面板
                e.panel ??= {};
                Object.assign(e.panel.box ?? e.panel, {
                    title: '参数面板',
                    init() { this.style.cssText += 'font-size: 12px;display: none;'; }
                });
                //功能块
                return {
                    box: {},
                    arr: [Object.assign({
                        tag: 'input', type: 'button',
                        style: `border-radius: 5px;border: none;border-bottom: 1px solid #aaa;padding: 5px 10px;
                            background-color: #eee;font-size: 15px;outline: none;`,
                    }, e), e.panel],
                    defaults: {
                        init() {
                            this.name ??= '';
                            this.title ||= this.name;
                            this.value ||= this.name;
                            this.style.cssText += this.addStyle ?? '';
                        }
                    }
                }
            }),
            defaults: {
                style: 'display: flex;flex-direction: column;',
                oncontextmenu(e) {
                    const style = this.panel.style;
                    style.display = style.display == 'none' ? 'flex' : 'none';
                    this.parentElement.onmouseenter();
                    e.preventDefault();
                },
            }
        });
        $tm.onload = () => {
            $('#bilibili-player').insertBefore(group, $('#bilibili-player').children[0]);
            group.update();
        };
        return group;
    }
    const globalBtnArr = [{
        name: '截图',
        onclick() {
            const _this = this;
            !function () {
                const elm = $('.bpx-player-video-wrap>*');
                switch (elm.tagName) {
                    case 'VIDEO': return Object.assign(document.createElement('canvas'), {
                        width: elm.videoWidth,
                        height: elm.videoHeight,
                        init() {
                            this.getContext('2d').drawImage(elm, 0, 0);
                            return this;
                        }
                    }).init();
                    case 'BWP-VIDEO': return elm.getRenderCanvas();
                }
            }().toBlob(blob => {
                _this.panel.$('input[type=radio]', 1).find(e => e.checked).value == '本地' ?
                    $tm.download(blob) :
                    navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(e => vtip('已截图'));
            }, 'image/png');
        },
        panel: {
            box: { style: 'justify-content: space-evenly;' },
            arr: [{ innerHTML: '剪切板', }, { innerHTML: '本地', }],
            defaults: {
                tag: 'label',
                style: 'padding: 5px;',
                init() { this.innerHTML += `<input type="radio" name="capture" value="${this.innerHTML}" ${this.innerHTML == '剪切板' ? 'checked' : ''}>`; }
            }
        }
    }, {
        name: '录制',
        onclick() {
            const states = {
                'inactive': {
                    text: '●', color: 'red',
                    fn() {
                        this.update();
                        this.recorder.start();
                    },
                },
                'recording': {
                    text: '▶', color: 'blue',
                    fn() {
                        this.recorder.pause();
                    },
                },
                'paused': {
                    text: '●', color: 'red',
                    fn() {
                        this.recorder.resume();
                    },
                },
            }
            const { fn, text, color } = states[this.recorder.state];
            fn.call(this);
            this.value = text;
            this.style.color = color;
        },
        ondblclick() {
            this.value = '录制';
            this.style.color = '';
            this.recorder.stop();
        },
        panel: {
            box: {
                style: 'padding: 5px;flex-direction: column;',
            },
            arr: [{
                tag: 'cite',
            }, {
                box: {
                    tag: 'label',
                    innerHTML: '是否转化格式',
                    title: '不建议勾选\n还不如用格式工厂',
                },
                arr: [{
                    tag: 'input',
                    type: 'checkbox',
                    // checked: true,
                }]
            }]
        },
        update() {
            const elm = $('.bpx-player-video-wrap>*');
            this.panel.$('cite').innerHTML = elm.tagName;
            if (elm.tagName == 'VIDEO') {
                this.recorder = Object.assign(new MediaRecorder(elm.captureStream()), {
                    ondataavailable: ({ data: blob }) => {
                        if (this.panel.$('input[type=checkbox]').checked) {
                            $tm.libs['FFmpeg'].use().then(async () => {
                                const ffmpeg = FFmpeg.createFFmpeg({});
                                await ffmpeg.load();
                                const timer = $tm.timer({ log(ts) { vtip(`正在转换格式${blob.type} ${parseInt(ts / 1e3)}s`, '录制-转换格式'); } });
                                timer.start(); //开始计时
                                ffmpeg.FS('writeFile', 'input.mkv', new Uint8Array(await blob.arrayBuffer()));
                                await ffmpeg.run('-i', 'input.mkv', '-c:v', 'copy', '-c:a', 'aac', '-f', 'mp4', 'output.mp4');
                                timer.stop(); //停止计时
                                return ffmpeg.FS('readFile', 'output.mp4').buffer;
                            }).then(buffer => {
                                $tm.download(new Blob([buffer], { type: 'video/mp4' }));
                            }).catch(console.error);
                        } else $tm.download(blob);
                    }
                });
            } else {
                this.style.opacity = 0.4;
                this.title = '无法录制\n请更改视频播放设置\n播放设置-播放策略-AVC';
            }
        },
    }];
    $tm.urlFunc(/www.bilibili.com\/video/, () => {
        // 页面内跳转
        $('.bpx-player-video-wrap').nodeListener(function () {
            setTimeout(e => {
                btnGrp.update();
                if (document.URL.includes(vd().bvid)) vtip('功能组已更新');
            }, 1000);
        }, { childList: true, subtree: true, attributes: true });
        // sm号换为nico视频
        $('#v_desc')?.nodeListener(function () {
            this.$('a', 1).forEach(a => {
                if (/sm\d+/.test(a.innerText)) a.href = `https://www.nicovideo.jp/watch/${a.innerText}`;
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
        // 屏蔽
        $('.bpx-player-cmd-dm-wrap').style.display = 'none';
        // 功能组
        if (!__INITIAL_STATE__.videoData) throw 'window.__INITIAL_STATE__.videoData 失效';
        const vd = () => __INITIAL_STATE__.videoData;
        const btnGrp = buttonGroup([...globalBtnArr, {
            name: '封面',
            onclick() { open(vd().pic) },
            panel: {
                box: {},
                arr: [{
                    tag: 'img',
                }]
            },
            update() { this.panel.$('img').src = vd().pic + '@150w_150h.jpg'; }
        }, {
            name: '下载',
            onclick() {
                // https://socialsisteryi.github.io/bilibili-API-collect/docs/video/videostream_url.html
                !async function () {
                    // 请求流地址
                    const { cid, page } = getPageData();
                    const default_params_obj = {
                        cid,
                        bvid: vd().bvid,
                    }, panel_params_obj = this.panel.$('select', 1).reduce((acc, e) => {
                        acc[e.name] = +e.value;
                        return acc;
                    }, {});
                    const total_params_obj = Object.assign(default_params_obj, panel_params_obj);
                    console.log('流地址请求参数', total_params_obj);
                    const { data, message } = await fetch('https://api.bilibili.com/x/player/playurl?' + new URLSearchParams(total_params_obj).toString(), { credentials: 'include', }).then(res => res.json());
                    const { durl, dash } = data;
                    // 获取文件
                    const fliename = [vd().title, vd().owner.name, 'p' + page, null].join('-');
                    if (durl) {
                        if (data.quality == total_params_obj.qn) {
                            getBlob(durl[0].url).then(blob => $tm.download(blob, 'mp4', fliename));
                        } else alert('mp4格式仅支持以下清晰度:\n' + data.accept_description.join('\n'));
                    } else {
                        const vUrl = dash.video.find(e => e.id == total_params_obj.qn && e.codecid == total_params_obj.codecid)?.baseUrl,
                            aUrl = dash.audio.find(e => e.id == total_params_obj.audio_qn)?.baseUrl;
                        //是否转换格式
                        if (this.panel.$('input[type=checkbox]').checked) {
                            await $tm.libs['FFmpeg'].use();
                            const ffmpeg = FFmpeg.createFFmpeg({});
                            await ffmpeg.load();
                            vtip('FFmpeg加载完毕');
                            //下载不同内容
                            switch (total_params_obj.content) {
                                case 0: convertFormat(Promise.all([
                                    getBlob(vUrl, 'video'),
                                    getBlob(aUrl, 'audio'),
                                ]), 'video/mp4', 'mp4', ['-c:v', 'copy', '-c:a', 'copy']); break;
                                case 1: convertFormat(getBlob(vUrl, 'video'), 'video/mp4', 'mp4', ['-vn', '-acodec', 'libmp3lame']); break;
                                case 2: convertFormat(getBlob(aUrl, 'audio'), 'audio/mpeg', 'mp3', ['-an', '-c', 'copy']); break;
                            }
                            async function convertFormat(promise, MIMEtype, newFormat, convertArgs) {
                                const res = await promise;
                                if (res instanceof Blob) res = [res];
                                const fileArgs = await Promise.all(res.map(async (blob, i) => {
                                    const name = i + '.m4s';
                                    ffmpeg.FS('writeFile', name, new Uint8Array(await blob.arrayBuffer()));
                                    return ['-i', name];
                                }));
                                const timer = $tm.timer({ log(ts) { vtip(`正在转换格式${newFormat} ${parseInt(ts / 1e3)}s`, '转换格式'); } });
                                timer.start();
                                await ffmpeg.run(...fileArgs.flat(), ...convertArgs, '-f', newFormat, 'output');
                                timer.stop();
                                const buffer = await ffmpeg.FS('readFile', 'output').buffer;
                                $tm.download(new Blob([buffer], { type: MIMEtype }), newFormat, fliename);
                            }
                        } else {
                            switch (total_params_obj.content) {
                                case 0: {
                                    Promise.all([
                                        getBlob(vUrl, 'video'),
                                        getBlob(aUrl, 'audio'),
                                    ]).then(([vBlob, aBlob]) => {
                                        $tm.download(vBlob, 'm4s', fliename + 'video');
                                        $tm.download(aBlob, 'm4s', fliename + 'audio');
                                    }); break;
                                }
                                case 1: getBlob(vUrl, 'video').then(blob => $tm.download(blob, 'm4s', fliename + 'video')); break;
                                case 2: getBlob(aUrl, 'audio').then(blob => $tm.download(blob, 'm4s', fliename + 'audio')); break;
                            }
                        }
                    }
                }.call(this).catch(errorFn);
                function getPageData() {
                    // 分p数据
                    const pageNum = +new URL(document.URL).searchParams.get('p');
                    if (pageNum) return vd().pages[pageNum - 1];
                    else return vd().pages[0];
                }
                async function getBlob(url, sign = 'data') {
                    vtip(`请求流地址 ${sign}`);
                    if (!url) return errorFn('找不到流地址\n' + sign);
                    const { headers, body, ok, status, statusText } = await fetch(url);
                    if (!ok) return errorFn(`请求失败 ${status} ${statusText}`);
                    // return await res.blob();
                    return await new Promise((resolve, reject) => {
                        const totalBytes = +headers.get('content-length');
                        let downloadBytes = 0;
                        let chunks = [];
                        const reader = body.getReader();
                        const throttle = vtip.throttle(1e3); //节流 定时执行
                        !function pump() {
                            reader.read().then(({ value, done }) => {
                                if (done) {
                                    vtip.throttle(1e3)(`获取完成${sign}`, sign);
                                    resolve(new Blob(chunks));
                                    return;
                                }
                                downloadBytes += value.length;
                                chunks.push(value);
                                throttle(`正在获取资源${sign} ${(1e2 * downloadBytes / totalBytes).toFixed(0)}%`, sign);
                                pump();
                            }).catch(reject);
                        }();
                    });
                }
                function errorFn(e) {
                    vtip(`<i style="font-size: 10px;color: yellow;">${e}</i> `);
                    console.error(e);
                    return Promise.reject(e);
                }
            },
            panel: {
                box: { style: 'flex-direction: column;padding: 5px;' },
                arr: [{
                    innerHTML: '视频格式', title: '', name: 'fnval', arr: [['mp4', 1], ['m4s', 16, true]]
                }, {
                    innerHTML: '清晰度', title: '', name: 'qn', arr: [['240p', 6], ['360p', 16], ['480p', 32], ['720p', 64, true], ['720p60', 74], ['1080p', 80], ['1080p+', 112], ['1080p60', 116], ['4k', 120], ['HDR', 125], ['杜比视界', 126], ['8k', 127]]
                }, {
                    innerHTML: '视频编码', title: '仅在m4s格式下有效', name: 'codecid', arr: [['AVC', 7], ['HEVC', 12], ['AV1', 13]]
                }, {
                    innerHTML: '音频音质', title: '仅在m4s格式下有效', name: 'audio_qn', arr: [['64k', 30216], ['132k', 30232, true], ['192k', 30280], ['杜比全景声', 30250], ['Hi-Res无损', 30251]]
                }, {
                    innerHTML: '下载内容', title: '仅在m4s格式下有效', name: 'content', arr: [['全部', 0, true], ['视频', 1], ['音频', 2]]
                }].map(({ innerHTML, title, name, arr }) => {
                    return {
                        box: { title, style: 'display: flex;justify-content: space-between;margin-top: 5px;' },
                        arr: [{
                            tag: 'label', innerHTML, style: 'padding-right: 5px;',
                        }, {
                            box: { tag: 'select', name, style: 'outline: none;width: 50px;', },
                            arr: arr.map(([innerHTML, value, selected]) => { return { innerHTML, value, selected } }),
                            defaults: { tag: 'option', }
                        }],
                    }
                }).concat({
                    box: {
                        tag: 'label',
                        innerHTML: '是否转化格式',
                    },
                    arr: [{
                        tag: 'input',
                        type: 'checkbox',
                        checked: true,
                    }]
                })
            },
        }, {
            name: '倍速',
            onclick() {
                let max = prompt('设置最大值') || '3';
                if (+max > 16) max = '16';
                this.panel.$('input').max = max;
            },
            panel: {
                box: {},
                arr: [{
                    tag: 'input', type: 'range',
                    step: '0.1', min: '0', max: '3', value: '1',
                    style: 'margin: 5px;width: -webkit-fill-available;',
                    oninput() {
                        const v = +this.value;
                        $('.bpx-player-video-wrap>*').playbackRate = v;
                        this.parentElement.btn.value = v.toFixed(1) + 'x';
                    },
                }],
            }
        }, {
            name: '搬运',
            onclick() {
                $tm.postMessage({
                    url: 'https://www.mfuns1.cn',
                    data: vd().bvid,
                    signal: 'OK',
                    func(d) { vtip(`发送${d}`) },
                }).then(e => vtip('停止发送'));
            }
        }]);
        // btnGrp.debug();
    });

    //番剧
    $tm.urlFunc(/www.bilibili.com\/bangumi/, () => {
        $('#bilibili-player').nodeListener(function () { return this.$('.bpx-player-toast-wrap').style.display = 'none'; });
        const btnGrp = buttonGroup(globalBtnArr);
        // btnGrp.debug();
    });

    //选中动态文字不跳转
    window.addEventListener('click', e => {
        const elm = e.target;
        const match = 'class="bili-rich-text__content';
        if ((elm.tagName == 'SPAN' && elm.parentElement.outerHTML.includes(match))
            || elm.outerHTML.includes(match)) {
            // e.stopImmediatePropagation();
            e.stopPropagation();
            // e.preventDefault();
        }
    }, true);

})();
