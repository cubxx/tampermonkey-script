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
            const _onmousemove = document.onmousemove || function () { },
                hidd_left = -95;
            $tm.onloadFuncs.push(e => document.body.appendChild(
                $tm.addElmsGroup({
                    box: {
                        tag: 'div', id: '全局功能组',
                        style: `display:flex;flex-direction:column;position:fixed;
                            top:0;left:${hidd_left}px;z-index:${1e6};width:100px;
                            mix-blend-mode:difference;display: block !important;
                            border:0px;border-radius:10px;margin:0px`,
                        onmousedown(e) {
                            let _this = this;
                            var ex = e.clientX,
                                ey = e.clientY,
                                px = parseFloat(window.getComputedStyle(this).left),
                                py = parseFloat(window.getComputedStyle(this).top);
                            var dx = px - ex,
                                dy = py - ey;
                            document.onmousemove = function (e) {
                                var ex = e.clientX,
                                    ey = e.clientY;
                                _this.style.left = dx + ex + 'px';
                                _this.style.top = dy + ey + 'px';
                                _onmousemove.call(this, e);
                            }
                            this.onmouseup = function () {
                                document.onmousemove = _onmousemove;
                                if (parseFloat(this.style.left) < 0) this.style.left = hidd_left + 'px';
                                if (parseFloat(this.style.top) < 0) this.style.top = '0px';
                            }
                        }
                    },
                    arr: [{
                        name: '设计模式',
                        do: true,
                        func1() { document.designMode = 'off', this.do = true },
                        func2() { document.designMode = 'on', this.do = false },
                    }, {
                        name: '邮箱发送',
                        func1() {
                            let email = getSelection().toString() || prompt('请输入邮箱');
                            email && open('mailto:' + email);
                        }
                    }, {
                        name: '地址查找',
                        apis: [
                            ['amap', 'https://ditu.amap.com/search?query='],
                            ['google', 'https://www.google.com/maps/search/'],
                            ['bing', 'https://cn.bing.com/maps/?q='],
                        ],
                        func1() {
                            let address = '';
                            if (address = getSelection().toString() || prompt('请输入地址')) {
                                let url = this.apis[prompt('请选择地图引擎\n' + this.apis.map((e, i) => `${i} - ${e[0]}`).join('\n')) || 0][1];
                                open(url + encodeURI(address));
                            }
                        },
                    }, {
                        name: 'Bing AI',
                        func1() {
                            let text = getSelection().toString();
                            $tm.urlFunc(/bing.com\/search/, e => { text = text || $('#sb_form_q').value });
                            open(`https://www.bing.com/search?showconv=0&q=${text}&cc=us`);
                        }
                    }],
                    defaults: {
                        tag: 'input', type: 'button',
                        style: `padding:0;border:none;border-bottom:solid 2px #000;border-radius: 10px;
                            width:100%;height:35px;transition: 300ms;
                            font:bold 17px/20px caption;outline: none;
                            background-color: #bbb;`,
                        onmousedown() {
                            let ismove = false;
                            this.onmousemove = function () { ismove = true };
                            this.onmouseup = function () {
                                if (!ismove) {
                                    if (!this.do) this.func1(), this.style.opacity = 1;
                                    else this.func2(), this.style.opacity = 0.5;
                                }
                            };
                        },
                        func1() { },
                        func2() { },
                        init(func) {
                            this.value = this.name;
                            this.title = this.name;
                            func && func.call(this);
                            return this;
                        },
                    }
                })
            ));
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
                e.remove();
            }
        }
        //删除广告iframe内文档
        if (self != top && location.href.includes('googleads')) {
            console.log(self.name);
            self.open('https://th.bing.com/th/id/OIP.UurI9RUzgeluKtlkOyar_wAAAA', '_self');
            del(self.document.documentElement);
        };
        if (typeof window.adsbygoogle != undefined)
            window.adsbygoogle = null;
        //监听添加node
        const _appendChild = Node.prototype.appendChild;
        Node.prototype.appendChild = function (node) {
            if (node.tagName == 'DIV' && /广告/.test(node.innerHTML));
            else if (node.tagName == 'A' && /广告/.test(node.innerHTML));
            else
                return _appendChild.call(this, node);
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
                        // '', //
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
        let text = getSelection().toString();
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
                let url = new URL(document.URL).searchParams.get('url');
                return url.includes('://') ? url : 'https://' + url;
            }, //QQ
        };
        for (let host in arr) {
            if (document.URL.includes(host)) {
                location.href = (arr[host] && arr[host]()) || new URL(document.URL).searchParams.get('target');
            }
        }
    }();

    //推特左边栏清除滚动条
    $tm.urlFunc(/twitter.com/, () => {
        $('#react-root').nodeListener(e => {
            let elm = $('header').$('.r-1wtj0ep');
            if (elm) elm.style.height = '735px';
        });
    });

    //bingAI界面优化
    $tm.urlFunc(/www.bing.com\/search\?/, () => {
        $('body').nodeListener(function () {
            let main = $('cib-serp') && $('cib-serp').shadowRoot;
            if (main) {
                $('#id_h').style = 'right:calc(40px - calc(100vw - 100%))';
                //左布局
                let conversation = main.$('#cib-conversation-main').shadowRoot.children[0];
                conversation.insertBefore(conversation.$('.side-panel'), conversation.$('.scroller-positioner'));
                let inputBox = main.$('#cib-action-bar-main');
                inputBox.style.right = '0px';
                //清空会话
                let surface = main.$('#cib-conversation-main').children[0].shadowRoot.$('.surface');
                let threads = surface.$('.threads');
                surface.appendChild($tm.addElms([{
                    tag: 'input', type: 'button',
                    value: '清空会话', className: 'show-recent',
                    onclick() { threads.$('cib-thread', 1).forEach(e => e.shadowRoot.$('.delete').click()); }
                }])[0]);
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
        let b = $('#languages-switcher-button');
        if (b) b.parentElement.nodeListener(() => {
            $('.language-menu button', 1).forEach(e => e.innerText.includes('简体') && e.click());
        }), b.click();
    });
})();
