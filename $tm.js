!function (e, t) {
    if (typeof e.$tm == 'undefined') e.$tm = t();
}(window, function () {
    'use strict';
    function $(Selectors, all) {
        const _this = this ? (this instanceof Node ? this : null) : document;
        if (_this) return all ? [..._this.querySelectorAll(Selectors)] : _this.querySelector(Selectors);
        else throw `this对象类型错误 ${this}`;
    };
    function addProperties(locked, p, o) {
        if (locked) {
            Object.keys(o).forEach(k => o[k] = {
                value: o[k],
                writable: true,
                enumerable: false,
            });
            Object.defineProperties(p, o);
        } else Object.assign(p, o);
    }
    addProperties(0, Node.prototype, {
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
    addProperties(1, Function.prototype, {
        debounce(delay) {
            let timer = null;
            const _this = this;
            return function (...args) {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    _this(...args);
                }, delay);
            };
        },
        throttle(delay) {
            let timer = null;
            const _this = this;
            return function (...args) {
                if (timer) return;
                timer = setTimeout(() => {
                    _this(...args);
                    timer = null;
                }, delay);
            };
        },
    });
    addProperties(1, Number.prototype, {
        clamp(min, max) {
            if (this < min) return min;
            else if (this > max) return max;
            else return this;
        },
    });
    const onloadFuncs = [];
    return {
        libs: {
            'axios': 'https://unpkg.com/axios/dist/axios.min.js',
            'Cookies': 'https://cdn.jsdelivr.net/npm/js-cookie/dist/js.cookie.min.js',
            'FFmpeg': 'https://unpkg.com/@ffmpeg/ffmpeg/dist/ffmpeg.min.js',
            'html2canvas': "https://html2canvas.hertzen.com/dist/html2canvas.min.js",
            init() {
                const elms = [];
                function use() {
                    return new Promise((resolve, reject) => {
                        const { url, name } = this;
                        if (typeof window[name] != 'undefined') return resolve(`库已存在 ${name}`);
                        if (elms.some(e => e.src == url)) return resolve(`库正在加载 ${name}`);
                        const elm = $tm.addElmsGroup({
                            box: {
                                tag: 'script', type: 'module',
                                async: true, src: url,
                                onload() { resolve(`加载成功 ${name}`) },
                                onerror() { reject(`加载失败 ${name}`) },
                            }
                        });
                        elms.push(elm);
                        document.head.appendChild(elm);
                    });
                }
                Object.keys(this).forEach(key => {
                    if (key == 'init') return;
                    this[key] = {
                        name: key,
                        url: this[key],
                        use,
                    }
                });
            },
        },
        set onload(fn) { onloadFuncs.push(fn); },
        $,
        init() {
            this.addEventListeners();
            this.libs.init();
            return this;
        },
        addEventListeners() {
            this.libs;
            window.addEventListener('load', e => {
                onloadFuncs.forEach(fn => fn());
            }, true);
            window.addEventListener('error', e => {
                if (e instanceof ErrorEvent) e.filename.includes('userscript.html') && this.tip(e.message, 3e3, 'red');
            }, true);
            window.addEventListener('unhandledrejection', e => {
                if (e instanceof ErrorEvent) e.filename.includes('userscript.html') && this.tip(e.message, 3e3, 'red');
            }, true);
        },
        ObjectToFormData(obj) {
            const formData = new FormData();
            Object.keys(obj).forEach(key => {
                formData.append(key, obj[key]);
            });
            return formData;
        },
        addElms({ arr, defaults }) {
            arr ??= [];
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
        },
        addElmsGroup({ box, arr, defaults }) {
            const container = this.addElms({ arr: [box] })[0];
            this.addElms({ arr, defaults }).map(e => container.appendChild(e));
            return container;
        },
        async urlFunc(reg, fn1, fn2) {
            reg.test(document.URL) ? fn1?.() : fn2?.();
        },
        tip(info, duration = 1e3, color = 'orange') {
            const elm = document.body.appendChild(this.addElms({
                arr: [{
                    style: `position: fixed; top: 0 %; left: 50 %; transform: translate(-50 %, -50 %);
                        background- color: ${color}; color: black;
                    margin: auto; padding: 5px 10px; border - radius: 10px;
                    font - size: 20px; font - weight: bold; opacity: 0;
                    transition: 300ms; z - index: 99999; display: block!important; `,
                    innerHTML: info,
                    init() { setTimeout(e => this.remove(), duration); },
                    animate() { this.style.cssText += 'opacity: 1;transform: translate(-50%,50%);' },
                }]
            })[0]);
            setTimeout(e => elm.animate(), 5);
            return elm;
        },
        postMessage({ url, data, signal, func }) {
            return new Promise((resolve, reject) => {
                let stop = false;
                const win = window.open(url),
                    key = setInterval(() => {
                        win.postMessage(data, url);
                        func?.(data);
                        if (win.closed) { reject(); endFn(); }
                        if (stop) { resolve(); endFn(); }
                    }, 1e3);
                window.addEventListener('message', fn);
                function fn(e) {
                    if (e.origin == url && e.data == signal) {
                        stop = true;
                    }
                }
                function endFn() {
                    window.removeEventListener('message', fn);
                    clearInterval(key);
                }
            });
        },
        timer(config) {
            return Object.assign({
                state: 'inactive',
                start() {
                    if (this.state == 'running') throw 'timer.start无法执行: ' + this.state;
                    this.state = 'running';
                    this.st = +new Date();
                    this.timer = setInterval(() => {
                        this.log(+new Date() - this.st);
                    }, 1e3);
                },
                log(timeStamp) {
                    return timeStamp;
                },
                stop() {
                    if (this.state == 'inactive') throw 'timer.stop无法执行: ' + this.state;
                    this.state = 'inactive';
                    clearInterval(this.timer);
                }
            }, config);
        },
        download(blob, type, name) {
            const blobType = blob.type;
            type ??= (function () {
                if (!blobType) return blobType;
                const type = blobType.match(/(?<=\/)[^;\/]+/)[0].split('-').slice(-1)[0];
                switch (type) {
                    case 'matroska': return 'mkv';
                    default: return type;
                }
            })();
            console.table('下载文件类型', { blobType, type });
            this.addElmsGroup({
                box: {
                    tag: 'a',
                    download: `${name || prompt(`${type}文件名:`) || '未命名'}.${type}`,
                    href: URL.createObjectURL(blob),
                }
            }).click();
        },
    }.init();
});
const { $, ObjectToFormData } = window.$tm;