// ==UserScript==
// @name        tm
// @version     0.2
// @author      cubxx
// @match       *://*/*
// @require     https://cdn.jsdelivr.net/gh/vanjs-org/van/public/van-1.5.5.nomodule.min.js
// @require     https://cdn.jsdelivr.net/npm/vanjs-ext@0.6.3/dist/van-x.nomodule.min.js
// @updateURL   /src/tm.user.js
// @downloadURL /src/tm.user.js
// @run-at      document-start
// @icon        data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="%23bf0" viewBox="0 0 1 1"><rect width="1" height="1"/></svg>
// @grant       none
// ==/UserScript==

const tm = (function () {
  'use strict';
  if (Object.prototype.hasOwnProperty.call(window, 'tm'))
    throw new Error('tm env error: global variable "tm" already exists');
  console.debug('tm env init', self.location.href);

  const _ = {
    exit(...e) {
      debugger;
      log.error(...e);
      throw new Error('tm exit');
    },
    /**
     * @template {any[]} P
     * @param {(...e: P) => void} fn
     * @param {number} delay
     * @returns {(...e: P) => void}
     */
    debounce(fn, delay) {
      /** @type {number | undefined} */
      let timer = void 0;
      return (...e) => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          fn.apply(null, e);
        }, delay);
      };
    },
    /**
     * @template {any[]} P
     * @param {(...e: P) => void} fn
     * @param {number} delay
     * @returns {(...e: P) => void}
     */
    throttle(fn, delay) {
      /** @type {number | null} */
      let timer = null;
      return (...e) => {
        if (timer) return;
        timer = window.setTimeout(() => {
          fn.apply(null, e);
          timer = null;
        }, delay);
      };
    },
    /**
     * @template {{}} T
     * @param {T} obj
     * @param {<K extends keyof T>(value: T[K], key: K, obj: T) => void} fn
     */
    each(obj, fn) {
      const keys = Object.keys(obj).sort();
      //@ts-ignore
      keys.forEach((key) => fn(obj[key], key, obj));
    },
    /**
     * @template {{}} T,R
     * @param {T} obj
     * @param {<K extends keyof T>(value: T[K], key: K, obj: T) => R} fn
     */
    map(obj, fn) {
      const results = /** @type {R[]} */ ([]);
      _.each(obj, (...e) => results.push(fn(...e)));
      return results;
    },
    /**
     * @template {{}} T,R
     * @param {T} obj
     * @param {<K extends keyof T>(value: T[K], key: K, obj: T) => R} fn
     */
    mapValues(obj, fn) {
      const result = /** @type {{ [P in keyof T]: R }} */ ({});
      _.each(obj, (...e) => (result[e[1]] = fn(...e)));
      return result;
    },
    /**
     * @template {{}} T
     * @template {PropertyKey} K
     * @param {T} obj
     * @param {K} key
     * @returns {T is {[P in K]: unknown}}
     */
    hasOwnKey(obj, key) {
      return Object.prototype.hasOwnProperty.call(obj, key);
    },
    /**
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
  };
  const log = (function () {
    const console = { ...window.console };
    const color = '#bf0';
    const handle =
      (key) =>
      (msg, ...e) =>
        console[key](
          `%c tm %c ${msg} %c`,
          $.style({
            background: color,
            color: '#000',
            font: 'italic bold 12px/1 serif',
            'border-radius': '4px',
          }),
          $.style({ color: color }),
          '',
          ...e,
        );
    return new Proxy(/** @type {Console & Console['log']} */ (handle('log')), {
      get: (o, p) => handle(p),
      set: () => false,
    });
  })();
  const hack = {
    get stack() {
      const error = new Error();
      return (
        error.stack
          ?.split('\n')
          .slice(2)
          .map((e) => e.trim()) ?? []
      );
    },
    /**
     * @template T
     * @template {keyof T} K
     * @template {{
     *   value: T[K];
     *   get(this: T): T[K];
     *   set(this: T, e: T[K]): void;
     * }} D
     * @param {T} obj
     * @param {K} key
     * @param {(descriptor: Merge<PropertyDescriptor, D>) => Partial<D>} convert
     */
    override(obj, key, convert) {
      const d = Object.getOwnPropertyDescriptor(obj, key) ??
        log(`can't find own key: ${key.toString()}, will add a new one`) ?? {
          configurable: true,
        };
      if (!d.configurable)
        return _.exit(`${key.toString()} is not configurable`);
      //@ts-ignore
      Object.defineProperty(obj, key, Object.assign({}, d, convert(d)));
    },
    infDebugger() {
      hack.override(window, 'setInterval', ({ value }) => ({
        //@ts-ignore
        value(...e) {
          ('' + e[0]).includes('debugger')
            ? tm.log('disabled setInterval')
            : //@ts-ignore
              value.apply(this, e);
        },
      }));
    },
    restoreConsole() {
      if (console.log.toString() === 'function log() { [native code] }') {
        return;
      }
      const iframe = $.h('iframe').mount('body').el;
      window['console'] = iframe.contentWindow?.['console'];
      iframe.remove();
    },
    /** @param {RegExp[]} regexs */
    blockRequest(...regexs) {
      const check = (url) => {
        const shouldBlock = regexs.some(
          (reg) => reg.test('' + url) && (log('blocked request:', url), true),
        );
        shouldBlock && log('blocked request:', url);
        return shouldBlock;
      };
      hack.override(window, 'fetch', ({ value }) => ({
        //@ts-ignore
        value(...e) {
          const url = e[0] instanceof Request ? e[0].url : e[0];
          //@ts-ignore
          return check(url) ? Promise.reject() : value(...e);
        },
      }));
      hack.override(XMLHttpRequest.prototype, 'open', ({ value }) => ({
        value(...e) {
          //@ts-ignore
          return check(e[1]) || value.apply(this, e);
        },
      }));
    },
    /** @see https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API */
    trustedTypes(name = 'tm-policy') {
      const { trustedTypes } = window;
      if (!trustedTypes) return;
      const policy = trustedTypes.createPolicy(name, {
        createHTML: (e) => e,
      });
      const cvt = ({ set }) => ({
        set(v) {
          //@ts-ignore
          set.call(this, policy.createHTML(v));
        },
      });
      hack.override(Element.prototype, 'innerHTML', cvt);
      hack.override(ShadowRoot.prototype, 'innerHTML', cvt);
    },
    openShadowRoot() {
      hack.override(Element.prototype, 'attachShadow', ({ value }) => ({
        value(e) {
          e.mode = 'open';
          return value.call(this, e);
        },
      }));
    },
    /** @see https://github.com/theajack/disable-devtool */
    enableDevtool() {
      hack.override(Object, 'assign', ({ value }) => ({
        value(...e) {
          if (
            typeof e[0] === 'function' &&
            _.hasOwnKey(e[1], 'isDevToolOpened')
          ) {
            hack.override(e, 0, ({ value }) => ({
              value() {
                return value({
                  disableMenu: false,
                  disableIframeParents: false,
                  clearIntervalWhenDevOpenTrigger: true,
                  clearLog: false,
                  ignore: () => true,
                  // ondevtoolopen() {},
                });
              },
            }));
          }
          //@ts-ignore
          return value.apply(this, e);
        },
      }));
    },
    eventIsTrusted() {
      hack.override(EventTarget.prototype, 'addEventListener', ({ value }) => ({
        value(...e) {
          const cb = e[1];
          if (typeof cb === 'function') {
            e[1] = function (e) {
              cb.call(
                this,
                new Proxy(e, {
                  get: (o, k) => {
                    if (k === 'isTrusted') {
                      return true;
                    }
                    const v = o[k];
                    return typeof v === 'function' ? v.bind(o) : v;
                  },
                }),
              );
            };
          }
          //@ts-ignore
          return value.apply(this, e);
        },
      }));
    },
    disableConsoleClear() {
      hack.override(console, 'clear', ({ value }) => ({
        value() {
          log.debug('console.clear() is disabled');
        },
      }));
    },
    /** @param {string} text @param {DocumentOrShadowRoot} [root] */
    injectCss(text, root = document) {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(text);
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
    },
  };
  /** @see https://developer.mozilla.org/docs/Glossary/CSS_Selector */
  const $ = Object.assign(
    /**
     * @template {string} S
     * @overload
     * @param {S} e
     * @returns {Dom<Selector<S>> | null}
     */
    /**
     * @template {El} T
     * @overload
     * @param {T} e
     * @returns {Dom<T>}
     */
    function (e) {
      //@ts-ignore
      const el = typeof e === 'string' ? $._getCtx(this).querySelector(e) : e;
      return el ? new Dom(el) : null;
    },
    {
      /**
       * Create new element
       *
       * @template {keyof HTMLElementTagNameMap} K
       * @param {K} tag
       * @param {Partial<Props<K>>} props
       * @param {(Dom | string)[]} children
       * @returns {Dom<HTMLElementTagNameMap[K]>}
       */
      h(tag, props = {}, children = []) {
        const el = document.createElement(tag);
        const dom = $(el);
        //@ts-ignore
        dom.set(props);
        if (children.length) {
          el.append(...children.map((e) => (typeof e === 'string' ? e : e.el)));
        }
        return $(el);
      },
      /** Class string @param {ConvertProps['class']} [value] */
      class(value) {
        if (!value) return '';
        return typeof value === 'string' ? value : value.join(' ');
      },
      /** Style string @param {ConvertProps['style']} [value] */
      style(value) {
        if (!value) return '';
        if (typeof value === 'string') return value;
        return _.map(value, (v, k) => `${k}:${v}`).join(';');
      },
      /** @param {string | Dom} dom */
      el(dom) {
        return dom instanceof Dom
          ? dom.el
          : ($(dom)?.el ?? _.exit(`${dom} not found`));
      },
      _getCtx(that) {
        return that instanceof Dom ? that.el : window.document;
      },
    },
  );
  /**
   * @template {string} S
   * @overload
   * @param {S} e
   * @returns {Dom<Selector<S>>[]}
   * @see https://developer.mozilla.org/docs/Glossary/CSS_Selector
   */
  function $$(e) {
    //@ts-ignore
    return [...$._getCtx(this).querySelectorAll(e)].map($);
  }
  /** @template {El} T */
  class Dom {
    $ = $;
    $$ = $$;
    /** @param {T} el */
    constructor(el) {
      /** @type {T} */
      this.el = el;
    }
    get shadow() {
      return $(
        this._assertType(HTMLElement).shadowRoot ??
          _.exit(`shadowRoot not found`),
      );
    }
    get children() {
      return [...this.el.children].map((e) => $(e));
    }
    /**
     * @template {El} T
     * @param {new (...e: any[]) => T} constructor
     */
    _assertType(constructor) {
      return this.el instanceof constructor
        ? this.el
        : _.exit(`el is not ${constructor.name}`);
    }
    /**
     * @template {EventType<T>} K
     * @overload
     * @param {K} name
     * @param {T[`on${K}`]} listener
     * @param {boolean | AddEventListenerOptions} [options]
     * @returns {this}
     */
    /**
     * @overload
     * @param {string} name
     * @param {EventListener} listener
     * @param {boolean | AddEventListenerOptions} [options]
     */
    on(name, listener, options) {
      this.el.addEventListener(name, listener, options);
      return this;
    }
    /**
     * @template {EventType<T>} K
     * @overload
     * @param {K} name
     * @param {T[`on${K}`]} listener
     * @param {boolean | EventListenerOptions} [options]
     */
    /**
     * @overload
     * @param {string} name
     * @param {EventListener} listener
     * @param {boolean | EventListenerOptions} [options]
     */
    off(name, listener, options) {
      this.el.removeEventListener(name, listener, options);
      return this;
    }
    /**
     * @template {EventType<T>} K
     * @overload
     * @param {K} evt
     * @param {EventInit} [options]
     * @returns {boolean}
     */
    /**
     * @overload
     * @param {Event} evt
     * @returns {boolean}
     */
    emit(evt, options) {
      return this.el.dispatchEvent(
        typeof evt === 'string' ? new Event(evt, options) : evt,
      );
    }
    /**
     * @param {string | Dom} dom
     * @param {string | Dom | number} [pos]
     */
    mount(dom, pos) {
      const el = $.el(dom);
      pos === void 0
        ? el.appendChild(this.el)
        : el.insertBefore(
            this.el,
            typeof pos === 'number' ? el.childNodes[pos] : $.el(pos),
          );
      return this;
    }
    /**
     * @param {(
     *   observer: MutationObserver,
     *   records: MutationRecord[],
     * ) => void} callback
     * @param {MutationObserverInit} config
     */
    observe(callback, config) {
      const observer = new MutationObserver((records) =>
        callback.call(null, observer, records),
      );
      observer.observe(this.el, config);
      return this;
    }
    hide() {
      const el = this._assertType(HTMLElement);
      requestAnimationFrame(() => {
        el.style.setProperty('display', 'none', 'important');
      });
    }
    /** @param {Partial<Props<ExtractKey<HTMLElementTagNameMap, T>>>} props */
    set(props) {
      const el = this._assertType(HTMLElement);
      /**
       * @type {{
       *   [P in keyof ConvertProps]: (value: ConvertProps[P]) => void;
       * }}
       */
      const converts = {
        class: (value) => (el.className = $.class(value)),
        style: (value) => (el.style.cssText = $.style(value)),
      };
      _.each(converts, (convert, key) => {
        if (_.hasOwnKey(props, key)) {
          //@ts-ignore
          convert(props[key]);
          delete props[key];
        }
      });
      Object.assign(el, props);
      return this;
    }
  }

  const ui = (function () {
    const { div, dialog, button } = van.tags;

    const container = div({ id: 'tm-ui', style: 'margin: 0; padding: 0;' });
    const root = container.attachShadow({ mode: 'open' });
    hack.injectCss(`* { transition: all 300ms ease }`, root);

    /**
     * @type {<T extends LooseObject, U extends HTMLElement>(
     *   setup: (props: T) => U,
     *   defaultProps: T,
     * ) => { props: T } & U}
     */
    const Component = (setup, defaultProps) => {
      const props = vanX.reactive(defaultProps);
      const el = setup(props);
      return Object.assign(el, { props });
    };
    /**
     * @type {<T extends LooseObject, U extends HTMLElement>(
     *   setup: (props: T & { open?: boolean }) => U,
     *   defaultProps: T & { open?: boolean },
     * ) => (
     *   patchProps: Partial<T & { open?: boolean }>,
     * ) => U & { props: T & { open?: boolean } }}
     */
    const define = (setup, defaultProps) => {
      let el;
      return (patchProps) => {
        if (!container.isConnected) {
          document.body.appendChild(container);
        }
        if (!el) {
          defaultProps.open = false;
          el = Component(setup, defaultProps);
          root.appendChild(el);
        }
        //@ts-ignore
        patchProps.open ??= true;
        Object.assign(el.props, patchProps);
        return el;
      };
    };
    return {
      Component,
      define,
      snackbar: define(
        (props) => {
          const el = div({
            style: $.style({
              position: 'fixed',
              left: '50%',
              transform: 'translateX(-50%)',
              'border-radius': '8px',
              padding: '8px 14px',
            }),
            textContent: () => props.text,
          });
          van.derive(() => (el.style.bottom = props.open ? '20px' : '-35px'));
          van.derive(() => (el.style.backgroundColor = props.color));
          van.derive(() =>
            window.setTimeout(() => (props.open = false), props.duration),
          );
          return el;
        },
        {
          text: '',
          /** @type {'crimson' | 'seagreen' | 'steelblue'} */
          color: 'steelblue',
          duration: 2e3,
        },
      ),
      dialog: define(
        (props) => {
          const el = dialog(
            {
              style: $.style({
                padding: '20px',
                'border-radius': '8px',
                border: 'none',
                color: '#fff',
                background: '#000a',
              }),
              onpointerup: (e) => (props.open = e.target !== el),
            },
            () =>
              props.title &&
              div(
                {
                  style:
                    'font-weight: bold; font-size: 18px; margin-bottom: 12px;',
                },
                props.title,
              ),
            () =>
              props.content &&
              div(
                { style: 'margin-bottom: 20px; white-space: pre-wrap;' },
                props.content,
              ),
            () =>
              vanX.list(
                () => div({ style: 'display: flex; gap: 8px;' }),
                props.buttons,
                ({ val: btn }) => {
                  // btn.hidden ??= false;
                  btn.color ??= 'steelblue';
                  return button(
                    {
                      style: () =>
                        $.style({
                          display: btn.hidden ? 'none' : '',
                          padding: '6px 12px',
                          'border-radius': '4px',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'inherit',
                          background: btn.color,
                        }),
                      onclick: btn.onclick,
                    },
                    () => btn.text,
                  );
                },
              ),
          );
          van.derive(() => (props.open ? el.showModal() : el.close()));
          return el;
        },
        {
          title: '',
          /** @type {string | Node} */
          content: '',
          /**
           * @type {{
           *   text: string;
           *   onclick: () => void;
           *   color?: string;
           *   hidden?: boolean;
           * }[]}
           */
          buttons: [],
        },
      ),
    };
  })();

  const fs = {
    /**
     * @param {Blob} blob
     * @param {string} [filename]
     */
    save: function (
      blob,
      filename = prompt('filename') ?? `tm-${Date.now()}.download`,
    ) {
      $.h('a', {
        href: URL.createObjectURL(blob),
        download: filename,
      }).el.click();
    },
    /**
     * Download stream
     *
     * @param {string} url
     * @param {(info: { progress: number; received: number }) => void} [onProgress]
     * @param {(info: { progress: number; received: number }) => void} onBreakpoint
     */
    async download(
      url,
      onProgress,
      onBreakpoint = ({ progress, received }) => {
        log('breakpoint at', `${progress} %`, `${received} MB`);
      },
    ) {
      const handle = await window.showSaveFilePicker();
      const stream = await handle.createWritable();
      let total = 0,
        received = 0;
      const { promise, resolve, reject } = Promise.withResolvers();
      promise
        .finally(() => stream.close())
        .then(
          () => {
            log('download success');
          },
          (err) => {
            log('download error, breakpoint at', received);
            log.error(err);
          },
        );
      const getProgressInfo = () => ({
        progress: +((received / total) * 100).toFixed(2),
        received: +(received / 1024 ** 2).toFixed(0),
      });
      /** @param {ReadableStreamDefaultReader<Uint8Array>} reader */
      function pump(reader) {
        onProgress && onProgress(getProgressInfo());
        reader.read().then(
          ({ done, value }) => {
            if (done) {
              resolve('');
              return;
            }
            if (value) {
              //@ts-ignore
              stream.write(value);
              received += value.length;
            }
            pump(reader);
          },
          (err) => {
            if (err == 'TypeError: network error') {
              onBreakpoint(getProgressInfo());
              download();
            } else {
              reject(err);
            }
          },
        );
      }
      function download() {
        fetch(url, { headers: { Range: `bytes=${received}-` } }).then((res) => {
          if (!res.ok || !res.body) {
            reject('HTTP error');
            log.error(res);
            debugger;
            return;
          }
          total ||= +(res.headers.get('Content-Length') ?? 0);
          pump(res.body.getReader());
        }, reject);
      }
      download();
    },
  };
  /** Communicate between tabs */
  const comm = {
    signal: 'tm.comm:signal',
    /**
     * @param {string} target
     * @param {{ [x: string]: Serializable }} data
     * @returns {Promise<Window | null>}
     */
    send(target, data) {
      data[comm.signal] = true;
      const win = window.open(target, '_blank', 'noopener=no');
      const targetOrigin = new URL(target).origin;
      const { promise, resolve } = Promise.withResolvers();
      /** @param {MessageEvent} e */
      function cb(e) {
        e.origin === targetOrigin && e.data == comm.signal && stop();
      }
      /** @param {string} [msg] */
      function stop(msg) {
        msg ? log.error(msg) : log(`receive stop signal: ${targetOrigin}`);
        window.removeEventListener('message', cb);
        clearInterval(timer);
        resolve(win);
      }
      const timer = setInterval(() => {
        if (!win) return stop(`win was blocked: ${targetOrigin}`);
        if (win.closed) return stop(`win was closed: ${targetOrigin}`);
        win.postMessage(data, targetOrigin);
      }, 1e3);
      window.addEventListener('message', cb);
      return promise;
    },
    /** @param {(origin: string) => boolean} [checkOrigin] */
    receive(checkOrigin) {
      let shouldStop = false;
      const { promise, resolve } = Promise.withResolvers();
      window.addEventListener('message', (e) => {
        if (shouldStop) {
          const source = e.source;
          /** @ts-ignore */
          if (source) source.postMessage(comm.signal, e.origin);
          else {
            log.warn("source is null, can't send stop signal", source);
            debugger;
          }
          return;
        }
        if (checkOrigin?.(e.origin) || !e.data[comm.signal]) return;
        log('receive signal', e.data);
        resolve(e.data);
        shouldStop = true;
      });
      return promise;
    },
  };
  const tm = /** @type {const} */ ({
    [Symbol.toStringTag]: 'tm',
    ...{ _, log, hack, $, $$, ui, fs, comm },
    /** @param {string} url */
    async import(url) {
      const res = await fetch(url);
      if (!res.ok) _.exit('fetch error:', res);
      const type = res.headers.get('Content-Type');
      if (!type?.includes('javascript')) _.exit('not js:', type);
      const code = await res.text();
      return new Function(code)();
    },
    /** @param {[match: RegExp | string, fn: () => void][]} map */
    matchURL(...map) {
      const url = location.href;
      for (const [str, fn] of map) {
        if (typeof str === 'string' ? url.includes(str) : str.test(url)) {
          log.info('match url', str);
          fn();
        }
      }
    },
    onRouteChange: (function () {
      const queue = [];
      const trigger = () => queue.forEach((cb) => cb());
      window.addEventListener('popstate', trigger);
      hack.override(History.prototype, 'pushState', ({ value }) => ({
        value(...e) {
          value.apply(this, e);
          trigger();
        },
      }));
      /** @param {() => void} cb */
      return (cb) => queue.push(cb);
    })(),
    /** @param {string} name @param {string[]} selectors @returns remove handler */
    rmAD(name, selectors) {
      const rm = () => {
        const ads = selectors
          .flatMap($$)
          .filter((ad) => ad.el.style.display !== 'none' && (ad.hide(), true))
          .map((e) => e.el);
        const len = ads.length;
        len && log(`rmAD: ${name}`, ads);
        return len;
      };
      tm.rmAD[name] = rm;
      rm();
      tm.onRouteChange(rm);
      requestIdleCallback(rm);
      document.addEventListener('DOMContentLoaded', rm);
      return rm;
    },
  });

  return /** @type {typeof tm} */ (
    window['tm'] = Object.create(Object.freeze(tm))
  );
})();
