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
// @require   https://cubxx.github.io/My-Tampermonkey-Script/$tm.js
// @icon         data:image/svg+xml,%3C?xml version='1.0' encoding='utf-8'?%3E%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Cg id='XMLID_273_'%3E%3Cg id='XMLID_78_'%3E%3Cpath id='XMLID_83_' class='st0' d='M304.8,0H95.2C42.6,0,0,42.6,0,95.2v209.6C0,357.4,42.6,400,95.2,400h209.6 c52.6,0,95.2-42.6,95.2-95.2V95.2C400,42.6,357.4,0,304.8,0z M106.3,375C61.4,375,25,338.6,25,293.8c0-44.9,36.4-81.3,81.3-81.3 c44.9,0,81.3,36.4,81.3,81.3C187.5,338.6,151.1,375,106.3,375z M293.8,375c-44.9,0-81.3-36.4-81.3-81.3 c0-44.9,36.4-81.3,81.3-81.3c44.9,0,81.3,36.4,81.3,81.3C375,338.6,338.6,375,293.8,375z'/%3E%3C/g%3E%3Cg id='XMLID_67_' class='st2'%3E%3Cpath id='XMLID_74_' class='st3' d='M304.8,0H95.2C42.6,0,0,42.6,0,95.2v209.6C0,357.4,42.6,400,95.2,400h209.6 c52.6,0,95.2-42.6,95.2-95.2V95.2C400,42.6,357.4,0,304.8,0z M106.3,375C61.4,375,25,338.6,25,293.8c0-44.9,36.4-81.3,81.3-81.3 c44.9,0,81.3,36.4,81.3,81.3C187.5,338.6,151.1,375,106.3,375z M293.8,375c-44.9,0-81.3-36.4-81.3-81.3 c0-44.9,36.4-81.3,81.3-81.3c44.9,0,81.3,36.4,81.3,81.3C375,338.6,338.6,375,293.8,375z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E
// @grant        none
// ==/UserScript==

(async function () {
    'use strict';
    if (self != top) return; //不在iframe中执行
    //全局功能组
    !async function () {
        //功能组
        const hiddLeft = -98;
        const btnArrInfo = [
            {
                name: '设计模式',
                func1() {
                    document.designMode = 'on';
                    this.style.backgroundColor = '#bbb';
                },
                func2() {
                    document.designMode = 'off';
                    this.style.backgroundColor = '';
                },
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
                    ['amap', e => `https://ditu.amap.com/search?query=${e}`, true],
                    ['baidu', e => `https://map.baidu.com/search/${e}?querytype=s&da_src=shareurl&wd=${e}`,],
                    ['google', e => `https://www.google.com/maps/search/${e}`],
                    ['bing', e => `https://cn.bing.com/maps/?setlang=zh-Hans&q=${e}`],
                ],
                func1() {
                    let address = getSelection().toString() || prompt('请输入地址');
                    if (!address)
                        return this.did = false;
                    this.group.attachment.innerHTML = `<b style="white-space: nowrap;">${address}</b>`
                        + $tm.addElms({
                            arr: this.apis.map(([innerText, fn, autoClick]) => {
                                return {
                                    innerText,
                                    href: fn(encodeURI(address)),
                                    autoClick
                                };
                            }),
                            defaults: {
                                tag: 'a',
                                style: `text-decoration: none;display: block;padding: 2px;`,
                                target: '_blank',
                                init() {
                                    this.title = this.href;
                                    this.autoClick && this.click();
                                }
                            }
                        }).map(e => e.outerHTML).join('');
                }
            }, {
                name: 'Bing AI',
                addStyle: 'background-color:#2870ea;color:#fff',
                func1() {
                    let text = getSelection().toString();
                    $tm.urlFunc(/bing.com\/search/, e => {
                        text ||= $('#sb_form_q')?.value
                    });
                    open(`https://www.bing.com/search?showconv=1&q=${text}&cc=us`);
                }
            }, {
                name: 'AI',
                addStyle: 'background-color:#75a99c;color:#fff',
                apis: [
                    'https://yiyan.baidu.com/',
                    'https://chat.gptchinese.info/',
                    'https://chat35.com/chat/',
                    'https://chatforai.com/',
                    'https://chat.xeasy.me/',
                ],
                func1() {
                    const question = getSelection().toString();
                    this.group.attachment.innerHTML = `<b style="width: 300px;">${question}</b>`
                        + $tm.addElms({
                            arr: this.apis.map(href => ({ href })),
                            defaults: {
                                tag: 'a',
                                style: `text-decoration: none;display: block;padding: 2px;color: #00654c;`,
                                target: '_blank',
                                init() {
                                    this.innerText = this.title = this.href;
                                }
                            }
                        }).map(e => e.outerHTML).join('');
                }
            }, {
                name: '更新Flash',
                addStyle: 'background-color: #5d0f0b;color: #fff;',
                func1() {
                    open('https://www.flash.cn/download-wins');
                    this.did = 0;
                },
            }
        ];
        const btnGrpInfo = {
            box: {
                name: '按钮组',
                addStyle: `width:100px;`,
            },
            arr: btnArrInfo,
            defaults: {
                tag: 'input',
                type: 'button',
                style: `margin-bottom: 3px;padding:0;border:1px solid;border-radius: 10px;
                        min-width:100%;max-width:100%;height:35px;background-color: field;
                        font:lighter 17px/20px caption;outline: none;`,
                func1() { },
                func2() {
                    this.group.attachment.style.display = 'none';
                },
                init() {
                    this.value = this.name;
                    this.title = this.name;
                    this.style.cssText += this.addStyle ?? '';
                    Object.defineProperty(this, 'group', {
                        get: function () {
                            return this.parentElement?.parentElement
                        }
                    });
                },
            }
        };
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
            arr: [btnGrpInfo, {
                name: '附件',
                addStyle: `width: fit-content;height: fit-content;
                        padding: 10px;border: 1px solid;
                        background-color: #fff;color: #000;
                        font-weight: normal;font-size: 16px;
                        display: none;flex-direction: column;`,
            }
            ],
            defaults: {
                style: `margin: 5px;border-radius: 10px;`,
                init() {
                    this.title = this.name;
                    this.style.cssText += this.addStyle ?? '';
                },
            }
        });
        const btnGrp = boxGrp.$('div[title=按钮组]');
        btnGrp.addEventListener('mousedown', e => {
            let ismove = false;
            const dx = parseFloat(window.getComputedStyle(boxGrp).left) - e.clientX,
                dy = parseFloat(window.getComputedStyle(boxGrp).top) - e.clientY;
            const moveFn = e => {
                ismove = true
                boxGrp.style.left = dx + e.clientX + 'px';
                boxGrp.style.top = dy + e.clientY + 'px';
            };
            document.addEventListener('mousemove', moveFn);
            document.addEventListener('mouseup', e => {
                document.removeEventListener('mousemove', moveFn);
                if (parseFloat(boxGrp.style.left) < 0)
                    boxGrp.style.left = hiddLeft + 'px';
                if (parseFloat(boxGrp.style.top) < 0)
                    boxGrp.style.top = '0px';
                //btn单击
                if (!ismove && btnGrp.contains(e.target)) {
                    switch (e.button) {
                        case 0: { //左键
                            const btn = e.target;
                            if (btn.did = !btn.did) {
                                btn.func1();
                                btnGrp.$('input[type=button]', 1).filter(e => e != btn).forEach(e => e.did = false);
                            } else
                                btn.func2();
                            break;
                        }
                        case 2: { //右键
                            e.stopImmediatePropagation();
                            break;
                        }
                    }
                }
            }, { once: true });
        });
        $tm.onload = () => {
            document.body.appendChild(boxGrp);
        };
    }();

    //广告删除
    !async function () {
        function get({
            className,
            id,
            tag
        }) {
            return [
                ...className.flatMap(e => $(`.${e}`, 1)),
                ...id.map(e => $(`#${e}`)),
                ...tag.flatMap(kvw => $(kvw[0], 1).filter(e => kvw[2].test(e[kvw[1]]))),
            ];
        }
        function del(e) {
            if (!e)
                return;
            // e.innerHTML = '';
            e.style.setProperty('display', 'none', 'important');
            // e.remove();
        }
        //定时执行
        $tm.invokeUntilNoError = function globalADs() {
            const ads = get({
                className: [
                    'adsbygoogle', //google
                    'pb-ad', //google
                    'google-auto-placed', //google
                    'ap_container', //google
                    'ad', //google
                    'b_ad', //bing-搜索
                    'Pc-card', //zhihu-首页
                    'unionAd', //baidu-百科
                    'jjjjasdasd', //halihali
                    'ytd-ad-slot-renderer', //ytb
                    'Ads', //nico
                    'ads', //nico
                    'baxia-dialog', //高德地图
                    'sufei-dialog', //高德地图
                    'app-download-panel', //高德地图
                    'pop-up-comp', //有道翻译
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
            }).filter(e => e);
            ads.forEach(del);
            console.log('全局广告元素', ads);
        };
    }();

    //事件监听
    window.addEventListener('keydown', e => {
        if (e.ctrlKey && e.code === 'KeyC') {
            if (!navigator.clipboard)
                throw '不支持 navigator.clipboard';
            const text = getSelection().toString();
            if (text) {
                navigator.clipboard.writeText(text)
                    .then(() => $tm.tip('复制成功'))
                    .catch(err => $tm.tip('复制失败'));
            }
        }
    }, true);

    //直接跳转
    !async function () {
        const arr = {
            'link.zhihu.com': null, //知乎
            'link.csdn.net': null, //CSDN
            'link.juejin.cn': null, //掘金
            'c.pc.qq.com': sp => {
                const url = sp.get('url') || sp.get('pfurl');
                return url.includes('://') ? url : 'https://' + url;
            }, //QQ
            'gitee.com/link': sp => sp.get('target'), // gitee
            'www.jianshu.com/go-wild': sp => sp.get('url'), //简书
        };
        for (let host in arr) {
            if (document.URL.includes(host)) {
                const sp = new URL(document.URL).searchParams;
                location.href = arr[host]?.(sp) || sp.get('target');
            }
        }
    }();

    //推特左边栏清除滚动条
    $tm.urlFunc(/twitter.com/, () => {
        $tm.invokeUntilNoError = () => $('header .r-1wtj0ep')?.style.setProperty('height', '735px');
    });

    //bingAI
    $tm.urlFunc(/www.bing.com\/search\?/, () => {
        //取消 blur事件
        window.addEventListener('blur', e => {
            e.stopImmediatePropagation();
        }, true);
        //界面优化
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
                        tag: 'input',
                        type: 'button',
                        value: '清空会话',
                        className: 'show-recent',
                        onclick() {
                            threads.$('cib-thread', 1).forEach(e => {
                                e.shadowRoot.$('.delete').click();
                                setTimeout(() => {
                                    e.shadowRoot.$('.confirm').click();
                                }, 50);
                            });
                        }
                    }
                    ]
                })[0]);
                //历史会话
                const height = 500;
                surface.style.cssText = 'max-height: fit-content;';
                threads.style.cssText += `overflow-y: auto;flex-wrap: nowrap;max-height: ${height}px;min-height: ${height}px;`;
                surface.nodeListener(function () {
                    this.$('button').remove();
                    return true;
                }, {
                    childList: true
                });
                threads.nodeListener(function () {
                    this.$('cib-thread', 1).forEach(e => e.removeAttribute('hide'));
                }, {
                    childList: true
                });
                return true;
            }
        }, {
            childList: true
        });
    });

    //mdn换成中文
    $tm.urlFunc(/developer.mozilla.org\/[\w-]+\/docs/, () => {
        const b = $('#languages-switcher-button');
        if (b && !b.innerText.includes('简体')) {
            b.parentElement.nodeListener(() => {
                $('.language-menu button', 1).forEach(e => e.innerText.includes('简体') && e.click());
            });
            b.click();
        }
    });

    //chatGPT
    $tm.urlFunc(/chat.xeasy.me/, () => {
        $('#zsm').style.display = 'none';
    });
    $tm.urlFunc(/chat35.com/, async () => {
        await $tm.libs['Cookies'].use();
        Object.keys(Cookies.get()).forEach(k => Cookies.remove(k));
    });
    $tm.urlFunc(/.(gptchinese|chatgptbilibili)./, () => {
        document.body.nodeListener(() => {
            return $('#modals')?.style.setProperty('display', 'none') == undefined;
        }, {
            childList: true
        });
    });
    $tm.urlFunc(/(chat2.jinshutuan.com|chatbot.theb.ai)/, () => {
        $tm.onload = () => {
            $('textarea').focus();
            $('.n-layout-scroll-container').style.cssText += 'max-width: 700px;';
            const wrapper = $('#image-wrapper');
            if (wrapper?.childElementCount === 1) {
                wrapper.$('div').style.display = 'none';
            }
            setTimeout(() => {
                $('.shadow-smt-app')?.style.setProperty('display', 'none', 'important');
            }, 1e3);
            $('main').appendChild($tm.addElmsGroup({
                box: {
                    className: 'n-button',
                    innerHTML: '清空历史',
                    onclick() {
                        localStorage.removeItem('chatStorage');
                        location.reload();
                    },
                    init() {
                        this.style.cssText += $('main button').style.cssText;
                    }
                }
            }));
        };
    });

    //知乎
    $tm.urlFunc(/www.zhihu.com\/(follow)?$/, () => {
        $('#TopstoryContent').addEventListener('click', e => {
            if (e.target.classList[1] != "ContentItem-more")
                return;
            e.target.parentElement.parentElement.parentElement.nodeListener(function () {
                const childrens = [...this.children];
                const time = childrens.filter(e => /(发布|编辑)于/.test(e.innerText))[0];
                const vote = childrens.filter(e => /赞同了该(回答|文章)/.test(e.innerText))[0];
                if (vote)
                    vote.style.display = 'none';
                if (!time)
                    return console.log('找不到日期元素');
                this.insertBefore(time, this.children[0]);
                this.$('.ContentItem-time').innerHTML += '<br>段落数 ' + this.$('.RichContent-inner p', 1).length;
                return true;
            }, {
                childList: true
            });
        });
    });
    $tm.urlFunc(/www.zhihu.com\/question/, () => {
        $('.App-main .QuestionHeader-title').title = `创建时间 ${$('meta[itemprop=dateCreated]').content}\n修改时间 ${$('meta[itemprop=dateModified]').content}`;
        $('header').style.display = 'none';
    });
    $tm.urlFunc(/zhuanlan.zhihu.com\/p/, () => {
        $('article').insertBefore($('.ContentItem-time'), $('.Post-RichTextContainer'));
    });

    //CoreNLP
    $tm.urlFunc(/corenlp.run/, () => {
        // $('#wrap>.container').style.cssText += `display: flex;flex-direction: column;align-items: center;`;
        $('#annotators_chosen').style.display = 'none';
        const selectElm = $('#annotators'),
            newDiv = $tm.addElmsGroup({
                box: {
                    style: `border: 1px solid #ccc;border-radius: 5px;padding: 8px;`,
                    init() {
                        this.addEventListener('change', e => {
                            if (e.target.tagName == 'INPUT') {
                                const {
                                    value,
                                    checked
                                } = e.target;
                                selectElm.$(`option[value="${value}"]`).selected = checked;
                            }
                        });
                    }
                },
                arr: selectElm.$('option', 1).map(({
                    value,
                    innerHTML
                }) => {
                    return {
                        box: {
                            innerHTML,
                        },
                        arr: [{
                            value,
                            checked: ['depparse', 'parse', 'openie'].includes(value),
                        }
                        ],
                        defaults: {
                            tag: 'input',
                            type: 'checkbox',
                            init() {
                                selectElm.$(`option[value="${this.value}"]`).selected = this.checked;
                            }
                        }
                    };
                }).toSpliced(4, 0, {
                    tag: 'br',
                }),
                defaults: {
                    tag: 'label',
                    style: `margin: 0 10px;font-weight: inherit;`,
                }
            });
        selectElm.before(newDiv);
        Object.assign($('#annotations'), {
            matrix(type, {
                scale: s = 1,
                position: [x, y] = [0, 0]
            } = {}) {
                switch (type) {
                    case 'get': {
                        const css = getComputedStyle(this.svg).transform;
                        if (css == 'none') {
                            return {
                                scale: s,
                                position: [x, y],
                            }
                        } else {
                            const matchArr = css.match(/matrix\(([\s\S]+)\)/);
                            if (!matchArr)
                                throw '匹配失败 ' + css;
                            const matrix = matchArr[1].split(', ').map(e => +e);
                            return {
                                scale: matrix[0],
                                position: matrix.slice(4, 6),
                            };
                        }
                    }
                    case 'set':
                        this.svg.style.transform = `matrix(${[s, 0, 0, s, x, y].join(', ')})`;
                }
            },
            init() {
                this.nodeListener(function () {
                    this.$('div[id]', 1).forEach(e => {
                        e.style.cssText += 'overflow: hidden;border: 1px solid;min-height: 140px;';
                        e.svg = e.$('svg');
                    });
                }, {
                    childList: true
                });
                this.addEventListener('mousedown', e => {
                    e.preventDefault();
                    if (!/(H4|DIV)/.test(e.target.tagName)) {
                        const elm = e.target.closest('div[id]');
                        const {
                            scale,
                            position: orig
                        } = this.matrix.call(elm, 'get');
                        const [dx, dy] = [orig[0] - e.clientX, orig[1] - e.clientY];
                        const moveFn = e => {
                            const position = [dx + e.clientX, dy + e.clientY];
                            this.matrix.call(elm, 'set', {
                                scale,
                                position
                            });
                        };
                        this.addEventListener('mousemove', moveFn);
                        this.addEventListener('mouseup', e => {
                            this.removeEventListener('mousemove', moveFn);
                        });
                    }
                });
                this.addEventListener('wheel', e => {
                    e.preventDefault();
                    if (!/(H4|DIV)/.test(e.target.tagName)) {
                        const elm = e.target.closest('div[id]');
                        const {
                            scale: orig,
                            position
                        } = this.matrix.call(elm, 'get');
                        const scale = (orig - Math.sign(e.deltaY) * 0.1).clamp(0.1, 2);
                        this.matrix.call(elm, 'set', {
                            scale,
                            position
                        });
                    }
                });
                this.addEventListener('contextmenu', e => {
                    e.preventDefault();
                    if (!/(H4|DIV)/.test(e.target.tagName)) {
                        const elm = e.target.closest('div[id]');
                        this.matrix.call(elm, 'set');
                    }
                });
            },
        }).init();
    });

    //heroicons
    $tm.urlFunc(/heroicons.dev/, () => {
        $('#root > aside.sidebar-2 > div').style.display = 'none';
    });

    //pixiv ADs
    $tm.urlFunc(/www.pixiv.net\/artworks/, () => {
        function delADs() {
            $('aside > div').style.setProperty('display', 'none');
            $('.charcoal-token > div > div:nth-child(2) > div:nth-child(2)').style.setProperty('display', 'none');
            $('.charcoal-token > div > div:nth-child(3) > div > div > div:nth-child(2)').style.setProperty('display', 'none');
            console.log('delADS');
        };
        $tm.invokeUntilNoError = delADs;
        document.body.nodeListener(delADs);
    });

    //flash
    $tm.urlFunc(/www.flash.cn\/download-wins$/, () => {
        $('body > ul > li:nth-child(2) > a').click();
    });
})();
