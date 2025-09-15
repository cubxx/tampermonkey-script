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
  const { $, $$, log, ui, _ } = tm;
  /** @type {[(e: KeyboardEvent) => boolean, () => void][]} */
  const listeners = [
    [
      (e) => e.ctrlKey && e.key === 'c',
      function copyText() {
        if (!navigator.clipboard) _.throw('not support navigator.clipboard');
        const text = getSelection()?.toString();
        if (!text) return;
        navigator.clipboard.writeText(text).then(
          () => log.info('copy success'),
          (err) => log.error('copy failed', err),
        );
      },
    ],
    [
      (e) => e.ctrlKey && e.key === '`',
      (function FnPanel() {
        tm['FnBtns'] =
          /**
           * @type {NonNullable<
           *   Parameters<typeof ui.dialog>[0]['buttons']
           * >}
           */
          ([
            {
              text: 'Design Mode',
              color: 'seagreen',
              onclick() {
                _.toggle(document, 'designMode', ['on', 'off']);
                _.toggle(this.style, 'opacity', ['0.5', '1']);
              },
            },
          ]);
        const { props } = ui.dialog({ open: false, buttons: tm['FnBtns'] });
        return () => {
          vanX.replace(props.buttons, () => tm['FnBtns']);
          ui.dialog({ title: '', content: '' });
        };
      })(),
    ],
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

/** Remove ADs */
(function () {
  'use strict';
  if (self != top) return;
  const { _, $$ } = tm;

  const rmADs =
    /** @param {string[]} selectors */
    (selectors) => {
      const rm = () => {
        for (const el of selectors.flatMap((e) => $$(e))) {
          if (el.style.display !== 'none') {
            el.style.display = 'none';
          }
        }
      };
      tm.onRouteChange(rm);
      document.addEventListener('DOMContentLoaded', rm, { once: true });
    };
  tm.router(
    _.mapValues(
      {
        'heroicons.dev': ['#root > aside.sidebar-2 > div'],
      },
      (selectors, host) => () => rmADs(selectors),
    ),
  );
});

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
  const { $, $$, log, comm, router, ui, _ } = tm;

  /** @satisfies {Record<string, () => Promise<any>>} */
  const hostTasks = {
    async 'chatgpt.com'() {
      const authorization =
        'Bearer ' +
        window['__reactRouterContext'].state.loaderData.root.clientBootstrap
          .session.accessToken;
      const { success } = await (
        await fetch(`/backend-api/conversation`, {
          method: 'PATCH',
          headers: { authorization, 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_visible: false }),
        })
      ).json();
      if (!success) _.throw('request failed');
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
      if (code !== 0) _.throw('request failed');
    },
    async 'www.kimi.com'() {
      const authorization = 'Bearer ' + localStorage.getItem('access_token');
      const { items } = await (
        await fetch('/api/chat/list', {
          method: 'post',
          headers: { authorization, 'content-type': 'application/json' },
          body: JSON.stringify({ offset: 0, size: 1e4 }),
        })
      ).json();
      await Promise.all(
        items.map(async ({ id }) =>
          (
            await fetch(`/api/chat/${id}`, {
              method: 'delete',
              headers: { authorization },
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
    async 'metaso.cn'() {
      localStorage.removeItem('data-store');
      const {
        data: { content },
      } = await (
        await fetch('/api/search-history?pageIndex=0&pageSize=100')
      ).json();
      await Promise.all(
        content.map(
          async ({ id }) =>
            await (
              await fetch(`/api/session/${id}`, { method: 'DELETE' })
            ).json(),
        ),
      );
    },
    async 'grok.com'() {
      await (
        await fetch('/rest/app-chat/conversations', { method: 'DELETE' })
      ).json();
    },
    async 'chat.qwen.ai'() {
      const { success } = await (
        await fetch(`/api/v2/chats`, { method: 'DELETE' })
      ).json();
      if (!success) _.throw('request failed');
    },
  };

  const clearKey = 'clearAIHistory';
  router(
    _.mapValues(hostTasks, (task) => async () => {
      tm[clearKey] = () =>
        task().then(
          (e) => log.info('clear AI history success', e),
          (e) => log.error('clear AI history failed', e),
        );
      if ((await comm.receive()).clearKey === clearKey) tm[clearKey]();
    }),
  );

  const btns = _.map(hostTasks, (task, host) => ({
    text: host.split('.').at(-2) ?? host,
    hidden: true,
    ...(location.host === host
      ? { onclick: tm[clearKey], color: 'steelblue' }
      : { onclick: () => comm.send(`https://${host}`, { clearKey }) }),
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

/** Route */
(function () {
  'use strict';
  if (self != top) return;
  const { $, $$, ui, log, _ } = tm;

  tm.router({
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

    'www.duolingo.com': {
      async ''() {
        if (location.hash === '#auto') {
          // auto continue
          let btn = await Promise.any([
            $.wait('button[data-test=story-start]', { count: 180 }),
            $.wait('button[data-test=stories-player-continue]', {
              count: 180,
            }),
          ]);
          if (btn.dataset['test'] === 'story-start') {
            log('find start');
            await new Promise((r) => btn.addEventListener('click', r));
            btn = await $.wait('button[data-test=stories-player-continue]');
          }

          log('find continue');
          btn.click();
          $.observe(btn, () => btn.disabled || btn.click(), {
            attributes: true,
            attributeFilter: ['disabled'],
          });

          $.observe(
            await $.wait(':has(+ #bottom-spacer)'),
            async () => {
              log('done');
              const id = location.pathname.split('/').at(-1);
              if (!id) return log.error('no story id found');
              stories.delete(id);
              localStorage.setItem('tm:stories', JSON.stringify([...stories]));
              const doneBtn = await $.wait(
                'button[data-test=stories-player-done]',
              );
              window.history.length === 1 ? window.close() : doneBtn.click();
            },
            { childList: true },
          );
        }

        // auto select story
        /** @type {Set<string>} */
        let stories = new Set(
          JSON.parse(localStorage.getItem('tm:stories') ?? '[]'),
        );
        tm['FnBtns'].push({
          text: 'story:' + stories.size,
          async onclick() {
            if (!stories.size) {
              ui.snackbar({ text: 'fetching stories...' });
              const list = (
                await (
                  await fetch(
                    'https://stories.duolingo.com/api2/practiceHubStories?' +
                      new URLSearchParams({
                        featuredStoryId:
                          'en-zh-history2-radio-play-0-autogenerated',
                        fromLanguage: 'zh',
                        learningLanguage: 'en',
                      }),
                    {
                      headers: {
                        Authorization: `Bearer ${(await window.cookieStore.get('jwt_token'))?.value}`,
                      },
                    },
                  )
                ).json()
              ).stories;
              stories = new Set(list.map(({ id }) => id));
              localStorage.setItem('tm:stories', JSON.stringify([...stories]));
            }
            const goto = () => {
              const id = [...stories][Math.floor(Math.random() * stories.size)];
              window.open(`/stories/${id}?mode=LISTEN#auto`);
            };
            const count = 1; //+(window.prompt('How many stories to goto?') ?? 0);
            for (let i = 0; i < count; i++) goto();
            this.parentElement.parentElement.close();
          },
        });
      },
      lesson() {
        location.hash = '#auto';
      },
    },

    'www.youtube.com': {
      async watch() {
        // change cover size mode
        (
          await $.wait('div.ytp-cued-thumbnail-overlay-image')
        ).style.backgroundSize = 'contain';
        // more height
        const player = await $.wait('ytd-watch-flexy div#player');
        player.style.setProperty(
          '--ytd-watch-flexy-height-ratio',
          '' +
            (+getComputedStyle(player).getPropertyValue(
              '--ytd-watch-flexy-width-ratio',
            ) /
              16) *
              11,
        );
        // shortcut
        /** @type {Record<string, number>} */
        const speeds = { '!': 1, '@': 2 };
        document.addEventListener('keydown', async (e) => {
          if (!e.shiftKey) return;
          const speed = speeds[e.key];
          if (speed) (await $.wait('video')).playbackRate = speed;
        });
      },
    },
  });
})();
