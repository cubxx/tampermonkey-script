// ==UserScript==
// @name         tm 环境
// @version      0.2
// @author       Cubxx
// @match        *://*/*
// @require      https://github.com/Cubxx/tampermonkey-script/raw/main/lib/lit-html.js
// @require      https://github.com/Cubxx/tampermonkey-script/raw/main/lib/sober.min.js
// @updateURL    https://github.com/Cubxx/tampermonkey-script/raw/main/src/tm.user.js
// @downloadURL  https://github.com/Cubxx/tampermonkey-script/raw/main/src/tm.user.js
// @run-at       document-start
// @icon         data:image/svg+xml,%3C?xml version='1.0' encoding='utf-8'?%3E%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Cg id='XMLID_273_'%3E%3Cg id='XMLID_78_'%3E%3Cpath id='XMLID_83_' class='st0' d='M304.8,0H95.2C42.6,0,0,42.6,0,95.2v209.6C0,357.4,42.6,400,95.2,400h209.6 c52.6,0,95.2-42.6,95.2-95.2V95.2C400,42.6,357.4,0,304.8,0z M106.3,375C61.4,375,25,338.6,25,293.8c0-44.9,36.4-81.3,81.3-81.3 c44.9,0,81.3,36.4,81.3,81.3C187.5,338.6,151.1,375,106.3,375z M293.8,375c-44.9,0-81.3-36.4-81.3-81.3 c0-44.9,36.4-81.3,81.3-81.3c44.9,0,81.3,36.4,81.3,81.3C375,338.6,338.6,375,293.8,375z'/%3E%3C/g%3E%3Cg id='XMLID_67_' class='st2'%3E%3Cpath id='XMLID_74_' class='st3' d='M304.8,0H95.2C42.6,0,0,42.6,0,95.2v209.6C0,357.4,42.6,400,95.2,400h209.6 c52.6,0,95.2-42.6,95.2-95.2V95.2C400,42.6,357.4,0,304.8,0z M106.3,375C61.4,375,25,338.6,25,293.8c0-44.9,36.4-81.3,81.3-81.3 c44.9,0,81.3,36.4,81.3,81.3C187.5,338.6,151.1,375,106.3,375z M293.8,375c-44.9,0-81.3-36.4-81.3-81.3 c0-44.9,36.4-81.3,81.3-81.3c44.9,0,81.3,36.4,81.3,81.3C375,338.6,338.6,375,293.8,375z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E
// @grant        none
// ==/UserScript==
const tm = (function () {
    'use strict';

    // 环境检查
    if (Object.prototype.hasOwnProperty.call(window, 'tm')) {
        if (window['tm'][Symbol.toStringTag] === 'tm') {
            console.debug('检测到 tm 环境');
            return /** @type {typeof tm} */ (window['tm']);
        }
        throw 'tm 环境错误, 全局属性被占用';
    }
    console.debug('注入 tm 环境');

    /** 通用工具 */
    const util = {
        /** 终止程序 */
        exit(...e) {
            console.error(...e);
            debugger;
            throw 'tm 终止程序';
        },
        /**
         * 防抖
         *
         * @template {any[]} P
         * @param {(...e: P) => void} fn
         * @param {number} delay
         * @returns {(...e: P) => void}
         */
        debounce(fn, delay) {
            /** @type {number | undefined} */
            let timer = void 0;
            return (...e) => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    fn.apply(null, e);
                }, delay);
            };
        },
        /**
         * 节流
         *
         * @template {any[]} P
         * @param {(...e: P) => void} fn
         * @param {number} delay
         * @returns {(...e: P) => void}
         */
        throttle(fn, delay) {
            /** @type {number | undefined} */
            let timer = void 0;
            return (...e) => {
                if (timer) return;
                timer = setTimeout(() => {
                    fn.apply(null, e);
                    timer = void 0;
                }, delay);
            };
        },
        /**
         * 捕获运行错误
         *
         * @template R,F
         * @overload
         * @param {() => R} fn
         * @param {(err: unknown) => F} callback
         * @returns {R | F}
         */
        /**
         * @template R,F
         * @overload
         * @param {() => Promise<R>} fn
         * @param {(err: unknown) => F | Promise<F>} callback
         * @returns {Promise<R | F>}
         */
        catch(fn, callback) {
            try {
                const R = fn();
                return R instanceof Promise ? R.catch(callback) : R;
            } catch (e) {
                return callback(e);
            }
        },
        /**
         * 遍历对象
         *
         * @template {{}} T, [R=void]
         * @param {T} obj
         * @param {<K extends keyof T>(value: T[K], key: K, acc: R) => void} fn
         * @param {R} acc 累积值
         */
        //@ts-ignore
        each(obj, fn, acc = void 0) {
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    fn(obj[key], key, acc);
                }
            }
            return acc;
        },
        /**
         * 检查是否有相应键名
         *
         * @template {Object} T
         * @template {string} K
         * @param {T} obj
         * @param {K} key
         * @returns {K is keyof T}
         */
        hasOwnKey(obj, key) {
            return Object.prototype.hasOwnProperty.call(obj, key);
        },
        /**
         * 切换值
         *
         * @template {{}} T
         * @template {keyof T} K
         * @param {T} data
         * @param {K} key
         * @param {T[K][]} values
         */
        toggle(data, key, values) {
            const index = (values.indexOf(data[key]) + 1) % values.length;
            return (data[key] = values[index]);
        },
        /**
         * 连字符命名法
         *
         * @param {string} name
         */
        toHyphenCase(name) {
            return name
                .replace(/([A-Z])/g, '-$1')
                .toLowerCase()
                .replace(/^-/, '');
        },
    };

    /** 逆向工具 */
    const hack = {
        /**
         * 覆盖原生属性
         *
         * @template {{}} T
         * @template {keyof T} K
         * @template {{
         *     value: T[K];
         *     get(this: T): T[K];
         *     set(this: T, e: T[K]): void;
         * }} D
         * @param {T} obj
         * @param {K} key
         * @param {(
         *     descriptor: Merge<PropertyDescriptor, Partial<D>>,
         * ) => Partial<D>} convert
         */
        override(obj, key, convert) {
            const d = Object.getOwnPropertyDescriptor(obj, key);
            if (!d) return util.exit(`找不到自身属性 ${key.toString()}`);
            if (!d.configurable)
                return util.exit(`属性 ${key.toString()} 不可配置`);
            //@ts-ignore
            Object.defineProperty(obj, key, Object.assign({}, d, convert(d)));
            return obj[key];
        },
        /** 禁止无限 debugger */
        disableInfDebugger() {
            const _Function = hack.override(
                window,
                'Function',
                ({ value }) => ({
                    //@ts-ignore
                    value(...e) {
                        if (!value) return util.exit('找不到 window.Function');
                        e[0] = e[0].replaceAll('debugger', '');
                        return new value(...e);
                    },
                }),
            );
            Function.prototype.constructor = _Function;
        },
        /** 还原 Console */
        restoreConsole() {
            if (console.log.toString() === 'function log() { [native code] }') {
                return;
            }
            const iframe = Dom.h('iframe').mount('body').el;
            window['console'] = iframe.contentWindow?.['console'];
            iframe.remove();
        },
        /** 监听 devtools 是否打开 @param {()=>void} opOpen */
        detectDevtools(opOpen) {
            console.log('%c', { toString: opOpen });
        },
    };

    /** @typedef {Document | DocumentFragment | Element} El 可操作 Node */
    /** Dom 操作器 @template {El} T */
    class Dom {
        /**
         * 获取元素
         *
         * @template {El} T
         * @param {string | Dom<T>} dom
         * @returns {T | Element}
         */
        static el(dom) {
            const el =
                typeof dom === 'string' ? document.querySelector(dom) : dom.el;
            return el ?? util.exit(`找不到 ${dom}`);
        }
        /**
         * 创建 Dom 对象
         *
         * @template {keyof HTMLElementTagNameMap} K
         * @param {K} tag
         * @param {Partial<Props<K>>} props
         * @param {(Dom | string)[]} children
         * @returns {Dom<HTMLElementTagNameMap[K]>}
         */
        static h(tag, props = {}, children = []) {
            // tag
            const el = document.createElement(tag);
            const dom = new Dom(el);
            // props
            //@ts-ignore
            dom.set(props);
            // children
            if (children.length) {
                el.append(
                    ...children.map((e) => (typeof e === 'string' ? e : e.el)),
                );
            }
            return new Dom(el);
        }
        /** Class 对象转字符串 @param {ConvertProps['class']} [value] */
        static class(value) {
            if (!value) return '';
            return typeof value === 'string' ? value : value.join(' ');
        }
        /** Style 对象转字符串 @param {ConvertProps['style']} [value] */
        static style(value) {
            if (!value) return '';
            if (typeof value === 'string') return value;
            return util
                .each(
                    value,
                    (value, key, acc) => {
                        acc.push(`${util.toHyphenCase(key)}:${value}`);
                    },
                    /** @type {string[]} */ ([]),
                )
                .join(';');
        }
        /** @param {T | string} el */
        constructor(el) {
            const _el =
                typeof el === 'string' ? document.querySelector(el) : el;
            /** @type {T} */
            //@ts-ignore
            this.el = _el ?? util.exit(`找不到 ${el}`);
        }
        /**
         * @template {keyof HTMLElementTagNameMap} K
         * @typedef {K
         *     | `${'#' | '.' | ''}${string}${' ' | '>'}${K}`
         *     | `${K}${`[${string}]` | `${':' | '#' | '.'}${string}`}`} Selector
         */
        /**
         * @template {keyof HTMLElementTagNameMap} K
         * @overload
         * @param {Selector<K>} e
         * @returns {Dom<HTMLElementTagNameMap[K]> | null}
         */
        /**
         * @overload
         * @param {string} e
         * @returns {Dom<HTMLDivElement> | null}
         */
        $(e) {
            const el = this.el.querySelector(e);
            return el ? new Dom(el) : null;
        }
        /**
         * @template {keyof HTMLElementTagNameMap} K
         * @overload
         * @param {Selector<K>} e
         * @returns {Dom<HTMLElementTagNameMap[K]>[]}
         */
        /**
         * @overload
         * @param {string} e
         * @returns {Dom<HTMLDivElement>[]}
         */
        $$(e) {
            return [...this.el.querySelectorAll(e)].map((e) => new Dom(e));
        }
        /**
         * @template {keyof HTMLElementEventMap} K
         * @overload
         * @param {...[
         *     type: K,
         *     cb: (e: HTMLElementEventMap[K]) => void,
         *     options?: boolean | AddEventListenerOptions,
         * ]} e
         */
        /**
         * @overload
         * @param {...[
         *     type: string,
         *     cb: (e: Event) => void,
         *     options?: boolean | AddEventListenerOptions,
         * ]} e
         */
        on(...e) {
            //@ts-ignore
            this.el.addEventListener(...e);
        }
        /**
         * @template {keyof HTMLElementEventMap} K
         * @overload
         * @param {...[
         *     type: K,
         *     cb: (e: HTMLElementEventMap[K]) => void,
         *     options?: boolean | EventListenerOptions,
         * ]} e
         */
        /**
         * @overload
         * @param {...[
         *     type: string,
         *     cb: (e: Event) => void,
         *     options?: boolean | AddEventListenerOptions,
         * ]} e
         */
        off(...e) {
            //@ts-ignore
            this.el.removeEventListener(...e);
        }
        /**
         * @template {El} T
         * @param {string | Dom<T>} dom
         * @param {number | string | Dom} [pos]
         */
        mount(dom, pos) {
            const el = Dom.el(dom);
            pos === void 0
                ? el.appendChild(this.el)
                : el.insertBefore(
                      this.el,
                      typeof pos === 'number'
                          ? el.childNodes[pos]
                          : Dom.el(pos).el,
                  );
            return this;
        }
        /**
         * @param {(
         *     observer: MutationObserver,
         *     records: MutationRecord[],
         * ) => void} callback
         * @param {MutationObserverInit} config
         */
        observe(callback, config) {
            const observer = new MutationObserver((records) =>
                callback(observer, records),
            );
            observer.observe(this.el, config);
            return observer;
        }
        hide() {
            const { el } = this;
            if (!(el instanceof HTMLElement)) {
                return util.exit('仅支持 HTMLElement');
            }
            requestAnimationFrame(() =>
                el.style.setProperty('display', 'none', 'important'),
            );
        }
        /**
         * 设置属性值
         *
         * @param {Partial<Props<ExtractKey<HTMLElementTagNameMap, T>>>} props
         */
        set(props) {
            const { el } = this;
            if (!(el instanceof HTMLElement)) {
                return util.exit('仅支持 HTMLElement');
            }
            util.each(
                /**
                 * @type {{
                 *     [P in keyof ConvertProps]: (
                 *         value: ConvertProps[P],
                 *     ) => void;
                 * }}
                 */
                ({
                    class: (value) => (el.className = Dom.class(value)),
                    style: (value) => (el.style.cssText = Dom.style(value)),
                }),
                (convert, key) => {
                    if (util.hasOwnKey(props, key)) {
                        //@ts-ignore
                        convert(props[key]);
                        delete props[key];
                    }
                },
            );
            Object.assign(el, props);
            return this;
        }
        /** @returns {Dom<ShadowRoot> | null} */
        get shadowRoot() {
            const { el } = this;
            if (el instanceof Element) {
                const { shadowRoot } = el;
                return shadowRoot ? new Dom(shadowRoot) : null;
            }
            return util.exit('仅支持 Element');
        }
        get children() {
            return [...this.el.children].map((e) => new Dom(e));
        }
    }

    /** Ui 工具 */
    const ui = (function () {
        const id = 'tm-ui';
        const shadow = {
            createRoot() {
                const container = Dom.h('section', {
                    id: id,
                    style: { position: 'absolute', zIndex: 1e5 },
                }).mount('body').el;
                const shadow = container.attachShadow({ mode: 'open' });
                const sheet = new CSSStyleSheet();
                sheet.replaceSync(`
                    :host{}
                    s-snackbar::part(container){background:var(--tm-snackbar-color)}
                `);
                shadow.adoptedStyleSheets = [sheet];
                return shadow;
            },
            get root() {
                return new Dom(
                    document.querySelector('#' + id)?.shadowRoot ??
                        this.createRoot(),
                );
            },
            get sheet() {
                return this.root.el.adoptedStyleSheets[0];
            },
            /** @returns {CSSStyleDeclaration} */
            get hostStyle() {
                //@ts-ignore
                return this.sheet.cssRules[0].style;
            },
        };
        /**
         * @template {Dom<HTMLElement & { show(): void; dismiss(): void }>} T
         * @template {any[]} U 更新参数
         */
        class Popup {
            dom;
            update;
            #hasMounted = false;
            /**
             * @param {T} dom Dom 对象
             * @param {(
             *     this: T,
             *     ...e: U
             * ) => Parameters<T['el']['show']> | void} update
             *   更新函数
             */
            constructor(dom, update) {
                const { tagName } = dom.el;
                if (!window.customElements.get(tagName.toLowerCase())) {
                    console.warn(`${tagName} 未定义, 请引入 sober 组件库`);
                }
                this.dom = dom;
                this.update = update.bind(this.dom);
            }
            /** @param {U} e */
            show(...e) {
                if (!this.#hasMounted) {
                    this.dom.mount(shadow.root);
                    this.#hasMounted = true;
                }
                //@ts-ignore
                this.dom.el.show(...(this.update(...e) ?? []));
            }
            close() {
                this.dom.el.dismiss();
            }
        }

        const snackbar = new Popup(
            Dom.h('s-snackbar'),
            /**
             * @param {string} text
             * @param {'crimson' | 'seagreen' | 'steelblue'} color
             * @param {number} duration
             */
            function (text, color = 'steelblue', duration = 2e3) {
                Object.assign(this, { textContent: text, duration });
                shadow.hostStyle.setProperty('--tm-snackbar-color', color);
            },
        );
        const dialog = new Popup(
            Dom.h('s-dialog'),
            /**
             * @param {string} title
             * @param {string | HTMLTemplateResult} text
             * @param {(Partial<
             *     ConvertProps &
             *         Pick<
             *             HTMLElementTagNameMap['s-button'],
             *             'type' | 'onclick'
             *         >
             * > & {
             *     text: string | HTMLTemplateResult;
             * })[]} actions
             */
            function (title, text, actions = []) {
                const titleTp = title
                    ? lit.html`<div slot="headline">${title}</div>`
                    : '';
                const conetntTp =
                    typeof text === 'string' && text
                        ? lit.html`<div slot="text">${text}</div>`
                        : text;
                const actionsTp = actions.map((action) => {
                    return lit.html`<s-button 
                        slot="action" 
                        class=${Dom.class(action.class)}
                        style=${Dom.style(action.style)}
                        type=${action.type}
                        .onclick=${action.onclick}
                    >${action.text}</s-button>`;
                });
                lit.render([titleTp, conetntTp, actionsTp], this.el);
            },
        );
        /**
         * @typedef {Partial<ConvertProps> & {
         *     text: string | HTMLTemplateResult;
         *     items: MenuItemOrGroup[];
         * }} MenuGroup
         *
         *
         * @typedef {Partial<ConvertProps> & {
         *     text: string | HTMLTemplateResult;
         *     onclick?: HTMLElementTagNameMap['s-menu-item']['onclick'];
         * }} MenuItem
         *
         *
         * @typedef {MenuGroup | MenuItem} MenuItemOrGroup
         */
        const menu = new Popup(
            Dom.h('s-menu'),
            (function () {
                /**
                 * @param {MenuItemOrGroup} item
                 * @returns {item is MenuItem}
                 */
                const isMenuItem = (item) => !util.hasOwnKey(item, 'items');
                /** @param {MenuItemOrGroup[]} items */
                function tp(items) {
                    return items.map((item) => {
                        if (isMenuItem(item)) {
                            return lit.html`<s-menu-item
                                class=${Dom.class(item.class)}
                                style=${Dom.style(item.style)}
                                .onclick=${item.onclick}
                            >${item.text}</s-menu-item>`;
                        }
                        return lit.html`<s-menu
                            class=${Dom.class(item.class)}
                            style=${Dom.style(item.style)}
                        >
                            <s-menu-item slot="trigger">
                                ${item.text}
                                <s-icon slot="end" type="arrow_drop_right"></s-icon>
                            </s-menu-item>
                            ${tp(item.items)}
                        </s-menu>`;
                    });
                }
                /** @param {MenuItemOrGroup[]} items @param {string|Dom} target */
                return function (items, target) {
                    lit.render(tp(items), this.el);
                    return [Dom.el(target)];
                };
            })(),
        );
        const confirm = new Popup(
            dialog.dom,
            /**
             * @typedef {[text: string, onclick: () => void]} Action
             * @param {string} title
             * @param {string | HTMLTemplateResult} text
             * @param {Action} ok
             * @param {Action} cancel
             * @returns
             */
            function (title, text, ok, cancel) {
                const C = ([text, onclick]) => ({ text, onclick });
                dialog.update(title, text, [
                    { type: 'filled', ...C(ok) },
                    { type: 'outlined', ...C(cancel) },
                ]);
            },
        );
        return { snackbar, dialog, menu, confirm };
    })();

    /** 脚本工具 */
    const tm = /** @type {const} */ ({
        [Symbol.toStringTag]: 'tm',
        util,
        Dom,
        hack,
        ui,
        /** 加载库 */
        load: (function () {
            const libLink = {
                axios: (v) =>
                    'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js',
                Cookies: (v) =>
                    'https://cdn.jsdelivr.net/npm/js-cookie/dist/js.cookie.min.js',
                FFmpeg: (v = '0.11.6') =>
                    `https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@${v}/dist/ffmpeg.min.js`,
                html2canvas: (v) =>
                    'https://html2canvas.hertzen.com/dist/html2canvas.min.js',
                tailwind: (v = '3.4.4') => `https://cdn.tailwindcss.com/${v}`,
            };
            /**
             * @param {keyof typeof libLink} name
             * @param {string} version
             */
            return (name, version) => {
                const { promise, reject, resolve } = Promise.withResolvers();
                Dom.h('script', {
                    src: libLink[name](version),
                    onload: () => resolve(`${name} 加载成功`),
                    onerror: () => reject(`${name} 加载失败`),
                }).mount('head');
                return promise;
            };
        })(),
        /**
         * 匹配网址
         *
         * @param {RegExp} reg
         * @param {() => void} success
         * @param {() => void} [fail]
         */
        matchURL(reg, success, fail) {
            reg.test(document.URL) ? success() : fail?.();
        },
        /**
         * 页面间通信
         *
         * @template D
         * @param {string} target
         * @param {D} data
         * @param {string} stopSignal
         */
        postMessage(target, data, stopSignal) {
            /** @param {MessageEvent} e */
            function callback(e) {
                if (
                    e.origin == new URL(target).origin &&
                    e.data == stopSignal
                ) {
                    stop();
                }
            }
            /** @param {string} [errorMessage] */
            function stop(errorMessage) {
                errorMessage ? reject(errorMessage) : resolve(null);
                window.removeEventListener('message', callback);
                clearInterval(key);
            }

            const { promise, resolve, reject } = Promise.withResolvers();
            const win = window.open(target);
            const key = setInterval(() => {
                if (!win) {
                    return stop('win被拦截');
                }
                if (win.closed) {
                    return stop('win被关闭');
                }
                win.postMessage(data, target);
            }, 1e3);
            window.addEventListener('message', callback);
            return promise;
        },
        /**
         * 下载文件
         *
         * @type {{
         *     (url: string, filename?: string): void;
         *     (blob: Blob, filename?: string): void;
         * }}
         */
        download: function (
            data,
            filename = prompt('文件名') ?? `${Date.now()}.tm-download`,
        ) {
            Dom.h('a', {
                href: data instanceof Blob ? URL.createObjectURL(data) : data,
                download: filename,
            }).el.click();
        },
    });

    util.each(Object.freeze(tm), Object.freeze);
    return /** @type {typeof tm} */ (window['tm'] = Object.create(tm));
})();
