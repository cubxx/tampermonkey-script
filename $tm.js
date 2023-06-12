!function (e, t) {
    if (typeof e.$tm == 'undefined') e.$tm = t();
}(window, function () {
    'use strict';
    function $(Selectors, all) {
        let _this = this ? (this instanceof Node ? this : null) : document;
        if (_this) return all ? _this.querySelectorAll(Selectors) : _this.querySelector(Selectors);
        else throw `this对象类型错误 ${this}`;
    };
    Object.assign(Node.prototype, {
        $,
        nodeListener(func, config) {
            const MO = new MutationObserver((...e) => {
                func.call(this, ...e) && MO.disconnect();
            });
            MO.observe(this, config ?? {
                childList: true,
                subtree: true,
                attributes: false,
            });
        },
    });
    return new class {
        $ = $;
        onloadFuncs = [];
        libs = {
            'axios': 'https://unpkg.com/axios/dist/axios.min.js',
            'Cookies': 'https://cdn.jsdelivr.net/npm/js-cookie/dist/js.cookie.min.js',
            'FFmpeg': 'https://unpkg.com/@ffmpeg/ffmpeg/dist/ffmpeg.min.js',
            'html2canvas': "https://html2canvas.hertzen.com/dist/html2canvas.min.js",
        };
        timer = class {
            state = 'inactive';
            constructor(config) { Object.assign(this, config); }
            start() {
                if (this.state == 'running') throw 'timer.start无法执行: ' + this.state;
                this.state = 'running';
                this.st = +new Date();
                this.timer = setInterval(() => {
                    this.log(+new Date() - this.st);
                }, 1e3);
            }
            log(timeStamp) { return timeStamp; }
            stop() {
                if (this.state == 'inactive') throw 'timer.stop无法执行: ' + this.state;
                this.state = 'inactive';
                clearInterval(this.timer);
            }
        };
        constructor() { }
        set onload(func) { this.onloadFuncs.push(func); }
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
        async urlFunc(reg, func1, func2) {
            reg.test(document.URL) ? func1?.() : func2?.();
        }
        useLib(name) {
            return new Promise((resolve, reject) => {
                if (typeof window[name] == 'undefined' && !$(`head script[id=lib_${name}]`)) {
                    $('head').appendChild(this.addElms({
                        arr: [{
                            tag: 'script', type: 'module', id: `lib_${name}`,
                            src: this.libs[name], async: true,
                            onload: () => resolve(`加载成功 ${name}`),
                            onerror: () => reject(`加载失败 ${name}`),
                        }]
                    })[0]);
                } else resolve(`库已存在 ${name}`);
            });
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
        }
        download(blob, type, name) {
            const defaultType = (function () {
                const type = blob.type.match(/(?<=\/)[^;\/]+/)[0].split('-').slice(-1)[0]
                switch (type) {
                    case 'matroska': return 'mkv';
                    default: return type;
                }
            })();
            console.table('下载文件类型', { blob: blob.type, defaultType, type });
            type ??= defaultType;
            this.addElms({
                arr: [{
                    tag: 'a',
                    download: `${name || prompt(`${type}文件名:`) || '未命名'}.${type}`,
                    href: URL.createObjectURL(blob),
                }]
            })[0].click();
        }
    }().init();
});
const { $, ObjectToFormData } = $tm;