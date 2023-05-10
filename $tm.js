!function (e, t) {
    if (typeof window.$tm == 'undefined') window.$tm = t();
}(this, function () {
    'use strict';
    return new class {
        constructor() {
            this.onloadFuncs = [];
            this.libs = { 'axios': 'https://unpkg.com/axios/dist/axios.min.js' };
        }
        init() {
            const _onload = window.onload;
            window.onload = function () {
                $tm.onloadFuncs.forEach(func => func());
                _onload && _onload();
            };
            Object.assign(Node.prototype, {
                $: this.$,
                nodeListener(func, config) {
                    new MutationObserver((mutationList, observer) => {
                        func.call(this, mutationList, observer);
                    }).observe(this, config || {
                        childList: true,
                        subtree: true,
                        attributes: false,
                    });
                },
                setValue(name, value) {
                    if (this[name] != value) this[name] = value;
                },
            });
            return this;
        }
        $(Selectors, all) {
            let _this = this || document;
            return all ? _this.querySelectorAll(Selectors) : _this.querySelector(Selectors);
        }
        ObjectToFormData(obj) {
            const formData = new FormData();
            Object.keys(obj).forEach(key => {
                formData.append(key, obj[key]);
            });
            return formData;
        }
        addElms(arr, defaults) {
            defaults = defaults || { tag: 'div' };
            return arr.map(config => {
                let elm = Object.assign(document.createElement(config.tag || defaults.tag), defaults, config);
                elm.init && elm.init();
                return elm;
            });
        }
        addElmsGroup({ box, arr, defaults }) {
            const container = $tm.addElms([box])[0];
            $tm.addElms(arr, defaults).map(e => container.appendChild(e));
            return container;
        }
        async urlFunc(reg, func1, func2 = function () { }) {
            reg.test(document.URL) ? func1() : func2();
        }
        async useLibs(...names) {
            return await Promise.allSettled(names.map(e =>
                new Promise((resolve, reject) => {
                    let o = (message) => { return { lib: e, message: message } };
                    if (typeof window[e] == 'undefined' && !$(`head script[id=lib_${e}]`)) {
                        $('head').appendChild(this.addElms([{
                            tag: 'script', type: 'module', id: `lib_${e}`,
                            src: this.libs[e], async: true,
                            onload: () => resolve(o(`加载成功 ${e}`)),
                            onerror: () => reject(o(`加载错误 ${e}`)),
                        }])[0]);
                    } else resolve(o(`库已存在 ${e}`));
                })
            )).then(es => es.forEach(e => { if (e.status == 'rejected') throw e.reason }));
        }
    }().init();
});
// 设置环境变量
let { $, ObjectToFormData } = $tm;