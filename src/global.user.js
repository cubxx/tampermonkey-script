// ==UserScript==
// @name         全局功能
// @version      0.2
// @author       Cubxx
// @match        *://*/*
// @updateURL    https://github.com/Cubxx/tampermonkey-script/raw/main/src/global.user.js
// @downloadURL  https://github.com/Cubxx/tampermonkey-script/raw/main/src/global.user.js
// @icon         https://i1.hdslb.com/bfs/face/a4883ecafbde7d55bb3f3356ce91d14452fcfef9.jpg@120w_120h_1c.avif
// @grant        none
// ==/UserScript==

//事件监听
(function () {
    const { Dom, ui, util } = tm;
    const doc = new Dom(document);

    function copyText() {
        if (!navigator.clipboard) util.exit('不支持 navigator.clipboard');
        const text = getSelection()?.toString();
        if (!text) return;
        navigator.clipboard.writeText(text).then(
            () => ui.snackbar.show('复制成功', 'seagreen'),
            (err) => ui.snackbar.show('复制失败', 'crimson'),
        );
    }
    function advancedNav() {
        const cfg = {
            google: 'https://www.google.com/search?q=',
            'google-scholar': 'https://scholar.google.com/scholar?q=',
            bing: 'https://www.bing.com/search?cc=us&q=',
            duck: 'https://duckduckgo.com/?q=',
            mdn: 'https://developer.mozilla.org/zh-CN/search?q=',
            github: 'https://github.com/search?q=',
            'github-user': 'https://github.com/',
            npm: 'https://www.npmjs.com/search?q=',
            'npm-pkg': 'https://www.npmjs.com/package/',
            bili: 'https://search.bilibili.com/all?keyword=',
            'bili-video': 'https://www.bilibili.com/video/',
            'bili-user': 'https://space.bilibili.com/',
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
        };
        let alias = 'bing',
            content = '';
        function setContent(e) {
            content = e.target.value;
            ui.confirm.update(...updateArgs());
        }
        function setAlias(e) {
            alias = typeof e === 'string' ? e : e.target.value;
            ui.confirm.update(...updateArgs());
        }
        function showCfg(e) {
            const text = e.target.value;
            if (!text) return;
            const aliases = Object.keys(cfg).filter((e) => e.startsWith(text));
            const items = aliases.map((e) => ({
                text: e,
                onclick: () => setAlias(e),
            }));
            if (!items.length) return;
            const el = ui.dialog.dom.$('s-text-field');
            el && ui.menu.show(items, el);
        }
        const comp = () => lit.html`
<div style="${Dom.style({
            margin: '15px 20px 0',
            font: 'large Consolas',
            display: 'grid',
            gridTemplateColumns: '1fr 2fr',
            gap: '10px',
        })}">
<s-text-field label="别名" style="min-width: auto;">
    <input .value=${alias} @blur=${setAlias} @input=${showCfg} type="text"/>
</s-text-field>
<s-text-field label="内容">
    <textarea .value=${content} @blur=${setContent}></textarea>
</s-text-field>
<i style="${Dom.style({
            gridColumnStart: 1,
            gridColumnEnd: 3,
            fontSize: 'small',
        })}">${cfg[alias] ?? 'https://...'}</i>
</div>`;
        function search(target) {
            if (!util.hasOwnKey(cfg, alias)) {
                ui.snackbar.show(`${alias} 别名无效`, 'crimson');
                return;
            }
            const url = cfg[alias] + content;
            window.open(url, target);
        }
        const updateArgs = () =>
            /** @type {Parameters<typeof ui.confirm.show>} */ ([
                '快速导航',
                comp(),
                ['新建', () => search('_blank')],
                ['覆盖', () => search('_self')],
            ]);

        ui.confirm.show(...updateArgs());
        const el = ui.confirm.dom.$('s-text-field textarea')?.el;
        if (!el) return;
        el.focus();
        el.setSelectionRange(-1, -1);
    }
    function FnPanel() {
        /** @type {NonNullable<Parameters<typeof ui.dialog.show>[2]>} */
        const FnBtns = [
            {
                text: '设计模式',
                style: {
                    background: document.designMode === 'on' ? '#bbb' : '',
                },
                onclick() {
                    util.toggle(document, 'designMode', ['on', 'off']);
                },
            },
        ];
        tm.matchURL(/github.(com|io)/) &&
            FnBtns.push({
                text: 'Github Page',
                onclick() {
                    const url = new URL(location.href);
                    if (url.host === 'github.com') {
                        const [_, author, rep] = url.pathname.split('/');
                        window.open(`https://${author}.github.io/${rep}`);
                    } else if (url.host.endsWith('.github.io')) {
                        const author = url.host.replace('.github.io', '');
                        const [_, rep] = url.pathname.split('/');
                        window.open(`https://github.com/${author}/${rep}`);
                    } else {
                        ui.snackbar.show('当前路径不支持转换', 'crimson');
                    }
                },
            });
        ui.dialog.show('', '', FnBtns);
    }
    doc.on(
        'keydown',
        (e) => {
            if (e.ctrlKey && e.code === 'KeyC') copyText();
            if (e.altKey && e.code === 'KeyQ') advancedNav();
            if (e.altKey && e.code === 'KeyS') FnPanel();
        },
        true,
    );
})();

//广告删除
(function () {
    'use strict';
    if (self != top) return;
    const { Dom } = tm;
    const doc = new Dom(document);
    function globalADs() {
        const ads = [
            [
                '.adsbygoogle', //google
                '.pb-ad', //google
                '.google-auto-placed', //google
                '.ap_container', //google
                '.ad', //google
                '.b_ad', //bing-搜索
                '.Pc-card', //zhihu-首页
                '.Pc-word', //zhihu-问题
                '.unionAd', //baidu-百科
                '.jjjjasdasd', //halihali
                '.ytd-ad-slot-renderer', //ytb
                '.Ads', //nico
                '.ads', //nico
                '.baxia-dialog', //高德地图
                '.sufei-dialog', //高德地图
                '.app-download-panel', //高德地图
                '.pop-up-comp', //有道翻译
                '.ai-guide', //有道翻译
                '#player-ads', //ytb
                '#masthead-ad', //ytb
                'ytd-ad-slot-renderer', //ytb
                '#google_esf', //google
                'li[data-layout=ad]', //duck
            ].map((e) => doc.$$(e)),
            /** @type {const} */ ([
                ['iframe', 'src', /googleads/],
                ['iframe', 'src', /app.moegirl/],
                ['iframe', 'src', /ads.nicovideo.jp/],
                // ['div', 'innerText', /^(oversea AD\n)?(加载中|广告)$/],
            ]).map(([s, key, reg]) =>
                doc.$$(s).filter(({ el }) => reg.test(el[key])),
            ),
        ]
            .flat(2)
            .map((e) => (e.hide(), e.el));
        console.debug('globalAD', ads);
    }
    requestIdleCallback(globalADs);
    window.addEventListener('load', globalADs);
})();

//直接跳转
(function () {
    'use strict';
    const arr = {
        'link.zhihu.com': null, //知乎
        'link.csdn.net': null, //CSDN
        'link.juejin.cn': null, //掘金
        'c.pc.qq.com': (sp) => {
            const url = sp.get('url') || sp.get('pfurl');
            return url.includes('://') ? url : 'https://' + url;
        }, //QQ
        'gitee.com/link': null, // gitee
        'www.jianshu.com/go-wild': (sp) => sp.get('url'), //简书
        'docs.qq.com/scenario/link.html': (sp) => sp.get('url'), //腾讯文档
        'afdian.net/link': null, //爱发电
        'mail.qq.com/cgi-bin/readtemplate': (sp) => sp.get('gourl'),
    };
    for (let path in arr) {
        if (location.href.includes(path)) {
            const sp = new URL(document.URL).searchParams;
            location.href = arr[path]?.(sp) || sp.get('target');
        }
    }
})();

(function () {
    'use strict';
    if (self != top) return;
    const { Dom, ui, util } = tm;
    const doc = new Dom(document);

    tm.matchURL(/bing.com/, () => {
        const url = new URL(location.href);
        if (url.pathname === '/ck/a') return;
        const search = url.searchParams;
        if (search.get('cc') === 'us' && search.get('mkt') === null) return;
        search.set('cc', 'us');
        search.delete('mkt');
        location.search = search + '';
    });
    tm.matchURL(/www.bing.com\/(search|chat)\?/, () => {
        //界面优化
        let times = 0;
        doc.$('body')?.observe(
            function (ob) {
                const main = doc.$('cib-serp')?.shadowRoot;
                if (!main) return;
                doc.$('#id_h')?.set({
                    style: { right: 'calc(40px - calc(100vw - 100%))' },
                });
                //左布局
                const conversation = main.$('#cib-conversation-main')
                    ?.shadowRoot?.children[0];
                if (!conversation) return;
                const sidePanel = conversation.$('.side-panel');
                const scroller = conversation.$('.scroller');
                if (!sidePanel || !scroller) return;
                sidePanel.mount(
                    scroller,
                    conversation.$('.scroller-positioner') ?? 0,
                );
                const inputBox = main.$('#cib-action-bar-main');
                inputBox?.set({ style: 'right: 0px;margin: 0;' });
                //清空会话
                const surface = main
                    .$('#cib-conversation-main')
                    ?.children[0].shadowRoot?.$('.threads-container .surface');
                if (!surface) return;
                const threads = surface.$('.threads');
                if (!threads) return;
                if (times) return ob.disconnect();
                const clearBtn = Dom.h('input', {
                    type: 'button',
                    value: '清空会话',
                    class: 'show-recent',
                    onclick() {
                        threads.$$('cib-thread').forEach((e) => {
                            e.shadowRoot?.$('.delete')?.el['click']();
                            setTimeout(() => {
                                e.shadowRoot?.$('.confirm')?.el['click']();
                            }, 50);
                        });
                    },
                });
                clearBtn.mount(surface);
                //历史会话
                surface.observe(
                    function (ob) {
                        surface.$('button')?.hide();
                        ob.disconnect();
                    },
                    { childList: true },
                );
                threads.observe(
                    function () {
                        threads
                            .$$('cib-thread')
                            ?.forEach((e) => e.el.removeAttribute('hide'));
                    },
                    { childList: true },
                );
                times++;
                ob.disconnect();
            },
            { childList: true },
        );
    });

    tm.matchURL(/developer.mozilla.org\/[\w-]+\/docs/, () => {
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
    });

    tm.matchURL(/www.zhihu.com\/(follow)?$/, () => {
        doc.$('#TopstoryContent')?.on('click', (e) => {
            //@ts-ignore
            if (e.target.classList[1] != 'ContentItem-more') return;
            //@ts-ignore
            const el = e.target.parentElement?.parentElement?.parentElement;
            el.observe(
                function (ob) {
                    const childrens = [...el.children];
                    const time = childrens.filter((e) =>
                        /(发布|编辑)于/.test(e.innerText),
                    )[0];
                    const vote = childrens.filter((e) =>
                        /赞同了该(回答|文章)/.test(e.innerText),
                    )[0];
                    if (vote) vote.hide();
                    if (!time) return console.log('找不到日期元素');
                    el.insertBefore(time, el.children[0]);
                    el.$('.ContentItem-time').innerHTML +=
                        '<br>段落数 ' + el.$$('.RichContent-inner p').length;
                    ob.disconnect();
                },
                { childList: true },
            );
        });
        async function delAllMsg() {
            const { data } = await fetch(
                'https://www.zhihu.com/api/v4/inbox',
            ).then((res) => res.json());
            const results = await Promise.allSettled(
                data.map(({ participant: { id } }) =>
                    fetch(`https://www.zhihu.com/api/v4/chat?sender_id=${id}`, {
                        method: 'delete',
                    }).then((res) => res.json()),
                ),
            );
            console.log('删除所有私信', results);
        }
    });
    tm.matchURL(/www.zhihu.com\/question/, () => {
        doc.$('.App-main .QuestionHeader-title')?.set({
            title: `创建时间doc.${
                doc.$('meta[itemprop=dateCreated]')?.el.content
            }\n修改时间doc.${doc.$('meta[itemprop=dateModified]')?.el.content}`,
        });
        doc.$('header')?.hide();
    });
    tm.matchURL(/zhuanlan.zhihu.com\/p/, () => {
        doc.$('.ContentItem-time')?.mount('article', '.Post-RichTextContainer');
    });

    tm.matchURL(/heroicons.dev/, () => {
        doc.$('#root > aside.sidebar-2 > div')?.hide();
    });

    tm.matchURL(/www.pixiv.net\/artworks/, () => {
        const list = [
            'aside > div',
            '.charcoal-token > div > div:nth-child(2) > div:nth-child(2)',
            '.charcoal-token > div > div:nth-child(3) > div > div > div:nth-child(2)',
        ];
        function delADs() {
            list.forEach((e) => doc.$(e)?.hide());
        }
        delADs();
        doc.$('body')?.observe(delADs, { childList: true });
    });

    tm.matchURL(/[^]+?.github.io\//, () => {});
})();
