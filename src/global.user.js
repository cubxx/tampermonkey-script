// ==UserScript==
// @name        global
// @version     latest
// @author      cubxx
// @match       *://*/*
// @icon        data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="%230bf" viewBox="0 0 1 1"><rect width="1" height="1"/></svg>
// @grant       none
// ==/UserScript==

/** Features */
(function () {
  'use strict';
  const { log, ui, tool } = tm;

  const openFnPanel = (() => {
    const { props } = ui.dialog({
      open: false,
      buttons: (tm['FnBtns'] = []),
    });
    return () => {
      vanX.replace(props.buttons, () => tm['FnBtns']);
      ui.dialog({ title: '', content: '' });
    };
  })();

  if (/Mobi/i.test(navigator.userAgent)) {
    document.addEventListener('dblclick', () => openFnPanel());
    return;
  }

  /** @type {[(e: KeyboardEvent) => boolean, () => void][]} */
  const listeners = [
    [
      (e) => e.ctrlKey && e.key === 'c',
      function copyText() {
        if (!navigator.clipboard) tool.throw('not support navigator.clipboard');
        const text = getSelection()?.toString();
        if (!text) return;
        navigator.clipboard.writeText(text).then(
          () => log.info('copy success'),
          (err) => log.error('copy failed', err),
        );
      },
    ],
    [(e) => e.ctrlKey && e.key === '`', openFnPanel],
  ];
  document.addEventListener(
    'keydown',
    (e) => {
      for (const [cond, fn] of listeners)
        if (cond(e)) return (e.stopImmediatePropagation(), fn());
    },
    true,
  );
})();

/** Auto skip */
(function () {
  'use strict';
  /**
   * @type {Record<
   *   string,
   *   ((sp: URLSearchParams) => string | null) | null
   * >}
   */
  const arr = {
    'link.zhihu.com': null,
    'link.csdn.net': null,
    'link.juejin.cn': null,
    'c.pc.qq.com': (sp) => {
      const url = sp.get('url') || sp.get('pfurl');
      return url && (url.includes('://') ? url : 'https://' + url);
    },
    'gitee.com/link': null,
    'www.jianshu.com/go-wild': (sp) => sp.get('url'),
    'docs.qq.com/scenario/link.html': (sp) => sp.get('url'),
    'afdian.com/link': null,
    'mail.qq.com/cgi-bin/readtemplate': (sp) => sp.get('gourl'),
    'weixin110.qq.com/cgi-bin/mmspamsupport-bin/newredirectconfirmcgi': () =>
      tm.$('p')?.textContent ?? '/',
    'www.google.com/url': (sp) => sp.get('q'),
  };
  for (let path in arr) {
    if (location.href.includes(path)) {
      const sp = new URL(document.URL).searchParams;
      const target = arr[path]?.(sp) ?? sp.get('target');
      if (target) location.href = target;
      else return tm.log("can't skip this url");
    }
  }
})();

/** Clear AI history */
(function () {
  'use strict';
  const { log, ui, tool } = tm;

  /** @satisfies {Record<string, () => Promise<any>>} */
  const hostTasks = {
    async 'chatgpt.com'() {
      const authorization =
        'Bearer ' +
        (await (await fetch('/api/auth/session')).json()).accessToken;
      const { items } = await (
        await fetch(
          `/backend-api/conversations?is_archived=false&is_starred=false`,
          { headers: { authorization, 'Content-Type': 'application/json' } },
        )
      ).json();
      await Promise.all(
        items.map(async ({ id }) => {
          const { success } = await (
            await fetch('/backend-api/conversation/' + id, {
              method: 'PATCH',
              headers: { authorization, 'Content-Type': 'application/json' },
              body: JSON.stringify({ is_visible: false }),
            })
          ).json();
          if (!success) tool.throw(`Failed to delete ${id}`);
        }),
      );
    },
    async 'chat.deepseek.com'() {
      const authorization =
        'Bearer ' + JSON.parse(localStorage.getItem('userToken') ?? '').value;
      const { code } = await (
        await fetch('/api/v0/chat_session/delete_all', {
          method: 'POST',
          headers: { authorization, 'content-type': 'application/json' },
        })
      ).json();
      if (code !== 0) tool.throw('request failed');
    },
    async 'www.kimi.com'() {
      const authorization = 'Bearer ' + localStorage.getItem('access_token');
      const { chats } = await (
        await fetch('/apiv2/kimi.chat.v1.ChatService/ListChats', {
          method: 'post',
          headers: { authorization, 'content-type': 'application/json' },
          body: JSON.stringify({ page_size: 1e3 }),
        })
      ).json();
      await Promise.all(
        chats.map(async ({ id }) =>
          (
            await fetch('/apiv2/kimi.chat.v1.ChatService/DeleteChat', {
              method: 'post',
              headers: { authorization, 'content-type': 'application/json' },
              body: `{"chat_id":"${id}"}`,
            })
          ).json(),
        ),
      );
    },
    //    async 'chatglm.cn'() {
    //      const token = document.cookie.match(
    //        new RegExp('(^|;\\s*)(chatglm_token)=([^;]*)'),
    //      )?.[3];
    //      if (!token) return console.error('token not found');
    //      const authorization = 'Bearer ' + decodeURIComponent(token);
    //      const {
    //        result: { results },
    //      } = await (
    //        await fetch('/chatglm/backend-api/assistant/search_log_history', {
    //          method: 'POST',
    //          headers: { authorization, 'content-type': 'application/json' },
    //          body: JSON.stringify({
    //            get_all_history: true,
    //            page_num: 1,
    //            page_size: 1e4,
    //          }),
    //        })
    //      ).json();
    //      await Promise.all(
    //        results.map(
    //          async ({ assistant_id, conversation_id }) =>
    //            await (
    //              await fetch(
    //                '/chatglm/backend-api/assistant/conversation/delete',
    //                {
    //                  method: 'POST',
    //                  headers: {
    //                    authorization,
    //                    'content-type': 'application/json',
    //                  },
    //                  body: JSON.stringify({ assistant_id, conversation_id }),
    //                },
    //              )
    //            ).json(),
    //        ),
    //      );
    //    },
    // async 'metaso.cn'() {
    //   localStorage.removeItem('data-store');
    //   const {
    //     data: { content },
    //   } = await (
    //     await fetch('/api/search-history?pageIndex=0&pageSize=100')
    //   ).json();
    //   await Promise.all(
    //     content.map(
    //       async ({ id }) =>
    //         await (
    //           await fetch(`/api/session/${id}`, { method: 'DELETE' })
    //         ).json(),
    //     ),
    //   );
    // },
    async 'grok.com'() {
      await (
        await fetch(`/rest/app-chat/conversations`, { method: 'DELETE' })
      ).json();
    },
    // async 'chat.qwen.ai'() {
    //   const { success } = await (
    //     await fetch(`/api/v2/chats`, { method: 'DELETE' })
    //   ).json();
    //   if (!success) tool.throw('request failed');
    // },
    async 'www.perplexity.ai'() {
      const { status } = await (
        await fetch(
          '/rest/thread/delete_all_threads?version=2.18&source=default',
          {
            method: 'DELETE',
            headers: { 'content-type': 'application/json' },
            body: '{"delete_all":true}',
          },
        )
      ).json();
      if (status !== 'success') throw Error(`status is ${status}`);
    },
    async 'www.doubao.com'() {
      const {
        downlink_body: {
          pull_recent_conv_chain_downlink_body: { cells },
        },
      } = await (
        await fetch('/im/chain/recent_conv?aid=497858', {
          method: 'POST',
          headers: { 'content-type': 'application/json; encoding=utf-8' },
          body: JSON.stringify({
            cmd: 3200,
            uplink_body: {
              pull_recent_conv_chain_uplink_body: {
                api_version: 1,
                limit: 1e2,
              },
            },
          }),
        })
      ).json();

      const res = await (
        await fetch('/im/conversation/batch_del_user_conv?aid=497858', {
          method: 'POST',
          headers: { 'content-type': 'application/json; encoding=utf-8' },
          body: JSON.stringify({
            cmd: 4171,
            uplink_body: {
              batch_delete_user_conversation_uplink_body: {
                conversation_id: cells.map((e) => e.id),
                delete_all: true,
              },
            },
          }),
        })
      ).json();
      if (res.status_code !== 0)
        throw Error('response status_code: ' + res.status_code);
    },
    async 'aistudio.google.com'() {},
    async 'consensus.app'() {},
  };

  const clearKey = 'clearAIHistory';
  tm.router(
    'clear ai history',
    tool.mapValues(hostTasks, (task) => () => {
      tm[clearKey] = () =>
        task().then(
          (e) => log.info('clear AI history success', e),
          (e) => log.error('clear AI history failed', e),
        );
      if (location.hash.slice(1) === clearKey) tm[clearKey]();
    }),
  );

  const btns = tool.map(hostTasks, (_, host) => ({
    text: host.split('.').at(-2) ?? host,
    hidden: true,
    ...(location.host === host
      ? { onclick: tm[clearKey], color: 'steelblue' }
      : {
          onclick() {
            open(`https://${host}#${clearKey}`);
          },
        }),
  }));
  tm['FnBtns'].push(
    {
      text: 'Clear AI History',
      color: 'cadetblue',
      onclick() {
        const { props } = ui.dialog({});
        vanX.replace(props.buttons, (l) =>
          l.map((v) => ({ ...v, hidden: !v.hidden })),
        );
      },
    },
    ...btns,
  );
})();

/** Media Recorder */
(() => {
  'use strict';
  const { $, tool } = tm;

  /** @param {HTMLMediaElement} el */
  const createRecorder = (el) => {
    const stream = (el.captureStream ?? el.mozCaptureStream).call(el);
    const recorder = new MediaRecorder(stream);

    const chunks = /** @type {Blob[]} */ ([]);
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const url = URL.createObjectURL(new Blob(chunks));
      const el = van.tags.a({
        href: url,
        download: `record-${Date.now()}.webm`,
      });
      el.click();
      el.remove();
      URL.revokeObjectURL(url);
      chunks.length = 0;
    };
    return recorder;
  };

  /** @type {MediaRecorder | null} */
  let recorder = null;
  tm['FnBtns'].push({
    text: 'Recorder',
    color: 'seagreen',
    async onclick() {
      if (recorder) {
        recorder.stop();
        recorder = null;
      } else {
        const el = $('video');
        if (!el) return tool.throw(`not found: video`);
        recorder = createRecorder(el);
        recorder.start();
      }
      tool.toggle(this, 'textContent', ['Recording', 'Recorder']);
    },
  });
})();

/** Translate */
(() => {
  'use strict';
  const { log, ui, tool } = tm;

  const translate = /** @param {string} orig */ async (orig) => {
    const q = encodeURIComponent(orig);
    // audio
    fetch(
      tm.proxy +
        `https://translate.google.com/translate_tts?ie=UTF-8&q=${q}&tl=en&client=tw-ob`,
      { method: 'post' },
    )
      .then((res) => res.blob())
      .then(
        async (blob) => {
          const url = URL.createObjectURL(blob);
          await new Audio(url).play();
          URL.revokeObjectURL(url);
        },
        (err) => log.error('Google TTS Error', err),
      );
    // translate
    fetch(
      tm.proxy +
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh-CN&dt=t&dt=bd&q=${q}`,
      { method: 'post' },
    )
      .then((res) => res.json())
      .then(
        (data) => {
          const trans =
            data[0][0][0] +
            (data[1]?.reduce(
              (acc, [part, words]) => `${acc}\n${part}. ${words.join(', ')}`,
              '',
            ) ?? '');
          ui.snackbar({ text: trans, color: 'steelblue' });
        },
        (err) => log.error('Google Translator Error', err),
      );
  };
  // trigger
  let selected = '';
  document.addEventListener('selectionchange', () => {
    selected = window.getSelection()?.toString().trim() ?? '';
  });
  document.addEventListener('mouseup', async () => {
    if (!selected) return;
    log.info('selected', selected);
    translate(selected).finally(() => (selected = ''));
  });
})();

/** Route */
(() => {
  'use strict';
  if (self != top) return;
  const { $, $$, log, tool, hack } = tm;

  tm.router('global', {
    'www.zhihu.com': {
      ''() {
        tm['FnBtns'].push({
          text: 'Clear Inbox',
          onclick: async () => {
            const { data } = await fetch('/api/v4/inbox').then((e) => e.json());
            await Promise.allSettled(
              data.map(({ participant: { id } }) =>
                fetch(`https://www.zhihu.com/api/v4/chat?sender_id=${id}`, {
                  method: 'delete',
                }).then((e) => e.json()),
              ),
            );
          },
        });
      },
    },

    'www.acgbox.link'() {
      $$('a.card').map((e) => {
        e.href = e.dataset['url'] ?? '';
      });
    },

    'nature.com'() {
      ['c-hero__link', 'c-card__link', 'u-faux-block-link'].map((c) =>
        $$(`a.${c}`).map((e) => {
          e.classList.remove(c);
          e.classList.add('u-link-inherit');
        }),
      );
    },

    'github.com'() {
      tm['FnBtns'].push(
        {
          text: 'Page',
          onclick() {
            const matches = location.pathname.match(/^\/(.+)\/(.+)/);
            if (!matches) return;
            window.open(`https://${matches[1]}.github.io/${matches[2]}`);
          },
        },
        {
          text: 'Stars',
          onclick() {
            window.open(`${location.href}/stargazers`);
          },
        },
      );
    },

    'www.youtube.com': {
      async watch() {
        // shortcut
        /** @type {Record<string, number>} */
        const speeds = { '!': 1, '@': 2 };
        document.addEventListener('keydown', async (e) => {
          if (!e.shiftKey) return;
          const speed = speeds[e.key];
          if (speed) (await $.wait('video')).playbackRate = speed;
        });

        // change cover
        const cover = await $.wait('div.ytp-cued-thumbnail-overlay-image');
        cover.style.background =
          cover.style.backgroundImage + ' top / contain no-repeat';

        // more height
        const changeHeight = () => {
          const subtitleSize = $(
            'span.ytp-caption-segment',
          )?.style.fontSize.slice(0, -2);
          if (!subtitleSize) return; // don't change height if no subtitle
          const extraHeight = +subtitleSize * 3.5;
          const container = $('ytd-watch-flexy div#player-container-inner');
          if (!container) return tool.throw('player container not found');
          container.style.paddingTop = `calc(var(--ytd-watch-flexy-height-ratio)/var(--ytd-watch-flexy-width-ratio)*100% + ${extraHeight}px)`;
        };
        const caption_el = $('div.ytp-caption-window-container');
        if (caption_el)
          $.observe(caption_el, changeHeight, { childList: true });

        // auto subtitles
        const btn = await $.wait('button.ytp-subtitles-button');
        btn.ariaPressed === 'false' && btn.click();

        // dual subtitles
        const opts = { lang: 'zh-Hans', min: 30 };
        const pure = (text) => text.trim().replaceAll('\n', ' ');
        hack.onXHR(void 0, (_, orig_xhr) => {
          if (location.pathname !== '/watch') return;
          const url = orig_xhr.responseURL;
          if (
            !url.includes('/api/timedtext') ||
            url.includes('&tlang') ||
            url.includes('&lang=' + opts.lang) ||
            !orig_xhr.responseText
          )
            return;

          if (orig_xhr.status !== 200)
            tool.throw(
              `failed to fetch orig subtitle: ${orig_xhr.status} ${orig_xhr.statusText}`,
            );
          const orig_sub = JSON.parse(orig_xhr.responseText);
          if (!orig_sub) return;
          if (orig_sub.events == null)
            tool.throw('subtitle response invalid', orig_sub);

          const trans_xhr = new XMLHttpRequest();
          trans_xhr.open('GET', url + `&tlang=` + opts.lang, false);
          trans_xhr.send();
          if (trans_xhr.status !== 200)
            tool.throw(
              `failed to fetch trans subtitle: ${trans_xhr.status} ${trans_xhr.statusText}`,
            );
          const trans_sub = JSON.parse(trans_xhr.responseText);

          // Modify original subtitles to include translated subtitles
          const isAutoGeneratedSub = orig_sub.events.some(
            (e) => e.segs && e.segs.length > 1,
          );
          if (!isAutoGeneratedSub) {
            for (let i = 0, len = orig_sub.events.length; i < len; i++) {
              const orig = orig_sub.events[i];
              if (!orig.segs) continue;
              const trans = trans_sub.events[i];
              orig.segs[0].utf8 =
                pure(orig.segs[0].utf8) + '\n' + pure(trans.segs[0].utf8);
            }
          } else {
            const originalEvents = orig_sub.events;
            const translatedEvents = trans_sub.events.filter(
              (trans) => !trans.aAppend && trans.segs,
            );
            const resultEvents = [];
            for (
              let i = 0, j = 0, tmpLine = '', len = originalEvents.length;
              i < len;
              i++
            ) {
              const orig = originalEvents[i];
              if (orig.aAppend || !orig.segs) continue;

              const origLine = orig.segs.reduce(
                (acc, seg) => acc + seg.utf8,
                tmpLine,
              );
              if (origLine.length < opts.min) {
                tmpLine = origLine + ' ';
                continue;
              }
              tmpLine = '';

              const st = orig.tStartMs,
                et =
                  i + 1 < len
                    ? originalEvents[i + 1].tStartMs
                    : st + orig.dDurationMs;

              const insidedTranslatedEvents = translatedEvents.filter(
                ({ tStartMs }) => st <= tStartMs && tStartMs < et,
              );
              const transLine = insidedTranslatedEvents.reduce(
                (acc, trans) =>
                  acc +
                  trans.segs.reduce((acc, seg) => acc + seg.utf8, '') +
                  '',
                '',
              );

              orig.segs = [{ utf8: pure(origLine) + '\n' + pure(transLine) }];
              delete orig.wWinId;
              resultEvents[j++] = orig;
            }
            // like provided subtitle
            orig_sub.wsWinStyles.length = 1;
            orig_sub.wpWinPositions.length = 1;
            orig_sub.events = resultEvents;
          }

          log.info('modify subtitle');
          return JSON.stringify(orig_sub);
        });
      },
    },

    async 'grok.com'() {
      tm.onRouteChange(async () => {
        (await $.wait('main > div:last-child')).style.setProperty(
          '--content-max-width',
          '90%',
        );
        log.info('set --content-max-width');
      });
    },

    'y.qq.com': {
      n: {
        ryqq_v2: {
          async player_radio() {
            // controls
            const play_area = await $.wait('.mod_type');
            const play = await $.wait('.btn_play');
            const next_area = await $.wait('.mod_player');
            const next = await $.wait('.btn_next');
            document.addEventListener('click', (e) => {
              e.target === play_area && play.click();
              e.target === next_area && next.click();
            });

            // disable document.title
            Object.defineProperty(document, 'title', {
              value: '',
              writable: true,
            });
          },
        },
      },
    },

    'ieltscat.xdf.cn': {
      practice: {
        check: {
          async listen() {
            (await $.wait('audio')).volume = 1;
          },
        },
      },
    },
  });
})();
