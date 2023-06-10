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
    function vtip(text, sign) {
        sign ??= text;
        const area = $('.bpx-player-tooltip-area');
        const elm = [...area.$('.bpx-player-tooltip-item', 1)].find(e => e.sign == sign)
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
                        if (!btn.onclick) btn.style.backgroundColor = '#eff';
                        btn.panel = e.panel = e.$('div[title=参数面板]');
                        btn.panel.btn = btn;
                        btn.update?.();
                    });
                },
                debug() {
                    $tm.onloadFuncs.push(e => {
                        this.onmouseenter();
                        this.onmouseleave = null;
                    });
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
        $tm.onloadFuncs.push(e => {
            $('#bilibili-player').insertBefore(group, $('#bilibili-player').children[0]);
            group.update();
        });
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
                [..._this.panel.$('input[type=radio]', 1)].find(e => e.checked).value == '本地' ?
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
            const actions = {
                'inactive': { fn: 'start', text: '●', color: 'red' },
                'recording': { fn: 'pause', text: '▶', color: 'blue' },
                'paused': { fn: 'resume', text: '●', color: 'red' },
            }
            const state = actions[this.recorder.state];
            this.recorder[state.fn]();
            this.value = state.text;
            this.style.color = state.color;
        },
        ondblclick() {
            this.recorder.stop();
            this.value = '录制';
            this.style.color = '';
            this.recorder.ondataavailable = ({ data: blob }) => {
                if (this.panel.$('input[type=checkbox]').checked) {
                    $tm.useLib('FFmpeg').then(async () => {
                        const ffmpeg = FFmpeg.createFFmpeg({});
                        await ffmpeg.load();
                        const timer = new $tm.timer({ log(ts) { vtip(`正在转换格式 ${parseInt(ts / 1e3)}s`, '转换格式'); } });
                        timer.start(); //开始计时
                        ffmpeg.FS('writeFile', 'input', new Uint8Array(await blob.arrayBuffer()));
                        await ffmpeg.run('-i', 'input', '-c:v', 'libx264', '-c:a', 'aac', '-preset', 'fast', '-r', '30', '-f', 'mp4', 'output.mp4');
                        timer.stop(); //停止计时
                        return ffmpeg.FS('readFile', 'output.mp4').buffer;
                    }).then(buffer => {
                        $tm.download(new Blob([buffer], { type: 'video/mp4' }));
                    }).catch(console.error);
                } else $tm.download(blob);
            };
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
                },
                arr: [{
                    tag: 'input',
                    type: 'checkbox',
                    checked: true,
                }]
            }]
        },
        update() {
            const elm = $('.bpx-player-video-wrap>*');
            this.recorder = new MediaRecorder((function () {
                switch (elm.tagName) {
                    case 'VIDEO': return elm;
                    case 'BWP-VIDEO': return elm.getRenderCanvas();
                }
            })().captureStream());
            this.panel.$('cite').innerHTML = elm.tagName;
        }
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
                const obj = {}
                this.panel.$('select', 1).forEach(e => obj[e.name] = +e.value);
                Object.assign(this.params, obj);
                console.log('流地址请求参数', this.params);
                fetch('https://api.bilibili.com/x/player/playurl?' + new URLSearchParams(this.params).toString(), { credentials: 'include', })
                    .then(res => res.json())
                    .then(({ data, message }) => {
                        // vtip('成功获取流地址');
                        const { durl, dash } = data;
                        const base = [vd().title, vd().owner.name, null].join('-');
                        if (durl) {
                            if (data.quality == this.params.qn) {
                                request(durl[0].url).then(blob => $tm.download(blob, 'mp4', base));
                            } else alert('mp4格式仅支持以下清晰度:\n' + data.accept_description.join('\n'));
                        } else {
                            const vUrl = dash.video.find(e => e.id == this.params.qn && e.codecid == this.params.codecid)?.baseUrl,
                                aUrl = dash.audio.find(e => e.id == this.params.audio_qn)?.baseUrl;
                            //是否转换格式
                            if (this.panel.$('input[type=checkbox]').checked) {
                                $tm.useLib('FFmpeg').then(async () => {
                                    const ffmpeg = FFmpeg.createFFmpeg({});
                                    await ffmpeg.load();
                                    vtip('FFmpeg加载完毕');
                                    //下载不同内容
                                    switch (this.params.content) {
                                        case 0: {
                                            Promise.all([
                                                request(vUrl, 'video'),
                                                request(aUrl, 'audio'),
                                            ]).then(async ([vBlob, aBlob]) => {
                                                const timer = new $tm.timer({ log(ts) { vtip(`正在合并音视频 ${parseInt(ts / 1e3)}s`, '合并'); } });
                                                timer.start();
                                                ffmpeg.FS('writeFile', 'video.m4s', new Uint8Array(await vBlob.arrayBuffer()));
                                                ffmpeg.FS('writeFile', 'audio.m4s', new Uint8Array(await aBlob.arrayBuffer()));
                                                await ffmpeg.run('-i', 'video.m4s', '-i', 'audio.m4s', '-c:v', 'copy', '-c:a', 'copy', '-f', 'mp4', 'output.mp4');
                                                timer.stop();
                                                return ffmpeg.FS('readFile', 'output.mp4').buffer;
                                            }).then(buffer => {
                                                $tm.download(new Blob([buffer], { type: 'video/mp4' }), 'mp4', base);
                                            }).catch(errorFn); break;
                                        }
                                        case 1: convertFormat(request(vUrl, 'video'), 'video/mp4', 'mp4'); break;
                                        case 2: convertFormat(request(aUrl, 'audio'), 'audio/mpeg', 'mp3'); break;
                                    }
                                    function convertFormat(promise, MIMEtype, newFormat, oldFormat = 'm4s') {
                                        const args = MIMEtype.includes('audio') ? ['-vn', '-acodec', 'libmp3lame'] : ['-an', '-c', 'copy'];
                                        promise.then(async blob => {
                                            const timer = new $tm.timer({ log(ts) { vtip(`正在转换格式${newFormat} ${parseInt(ts / 1e3)}s`, '转换格式'); } });
                                            timer.start();
                                            ffmpeg.FS('writeFile', 'input.' + oldFormat, new Uint8Array(await blob.arrayBuffer()));
                                            await ffmpeg.run('-i', 'input.' + oldFormat, ...args, '-f', newFormat, 'output.' + newFormat);
                                            timer.stop();
                                            return ffmpeg.FS('readFile', 'output.' + newFormat).buffer;
                                        }).then(buffer => {
                                            $tm.download(new Blob([buffer], { type: MIMEtype }), newFormat, base);
                                        }).catch(errorFn);
                                    }
                                });
                            } else {
                                switch (this.params.content) {
                                    case 0: {
                                        Promise.all([
                                            request(vUrl, 'video'),
                                            request(aUrl, 'audio'),
                                        ]).then(([vBlob, aBlob]) => {
                                            $tm.download(vBlob, 'm4s', base + 'video');
                                            $tm.download(aBlob, 'm4s', base + 'audio');
                                        }).catch(errorFn); break;
                                    }
                                    case 1: request(vUrl, 'video').then(blob => $tm.download(blob, 'm4s', base + 'video')).catch(errorFn); break;
                                    case 2: request(aUrl, 'audio').then(blob => $tm.download(blob, 'm4s', base + 'audio')).catch(errorFn); break;
                                }
                            }
                        }
                    }).catch(errorFn);
                async function request(url, sign = '') {
                    if (!url) return Promise.reject('找不到流地址\n' + sign);
                    try {
                        const timer = new $tm.timer({ log(ts) { vtip(`正在请求流地址${sign} ${parseInt(ts / 1e3)}s`, sign); } });
                        timer.start();
                        const res = await fetch(url);
                        const blob = await res.blob();
                        timer.stop();
                        return blob;
                    } catch (e) {
                        return errorFn(e);
                    }
                }
                function errorFn(e) {
                    vtip(e);
                    throw e;
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
            update() {
                this.params = {
                    cid: vd().cid,
                    bvid: vd().bvid,
                    qn: 64,
                    fnval: 16,
                };
            },
        }, {
            name: '倍速',
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
                    ondblclick() { this.max = prompt('max:') || '3' },
                }],
            }
        }, , {
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
