// ==UserScript==
// @name         全局功能
// @version      0.2
// @author       Cubxx
// @include      *
// @exclude      file:///*
// @exclude      https://cubxx.github.io/*
// @exclude      http://127.0.0.1:*/*
// @updateURL    https://github.com/Cubxx/My-Tampermonkey-Script/raw/master/src/global.user.js
// @downloadURL  https://github.com/Cubxx/My-Tampermonkey-Script/raw/master/src/global.user.js
// @icon         https://i1.hdslb.com/bfs/face/a4883ecafbde7d55bb3f3356ce91d14452fcfef9.jpg@120w_120h_1c.avif
// @grant        none
// ==/UserScript==

//事件监听
(function () {
    const { dom, ui, util } = tm;

    document.on(
        'keydown',
        (e) => {
            if (e.ctrlKey && e.code === 'KeyC') {
                if (!navigator.clipboard)
                    util.exit('不支持 navigator.clipboard');
                const text = getSelection()?.toString();
                if (!text) return;
                navigator.clipboard.writeText(text).then(
                    () => ui.snackbar.show('复制成功', 'seagreen'),
                    (err) => ui.snackbar.show('复制失败', 'crimson'),
                );
            }
        },
        true,
    );
    document.on(
        'contextmenu',
        (e) => {
            // 右键左上角
            if (e.clientX > 10 || e.clientY > 10) return;
            e.preventDefault();
            ui.dialog.show('', '', [
                {
                    text: '设计模式',
                    style: {
                        background:
                            document['designMode'] === 'on' ? '#bbb' : '',
                    },
                    onclick() {
                        util.toggle(document, 'designMode', ['on', 'off']);
                    },
                },
                {
                    text: '邮箱发送',
                    onclick() {
                        const email =
                            getSelection()?.toString() || prompt('请输入邮箱');
                        email && open('mailto:' + email);
                    },
                },
                {
                    text: '地址查找',
                    onclick() {
                        const address =
                            getSelection()?.toString() || prompt('请输入地址');
                        address &&
                            open(
                                `https://ditu.amap.com/search?query=${address}`,
                            );
                    },
                },
                {
                    text: 'SciHub',
                    onclick() {
                        const doi =
                            getSelection()?.toString() || prompt('请输入DOI');
                        doi && open(`https://sci-hub.st/${doi}`);
                    },
                },
            ]);
        },
        false,
    );
})();

//广告删除
(function () {
    'use strict';
    if (self != top) return;

    function get({ className, id, tag }) {
        return [
            ...className.flatMap((e) => document.$$(`.${e}`)),
            ...id.map((e) => document.$(`#${e}`)),
            ...tag.flatMap((kvw) =>
                document.$$(kvw[0]).filter((e) => kvw[2].test(e[kvw[1]])),
            ),
        ];
    }
    function del(e) {
        if (!e) return;
        e.hide();
        // e.remove();
    }
    function globalADs() {
        const ads = get({
            className: [
                'adsbygoogle', //google
                'pb-ad', //google
                'google-auto-placed', //google
                'ap_container', //google
                'ad', //google
                'b_ad', //bing-搜索
                'Pc-card', //zhihu-首页
                'Pc-word', //zhihu-问题
                'unionAd', //baidu-百科
                'jjjjasdasd', //halihali
                'ytd-ad-slot-renderer', //ytb
                'Ads', //nico
                'ads', //nico
                'baxia-dialog', //高德地图
                'sufei-dialog', //高德地图
                'app-download-panel', //高德地图
                'pop-up-comp', //有道翻译
                'ai-guide', //有道翻译
            ],
            id: [
                'player-ads', //ytb
                'masthead-ad', //ytb
                'google_esf', //google
            ],
            tag: [
                ['iframe', 'src', /googleads/], //删除 iframe.src 中匹配正则的元素
                ['iframe', 'src', /app.moegirl/],
                ['div', 'innerText', /^(oversea AD\n)?(加载中|广告)$/],
                ['iframe', 'src', /ads.nicovideo.jp/],
            ],
        }).filter((e) => e);
        ads.forEach(del);
        console.log('globalAD', ads);
    }
    requestIdleCallback(globalADs);
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
    const { dom, ui, util } = tm;

    //bingAI
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
        document.body.observe(
            function (ob) {
                const main = document.$('cib-serp')?.shadowRoot;
                if (!main) return;
                document
                    .$('#id_h')
                    ?.[
                        'style'
                    ].setProperty('right', 'calc(40px - calc(100vw - 100%))');
                //左布局
                const conversation = main.$('#cib-conversation-main')
                    ?.shadowRoot?.children[0];
                if (!conversation) return;
                const sidePanel = conversation.$('.side-panel');
                if (!sidePanel) return;
                conversation
                    .$('.scroller')
                    ?.insertBefore(
                        sidePanel,
                        conversation.$('.scroller-positioner'),
                    );
                const inputBox = main.$('#cib-action-bar-main');
                if (!inputBox) return;
                inputBox['style'].cssText = 'right: 0px;margin: 0;';
                //清空会话
                const surface = main
                    .$('#cib-conversation-main')
                    ?.children[0].shadowRoot?.$('.threads-container .surface');
                if (!surface) return;
                const threads = surface.$('.threads');
                if (!threads) return;
                if (times) return ob.disconnect();
                const clearBtn = dom.h('input', {
                    type: 'button',
                    value: '清空会话',
                    class: 'show-recent',
                    onclick() {
                        threads.$$('cib-thread').forEach((e) => {
                            e.shadowRoot?.$('.delete')?.['click']();
                            setTimeout(() => {
                                e.shadowRoot?.$('.confirm')?.['click']();
                            }, 50);
                        });
                    },
                });
                clearBtn.mount(surface);
                //历史会话
                surface.observe(
                    function (ob) {
                        surface.$('button')?.remove();
                        ob.disconnect();
                    },
                    { childList: true },
                );
                threads.observe(
                    function () {
                        threads
                            .$$('cib-thread')
                            ?.forEach((e) => e.removeAttribute('hide'));
                    },
                    { childList: true },
                );
                times++;
                ob.disconnect();
            },
            { childList: true },
        );
    });

    //mdn换成中文
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
        // document
        //     .$$(/** @type {'a'} */ ('.language-menu a'))
        //     .forEach((e) => e.innerText.includes('简体') && e.click());
    });

    //知乎
    tm.matchURL(/www.zhihu.com\/(follow)?$/, () => {
        document.$('#TopstoryContent')?.on('click', (e) => {
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
        const el = document.$(
            /** @type {'div'} */ ('.App-main .QuestionHeader-title'),
        );
        if (!el) return;
        el.title = `创建时间document.${
            document.$('meta[itemprop=dateCreated]')?.['content']
        }\n修改时间document.${
            document.$('meta[itemprop=dateModified]')?.['content']
        }`;
        document.$('header')?.hide();
    });
    tm.matchURL(/zhuanlan.zhihu.com\/p/, () => {
        const el = document.$('.ContentItem-time');
        if (!el) return;
        document
            .$('article')
            ?.insertBefore(el, document.$('.Post-RichTextContainer'));
    });

    //heroicons
    tm.matchURL(/heroicons.dev/, () => {
        document.$('#root > aside.sidebar-2 > div')?.hide();
    });

    //pixiv ADs
    tm.matchURL(/www.pixiv.net\/artworks/, () => {
        const list = [
            'aside > div',
            '.charcoal-token > div > div:nth-child(2) > div:nth-child(2)',
            '.charcoal-token > div > div:nth-child(3) > div > div > div:nth-child(2)',
        ];
        function delADs() {
            list.forEach((e) => document.$(e)?.hide());
        }
        delADs();
        document.body.observe(delADs, { childList: true });
    });

    //github
    tm.matchURL(/[^]+?.github.io\//, () => {});
})();
