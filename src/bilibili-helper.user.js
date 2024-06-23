// ==UserScript==
// @name         bilibili助手
// @version      0.1
// @author       Cubxx
// @match        https://*.bilibili.com/*
// @exclude      https://api.bilibili.com/*
// @exclude      https://api.vc.bilibili.com/*
// @updateURL    https://github.com/Cubxx/tampermonkey-script/raw/main/src/bilibili-helper.user.js
// @downloadURL  https://github.com/Cubxx/tampermonkey-script/raw/main/src/bilibili-helper.user.js
// @icon         https://www.bilibili.com/favicon.ico
// @grant        none
// ==/UserScript==

// 事件监听
(function () {
    // 选中富文本不跳转
    document.on(
        'click',
        (e) => {
            const el = /** @type {HTMLSpanElement} */ (e.target);
            const match = 'class="bili-rich-text__content';
            if (
                (el.tagName == 'SPAN' &&
                    el.parentElement?.outerHTML.includes(match)) ||
                el.outerHTML.includes(match)
            ) {
                // e.stopImmediatePropagation();
                e.stopPropagation();
                // e.preventDefault();
            }
        },
        true,
    );
})();

// 删除广告
const deleteADs = function () {
    if (self != top) return; // 不在iframe内执行
    // 页面元素
    (function bodyADs() {
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
            '.reply-notice', //通知
        ].flatMap((e) => document.$$(e));
        if (ads.some((ad) => ad?.['style'].display !== 'none')) {
            ads.forEach((ad) => ad?.hide());
            requestIdleCallback(bodyADs);
        } else {
            console.log('biliAD body', ads);
        }
    })();
    // 顶部元素
    (function headerADs() {
        const li = document.$('.right-entry > li');
        const ads = [
            '.vip-wrap', //顶部按钮-大会员
            '.vip-entry-containter', //信息面板-大会员
        ]
            .flatMap((e) => document.$$(e))
            .filter((e) => e);
        if (ads.length) {
            ads.forEach((e) => e.hide());
            console.log('biliAD header', ads);
        } else {
            li?.['_vei']?.onMouseenter({});
            li?.['_vei']?.onMouseleave({});
            requestIdleCallback(headerADs);
        }
    })();
    // 首页
    (function homeADs() {
        if (location.host == 'www.bilibili.com' && location.pathname == '/') {
            const sectionIDs = ['推广', '赛事', '直播'];
            const ads = document
                .$$('section')
                .filter((e) => sectionIDs.includes(e.$('a')?.id ?? ''));
            if (ads.length != 0) {
                ads.forEach((e) => e.hide());
                console.log('biliAD home', ads);
            } else {
                requestIdleCallback(homeADs);
            }
        }
    })();
};
deleteADs();

// 视频功能
(function () {
    'use strict';
    if (self != top) return;
    const { dom, ui, util, hack } = tm;

    /** @readonly @type {any} */
    let player = window['player'];
    if (!player) {
        Object.defineProperty(window, 'player', {
            set: (v) => (player = v),
            get: () => player,
        });
    }
    const playerEl =
        document.$('#bilibili-player') ??
        util.exit('未启动视频功能: 找不到 #bilibili-player');

    /** @typedef {Parameters<typeof ui.menu.show>[0]} MenuConfigs 按钮配置 */
    /** 节点监听器 */
    const observer = {
        /** @type {Map<string, ((ob: MutationObserver) => void)[]>} */
        listeners: new Map(),
        /**
         * @param {string} selector
         * @param {(ob: MutationObserver) => void} cb
         */
        add(selector, cb) {
            const callbacks = this.listeners.get(selector) ?? [];
            callbacks.push(cb);
            this.listeners.set(selector, callbacks);
        },
        run() {
            this.listeners.forEach((callbacks, selector) => {
                document.$(selector)?.observe(
                    (ob) => {
                        callbacks.forEach((cb) => cb(ob));
                    },
                    { childList: true, subtree: true },
                );
            });
        },
    };
    /** 视频控制器 */
    const tmPlayer = (tm['player'] = {
        /** 更改宽屏回调 @param {string} selector */
        wideScreen(selector) {
            const btn = document.$(/** @type {'button'} */ (selector));
            btn?.on('click', () => {
                const cfg = { lightOff: false, quality: 16 };
                player.setLightOff(util.toggle(cfg, 'lightOff', [true, false]));
                player.requestQuality(util.toggle(cfg, 'quality', [16, 64]));
            });
            return true;
        },
        /** @param {string} text */
        tooltip(text, sign = '') {
            const hasTooltip = player.tooltip.update(sign, { title: text });
            if (hasTooltip) return;
            player.tooltip.create({
                title: text,
                name: sign,
                position: 5,
                target: player.getElements().videoArea,
            });
        },
        toast: (function () {
            /** @type {Map<string, number>} */
            const sign_iid_map = new Map();
            /** @param {string} text */
            return function (text, sign = '') {
                const iid = sign_iid_map.get(sign);
                if (iid) {
                    player.toast.update(iid, { text });
                } else {
                    const iid = player.toast.create({ text });
                    sign_iid_map.set(sign, iid);
                }
            };
        })(),
        setMenu: (function () {
            /** 功能按钮 */
            const FnButton = dom.h(
                's-icon-button',
                {
                    type: 'filled',
                    style: {
                        position: 'absolute',
                        transform: 'translateX(-130%)',
                    },
                },
                [dom.h('s-icon', { type: 'menu' })],
            );
            setTimeout(() =>
                playerEl.insertBefore(FnButton, playerEl.firstElementChild),
            );
            /** 设置显示菜单 @param {MenuConfigs} items */
            return function (items) {
                FnButton.onclick = () => ui.menu.show(items, FnButton);
                // tmPlayer.onRouteChange(() => ui.menu.update(items, FnButton));
            };
        })(),
        onRouteChange: (function () {
            const cbs = [];
            const run = () => {
                requestIdleCallback(() => cbs.forEach((cb) => cb()));
            };
            window.addEventListener('popstate', run);
            hack.override(History.prototype, 'pushState', ({ value }) => ({
                value(...e) {
                    value?.apply(this, e);
                    run();
                },
            }));
            /** 路由变化监听 @param {()=>void} callback */
            return function (callback) {
                cbs.push(callback);
            };
        })(),
    });
    /** 共享按钮 @type {MenuConfigs} */
    const sharedItems = [
        {
            text: '截图',
            onclick() {
                /** @type {HTMLCanvasElement} */
                const canvas = (() => {
                    /** @type {HTMLVideoElement} */
                    const el = player.mediaElement();
                    switch (el.tagName) {
                        case 'VIDEO': {
                            const canvas = dom.h('canvas', {
                                width: el.videoWidth,
                                height: el.videoHeight,
                            });
                            canvas?.getContext('2d')?.drawImage(el, 0, 0);
                            return canvas;
                        }
                        case 'BWP-VIDEO':
                            //@ts-ignore
                            return el.getRenderCanvas();
                    }
                })();
                canvas.toBlob((blob) => {
                    if (!blob) return util.exit('无法生成 blob');
                    ui.confirm.show(
                        '保存至:',
                        '',
                        ['本地', () => tm.download(blob)],
                        [
                            '剪切板',
                            function () {
                                navigator.clipboard.write([
                                    new ClipboardItem({ 'image/png': blob }),
                                ]);
                                tmPlayer.tooltip('已截图');
                            },
                        ],
                    );
                }, 'image/png');
            },
        },
        (function () {
            /** @param {Blob} blob */
            async function convertFormat(blob) {
                await tm.load('FFmpeg', '0.11.6');
                const ffmpeg = window['FFmpeg'].createFFmpeg();
                await ffmpeg.load();
                ffmpeg.setProgress(({ ratio }) => {
                    tmPlayer.toast(
                        `正在转换格式 ${1e2 * ratio.toFixed(2)}%`,
                        '录制-转换格式',
                    );
                });
                ffmpeg.FS(
                    'writeFile',
                    'input',
                    new Uint8Array(await blob.arrayBuffer()),
                );
                await ffmpeg.run(
                    '-i',
                    'input',
                    '-c:v',
                    'libx264',
                    '-c:a',
                    'aac',
                    '-f',
                    'mp4',
                    'output',
                );
                const buffer = await ffmpeg.FS('readFile', 'output').buffer;
                return new Blob([buffer], { type: 'video/mp4' });
            }
            /** @type {MediaRecorder | null} @readonly */
            let recorder = null;
            /** 设置 Recorder */
            function setRecorder() {
                const el = player.mediaElement();
                if (el.tagName !== 'VIDEO') {
                    tmPlayer.tooltip(`${el.tagName} 不支持录制`);
                    return;
                }
                if (recorder) return;
                recorder = new MediaRecorder(el.captureStream());
                recorder.ondataavailable = ({ data: blob }) => {
                    console.log('录制资源', blob);
                    ui.confirm.show(
                        '是否转化格式',
                        '',
                        [
                            '是',
                            function () {
                                convertFormat(blob).then(tm.download, (e) => {
                                    console.error('格式转换失败', e);
                                });
                            },
                        ],
                        ['否', () => tm.download(blob)],
                    );
                };
            }
            setRecorder();
            tmPlayer.onRouteChange(setRecorder);
            /**
             * @type {Record<
             *     RecordingState,
             *     (
             *         this: HTMLElementTagNameMap['s-menu-item'],
             *         recorder: MediaRecorder,
             *     ) => void
             * >}
             */
            const stateConfig = {
                inactive(recorder) {
                    recorder.start();
                },
                recording(recorder) {
                    recorder.pause();
                },
                paused(recorder) {
                    recorder.resume();
                },
            };
            return {
                text: '录制',
                onclick() {
                    if (!recorder) return;
                    //@ts-ignore
                    stateConfig[recorder.state].call(this, recorder);
                },
            };
        })(),
        {
            text: '倍速',
            onclick() {
                const rate = prompt('设置倍速');
                if (rate) {
                    player.mediaElement().playbackRate = +rate;
                }
            },
        },
    ];

    tm.matchURL(/www.bilibili.com\/(video|list\/ml\d+)/, () => {
        /** 状态对象 */
        const _ = {
            get vd() {
                return (
                    window['__INITIAL_STATE__'].videoData ??
                    util.exit('vd 失效')
                );
            },
        };

        // 再次除广告
        document
            .$('.left-container-under-player')
            ?.observe(util.debounce(deleteADs, 10), { childList: true });
        // 页面内跳转
        tmPlayer.onRouteChange(deleteADs);
        // 宽屏模式
        observer.add(
            '.bpx-player-control-wrap',
            (ob) =>
                tmPlayer.wideScreen('.bpx-player-ctrl-btn[aria-label=宽屏]') &&
                ob.disconnect(),
        );
        // 换sm链接
        observer.add('.video-desc-container', () => {
            document
                .$$(/** @type {'a'} */ ('.video-desc-container a'))
                ?.forEach((a) => {
                    if (/sm\d+/.test(a.innerText))
                        a.href = `https://www.nicovideo.jp/watch/${a.innerText}`;
                });
        });
        // 屏蔽
        document.$('.bpx-player-cmd-dm-wrap')?.hide();
        // 开字幕
        if (_.vd.subtitle.list.length) {
            observer.add('.bpx-player-control-wrap', (ob) => {
                const btn = document.$(
                    /** @type {'span'} */ ('.bpx-player-ctrl-subtitle span'),
                );
                if (btn) {
                    player
                        .getElements()
                        .subtitle.$('.bpx-player-subtitle-panel-text') ||
                        btn.click();
                    ob.disconnect();
                }
            });
        }
        observer.run();

        // 按钮组
        function getPageData() {
            const p = new URL(document.URL).searchParams.get('p');
            if (!p) return _.vd.pages[0];
            return _.vd.pages[+p - 1];
        }
        /** @param {string} url */
        async function getBlob(url, sign = 'data') {
            if (!url) throw tmPlayer.toast('请求地址为空 ' + sign);
            const { headers, body, ok, status, statusText } = await fetch(url);
            if (!ok || !headers || !body) {
                throw tmPlayer.toast(`请求失败 ${status} ${statusText}`);
            }
            // return await res.blob();
            const total = +(headers.get('content-length') ?? 0);
            let cur = 0;
            let chunks = [];
            const reader = body.getReader();
            await (async function pump() {
                const { value, done } = await reader.read();
                if (done) return;
                cur += value.length;
                chunks.push(value);
                tmPlayer.toast(
                    `正在取流 ${sign} ${((1e2 * cur) / total).toFixed(2)}%`,
                    sign,
                );
                return pump();
            })();
            return new Blob(chunks);
        }
        /**
         * 请求流地址
         *
         * @typedef {{
         *     id: number;
         *     baseUrl: string;
         *     backupUrl: string[];
         *     mimeType: string;
         *     codecs: string;
         *     codecid: number;
         * }} Dash
         * @param {Partial<{
         *     cid: number;
         *     bvid: string;
         *     fnval: number;
         *     qn: number;
         * }>} [restParams]
         * @returns {Promise<{
         *     quality: number;
         *     accept_quality: number[];
         *     accept_description: string[];
         *     durl: [{ url: string; backup_url: string[] }];
         *     dash: { video: Dash[]; audio: Dash[] };
         * }>}
         * @link https://socialsisteryi.github.io/bilibili-API-collect/docs/video/videostream_url.html
         */
        function getStreamUrl(restParams) {
            const { cid, page } = getPageData();
            const params = Object.assign(
                { cid, bvid: _.vd.bvid, fnval: 16, qn: 64 },
                restParams,
            );
            tmPlayer.toast('请求流地址');
            console.log('流地址请求参数', params);
            return fetch(
                'https://api.bilibili.com/x/player/playurl?' +
                    //@ts-ignore
                    new URLSearchParams(params),
                { credentials: 'include' },
            )
                .then((response) => response.json())
                .then(({ data, message, code }) => data);
        }
        /** @type {MenuConfigs} */
        const btnItems = [
            (function () {
                function update() {
                    const el = ui.menu.el.$(
                        /** @type {'img'} */ ('#tm-menu-cover'),
                    );
                    if (!el) return;
                    el.src = _.vd.pic + '@150w_150h.jpg';
                }
                update();
                tmPlayer.onRouteChange(update);
                return {
                    text: '封面',
                    items: [
                        {
                            text: lit.html`<img id="tm-menu-cover" />`,
                            style: { height: '100px' },
                            onclick() {
                                open(_.vd.pic);
                            },
                        },
                    ],
                };
            })(),
            (function () {
                const config = (tmPlayer['params'] = {
                    /** 视频格式 */
                    fnval: 16,
                    /** 清晰度 */
                    qn: 64,
                    /** 视频编码 */
                    codecid: 7,
                    /** 音频音质 */
                    audio_qn: 30232,
                    /** 下载内容 */
                    content: [true, true],
                });
                /**
                 * @typedef {keyof typeof config} K
                 * @type {{
                 *     [P in Exclude<K, 'content'>]: [
                 *         text: string,
                 *         value: number,
                 *     ][];
                 * }}
                 */
                const options = {
                    fnval: [
                        ['mp4', 1],
                        ['m4s', 16],
                    ],
                    qn: [
                        // ['240p', 6],
                        ['360p', 16],
                        ['480p', 32],
                        ['720p', 64],
                        // ['720p60', 74],
                        ['1080p', 80],
                        // ['1080p+', 112],
                        // ['1080p60', 116],
                        // ['4k', 120],
                        // ['HDR', 125],
                        // ['杜比视界', 126],
                        // ['8k', 127],
                    ],
                    codecid: [
                        ['AVC', 7],
                        ['HEVC', 12],
                        ['AV1', 13],
                    ],
                    audio_qn: [
                        ['64k', 30216],
                        ['132k', 30232],
                        ['192k', 30280],
                        // ['杜比全景声', 30250],
                        // ['Hi-Res无损', 30251],
                    ],
                };
                /** 更新值 */
                const m = (obj, key, prop) => (e) => {
                    obj[key] = e.target[prop];
                };

                // ui
                const toOptionTp = (key, [text, value]) =>
                    lit.html`
<s-segmented-button-item selected=${value === config[key]} ._value=${value}>
${text}</s-segmented-button-item>`;
                const toSelectTp = ([key, options]) =>
                    lit.html`
<s-segmented-button @segmented-button-item:update=${m(config, key, '_value')}>
${options.map((e) => toOptionTp(key, e))}</s-segmented-button>`;
                const toSelectsTp = () =>
                    Object.entries(options).map(toSelectTp);
                const toFormTp = () => lit.html`
<section style="display:grid;gap:15px;justify-items:center;">
${toSelectsTp()}<section>
Video<s-checkbox checked="true" @change=${m(config.content, 0, 'checked')}></s-checkbox>
Audio<s-checkbox checked="true" @change=${m(config.content, 1, 'checked')}></s-checkbox>
</section></section>`;

                /** 转换后下载 @param {Dash} vDash @param {Dash} aDash */
                async function cd(filename, vDash, aDash) {
                    async function cf(
                        promise,
                        MIMEtype,
                        newFormat,
                        convertArgs,
                    ) {
                        const blobs = await promise; // blob[] | blob
                        const fileArgs = await Promise.all(
                            [blobs].flat().map(async (blob, i) => {
                                const name = i + '.m4s';
                                ffmpeg.FS(
                                    'writeFile',
                                    name,
                                    new Uint8Array(await blob.arrayBuffer()),
                                );
                                return ['-i', name];
                            }),
                        );
                        ffmpeg.setProgress(({ ratio }) => {
                            tmPlayer.toast(
                                `正在转换格式${newFormat}document.${
                                    1e2 * ratio.toFixed(2)
                                }%`,
                                '下载-转换格式',
                            );
                        });
                        await ffmpeg.run(
                            ...fileArgs.flat(),
                            ...convertArgs,
                            '-f',
                            newFormat,
                            'output',
                        );
                        const buffer = await ffmpeg.FS('readFile', 'output')
                            .buffer;
                        tm.download(
                            new Blob([buffer], { type: MIMEtype }),
                            filename + newFormat,
                        );
                    }

                    tmPlayer.toast('加载FFmpeg');
                    await tm.load('FFmpeg', '0.11.6');
                    const ffmpeg = window['FFmpeg'].createFFmpeg();
                    await ffmpeg.load();
                    debugger;
                    const { content } = config;
                    if (content.every((e) => e)) {
                        return cf(
                            Promise.all([
                                getBlob(vDash.baseUrl, 'video'),
                                getBlob(aDash.baseUrl, 'audio'),
                            ]),
                            'video/mp4',
                            'mp4',
                            ['-c:v', 'copy', '-c:a', 'copy'],
                        );
                    }
                    if (content[0]) {
                        return cf(
                            getBlob(vDash.baseUrl, 'video'),
                            'video/mp4',
                            'mp4',
                            ['-vn', '-acodec', 'libmp3lame'],
                        );
                    }
                    if (content[1]) {
                        return cf(
                            getBlob(aDash.baseUrl, 'audio'),
                            'audio/mpeg',
                            'mp3',
                            ['-an', '-c', 'copy'],
                        );
                    }
                }
                /** 直接下载 @param {Dash} vDash @param {Dash} aDash */
                function dd(filename, vDash, aDash) {
                    const { content } = config;
                    if (content.every((e) => e)) {
                        return Promise.all([
                            getBlob(vDash.baseUrl, 'video'),
                            getBlob(aDash.baseUrl, 'audio'),
                        ]).then(([vBlob, aBlob]) => {
                            tm.download(vBlob, filename + 'video.m4s');
                            tm.download(aBlob, filename + 'audio.m4s');
                        });
                    }
                    if (content[0]) {
                        return getBlob(vDash.baseUrl, 'video').then((blob) =>
                            tm.download(blob, filename + 'video.m4s'),
                        );
                    }
                    if (content[1]) {
                        return getBlob(aDash.baseUrl, 'audio').then((blob) =>
                            tm.download(blob, filename + 'audio.m4s'),
                        );
                    }
                }
                return {
                    text: '下载',
                    async onclick() {
                        const { promise, resolve } = Promise.withResolvers();
                        ui.confirm.el.addEventListener(
                            'dismiss',
                            () => resolve(false),
                            { once: true },
                        );
                        ui.confirm.show(
                            '下载设置',
                            toFormTp(),
                            ['确定', () => resolve(true)],
                            ['取消', () => resolve(false)],
                        );
                        if (!(await promise)) return;

                        const data = await getStreamUrl(config);
                        const { cid, page } = getPageData();
                        const filename = `${_.vd.title}-${_.vd.owner.name}-p${page}`;

                        if (data.durl) {
                            if (data.quality === config.qn) {
                                const blob = await getBlob(data.durl[0].url);
                                tm.download(blob, filename + '.mp4');
                            } else {
                                tmPlayer.tooltip(
                                    [
                                        'mp4 格式仅支持:',
                                        ...data.accept_description,
                                    ].join('\n'),
                                );
                            }
                            return;
                        }
                        const vDash = data.dash.video.find(
                            (e) =>
                                e.id == config.qn &&
                                e.codecid == config.codecid,
                        );
                        const aDash = data.dash.audio.find(
                            (e) => e.id == config.audio_qn,
                        );
                        if (!vDash || !aDash) {
                            tmPlayer.toast('找不到 dash 资源');
                            console.log('dash 数据', data.dash, config);
                            return;
                        }
                        ui.confirm.show(
                            '是否转化格式',
                            '',
                            ['是', () => cd(filename, vDash, aDash)],
                            ['否', () => dd(filename, vDash, aDash)],
                        );
                    },
                };
            })(),
            {
                text: '搬运',
                onclick() {
                    const { bvid, desc, pic, title, copyright, owner } = _.vd;
                    tmPlayer.tooltip(`发送${bvid}`);
                    tm.postMessage(
                        'https://www.mfuns.net/create/video',
                        {
                            bvid,
                            desc,
                            pic,
                            title,
                            copyright,
                            owner_name: owner.name,
                        },
                        'mfuns get',
                    ).then(
                        () => tmPlayer.tooltip('停止发送'),
                        () => tmPlayer.tooltip('发送失败'),
                    );
                },
            },
            {
                text: '听视频',
                /**
                 * @this {HTMLElementTagNameMap['s-menu-item'] & {
                 *     _enabled: boolean;
                 * }}
                 */
                //@ts-ignore
                onclick() {
                    util.toggle(this.style, 'background', ['#bbb', '']);
                    if (!util.toggle(this, '_enabled', [true, false])) return;
                    const el = player.mediaElement();
                    hack.override(
                        SourceBuffer.prototype,
                        'buffered',
                        ({ get }) => ({
                            get: () =>
                                util.catch(
                                    //@ts-ignore
                                    () => get.call(this),
                                    () => el.buffered,
                                ),
                        }),
                    );
                    // 自动播放
                    player.setAutoplay(true);
                    player.setHandoff(0);
                    async function enable() {
                        const { dash } = await getStreamUrl();
                        const streamUrl = dash.audio[1].baseUrl;
                        el.src = streamUrl;
                        tmPlayer.toast('设置音频流');
                        player.play();
                    }
                    enable();
                    tmPlayer.onRouteChange(enable);
                },
            },
        ];
        tmPlayer.setMenu(sharedItems.concat(btnItems));
    });

    tm.matchURL(/www.bilibili.com\/bangumi/, () => {
        tmPlayer.setMenu(sharedItems);
        playerEl.observe(
            (ob) => {
                // 屏蔽wrap
                document.$('.bpx-player-toast-wrap')?.hide();
                // 宽屏模式
                observer.add('.bpx-player-control-wrap', (ob) => {
                    tmPlayer.wideScreen('.squirtle-video-widescreen') &&
                        ob.disconnect();
                });
                observer.run();
                ob.disconnect();
            },
            { childList: true },
        );
    });
})();
