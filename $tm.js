!function (e, t) {
    if (typeof window.$tm == 'undefined') window.$tm = t();
}(this, function () {
    'use strict';
    const $ = function (Selectors, all) {
        let _this = this ? (this instanceof Node ? this : null) : document;
        if (_this) return all ? _this.querySelectorAll(Selectors) : _this.querySelector(Selectors);
        else throw `this对象类型错误 ${this}`;
    };
    Object.assign(Node.prototype, {
        $,
        nodeListener(func, config) {
            const MO = new MutationObserver((mutationList, observer) => {
                func.call(this, mutationList, observer) && MO.disconnect();
            });
            MO.observe(this, config || {
                childList: true,
                subtree: true,
                attributes: false,
            });
        },
        setValue(name, value) { if (this[name] != value) this[name] = value; },
    });
    return new class {
        $ = $;
        onloadFuncs = [];
        libs = {
            'axios': 'https://unpkg.com/axios/dist/axios.min.js',
            'Cookies': 'https://cdn.jsdelivr.net/npm/js-cookie/dist/js.cookie.min.js',
        };
        constructor() { }
        init() {
            window.addEventListener('load', e => {
                this.onloadFuncs.forEach(func => func());
            }, true);
            window.addEventListener('error', e => {
                if (e instanceof ErrorEvent) e.filename.includes('userscript.html') && this.tip(e.message, 3e3, 'red');
            }, true);
            window.addEventListener('unhandledrejection', e => {
                if (e instanceof ErrorEvent) e.filename.includes('userscript.html') && this.tip(e.message, 3e3, 'red');
            }, true);
            return this;
        }
        ObjectToFormData(obj) {
            const formData = new FormData();
            Object.keys(obj).forEach(key => {
                formData.append(key, obj[key]);
            });
            return formData;
        }
        addElms({ arr, defaults }) {
            defaults ??= { tag: 'div' };
            return arr.map(config => {
                //迭代传参
                if (config.box && config.arr) {
                    config.box = Object.assign(defaults, config.box);
                    return this.addElmsGroup(config);
                }
                //默认逻辑
                const elm = Object.assign(document.createElement(config.tag ?? defaults.tag ?? 'div'), defaults, config);
                elm.init?.();
                return elm;
            });
        }
        addElmsGroup({ box, arr, defaults }) {
            const container = this.addElms({ arr: [box] })[0];
            this.addElms({ arr, defaults }).map(e => container.appendChild(e));
            return container;
        }
        async urlFunc(reg, func1, func2 = function () { }) {
            reg.test(document.URL) ? func1() : func2();
        }
        async useLibs(...names) {
            return await Promise.allSettled(names.map(e =>
                new Promise((resolve, reject) => {
                    const o = (message) => { return { lib: e, message: message } };
                    if (typeof window[e] == 'undefined' && !$(`head script[id=lib_${e}]`)) {
                        $('head').appendChild(this.addElms({
                            arr: [{
                                tag: 'script', type: 'module', id: `lib_${e}`,
                                src: this.libs[e], async: true,
                                onload: () => resolve(o(`加载成功 ${e}`)),
                                onerror: () => reject(o(`加载错误 ${e}`)),
                            }]
                        })[0]);
                    } else resolve(o(`库已存在 ${e}`));
                })
            )).then(es => es.forEach(e => { if (e.status == 'rejected') throw e.reason }));
        }
        tip(info, duration = 1e3, color = 'orange') {
            const elm = document.body.appendChild(this.addElms({
                arr: [{
                    style: `position: fixed;top: 0%;left: 50%;transform: translate(-50%,-50%);
                    background-color: ${color};color: black;
                    margin: auto;padding: 5px 10px;border-radius: 10px;
                    font-size: 20px;font-weight: bold;opacity: 0;
                    transition: 300ms;z-index: 99999;display: block !important;`,
                    innerHTML: info,
                    init() { setTimeout(e => this.remove(), duration); },
                    animate() { this.style.cssText += 'opacity: 1;transform: translate(-50%,50%);' },
                }]
            })[0]);
            setTimeout(e => elm.animate(), 5);
            return elm;
        }
        async postMessage({ url, data, signal, func }) {
            return new Promise((resolve, reject) => {
                let stop = false;
                const win = window.open(url),
                    key = setInterval(() => {
                        win.postMessage(data, url);
                        func && func(data);
                        if (win.closed) reject(), clearInterval(key);
                        if (stop) resolve(), clearInterval(key);
                    }, 1e3);
                window.addEventListener('message', e => {
                    if (e.origin == url && e.data == signal) stop = true;
                });
            });
        };
    }().init();
});
const { $, ObjectToFormData } = $tm;