// ==UserScript==
// @name        global
// @version     0.2
// @author      cubxx
// @match       *://*/*
// @updateURL   https://cdn.jsdelivr.net/gh/cubxx/tampermonkey-script/src/global.user.js
// @downloadURL https://cdn.jsdelivr.net/gh/cubxx/tampermonkey-script/src/global.user.js
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
      (e) => e.shiftKey && e.code === 'KeyC',
      function copyText() {
        if (!navigator.clipboard) _.exit('not support navigator.clipboard');
        const text = getSelection()?.toString();
        if (!text) return;
        navigator.clipboard.writeText(text).then(
          () => ui.snackbar.show('copy success', 'seagreen'),
          (err) => ui.snackbar.show('copy failed', 'crimson'),
        );
      },
    ],
    [
      (e) => e.altKey && e.code === 'KeyQ',
      (function advancedNav() {
        const cfg = {
          google: 'https://www.google.com/search?q=',
          'google.scholar': 'https://scholar.google.com/scholar?q=',
          bing: 'https://www.bing.com/search?cc=us&q=',
          duck: 'https://duckduckgo.com/?q=',
          mdn: 'https://developer.mozilla.org/zh.CN/search?q=',
          github: 'https://github.com/search?q=',
          'github.user': 'https://github.com/',
          npm: 'https://www.npmjs.com/search?q=',
          'npm.pkg': 'https://www.npmjs.com/package/',
          bili: 'https://search.bilibili.com/all?keyword=',
          'bili.video': 'https://www.bilibili.com/video/',
          'bili.user': 'https://space.bilibili.com/',
          mfuns: 'https://www.mfuns.net/search?q=',
          youtube: 'https://www.youtube.com/results?search_query=',
          x: 'https://x.com/search?q=',
          stackoverflow: 'https://stackoverflow.com/search?q=',
          zhihu: 'https://www.zhihu.com/search?q=',
          zhipin: 'https://www.zhipin.com/web/geek/job?query=',
          steamdb: 'https://steamdb.info/search/?q=',
          greasyfork: 'https://greasyfork.org/zh-CN/scripts?q=',
          amap: 'https://ditu.amap.com/search?query=',
          scihub: 'https://sci-hub.st/',
          email: 'mailto:',
          wiki: 'https://wikipedia.org/w/index.php?search=',
          xiaohongshu: 'https://www.xiaohongshu.com/search_result?keyword=',
          pypi: 'https://pypi.org/search/?q=',
          'pypi.pkg': 'https://pypi.org/project/',
        };
        const dom = ui.dialog.dom;
        function goto() {
          const el = dom.$('s-picker-item[selected]')?.el;
          if (!el) return;
          el.attributes.removeNamedItem('selected');
          const alias = el.textContent;
          const content = dom.$('textarea')?.el.value;
          _.hasOwnKey(cfg, alias ?? '')
            ? window.open(cfg[alias] + content, '_blank')
            : ui.snackbar.show(`not support ${alias}`, 'crimson');
        }
        const comp = () => lit.html`
      <div style="${$.style({
        margin: '15px 20px',
        'font-family': 'Consolas',
      })}"
        @keydown=${(e) => {
          e.stopImmediatePropagation();
          if (e.key === 'Enter' && e.target.tagName === 'TEXTAREA') {
            dom.$('s-picker')?.el.toggle();
          } else if (e.key === 'ArrowUp') {
          }
        }}>
        <s-text-field label="Content">
          <textarea tabindex="0" autofocus></textarea>
        </s-text-field>
        <s-picker label="Alias" style="color: #0096d2" @change=${goto}>
          ${_.map(
            cfg,
            (v, k) =>
              lit.html`<s-picker-item .textContent=${k} style="${$.style({
                height: 'auto',
                'justify-content': 'flex-start',
              })}"></s-picker-item>`,
          )}
        </s-picker>
      </div>`;
        return () => {
          ui.dialog.show('Nav', comp());
          dom.$('textarea')?.el.setSelectionRange(-1, -1);
        };
      })(),
    ],
    [
      (e) => e.altKey && e.code === 'KeyS',
      (function FnPanel() {
        /** @type {NonNullable<Parameters<typeof ui.dialog.show>[2]>[]} */
        tm['FnBtns'] = [
          {
            text: 'Design Mode',
            style: { background: 'seagreen' },
            onclick() {
              _.toggle(document, 'designMode', ['on', 'off']);
              _.toggle(this.style, 'opacity', ['0.5', '1']);
            },
          },
        ];
        return () => ui.dialog.show('', '', tm['FnBtns']);
      })(),
    ],
  ];
  $(document).on(
    'keydown',
    (e) => {
      for (const [is, fn] of listeners)
        if (is(e)) return e.stopImmediatePropagation(), fn();
    },
    true,
  );
})();

/** Remove ADs */
(function () {
  'use strict';
  if (self != top) return;

  tm.rmAD('global', [
    '.adsbygoogle', //google
    '.pb-ad', //google
    '.google-auto-placed', //google
    '.ap_container', //google
    '.ad', //google
    '.b_ad', //bing
    '.Pc-card', //zhihu-首页
    '.Pc-Business-Card-PcTopFeedBanner', //zhihu-首页
    '.Pc-word', //zhihu-问题
    '.jjjjasdasd', //halihali
    '.Ads', //nico
    '.ads', //nico
    '.baxia-dialog', //amap
    '.sufei-dialog', //amap
    '.app-download-panel', //amap
    '#player-ads', //ytb
    '#masthead-ad', //ytb
    'ytd-ad-slot-renderer', //ytb
    '#google_esf', //google
    'li[data-layout=ad]', //duck
    'img[alt=AD]', //acgbox
    'div[id="1280_adv"]',
    '.c-ad', //nature
    '.wwads-container', //vitepress
    '.VPDocAsideCarbonAds', //vitepress
    '.carbonads-responsive',
    '.cpc-ad',
    '[id^=google_ads]',
    'iframe[src*="googleads"]',
    'iframe[src*="app.moegirl"]',
    'iframe[src*="ads.nicovideo.jp"]',
  ]);
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
  const { $, $$, log, comm, matchURL, ui, _ } = tm;
  const clearSignal = 'tm:clearAIHistory';
  /** @type {Record<string, () => Promise<unknown>>} */
  const urlTaskMap = {
    async 'https://account.microsoft.com/privacy/copilot'() {
      const { ok } = await fetch(
        '/privacy/api/copilot-activity/clear-all/bing-consumer',
        {
          method: 'DELETE',
          headers: {
            __requestverificationtoken:
              $('input[name=__RequestVerificationToken]')?.el.value ?? '',
            'X-Requested-With': 'XMLHttpRequest',
          },
        },
      );
      if (!ok) return Promise.reject();
    },
    async 'https://chatgpt.com'() {
      const authorization =
        'Bearer ' +
        window['__reactRouterContext'].state.loaderData.root['rq:["session"]']
          .data.accessToken;
      const { items } = await (
        await fetch('/backend-api/conversations?offset=0&limit=100', {
          method: 'GET',
          headers: { authorization },
        })
      ).json();
      await Promise.all(
        items.map(async ({ id }) =>
          (
            await fetch(`/backend-api/conversation/${id}`, {
              method: 'PATCH',
              headers: { authorization, 'Content-Type': 'application/json' },
              body: JSON.stringify({ is_visible: false }),
            })
          ).json(),
        ),
      );
    },
    async 'https://chat.deepseek.com'() {
      const authorization =
        'Bearer ' + JSON.parse(localStorage.getItem('userToken') ?? '').value;
      const {
        data: {
          biz_data: { chat_sessions },
        },
      } = await (
        await fetch('/api/v0/chat_session/fetch_page?count=100', {
          method: 'GET',
          headers: { authorization },
        })
      ).json();
      await Promise.all(
        chat_sessions.map(
          async ({ id }) =>
            await (
              await fetch('/api/v0/chat_session/delete', {
                method: 'POST',
                headers: { authorization, 'content-type': 'application/json' },
                body: JSON.stringify({ chat_session_id: id }),
              })
            ).json(),
        ),
      );
    },
    async 'https://kimi.moonshot.cn'() {
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
    async 'https://chatglm.cn'() {
      const authorization =
        'Bearer ' + (await window['cookieStore'].get('chatglm_token')).value;
      const {
        result: { results },
      } = await (
        await fetch('/chatglm/backend-api/assistant/search_log_history', {
          method: 'POST',
          headers: { authorization, 'content-type': 'application/json' },
          body: JSON.stringify({
            get_all_history: true,
            page_num: 1,
            page_size: 1e4,
          }),
        })
      ).json();
      await Promise.all(
        results.map(
          async ({ assistant_id, conversation_id }) =>
            await (
              await fetch(
                '/chatglm/backend-api/assistant/conversation/delete',
                {
                  method: 'POST',
                  headers: {
                    authorization,
                    'content-type': 'application/json',
                  },
                  body: JSON.stringify({ assistant_id, conversation_id }),
                },
              )
            ).json(),
        ),
      );
    },
    async 'https://metaso.cn'() {
      const token = '';
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
  };
  tm['FnBtns'].push({
    text: 'Clear AI History',
    style: { background: 'cadetblue' },
    onclick() {
      setTimeout(() =>
        ui.dialog.show(
          'Choose one',
          '',
          _.map(urlTaskMap, (task, url) => ({
            text: new URL(url).hostname.split('.').at(-2) ?? '',
            ...(document.URL.includes(url)
              ? { onclick: task, style: { background: 'steelblue' } }
              : { onclick: () => comm.send(url, { x: clearSignal }) }),
          })),
        ),
      );
    },
  });
  matchURL(
    ..._.map(
      urlTaskMap,
      (task, url) =>
        /** @type {[String, () => void]} */ ([
          url,
          async () => {
            if ((await comm.receive()).x !== clearSignal) return;
            log('clear AI history start');
            task().then(
              (e) => log.info('clear AI history success', e),
              (e) => log.error('clear AI history failed', e),
            );
          },
        ]),
    ),
  );
})();

/** Different site task */
(function () {
  'use strict';
  if (self != top) return;
  const { $, $$, ui, log, _ } = tm;

  document.documentElement.style.fontSize = '16px';
  tm.matchURL(
    [
      'bing.com',
      () => {
        const url = new URL(location.href);
        if (url.pathname === '/ck/a') return;
        const search = url.searchParams;
        if (search.get('cc') === 'us' && search.get('mkt') === null) return;
        search.set('cc', 'us');
        search.delete('mkt');
        location.search = search + '';
      },
    ],
    [
      /developer.mozilla.org\/[\w-]+\/docs/,
      () => {
        if (location.href.includes('zh-CN')) return;
        if (history.length > 2) return;
        history.pushState(
          null,
          '',
          (location.href = location.href.replace(
            /\/([\w-]+)\/docs/,
            '/zh-CN/docs',
          )),
        );
      },
    ],

    [
      /www.zhihu.com\/(follow)?$/,
      () => {
        $('#TopstoryContent')?.on('click', (e) => {
          const target = /** @type {HTMLElement} */ (e.target);
          if (target.classList[1] != 'ContentItem-more') return;
          const el = target.parentElement?.parentElement?.parentElement;
          if (!el) return;
          const dom = $(el);
          dom.observe(
            function (ob) {
              const childrens = dom.$$('div');
              const time = childrens.find(({ el }) =>
                /(发布|编辑)于/.test(el.innerText),
              );
              const vote = childrens.find(({ el }) =>
                /赞同了该(回答|文章)/.test(el.innerText),
              );
              vote?.hide();
              if (!time) return log('time not found');
              time.mount(dom, 0);
              time.el.innerHTML += `<p>段落数 ${dom.$$('.RichContent-inner p').length}</p>`;
              ob.disconnect();
            },
            { childList: true },
          );
        });
      },
    ],

    [
      'zhihu.com',
      () => {
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
    ],
    [
      'www.zhihu.com/question',
      () => {
        $('.App-main .QuestionHeader-title')?.set({
          title: `Create on ${
            $('meta[itemprop=dateCreated]')?.el.content
          }\nEdit on${$('meta[itemprop=dateModified]')?.el.content}`,
        });
        $('header')?.hide();
      },
    ],
    [
      'zhuanlan.zhihu.com/p',
      () => {
        $('.ContentItem-time')?.mount('article', '.Post-RichTextContainer');
      },
    ],

    [
      'heroicons.dev',
      () => {
        $('#root > aside.sidebar-2 > div')?.hide();
      },
    ],
    [
      'www.pixiv.net/artworks',
      () => {
        function delADs() {
          $$('iframe').forEach((e) => e.hide());
        }
        // delADs();
        $('body')?.observe(delADs, { childList: true });
      },
    ],
    [
      'www.acgbox.link',
      () => {
        $$('a.card').map((e) => {
          e.set({ href: e.el.dataset.url });
        });
      },
    ],
    [
      'nature.com',
      () => {
        ['c-hero__link', 'c-card__link', 'u-faux-block-link'].map((c) =>
          $$(`a.${c}`).map((e) => {
            e.el.classList.remove(c);
            e.el.classList.add('u-link-inherit');
          }),
        );
      },
    ],
    [
      'x.com',
      () => {
        $(document.body).observe(
          (ob) => {
            const root = $(':has(>div[data-testid="cellInnerDiv"])');
            if (!root) return;
            root.observe(
              tm.rmAD('x', [
                'div[data-testid="cellInnerDiv"]:has(article div[id]>.r-1awozwy>svg)',
              ]),
              { childList: true },
            );
            ob.disconnect();
          },
          { childList: true, subtree: true },
        );
      },
    ],
    [
      /github.(com|io)/,
      () => {
        const url = new URL(location.href);
        function repo2page() {
          if (url.host !== 'github.com') return;
          const [_, usr, rep] = url.pathname.split('/');
          return `https://${usr}.github.io/${rep ?? ''}`;
        }
        function page2repo() {
          if (!url.host.endsWith('.github.io')) return;
          const usr = url.host.replace('.github.io', '');
          const [_, rep] = url.pathname.split('/');
          return `https://github.com/${usr}/${rep ?? ''}`;
        }
        tm['FnBtns'].push(
          {
            text: 'Repo <-> Page',
            onclick() {
              repo2page() && window.open(repo2page());
              page2repo() && window.open(page2repo());
            },
          },
          {
            text: 'Stargazers',
            onclick() {
              window.open(`${page2repo() ?? location.href}/stargazers`);
            },
          },
        );
      },
    ],
  );
})();
