// ==UserScript==
// @name         全局功能
// @namespace    global_function
// @version      0.1
// @description  null
// @author       Cubxx
// @include    *
// @exclude   file:///*
// @exclude   https://cubxx.github.io/*
// @exclude   http://127.0.0.1:*/*
// @require    https://cubxx.github.io/$tm.js
// @icon         data:image/svg+xml,%3C?xml version='1.0' encoding='utf-8'?%3E%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Cg id='XMLID_273_'%3E%3Cg id='XMLID_78_'%3E%3Cpath id='XMLID_83_' class='st0' d='M304.8,0H95.2C42.6,0,0,42.6,0,95.2v209.6C0,357.4,42.6,400,95.2,400h209.6 c52.6,0,95.2-42.6,95.2-95.2V95.2C400,42.6,357.4,0,304.8,0z M106.3,375C61.4,375,25,338.6,25,293.8c0-44.9,36.4-81.3,81.3-81.3 c44.9,0,81.3,36.4,81.3,81.3C187.5,338.6,151.1,375,106.3,375z M293.8,375c-44.9,0-81.3-36.4-81.3-81.3 c0-44.9,36.4-81.3,81.3-81.3c44.9,0,81.3,36.4,81.3,81.3C375,338.6,338.6,375,293.8,375z'/%3E%3C/g%3E%3Cg id='XMLID_67_' class='st2'%3E%3Cpath id='XMLID_74_' class='st3' d='M304.8,0H95.2C42.6,0,0,42.6,0,95.2v209.6C0,357.4,42.6,400,95.2,400h209.6 c52.6,0,95.2-42.6,95.2-95.2V95.2C400,42.6,357.4,0,304.8,0z M106.3,375C61.4,375,25,338.6,25,293.8c0-44.9,36.4-81.3,81.3-81.3 c44.9,0,81.3,36.4,81.3,81.3C187.5,338.6,151.1,375,106.3,375z M293.8,375c-44.9,0-81.3-36.4-81.3-81.3 c0-44.9,36.4-81.3,81.3-81.3c44.9,0,81.3,36.4,81.3,81.3C375,338.6,338.6,375,293.8,375z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E
// @grant        none
// ==/UserScript==

(async function () {
    'use strict';
    //全局功能组
    !async function () {
        if (self === top) { //不添加在iframe中
            function findFrame(doc, func) { //不能解决iframe跨域问题
                function get_frame() {
                    return [...doc.getElementsByTagName('iframe'), ...doc.getElementsByTagName('frame')]
                }
                if (doc === null) {
                    console.log('this.contentDocument == null');
                    return false;
                }
                func();
                for (let f of get_frame()) {
                    findFrame(f.contentDocument, func)
                }
            }
            //功能组
            const _onmousemove = document.onmousemove,
                hiddLeft = -98;
            const buttonArr = [{
                name: '设计模式',
                func1() { document.designMode = 'on', this.style.backgroundColor = '#bbb' },
                func2() { document.designMode = 'off', this.style.backgroundColor = '' },
            }, {
                name: '邮箱发送',
                func1() {
                    const email = getSelection().toString() || prompt('请输入邮箱');
                    email && open('mailto:' + email);
                    this.did = !!email;
                }
            }, {
                name: '地址查找',
                apis: [
                    ['amap', 'https://ditu.amap.com/search?query='],
                    ['google', 'https://www.google.com/maps/search/'],
                    ['bing', 'https://cn.bing.com/maps/?setlang=zh-Hans&q='],
                ],
                func1() {
                    let address = getSelection().toString();
                    if (address ||= prompt('请输入地址')) {
                        this.group.attachment.innerHTML = `<b style="white-space: nowrap;">${address}</b>`
                            + $tm.addElms({
                                arr: this.apis.map(e => {
                                    return {
                                        href: e[1] + encodeURI(address),
                                        innerText: e[0],
                                    }
                                }),
                                defaults: {
                                    tag: 'a',
                                    style: `text-decoration: none;display: block;padding: 2px;`,
                                    target: '_blank',
                                    init() { this.title = this.href; }
                                }
                            }).map(e => e.outerHTML).join('');
                    } else this.did = false;
                }
            }, {
                name: 'Bing AI',
                addStyle: 'background-color:#2870ea;color:#fff',
                func1() {
                    let text = getSelection().toString();
                    $tm.urlFunc(/bing.com\/search/, e => { text ||= $('#sb_form_q').value });
                    open(`https://www.bing.com/search?showconv=0&q=${text}&cc=us`);
                }
            }, {
                name: 'ChatGPT',
                addStyle: 'background-color:#75a99c;color:#fff',
                apis: [
                    'https://chat2.jinshutuan.com/',
                    'https://chatbot.theb.ai/',
                    'https://chat.gptchinese.info/',
                    'https://chat35.com/chat',
                    'https://chatforai.com/',
                    'https://chat.xeasy.me/',
                ],
                func1() {
                    this.group.attachment.innerHTML = $tm.addElms({
                        arr: this.apis.map(e => { return { href: e } }),
                        defaults: {
                            tag: 'a',
                            style: `text-decoration: none;display: block;padding: 2px;`,
                            target: '_blank',
                            init() { this.innerText = this.title = this.href; }
                        }
                    }).map(e => e.outerHTML).join('');
                }
            }, {
                name: '运行代码',
                addStyle: 'background-color:#f7df1e;color: #000;',
                func1() {
                    this.group.attachment.innerHTML = '';
                    $tm.addElms({
                        arr: [{
                            title: '代码', addStyle: 'border-bottom: 2px solid;', textContent: 'return 0',
                            onkeydown(e) {
                                if (!e.shiftKey && !e.ctrlKey && e.key == 'Enter') {
                                    const res = (function (code) {
                                        try { return new Function(code)(); }
                                        catch (e) { return e; }
                                    })(this.textContent);
                                    console.log('输出', res);
                                    boxGrp.$('code[title=输出]').textContent = '' + res;
                                }
                            },
                        }, {
                            title: '输出',
                        }],
                        defaults: {
                            tag: 'code',
                            contentEditable: true,
                            style: `background-color: #eee;outline: none;width: 300px;
                                padding: 5px;font-family: Consolas;`,
                            init() { this.style.cssText += this.addStyle; }
                        }
                    }).forEach(e => this.group.attachment.appendChild(e));
                },
            }];
            const buttonGrp = {
                name: '按钮组',
                addStyle: `width:100px;`,
                childrens: $tm.addElms({
                    arr: buttonArr,
                    defaults: {
                        tag: 'input', type: 'button',
                        style: `margin-bottom: 3px;padding:0;
                            border:1px solid;border-radius: 10px;
                            width:100%;height:35px;
                            font:lighter 17px/20px caption;outline: none;`,
                        onmousedown() {
                            let ismove = false;
                            this.onmousemove = function () { ismove = true };
                            this.onmouseup = function () {
                                if (!ismove) {
                                    if (this.did = !this.did) {
                                        this.func1();
                                        [...this.parentElement.$('input[type=button]', 1)].filter(e => e != this).forEach(e => e.did = false);
                                    } else this.func2();
                                }
                            };
                        },
                        func1() { },
                        func2() { this.group.attachment.style.display = 'none'; },
                        init() {
                            this.value = this.name;
                            this.title = this.name;
                            this.style.cssText += this.addStyle ?? '';
                            Object.defineProperty(this, 'group', { get: function () { return this.parentElement?.parentElement } });
                        },
                    }
                }),
                onmousedown(e) {
                    const dx = parseFloat(window.getComputedStyle(boxGrp).left) - e.clientX,
                        dy = parseFloat(window.getComputedStyle(boxGrp).top) - e.clientY;
                    document.onmousemove = function (e) {
                        boxGrp.style.left = dx + e.clientX + 'px';
                        boxGrp.style.top = dy + e.clientY + 'px';
                        _onmousemove?.call(this, e);
                    }
                    this.onmouseup = function () {
                        document.onmousemove = _onmousemove;
                        if (parseFloat(boxGrp.style.left) < 0) boxGrp.style.left = hiddLeft + 'px';
                        if (parseFloat(boxGrp.style.top) < 0) boxGrp.style.top = '0px';
                    }
                },
            };
            const boxArr = [buttonGrp, {
                name: '附件',
                addStyle: `width: fit-content;height: fit-content;
                    padding: 10px;border: 1px solid;
                    background-color: #fff;color: #000;
                    font-weight: normal;font-size: 16px;
                    display: none;flex-direction: column;`,
            }];
            const boxGrp = $tm.addElmsGroup({
                box: {
                    id: '全局功能组',
                    style: `position:fixed;top:0;left:${hiddLeft}px;z-index:${1e6};
                        display:flex !important;
                        border:none;border-radius:10px;margin:0px`,
                    init() {
                        //调用this.attachment时显示附件
                        Object.defineProperty(this, 'attachment', {
                            get: function () {
                                const elm = this.$('div[title=附件]');
                                elm.style.display = 'flex';
                                return elm;
                            }
                        });
                    },
                },
                arr: boxArr,
                defaults: {
                    style: `margin: 5px;border-radius: 10px;`,
                    init() {
                        this.title = this.name;
                        this.style.cssText += this.addStyle ?? '';
                        this.childrens?.forEach(e => this.appendChild(e));
                    },
                }
            });
            $tm.onloadFuncs.push(() => document.body.appendChild(boxGrp));
        }
    }();

    //广告删除
    !async function () {
        function get(config) {
            let ads = [];
            config.class.forEach(e => ads.push(...$(`.${e}`, 1)));
            config.id.forEach(e => ads.push($(`#${e}`)));
            config.tag.forEach(kvw => {
                ads.push(...[...$(kvw[0], 1)].filter(e => kvw[2].test(e[kvw[1]])));
            });
            return ads;
        }
        function del(e) {
            if (e) {
                e.innerHTML = '<img src="https://th.bing.com/th/id/OIP.UurI9RUzgeluKtlkOyar_wAAAA">';
                e.style.display = 'none';
                // e.remove();
            }
        }
        //删除广告iframe内文档
        if ((self !== top) && location.href.includes('googleads')) {
            console.log(self.name);
            self.open('https://th.bing.com/th/id/OIP.UurI9RUzgeluKtlkOyar_wAAAA', '_self');
            del(self.document.documentElement);
        };
        if (typeof window.adsbygoogle != undefined) window.adsbygoogle = null;
        //监听添加node
        const _appendChild = Node.prototype.appendChild;
        Node.prototype.appendChild = function (node) {
            if (node.tagName == 'DIV' && /广告/.test(node.innerHTML));
            else if (node.tagName == 'A' && /广告/.test(node.innerHTML));
            else return _appendChild.call(this, node);
        };
        //DOM加载完后
        $tm.onloadFuncs.push(function () {
            let stop = setInterval(() => {
                let ads = get({
                    class: [
                        'adsbygoogle', //google
                        'pb-ad', //google
                        'google-auto-placed', //google
                        'ap_container', //google
                        'ad', //google
                        'b_ad', //bing-搜索
                        //'Pc-card Card', //zhihu-首页
                        'unionAd', //baidu-百科
                        'jjjjasdasd', //halihali
                        'pop-up-comp mask', //有道翻译
                        'ytd-ad-slot-renderer', //ytb
                        'Ads', //nico
                        'ads', //nico
                        'baxia-dialog', //高德地图
                        'sufei-dialog', //高德地图
                        'app-download-panel', //高德地图
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
                });
                ads.forEach(del);
                console.log(ads);
                clearInterval(stop);
                console.log('停止识别广告');
            }, 5e2);
        });
    }();

    //选择复制
    document.addEventListener('keydown', e => {
        const text = getSelection().toString();
        if (text && e.ctrlKey && e.code === 'KeyC') {
            if (!navigator.clipboard) throw '不支持 navigator.clipboard';
            navigator.clipboard.writeText(text).then(e => $tm.tip('复制成功'));
        }
    });

    //直接跳转
    !async function () {
        const arr = {
            'link.zhihu.com': null, //知乎
            'link.csdn.net': null, //CSDN
            'link.juejin.cn': null, //掘金
            'c.pc.qq.com': function () {
                const sp = new URL(document.URL).searchParams;
                const url = sp.get('url') || sp.get('pfurl');
                return url.includes('://') ? url : 'https://' + url;
            }, //QQ
        };
        for (let host in arr) {
            if (document.URL.includes(host)) {
                location.href = (arr[host]?.()) || new URL(document.URL).searchParams.get('target');
            }
        }
    }();

    //推特左边栏清除滚动条
    $tm.urlFunc(/twitter.com/, () => {
        $('#react-root').nodeListener(e => {
            const elm = $('header').$('.r-1wtj0ep');
            if (elm) elm.style.height = '735px';
        });
    });

    //bingAI界面优化
    $tm.urlFunc(/www.bing.com\/search\?/, () => {
        $('body').nodeListener(function () {
            const main = $('cib-serp')?.shadowRoot;
            if (main) {
                $('#id_h').style = 'right:calc(40px - calc(100vw - 100%))';
                //左布局
                const conversation = main.$('#cib-conversation-main').shadowRoot.children[0];
                conversation.insertBefore(conversation.$('.side-panel'), conversation.$('.scroller-positioner'));
                const inputBox = main.$('#cib-action-bar-main');
                inputBox.style.right = '0px';
                //清空会话
                const surface = main.$('#cib-conversation-main').children[0].shadowRoot.$('.surface');
                const threads = surface.$('.threads');
                surface.appendChild($tm.addElms({
                    arr: [{
                        tag: 'input', type: 'button',
                        value: '清空会话', className: 'show-recent',
                        onclick() { threads.$('cib-thread', 1).forEach(e => e.shadowRoot.$('.delete').click()); }
                    }]
                })[0]);
                //历史会话
                const height = 500;
                surface.style.cssText = 'max-height: fit-content;';
                threads.style.cssText += `overflow-y: scroll;flex-wrap: nowrap;max-height: ${height}px;min-height: ${height}px;`;
                surface.nodeListener(function () {
                    this.$('button').remove();
                    threads.$('cib-thread', 1).forEach(e => {
                        e.removeAttribute('hide');
                        e.nodeListener(function () { this.removeAttribute('hide'); }, { attributes: true })
                    });
                    return true;
                }, { childList: true });
                return true;
            }
        }, { childList: true });
    });

    //mdn换成中文
    $tm.urlFunc(/developer.mozilla.org\/en-US/, () => {
        const b = $('#languages-switcher-button');
        if (b) b.parentElement.nodeListener(() => {
            $('.language-menu button', 1).forEach(e => e.innerText.includes('简体') && e.click());
        }), b.click();
    });

    //chatGPT
    $tm.urlFunc(/chat.xeasy.me/, () => { $('#zsm').style.display = 'none'; });
    $tm.urlFunc(/chat35.com/, () => {
        $tm.useLibs('Cookies').then(() => {
            Object.keys(Cookies.get()).forEach(k => Cookies.remove(k));
        });
    });
    $tm.urlFunc(/.(gptchinese|chatgptbilibili)./, () => {
        document.body.nodeListener(() => { if ($('#modals')) return $('#modals').style.display = 'none'; }, { childList: true });
    });
    $tm.urlFunc(/(chat2.jinshutuan.com|chatbot.theb.ai)/, () => {
        $tm.onloadFuncs.push(() => {
            $('textarea').focus();
            $('.n-layout-scroll-container').style.cssText += 'max-width: 700px;';
            const wrapper = $('#image-wrapper');
            if (wrapper?.childElementCount === 1) wrapper.$('div').style.display = 'none';
        });
    });

})();
