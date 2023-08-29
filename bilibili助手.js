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
    function deleteADs() {
        if (self != top) return; // 不在iframe内执行
        // 页面元素
        $tm.invokeUntilNoError = function bodyADs() {
            const ads = [
                '.ad-report', //视频-广告
                '#slide_ad', //视频-广告
                '.pop-live-small-mode', //视频-mini直播
                '.activity-banner', //活动
                '#activity_vote', //活动
                '.eva-banner', //横向广告
                '.banner-card', //横向广告-老版
                '.gg-floor-module', //番剧
                '.vipPaybar_container__GsBut', //番剧大会员
                '.bili-dyn-ads', //动态广告
                // '.reply-notice', //通知
            ].flatMap(e => $(e, 1)).filter(e => e);
            if (ads.some(ad => ad.style.display != 'none')) {
                ads.forEach(ad => ad.style.display = 'none');
                throw '再次执行';
            } else {
                console.log('bili广告元素', ads);
            }
        };
        // 顶部元素
        $tm.invokeUntilNoError = function headerADs() {
            const li = $('.right-entry > li')
            const ads = [
                '.vip-wrap', //顶部按钮-大会员
                '.vip-entry-containter', //信息面板-大会员
            ].flatMap(e => $(e, 1)).filter(e => e);
            if (ads.length == 2) {
                ads.forEach(e => e.style.display = 'none');
                console.log('bili广告元素', ads);
            } else {
                li._vei.onMouseenter({});
                li._vei.onMouseleave({});
                throw '再次执行';
            }
        };
        // 首页
        $tm.invokeUntilNoError = function homeADs() {
            if (location.host == 'www.bilibili.com' && location.pathname == '/') {
                const sectionIDs = ['推广', '赛事'];
                const ads = $('section', 1).filter(e => sectionIDs.includes(e.$('a')?.id))
                if (ads.length != 0) {
                    ads.forEach(e => e.style.display = 'none');
                } else {
                    throw '再次执行';
                }
            };
        };
    }
    deleteADs();

    // 视频功能
    function wideScreenFn(selector) {
        $('.bpx-player-control-wrap').nodeListener(function () {
            const btn = $(selector);
            if (btn) {
                const _onclick = btn.onclick;
                btn.onclick = function (e) {
                    _onclick?.call(this, e);
                    const lightOff = !player.getLightOff();
                    const videoQuality = [16, 64][+lightOff]; //720p/360p
                    player.setLightOff(lightOff); //开关灯
                    if (player.getQuality().nowQ != videoQuality) {
                        player.requestQuality(videoQuality);
                    }
                };
                return 1;
            }
        });
    }
    function tooltip(text) {
        const hasTooltip = player.tooltip.update('shortcut', { title: text });
        hasTooltip || player.tooltip.create({
            title: text,
            name: 'shortcut',
            position: 5,
            target: player.getElements().videoArea,
        });
    }
    const toast = function () {
        const sign_iid_pairs = new Map();
        return function (text, sign) {
            if (sign_iid_pairs.has(sign)) {
                const iid = sign_iid_pairs.get(sign);
                const hasToast = player.toast.update(iid, { text });
                if (hasToast) {
                    return iid;
                }
            }
            const iid = player.toast.create({ text });
            sign && sign_iid_pairs.set(sign, iid);
            return iid;
        }
    }();
    function buttonGroup(configs) {
        const group = $tm.addElmsGroup({
            box: {
                id: '视频功能组',
                style: `position: absolute;left: -10px;top: 0px;z-index: 0;
                        display: flex;flex-direction: column;align-items: stretch;
                        border-radius: 5px;border: 1px solid #888;
                        opacity: 0.4;transition: 300ms;`,
                onmouseenter() {
                    this.style.opacity = '1';
                    this.style.left = '-' + getComputedStyle(this).width;
                },
                onmouseleave() {
                    this.style.opacity = '0.4';
                    this.style.left = '-10px';
                },
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
                    init() {
                        this.style.cssText += 'font-size: 12px;display: none;';
                    }
                });
                //功能块
                return {
                    box: {},
                    arr: [Object.assign({
                        tag: 'input',
                        type: 'button',
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
        const playerElm = $('#bilibili-player');
        playerElm.insertBefore(group, playerElm.children[0]);
        return group;
    }
    const publicBtnArr = [
        {
            name: '截图',
            onclick() {
                const _this = this;
                !function () {
                    const videoElm = player.mediaElement();
                    switch (videoElm.tagName) {
                        case 'VIDEO':
                            return Object.assign(document.createElement('canvas'), {
                                width: videoElm.videoWidth,
                                height: videoElm.videoHeight,
                                init() {
                                    this.getContext('2d').drawImage(videoElm, 0, 0);
                                    return this;
                                }
                            }).init();
                        case 'BWP-VIDEO':
                            return videoElm.getRenderCanvas();
                    }
                }().toBlob(blob => {
                    _this.panel.$('input[type=radio]', 1).find(e => e.checked).value == '本地'
                        ? $tm.download(blob)
                        : navigator.clipboard.write([new ClipboardItem({
                            'image/png': blob
                        })]).then(e => tooltip('已截图'));
                }, 'image/png');
            },
            panel: {
                box: {
                    style: 'justify-content: space-evenly;'
                },
                arr: [{
                    innerHTML: '剪切板',
                }, {
                    innerHTML: '本地',
                }],
                defaults: {
                    tag: 'label',
                    style: 'padding: 5px;',
                    init() {
                        this.innerHTML += `<input type="radio" name="capture" value="${this.innerHTML}" ${this.innerHTML == '剪切板' ? 'checked' : ''}>`;
                    }
                }
            }
        }, {
            name: '录制',
            onclick() {
                const states = {
                    'inactive': {
                        text: '●',
                        color: 'red',
                        fn() {
                            this.update();
                            this.recorder.start();
                        },
                    },
                    'recording': {
                        text: '▶',
                        color: 'blue',
                        fn() {
                            this.recorder.pause();
                        },
                    },
                    'paused': {
                        text: '●',
                        color: 'red',
                        fn() {
                            this.recorder.resume();
                        },
                    },
                }
                const {
                    fn,
                    text,
                    color
                } = states[this.recorder.state];
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
                        innerHTML: '转化格式',
                        title: '不建议勾选',
                    },
                    arr: [{
                        tag: 'input',
                        type: 'checkbox',
                        // checked: true,
                    }]
                }]
            },
            update() {
                const videoElm = $('.bpx-player-video-wrap>*');
                this.panel.$('cite').innerHTML = videoElm.tagName;
                if (videoElm.tagName == 'VIDEO') {
                    this.recorder = Object.assign(new MediaRecorder(videoElm.captureStream()), {
                        ondataavailable: ({ data: blob }) => {
                            console.log('录制资源', blob);
                            if (this.panel.$('input[type=checkbox]').checked) {
                                $tm.libs['FFmpeg'].use().then(async () => {
                                    const ffmpeg = FFmpeg.createFFmpeg({});
                                    await ffmpeg.load();
                                    ffmpeg.setProgress(({ ratio }) => {
                                        toast(`正在转换格式 ${1e2 * ratio.toFixed(2)}%`, '录制-转换格式');
                                    });
                                    ffmpeg.FS('writeFile', 'input', new Uint8Array(await blob.arrayBuffer()));
                                    await ffmpeg.run('-i', 'input', '-c:v', 'libx264', '-c:a', 'aac', '-f', 'mp4', 'output');
                                    return ffmpeg.FS('readFile', 'output').buffer;
                                }).then(buffer => {
                                    $tm.download(new Blob([buffer], {
                                        type: 'video/mp4'
                                    }));
                                }).catch(console.error);
                            } else
                                $tm.download(blob);
                        }
                    });
                } else {
                    this.style.opacity = 0.4;
                    this.title = '无法录制\n请更改视频播放设置\n播放设置-播放策略-AVC';
                }
            },
        }, {
            name: '倍速',
            onclick() {
                let max = prompt('设置最大值') || '3';
                if (+max > 16)
                    max = '16';
                this.panel.$('input').max = max;
            },
            panel: {
                box: {},
                arr: [{
                    tag: 'input',
                    type: 'range',
                    step: '0.1',
                    min: '0',
                    max: '3',
                    value: '1',
                    style: 'margin: 5px;width: -webkit-fill-available;',
                    oninput() {
                        const v = +this.value;
                        player.mediaElement().playbackRate = v;
                        this.parentElement.btn.value = v.toFixed(1) + 'x';
                    },
                }
                ],
            }
        }];
    $tm.urlFunc(/www.bilibili.com\/video/, () => {
        function vd() {
            const vd = __INITIAL_STATE__.videoData;
            if (vd) {
                return vd;
            } else {
                throw 'vd 失效';
            }
        }
        //再次除广告
        $('.left-container-under-player').nodeListener(function () {
            setTimeout(deleteADs, 1e3);
            return 1;
        }, { childList: true });
        // 页面内跳转
        $('.bpx-player-video-wrap').nodeListener(function () {
            setTimeout(() => {
                deleteADs();
                btnGrp.update();
            }, 1e3);
        }, {
            childList: true,
            subtree: true,
            attributes: true
        });
        // sm号换为nico视频
        $('#v_desc')?.nodeListener(function () {
            this.$('a', 1).forEach(a => {
                if (/sm\d+/.test(a.innerText))
                    a.href = `https://www.nicovideo.jp/watch/${a.innerText}`;
            });
        });
        // 宽屏模式
        wideScreenFn('.bpx-player-ctrl-btn[aria-label=宽屏]');
        // 屏蔽
        $('.bpx-player-cmd-dm-wrap').style.display = 'none';
        // 开字幕
        vd().subtitle.list.length && $('.bpx-player-ctrl-btn[aria-label=字幕]>div>span').click();
        // 按钮组
        const btnGrp = buttonGroup([...publicBtnArr, {
            name: '封面',
            onclick() {
                open(vd().pic)
            },
            panel: {
                box: {},
                arr: [{
                    tag: 'img',
                }]
            },
            update() {
                this.panel.$('img').src = vd().pic + '@150w_150h.jpg';
            }
        }, {
            name: '下载',
            onclick() {
                // https://socialsisteryi.github.io/bilibili-API-collect/docs/video/videostream_url.html
                !async function () {
                    // 请求流地址
                    const { cid, page } = getPageData();
                    const default_params_obj = { cid, bvid: vd().bvid, },
                        panel_params_obj = this.panel.$('select', 1).reduce((acc, e) => {
                            acc[e.name] = +e.value;
                            return acc;
                        }, {});
                    const params_obj = Object.assign(default_params_obj, panel_params_obj);
                    toast('请求流地址');
                    console.log('流地址请求参数', params_obj);
                    const { data, message } = await fetch('https://api.bilibili.com/x/player/playurl?' + new URLSearchParams(params_obj).toString(), {
                        credentials: 'include',
                    }).then(res => res.json());
                    const { durl, dash } = data;
                    // 获取文件
                    const fliename = [vd().title, vd().owner.name, 'p' + page, null].join('-');
                    if (durl) {
                        if (data.quality == params_obj.qn) {
                            getBlob(durl[0].url).then(blob => $tm.download(blob, 'mp4', fliename));
                        } else
                            alert('mp4格式仅支持以下清晰度:\n' + data.accept_description.join('\n'));
                    } else {
                        const vUrl = dash.video.find(e => e.id == params_obj.qn && e.codecid == params_obj.codecid)?.baseUrl,
                            aUrl = dash.audio.find(e => e.id == params_obj.audio_qn)?.baseUrl;
                        //是否转换格式
                        if (this.panel.$('input[type=checkbox]').checked) {
                            toast('加载FFmpeg');
                            await $tm.libs['FFmpeg'].use();
                            const ffmpeg = FFmpeg.createFFmpeg({});
                            await ffmpeg.load();
                            //下载不同内容
                            switch (params_obj.content) {
                                case 0:
                                    convertFormat(Promise.all([
                                        getBlob(vUrl, 'video'),
                                        getBlob(aUrl, 'audio'),
                                    ]), 'video/mp4', 'mp4', ['-c:v', 'copy', '-c:a', 'copy']);
                                    break;
                                case 1:
                                    convertFormat(getBlob(vUrl, 'video'), 'video/mp4', 'mp4', ['-vn', '-acodec', 'libmp3lame']);
                                    break;
                                case 2:
                                    convertFormat(getBlob(aUrl, 'audio'), 'audio/mpeg', 'mp3', ['-an', '-c', 'copy']);
                                    break;
                            }
                            async function convertFormat(promise, MIMEtype, newFormat, convertArgs) {
                                const blobs = await promise; // blob[] | blob
                                const fileArgs = await Promise.all([blobs].flat().map(async (blob, i) => {
                                    const name = i + '.m4s';
                                    ffmpeg.FS('writeFile', name, new Uint8Array(await blob.arrayBuffer()));
                                    return ['-i', name];
                                }));
                                ffmpeg.setProgress(({ ratio }) => {
                                    toast(`正在转换格式${newFormat} ${1e2 * ratio.toFixed(2)}%`, '下载-转换格式');
                                });
                                await ffmpeg.run(...fileArgs.flat(), ...convertArgs, '-f', newFormat, 'output');
                                const buffer = await ffmpeg.FS('readFile', 'output').buffer;
                                $tm.download(new Blob([buffer], {
                                    type: MIMEtype
                                }), newFormat, fliename);
                            }
                        } else {
                            switch (params_obj.content) {
                                case 0: {
                                    Promise.all([
                                        getBlob(vUrl, 'video'),
                                        getBlob(aUrl, 'audio'),
                                    ]).then(([vBlob, aBlob]) => {
                                        $tm.download(vBlob, 'm4s', fliename + 'video');
                                        $tm.download(aBlob, 'm4s', fliename + 'audio');
                                    });
                                    break;
                                }
                                case 1:
                                    getBlob(vUrl, 'video').then(blob => $tm.download(blob, 'm4s', fliename + 'video'));
                                    break;
                                case 2:
                                    getBlob(aUrl, 'audio').then(blob => $tm.download(blob, 'm4s', fliename + 'audio'));
                                    break;
                            }
                        }
                    }
                }.call(this).catch(errorFn);
                function getPageData() {
                    // 分p数据
                    const pageNum = +new URL(document.URL).searchParams.get('p');
                    if (pageNum)
                        return vd().pages[pageNum - 1];
                    else
                        return vd().pages[0];
                }
                async function getBlob(url, sign = 'data') {
                    // toast(`获取资源 ${sign}`);
                    if (!url)
                        return errorFn('找不到资源\n' + sign);
                    const {
                        headers,
                        body,
                        ok,
                        status,
                        statusText
                    } = await fetch(url);
                    if (!ok)
                        return errorFn(`获取失败 ${status} ${statusText}`);
                    // return await res.blob();
                    return await new Promise((resolve, reject) => {
                        const totalBytes = +headers.get('content-length');
                        let downloadBytes = 0;
                        let chunks = [];
                        const reader = body.getReader();
                        const freq = 1e2; // 获取进度的周期
                        const toast_throttle = toast.throttle(freq); //节流
                        !function pump() {
                            reader.read().then(({ value, done }) => {
                                if (done) {
                                    resolve(new Blob(chunks));
                                    return;
                                }
                                downloadBytes += value.length;
                                chunks.push(value);
                                toast_throttle(`正在获取资源${sign} ${(1e2 * downloadBytes / totalBytes).toFixed(0)}%`, sign);
                                pump();
                            }).catch(reject);
                        }();
                    });
                }
                function errorFn(e) {
                    toast(e + '');
                    console.error(e);
                    return Promise.reject(e);
                }
            },
            panel: {
                box: {
                    style: 'flex-direction: column;padding: 5px;'
                },
                arr: [{
                    innerHTML: '视频格式',
                    title: '',
                    name: 'fnval',
                    arr: [['mp4', 1], ['m4s', 16, true]]
                }, {
                    innerHTML: '清晰度',
                    title: '',
                    name: 'qn',
                    arr: [['240p', 6], ['360p', 16], ['480p', 32], ['720p', 64, true], ['720p60', 74], ['1080p', 80], ['1080p+', 112], ['1080p60', 116], ['4k', 120], ['HDR', 125], ['杜比视界', 126], ['8k', 127]]
                }, {
                    innerHTML: '视频编码',
                    title: '仅在m4s格式下有效',
                    name: 'codecid',
                    arr: [['AVC', 7], ['HEVC', 12], ['AV1', 13]]
                }, {
                    innerHTML: '音频音质',
                    title: '仅在m4s格式下有效',
                    name: 'audio_qn',
                    arr: [['64k', 30216], ['132k', 30232, true], ['192k', 30280], ['杜比全景声', 30250], ['Hi-Res无损', 30251]]
                }, {
                    innerHTML: '下载内容',
                    title: '仅在m4s格式下有效',
                    name: 'content',
                    arr: [['全部', 0, true], ['视频', 1], ['音频', 2]]
                }].map(({
                    innerHTML,
                    title,
                    name,
                    arr
                }) => ({
                    box: {
                        title,
                        style: 'display: flex;justify-content: space-between;margin-top: 5px;'
                    },
                    arr: [{
                        tag: 'label',
                        innerHTML,
                        style: 'padding-right: 5px;',
                    }, {
                        box: {
                            tag: 'select',
                            name,
                            style: 'outline: none;width: 50px;',
                        },
                        arr: arr.map(([innerHTML, value, selected]) => {
                            return {
                                innerHTML,
                                value,
                                selected
                            }
                        }),
                        defaults: {
                            tag: 'option',
                        }
                    }],
                })).concat({
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
            name: '搬运',
            onclick() {
                const { bvid, desc, pic, title, copyright, owner } = vd();
                $tm.postMessage({
                    url: 'https://www.mfuns.net/create/video',
                    data: {
                        bvid, desc, pic, title, copyright,
                        owner_name: owner.name,
                    },
                    signal: 'mfuns get',
                    fn(data) {
                        tooltip(`发送${data.bvid}`)
                    },
                }).then(e => tooltip('停止发送'));
            }
        }]);
        btnGrp.update();
    });

    //番剧
    $tm.urlFunc(/www.bilibili.com\/bangumi/, () => {
        // 添加功能
        $('#bilibili-player').nodeListener(function () {
            // 屏蔽wrap
            $('.bpx-player-toast-wrap').style.display = 'none';
            // 宽屏模式
            wideScreenFn('.squirtle-video-widescreen');
            // 按钮组
            buttonGroup(publicBtnArr).update();
            return 1;
        });
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
