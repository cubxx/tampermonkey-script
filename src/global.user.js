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
        /** @typedef {NonNullable<Parameters<typeof ui.dialog.show>[2]>} Btns */
        /** @type {Btns} */
        const pageBtns = [];
        /**
         * @type {(
         *   | [RegExp | string, string, () => void]
         *   | [RegExp | string, () => void]
         * )[]}
         */
        const confgis = [
          [
            /github.(com|io)/,
            'Github Page',
            () => {
              const url = new URL(location.href);
              if (url.host === 'github.com') {
                const [_, usr, rep] = url.pathname.split('/');
                window.open(`https://${usr}.github.io/${rep ?? ''}`);
              } else if (url.host.endsWith('.github.io')) {
                const usr = url.host.replace('.github.io', '');
                const [_, rep] = url.pathname.split('/');
                window.open(`https://github.com/${usr}/${rep ?? ''}`);
              } else {
                ui.snackbar.show('not support this page', 'crimson');
              }
            },
          ],
          [
            /github.com\/.+\/.+$/,
            'Stargazers',
            () => window.open(`${location.href}/stargazers`),
          ],
          [
            'zhihu.com',
            'Clear Inbox',
            async () => {
              const { data } = await fetch('/api/v4/inbox').then((e) =>
                e.json(),
              );
              await Promise.allSettled(
                data.map(({ participant: { id } }) =>
                  fetch(`https://www.zhihu.com/api/v4/chat?sender_id=${id}`, {
                    method: 'delete',
                  }).then((e) => e.json()),
                ),
              );
            },
          ],
          [
            'chatgpt.com',
            'Clear Conversation',
            async () => {
              const token = prompt('token');
              await Promise.all(
                $$('nav li a').map(({ el }) => {
                  const id = el.href.match(/[^\/]+$/)?.[0];
                  return fetch(`/backend-api/conversation/${id}`, {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: {
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json',
                      'Oai-Device-Id': (
                        localStorage.getItem('oai-did') ?? ''
                      ).replaceAll('"', ''),
                      'Oai-Language': 'en-US',
                    },
                    body: JSON.stringify({ is_visible: false }),
                  });
                }),
              );
              log('clear conversation success');
            },
          ],
          [
            'microsoft.com',
            'Clear Conversation',
            () => {
              window.open(
                'https://account.microsoft.com/privacy/copilot',
                '_blank',
              );
            },
          ],
          [
            'kimi.moonshot.cn',
            'Clear Conversation',
            async () => {
              const { promise, resolve } = Promise.withResolvers();
              /** @type {MutationObserver} */
              let ob;
              $(document.body).observe(
                (_ob) => {
                  $('.MuiDialogActions-root button:last-child')?.el.click();
                  ob = _ob;
                },
                { childList: true },
              );
              const timer = setInterval(() => {
                const btns = $$('div[class*=contentBox] div[class*=delBtn]');
                if (!btns.length) resolve(0);
                (function addTask() {
                  const btn = btns.pop();
                  btn &&
                    setTimeout(
                      () => {
                        btn.el.click();
                        addTask();
                      },
                      Math.random() * 5e2 + 5e2,
                    );
                })();
              }, 1e3);
              promise.then(() => {
                ob.disconnect();
                clearInterval(timer);
                log('clear conversation success');
              });
            },
          ],
        ];
        tm.matchURL(
          //@ts-ignore
          ...confgis.map((e) =>
            e.length === 3
              ? [e[0], () => pageBtns.push({ text: e[1], onclick: e[2] })]
              : e,
          ),
        );
        /** @type {Btns} */
        const commonBtns = [
          {
            text: 'Design Mode',
            onclick() {
              _.toggle(document, 'designMode', ['on', 'off']);
              _.toggle(this.style, 'opacity', ['0.5', '1']);
            },
          },
        ].map((e) => {
          Object.assign((e.style ??= {}), { background: 'seagreen' });
          return e;
        });
        return () => ui.dialog.show('', '', commonBtns.concat(pageBtns));
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

(function () {
  'use strict';
  if (self != top) return;
  const { $, $$, hack, log, _ } = tm;

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
  );
})();
