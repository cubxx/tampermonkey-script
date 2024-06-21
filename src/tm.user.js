// ==UserScript==
// @name         tm 环境
// @version      0.2
// @author       Cubxx
// @match        *://*/*
// @require      https://github.com/Cubxx/My-Tampermonkey-Script/raw/master/lib/lit-html.user.js
// @require      https://github.com/Cubxx/My-Tampermonkey-Script/raw/master/lib/sober.min.user.js
// @updateURL    https://github.com/Cubxx/My-Tampermonkey-Script/raw/master/src/tm.user.js
// @downloadURL  https://github.com/Cubxx/My-Tampermonkey-Script/raw/master/src/tm.user.js
// @run-at       document-start
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
    const reserve = {
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
            const _Function = reserve.override(
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
        /** 还原 Comsole */
        restoreConsole() {
            if (console.log.toString() !== 'function log() { [native code] }') {
                const iframe = dom.h('iframe');
                iframe.mount('body');
                window['console'] = iframe.contentWindow?.['console'];
                iframe.remove();
            }
        },
    };

    /** Dom 操作工具 */
    const dom = {
        ...(function () {
            /** 获取元素 @param {string|Node} el */
            function _$(el) {
                const _el = typeof el === 'string' ? document.$(el) : el;
                if (_el) return _el;
                else return util.exit(`找不到 ${el}`);
            }
            /**
             * 注入原型
             *
             * @type {Polyfill.Node}
             */
            const polyfill = {
                $(...e) {
                    if (typeof this['querySelector'] === 'function') {
                        return this['querySelector'](...e);
                    } else {
                        util.exit('仅支持 Document DocumentFragment Element');
                    }
                },
                $$(...e) {
                    if (typeof this['querySelectorAll'] === 'function') {
                        return [...this['querySelectorAll'](...e)];
                    } else {
                        return util.exit(
                            '仅支持 Document DocumentFragment Element',
                        );
                    }
                },
                on(...e) {
                    this['addEventListener'](...e);
                },
                off(...e) {
                    this['removeEventListener'](...e);
                },
                mount(container) {
                    return _$(container).appendChild(this);
                },
                observe(callback, config) {
                    const observer = new MutationObserver((records) => {
                        callback(observer, records);
                    });
                    observer.observe(this, config);
                    return observer;
                },
                hide() {
                    if (!(this instanceof HTMLElement)) {
                        return util.exit('仅支持 HTMLElement');
                    }
                    requestAnimationFrame(() =>
                        this.style.setProperty('display', 'none', 'important'),
                    );
                },
            };
            const _polyfill = /**
             * @type {typeof polyfill extends infer T
             *     ? {
             *           [K in keyof T]: T[K] extends (...e: infer P) => infer R
             *               ? (el: Node | string, ...e: P) => R
             *               : never;
             *       }
             *     : never}
             */ ({});
            util.each(polyfill, (value, key) => {
                if (Object.prototype.hasOwnProperty.call(Node.prototype, key)) {
                    window['tm']?.__inject__ ||
                        console.warn(
                            `Node.prototype.${key} is already defined`,
                        );
                } else {
                    Object.defineProperty(Node.prototype, key, {
                        value,
                        enumerable: false,
                        writable: false,
                    });
                }
                //@ts-ignore
                _polyfill[key] = (el, ...e) => value.apply(_$(el), e);
            });
            return _polyfill;
        })(),
        /**
         * 创建 dom 元素
         *
         * @template {keyof HTMLElementTagNameMap} K
         * @param {K} tag
         * @param {Partial<Props<K>>} props
         * @param {(Node | string)[] | HTMLTemplateResult[]} children
         * @returns {HTMLElementTagNameMap[K]}
         */
        h(tag, props = {}, children = []) {
            // tag
            const el = document.createElement(tag);
            // props
            util.each(
                /**
                 * @type {{
                 *     [P in keyof ConvertProps]: (
                 *         value: ConvertProps[P],
                 *     ) => void;
                 * }}
                 */
                ({
                    class: (value) => (el.className = dom.classText(value)),
                    style: (value) => (el.style.cssText = dom.styleText(value)),
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
            // children
            if (children.length) {
                lit.render(lit.html`${children}`, el);
            }
            return el;
        },
        /**
         * Class 对象转字符串
         *
         * @param {ConvertProps['class']} [value]
         */
        classText(value) {
            if (!value) return '';
            return typeof value === 'string' ? value : value.join(' ');
        },
        /**
         * Style 对象转字符串
         *
         * @param {ConvertProps['style']} [value]
         */
        styleText(value) {
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
        },
    };

    /** Ui 工具 */
    const ui = (function () {
        function getShadow() {
            const shadow = document.$('#tm-ui-container')?.shadowRoot;
            if (shadow) return shadow;
            const container = dom.h('section', {
                id: 'tm-ui-container',
                style: { position: 'absolute', zIndex: 1e5 },
            });
            container.mount('body');
            return container.attachShadow({ mode: 'open' });
        }
        /**
         * @template {HTMLElement & { show(): void; dismiss(): void }} T 元素
         * @template {any[]} U 更新参数
         */
        class Popup {
            el;
            update;
            #hasMounted = false;
            /**
             * @param {T} el 元素
             * @param {(this: T, ...e: U) => Parameters<T['show']> | void} update
             *   更新函数
             */
            constructor(el, update) {
                if (!window.customElements.get(el.tagName.toLowerCase())) {
                    console.warn(`${el.tagName} 未定义, 请引入 sober 组件库`);
                }
                this.el = el;
                this.update = update.bind(this.el);
            }
            /** @param {U} e */
            show(...e) {
                if (!this.#hasMounted) {
                    this.el.mount(getShadow());
                    this.#hasMounted = true;
                }
                //@ts-ignore
                this.el.show(...(this.update(...e) ?? []));
            }
            close() {
                this.el.dismiss();
            }
        }

        const snackbar = new Popup(
            dom.h('s-snackbar'),
            /**
             * @param {string} text
             * @param {'crimson' | 'seagreen' | 'steelblue'} color
             * @param {number} duration
             */
            function (text, color = 'steelblue', duration = 2e3) {
                Object.assign(this, { textContent: text, duration });
            },
        );
        const dialog = new Popup(
            dom.h('s-dialog'),
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
                        class=${dom.classText(action.class)}
                        style=${dom.styleText(action.style)}
                        type=${action.type}
                        .onclick=${action.onclick}
                    >${action.text}</s-button>`;
                });
                lit.render([titleTp, conetntTp, actionsTp], this);
            },
        );
        /**
         * @typedef {Partial<ConvertProps> & {
         *     text: string | HTMLTemplateResult;
         *     items: MenuConfig[];
         * }} MenuGroup
         *
         *
         * @typedef {Partial<ConvertProps> & {
         *     text: string | HTMLTemplateResult;
         *     onclick: HTMLElementTagNameMap['s-menu-item']['onclick'];
         * }} MenuItem
         *
         *
         * @typedef {MenuGroup | MenuItem} MenuConfig
         */
        const menu = new Popup(
            dom.h('s-menu'),
            (function () {
                /**
                 * @param {MenuConfig} item
                 * @returns {item is MenuItem}
                 */
                const isMenuItem = (item) => !util.hasOwnKey(item, 'items');
                /** @param {MenuConfig[]} items */
                function tp(items) {
                    return items.map((item) => {
                        if (isMenuItem(item)) {
                            return lit.html`<s-menu-item
                                class=${dom.classText(item.class)}
                                style=${dom.styleText(item.style)}
                                .onclick=${item.onclick}
                            >${item.text}</s-menu-item>`;
                        }
                        return lit.html`<s-menu
                            class=${dom.classText(item.class)}
                            style=${dom.styleText(item.style)}
                        >
                            <s-menu-item slot="trigger">
                                ${item.text}
                                <s-icon slot="end" type="arrow_drop_right"></s-icon>
                            </s-menu-item>
                            ${tp(item['items'])}
                        </s-menu>`;
                    });
                }
                /** @param {MenuConfig[]} items @param {HTMLElement} target */
                return function (items, target) {
                    lit.render(tp(items), this);
                    return [target];
                };
            })(),
        );
        const confirm = new Popup(
            dialog.el,
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
        dom,
        reserve,
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
                dom.h('script', {
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
            dom.h('a', {
                href: data instanceof Blob ? URL.createObjectURL(data) : data,
                download: filename,
            }).click();
        },
    });

    (function deepFreeze(/** @type {object} */ obj) {
        util.each(obj, (value) => {
            if (
                (value &&
                    typeof value === 'object' &&
                    !(value instanceof Node)) ||
                typeof value === 'function'
            ) {
                deepFreeze(value);
            }
        });
        return Object.freeze(obj);
    })(tm);
    return /** @type {typeof tm} */ (window['tm'] = Object.create(tm));
})();
