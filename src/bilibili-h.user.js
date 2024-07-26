// ==UserScript==
// @name        bilibili-h
// @version     0.1
// @author      cubxx
// @match       https://*.bilibili.com/*
// @exclude     https://api.bilibili.com/*
// @exclude     https://api.vc.bilibili.com/*
// @updateURL   https://cdn.jsdelivr.net/gh/cubxx/tampermonkey-script/src/bilibili-h.user.js
// @downloadURL https://cdn.jsdelivr.net/gh/cubxx/tampermonkey-script/src/bilibili-h.user.js
// @icon        https://www.bilibili.com/favicon.ico
// @grant       none
// ==/UserScript==

(function () {
  'use strict';
  const { $ } = tm;
  // 选中富文本不跳转
  $(document).on(
    'click',
    (e) => {
      const el = /** @type {HTMLSpanElement} */ (e.target);
      const match = 'class="bili-rich-text__content';
      if (
        (el.tagName == 'SPAN' && el.parentElement?.outerHTML.includes(match)) ||
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

tm['deleteADs'] = tm._.debounce(function () {
  'use strict';
  if (self != top) return; // 不在iframe内执行
  const { $, $$, log, rmAD } = tm;

  rmAD('bili-body', [
    '.ad-report', //视频-广告
    '.vcd', //视频-广告
    '#slide_ad', //视频-广告
    '.video-page-special-card-small',
    '.pop-live-small-mode', //视频-mini直播
    '.activity-banner', //活动
    '.activity-m-v1', //活动
    '#activity_vote', //活动
    '.eva-banner', //横向广告
    '.banner-card', //横向广告-老版
    '.gg-floor-module', //番剧
    '.vipPaybar_container__GsBut', //番剧大会员
    '.bili-dyn-ads', //动态广告
    '.reply-notice', //通知
    '.adcard',
  ]);
  rmAD('bili-header', [
    '.vip-wrap', //顶部按钮-大会员
    '.vip-entry-containter', //信息面板-大会员
  ]);
  const { host, pathname } = window.location;
  if (host == 'www.bilibili.com' && pathname == '/') {
    $('.container')?.observe(
      rmAD('bili-home', [
        '.bili-video-card:has(.bili-video-card__info--ad, .bili-video-card__info--creative-ad)',
      ]),
      { childList: true },
    );
  }
}, 10);
tm['deleteADs']();

(function () {
  'use strict';
  if (self != top) return;
  const { $, ui, _, hack, fs, log, comm } = tm;

  /** @readonly @type {any} */
  let player = window['player'];
  if (!player) return log('window.player not found');

  const tmPlayer = (tm['player'] = {
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
      const FnButton = $.h(
        's-icon-button',
        {
          type: 'filled',
          style: {
            position: 'absolute',
            transform: 'translateX(-130%)',
          },
        },
        [$.h('s-icon', { type: 'menu' })],
      );
      setTimeout(() => {
        FnButton.mount('#bilibili-player', 0);
      }, 1e2);
      /** @param {MenuConfigs} items */
      return function (items) {
        FnButton.el.onclick = () => ui.menu.show(items, FnButton);
        // tm.onRouteChange(() => ui.menu.update(items, FnButton));
      };
    })(),
  });
  /** @typedef {Parameters<typeof ui.menu.show>[0]} MenuConfigs */
  /** @type {MenuConfigs} */
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
              const canvas = $.h('canvas', {
                width: el.videoWidth,
                height: el.videoHeight,
              }).el;
              canvas?.getContext('2d')?.drawImage(el, 0, 0);
              return canvas;
            }
            case 'BWP-VIDEO':
              //@ts-ignore
              return el.getRenderCanvas();
          }
        })();
        canvas.toBlob((blob) => {
          if (!blob) return _.exit('无法生成 blob');
          ui.confirm.show(
            '保存至:',
            '',
            ['本地', () => fs.save(blob)],
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
        await tm.import.FFmpeg('0.11.6');
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
        if (recorder) return;
        const el = player.mediaElement();
        if (el.tagName !== 'VIDEO') {
          log(`${el.tagName} 不支持录制`);
          return;
        }
        recorder = new MediaRecorder(el.captureStream());
        recorder.ondataavailable = ({ data: blob }) => {
          log('录制资源', blob);
          ui.confirm.show(
            '是否转化格式',
            '',
            [
              '是',
              function () {
                convertFormat(blob).then(fs.save, (e) => {
                  log.error('格式转换失败', e);
                });
              },
            ],
            ['否', () => fs.save(blob)],
          );
        };
      }
      setRecorder();
      tm.onRouteChange(setRecorder);
      /** @type {Record<RecordingState, (recorder: MediaRecorder) => void>} */
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
        onclick(e) {
          if (!recorder) return;
          stateConfig[recorder.state](recorder);
          e.ctrlKey && recorder.stop();
          //@ts-ignore
          this.textContent = recorder.state;
        },
        oncontextmenu() {},
      };
    })(),
    {
      text: '倍速',
      items: [
        {
          text: lit.html`<s-slider min="0" max="16" step="0.1" labeled="true"
            .value=${player.mediaElement().playbackRate} @change=${(e) => {
              player.mediaElement().playbackRate = e.target.value;
            }}/>`,
          style: { width: '224px', height: '70px' },
        },
      ],
    },
  ];

  tm.matchURL(
    [
      /www.bilibili.com\/(video|list\/ml\d+)/,
      () => {
        /** 状态对象 */
        const s = {
          get vd() {
            return window['__INITIAL_STATE__'].videoData ?? _.exit('vd 失效');
          },
        };

        // 再次除广告
        $('.rcmd-tab')?.observe(tm['deleteADs'], { childList: true });
        // 屏蔽
        $('.bpx-player-cmd-dm-wrap')?.hide();
        // 开字幕
        if (s.vd.subtitle.list.length) {
          $('.bpx-player-control-wrap')?.observe(
            (ob) => {
              const btn = $('.bpx-player-ctrl-subtitle')?.$('span');
              if (btn) {
                player
                  .getElements()
                  .subtitle.$('.bpx-player-subtitle-panel-text') ||
                  btn.el.click();
                ob.disconnect();
              }
            },
            { childList: true, subtree: true },
          );
        }

        // 按钮组
        function getPageData() {
          const p = new URL(document.URL).searchParams.get('p');
          if (!p) return s.vd.pages[0];
          return s.vd.pages[+p - 1];
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
         *   id: number;
         *   baseUrl: string;
         *   backupUrl: string[];
         *   mimeType: string;
         *   codecs: string;
         *   codecid: number;
         * }} Dash
         * @param {Partial<{
         *   cid: number;
         *   bvid: string;
         *   fnval: number;
         *   qn: number;
         * }>} [restParams]
         * @returns {Promise<{
         *   quality: number;
         *   accept_quality: number[];
         *   accept_description: string[];
         *   durl: [{ url: string; backup_url: string[] }];
         *   dash: { video: Dash[]; audio: Dash[] };
         * }>}
         * @link https://socialsisteryi.github.io/bilibili-API-collect/docs/video/videostream_url.html
         */
        function getStreamUrl(restParams) {
          const { cid, page } = getPageData();
          const params = Object.assign(
            { cid, bvid: s.vd.bvid, fnval: 16, qn: 64 },
            restParams,
          );
          tmPlayer.toast('请求流地址');
          log('流地址请求参数', params);
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
            const id = 'tm-menu-cover';
            function update() {
              const img = ui.menu.dom.$(`img#${id}`);
              if (!img) return;
              setTimeout(
                () => img.set({ src: `${s.vd.pic}@150w_150h.jpg` }),
                1e3,
              );
            }
            tm.onRouteChange(update);
            return {
              text: '封面',
              items: [
                {
                  text: lit.html`<img id=${id} src="${s.vd.pic}@150w_150h.jpg"/>`,
                  style: { height: '100px' },
                  onclick() {
                    open(s.vd.pic);
                  },
                },
              ],
            };
          })(),
          (function () {
            const config = (tmPlayer['params'] = /** @type {const} */ ({
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
            }));
            /**
             * @typedef {keyof typeof config} K
             * @type {{
             *   [P in Exclude<K, 'content'>]: [text: string, value: number][];
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
            const set = (o, k, p) => (e) => (o[k] = e.target[p]);
            // ui
            const toOptionTp = (key, [text, value]) => lit.html`
<s-segmented-button-item selected=${value === config[key]} ._value=${value}>${text}</s-segmented-button-item>`;
            const toSelectTp = ([key, options]) => lit.html`
<s-segmented-button @segmented-button-item:update=${set(config, key, '_value')}>
  ${options.map((e) => toOptionTp(key, e))}
</s-segmented-button>`;
            const toFormTp = () => lit.html`
<section style="display:grid;gap:15px;justify-items:center;">
  ${Object.entries(options).map(toSelectTp)}
  <section>
    Video<s-checkbox checked="true" @change=${set(config.content, 0, 'checked')}></s-checkbox>
    Audio<s-checkbox checked="true" @change=${set(config.content, 1, 'checked')}></s-checkbox>
  </section>
</section>`;

            /** 转换后下载 @param {Dash} vDash @param {Dash} aDash */
            async function cd(filename, vDash, aDash) {
              async function cf(promise, MIMEtype, newFormat, convertArgs) {
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
                    `正在转换格式${newFormat}document.${1e2 * ratio.toFixed(2)}%`,
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
                const buffer = await ffmpeg.FS('readFile', 'output').buffer;
                fs.save(
                  new Blob([buffer], { type: MIMEtype }),
                  filename + newFormat,
                );
              }

              tmPlayer.toast('加载FFmpeg');
              await tm.import.FFmpeg('0.11.6');
              const ffmpeg = window['FFmpeg'].createFFmpeg();
              await ffmpeg.load();
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
                return cf(getBlob(vDash.baseUrl, 'video'), 'video/mp4', 'mp4', [
                  '-vn',
                  '-acodec',
                  'libmp3lame',
                ]);
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
                  fs.save(vBlob, filename + 'video.m4s');
                  fs.save(aBlob, filename + 'audio.m4s');
                });
              }
              if (content[0]) {
                return getBlob(vDash.baseUrl, 'video').then((blob) =>
                  fs.save(blob, filename + 'video.m4s'),
                );
              }
              if (content[1]) {
                return getBlob(aDash.baseUrl, 'audio').then((blob) =>
                  fs.save(blob, filename + 'audio.m4s'),
                );
              }
            }
            return {
              text: '下载',
              async onclick() {
                const { promise, resolve } = Promise.withResolvers();
                sober.Dialog;
                ui.confirm.dom.on('dismiss', () => resolve(false), {
                  once: true,
                });
                ui.confirm.show(
                  '下载参数',
                  toFormTp(),
                  ['确定', () => resolve(true)],
                  ['取消', () => resolve(false)],
                );
                if (!(await promise)) return;

                const data = await getStreamUrl(config);
                const { cid, page } = getPageData();
                const filename = `${s.vd.title}-${s.vd.owner.name}-p${page}`;

                if (data.durl) {
                  if (data.quality === config.qn) {
                    const blob = await getBlob(data.durl[0].url);
                    fs.save(blob, filename + '.mp4');
                  } else {
                    tmPlayer.tooltip(
                      ['mp4 格式仅支持:', ...data.accept_description].join(
                        '\n',
                      ),
                    );
                  }
                  return;
                }
                const vDash = data.dash.video.find(
                  (e) => e.id == config.qn && e.codecid == config.codecid,
                );
                const aDash = data.dash.audio.find(
                  (e) => e.id == config.audio_qn,
                );
                if (!vDash || !aDash) {
                  tmPlayer.toast('找不到 dash 资源');
                  log('dash 数据', data.dash, config);
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
            async onclick() {
              const { bvid, desc, pic, title, copyright, owner } = s.vd;
              tmPlayer.tooltip(`发送${bvid}`);
              await comm.send('https://www.mfuns.net/create/video', {
                bvid,
                desc,
                pic,
                title,
                copyright,
                owner_name: owner.name,
              });
              tmPlayer.tooltip('发送完成');
            },
          },
          {
            text: '听视频',
            /**
             * @this {HTMLElementTagNameMap['s-popup-menu-item'] & {
             *   _enabled: boolean;
             * }}
             */
            //@ts-ignore
            onclick() {
              _.toggle(this.style, 'background', ['#bbb', '']);
              if (!_.toggle(this, '_enabled', [true, false])) return;
              const el = player.mediaElement();
              hack.override(SourceBuffer.prototype, 'buffered', ({ get }) => ({
                get() {
                  try {
                    return get.call(this);
                  } catch (error) {
                    return el.buffered;
                  }
                },
              }));
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
              tm.onRouteChange(enable);
            },
          },
        ];
        tmPlayer.setMenu(sharedItems.concat(btnItems));
      },
    ],
    [
      /www.bilibili.com\/bangumi/,
      () => {
        tmPlayer.setMenu(sharedItems);
        $(player.getElements().container)?.observe(
          (ob) => {
            // 屏蔽wrap
            $('.bpx-player-toast-wrap')?.hide();
            ob.disconnect();
          },
          { childList: true },
        );
      },
    ],
  );
})();
