const $tm = (function () {
    'use strict';
    function $(Selectors, all) {
        if (typeof Selectors != 'string') {
            // throw '选择器不是string';
            return;
        }
        return all ? [...this.querySelectorAll(Selectors)] : this.querySelector(Selectors);
    }
    function addProperties(locked, p, o) {
        if (locked) {
            Object.keys(o).forEach(
                (k) =>
                    (o[k] = {
                        value: o[k],
                        writable: true,
                        enumerable: false,
                    }),
            );
            Object.defineProperties(p, o);
        } else Object.assign(p, o);
    }
    addProperties(0, Node.prototype, {
        $,
        nodeListener(func, config) {
            const MO = new MutationObserver((mutationList) => {
                func.call(this, mutationList) && MO.disconnect();
            });
            MO.observe(
                this,
                config ?? {
                    childList: true,
                    subtree: true,
                    attributes: false,
                },
            );
            return 1;
        },
    });
    addProperties(1, Function.prototype, {
        /**防抖 */
        debounce(delay) {
            let timer = null;
            return (...args) => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    this(...args);
                }, delay);
            };
        },
        /**节流 */
        throttle(delay) {
            let timer = null;
            return (...args) => {
                if (timer) return;
                timer = setTimeout(() => {
                    this(...args);
                    timer = null;
                }, delay);
            };
        },
        /**捕获运行错误 */
        catch() {
            return (...args) => {
                try {
                    this(...args);
                } catch (err) {
                    this.tip(err.message, 3e3, 'red');
                    console.error(err);
                }
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
    const onloadFns = [];
    return {
        libs: {
            axios: 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js',
            Cookies: 'https://cdn.jsdelivr.net/npm/js-cookie/dist/js.cookie.min.js',
            FFmpeg: 'https://unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js',
            html2canvas: 'https://html2canvas.hertzen.com/dist/html2canvas.min.js',
            init() {
                const elms = [];
                function use() {
                    return new Promise((resolve, reject) => {
                        const { url, name } = this;
                        if (typeof window[name] != 'undefined') return resolve(`库已存在 ${name}`);
                        if (elms.some((e) => e.src == url)) return resolve(`库正在加载 ${name}`);
                        const elm = $tm.addElmsGroup({
                            box: {
                                tag: 'script',
                                type: 'module',
                                async: true,
                                src: url,
                                onload() {
                                    resolve(`加载成功 ${name}`);
                                },
                                onerror() {
                                    reject(`加载失败 ${name}`);
                                },
                            },
                        });
                        elms.push(elm);
                        document.head.appendChild(elm);
                    });
                }
                Object.keys(this).forEach((key) => {
                    if (key == 'init') return;
                    this[key] = {
                        name: key,
                        url: this[key],
                        use,
                    };
                });
            },
        },
        set onload(fn) {
            onloadFns.push(fn);
        },
        set invokeUntilNoError(fn) {
            const fnName = fn.name || 'anonymous';
            this.timer({
                async fn() {
                    try {
                        console.log(fnName + '函数开始调用');
                        await fn();
                        this.stop();
                        console.log(fnName + '函数停止调用');
                    } catch (error) {
                        error.message;
                    }
                },
            }).start();
        },
        $,
        init() {
            this.addEventListeners();
            this.libs.init();
            return this;
        },
        addEventListeners() {
            window.addEventListener(
                'load',
                (e) => {
                    onloadFns.forEach((fn) => fn());
                },
                true,
            );
            window.addEventListener(
                'error',
                (e) => {
                    if (e instanceof ErrorEvent)
                        e.filename.includes('userscript.html') && this.tip(e.message, 3e3, 'red');
                },
                true,
            );
            window.addEventListener(
                'unhandledrejection',
                (e) => {
                    if (e instanceof ErrorEvent)
                        e.filename.includes('userscript.html') && this.tip(e.message, 3e3, 'red');
                },
                true,
            );
        },
        addElms({ arr, defaults }) {
            arr ??= [];
            defaults ??= { tag: 'div' };
            return arr.map((config) => {
                //迭代传参
                if (config.box && config.arr) {
                    config.box = Object.assign(defaults, config.box);
                    return this.addElmsGroup(config);
                }
                //默认逻辑
                const elm = Object.assign(
                    document.createElement(config.tag ?? defaults.tag ?? 'div'),
                    defaults,
                    config,
                );
                elm.init?.();
                return elm;
            });
        },
        addElmsGroup({ box, arr, defaults }) {
            const container = this.addElms({ arr: [box] })[0];
            this.addElms({ arr, defaults }).map((e) => container.appendChild(e));
            return container;
        },
        async urlFunc(reg, fn1, fn2) {
            reg.test(document.URL) ? fn1?.() : fn2?.();
        },
        tip(info, duration = 2e3, color = 'orange') {
            const elm = document.body.appendChild(
                this.addElms({
                    arr: [
                        {
                            style: `position: fixed; top: 0%; left: 50%; transform: translate(-50%, -50%);
                        background-color: ${color}; color: black;
                    margin: auto; padding: 5px 10px; border-radius: 10px;
                    font-size: 20px; font-weight: bold; opacity: 0;
                    transition: 300ms; z-index: 99999; display: block!important; `,
                            innerHTML: info,
                            init() {
                                setTimeout((e) => this.remove(), duration);
                            },
                            animate() {
                                this.style.cssText += 'opacity: 1;transform: translate(-50%,50%);';
                            },
                        },
                    ],
                })[0],
            );
            setTimeout((e) => elm.animate(), 100);
            return elm;
        },
        postMessage({ url, data, signal, fn }) {
            return new Promise((resolve, reject) => {
                let isStop = false;
                const win = window.open(url),
                    key = setInterval(() => {
                        if (!win) {
                            reject('win被拦截');
                            finish();
                        }
                        win.postMessage(data, url);
                        fn?.(data);
                        if (win.closed) {
                            reject('win被关闭');
                            finish();
                        }
                        if (isStop) {
                            resolve();
                            finish();
                        }
                    }, 10);
                window.addEventListener('message', eventFn);
                function eventFn(e) {
                    if (e.origin == new URL(url).origin && e.data == signal) {
                        isStop = true;
                    }
                }
                function finish() {
                    window.removeEventListener('message', eventFn);
                    clearInterval(key);
                }
            });
        },
        timer(config) {
            return Object.assign(
                {
                    state: 'inactive',
                    interval: 1e3,
                    start() {
                        if (this.state == 'running') throw 'timer.start无法执行: ' + this.state;
                        this.state = 'running';
                        this.startTime = +new Date();
                        this.timerID = setInterval(() => {
                            this.fn(+new Date() - this.startTime);
                        }, this.interval);
                    },
                    fn(duration) {
                        return duration;
                    },
                    stop() {
                        if (this.state == 'inactive') throw 'timer.stop无法执行: ' + this.state;
                        this.state = 'inactive';
                        clearInterval(this.timerID);
                    },
                },
                config,
            );
        },
        download(blob, type, name) {
            const blobType = blob.type;
            type ??= (function () {
                if (!blobType) return blobType;
                const type = blobType
                    .match(/(?<=\/)[^;\/]+/)[0]
                    .split('-')
                    .slice(-1)[0];
                switch (type) {
                    case 'matroska':
                        return 'mkv';
                    default:
                        return type;
                }
            })();
            console.table('下载文件类型', { blobType, type });
            this.addElmsGroup({
                box: {
                    tag: 'a',
                    download: `${name || prompt(`${type}文件名:`) || '未命名'}.${type}`,
                    href: URL.createObjectURL(blob),
                },
            }).click();
        },
    }.init();
})();
const $ = $tm.$.bind(document);
window.$tm ??= $tm;
