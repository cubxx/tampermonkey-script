// ==UserScript==
// @name        tm
// @version     latest
// @author      cubxx
// @match       *://*/*
// @require     https://cdn.jsdelivr.net/gh/vanjs-org/van/public/van-1.6.0.nomodule.min.js
// @require     https://cdn.jsdelivr.net/npm/vanjs-ext@0.6.3/dist/van-x.nomodule.min.js
// @run-at      document-start
// @icon        data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="%23bf0" viewBox="0 0 1 1"><rect width="1" height="1"/></svg>
// @grant       none
// ==/UserScript==

const tm = (() => {
  'use strict';
  if (Object.prototype.hasOwnProperty.call(window, 'tm'))
    throw new Error('tm env error: global variable "tm" already exists');
  console.debug('tm env init', self.location.href);

  const tool = {
    throw: Object.assign(
      /** @param {string} msg */
      (msg, ...e) => {
        log.error(msg, ...e);
        throw Error(msg, { cause: tool.throw.cause });
      },
      { cause: 'tm:throw' },
    ),
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
      tool.each(obj, (...e) => results.push(fn(...e)));
      return results;
    },
    /**
     * @template {{}} T,R
     * @param {T} obj
     * @param {<K extends keyof T>(value: T[K], key: K, obj: T) => R} fn
     */
    mapValues(obj, fn) {
      const result = /** @type {{ [P in keyof T]: R }} */ ({});
      tool.each(obj, (...e) => (result[e[1]] = fn(...e)));
      return result;
    },
    /**
     * @template {{}} T
     * @template {PropertyKey} K
     * @param {T} obj
     * @param {K} key
     * @returns {T is {[P in K]: unknown}}
     */
    hasOwn(obj, key) {
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
      const value = values[index];
      return value == null
        ? tool.throw('toggle value is nullish', index, values)
        : (data[key] = value);
    },
  };
  const log = (() => {
    const console = { ...window.console };
    const color = '#bf0';
    const factory =
      (key) =>
      (msg, ...e) => {
        key === 'error' && ui.snackbar({ text: msg, color: 'crimson' });
        key === 'info' && ui.snackbar({ text: msg, color: 'seagreen' });
        key === 'log' && ui.snackbar({ text: msg, color: 'steelblue' });
        console[key](
          `%c tm %c ${msg} %c`,
          $.css({
            background: color,
            color: '#000',
            font: 'italic bold 12px/1 serif',
            'border-radius': '4px',
          }),
          $.css({ color: color }),
          '',
          ...e,
        );
      };
    return new Proxy(/** @type {Console & Console['log']} */ (factory('log')), {
      get: (o, p) => factory(p),
      set: () => false,
    });
  })();
  const hack = {
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
        throw tool.throw(`${key.toString()} is not configurable`);
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
      const iframe = $.mount(van.tags.iframe());
      window['console'] = iframe.contentWindow?.['console'];
      iframe.remove();
    },
    /**
     * @param {(req: Request) => void | 'block'} [onRequest]
     * @param {(res: Response) => void | Response} [onResponse]
     */
    onFetch(onRequest, onResponse) {
      hack.override(window, 'fetch', ({ value }) => ({
        value(input, init) {
          const req =
            input instanceof Request ? input : new Request(input, init);
          return onRequest?.(req) === 'block'
            ? Promise.reject('block fetch: ' + req.url)
            : onResponse
              ? value(req).then((res) => onResponse(res) ?? res)
              : value(req);
        },
      }));
    },
    /**
     * @typedef {{
     *   method: string;
     *   url: string | URL;
     *   body?: Document | XMLHttpRequestBodyInit | null;
     * }} XHRRequestInfo
     */
    /**
     * @param {(
     *   info: XHRRequestInfo,
     *   xhr: XMLHttpRequest,
     * ) => void | 'block'} [onRequest]
     * @param {(
     *   info: XHRRequestInfo,
     *   xhr: XMLHttpRequest,
     * ) => void | unknown} [onResponse]
     */
    onXHR(onRequest, onResponse) {
      const proto = XMLHttpRequest.prototype;
      const requestInfoKey = 'tm:xhrReqInfo';
      hack.override(proto, 'open', ({ value }) => ({
        value(method, url, ...e) {
          this[requestInfoKey] = { method, url };
          //@ts-ignore
          return value.call(this, method, url, ...e);
        },
      }));
      hack.override(proto, 'send', ({ value }) => ({
        /** @this {XMLHttpRequest} */
        value(body) {
          this[requestInfoKey].body = body;
          onResponse &&
            this.addEventListener('load', () => {
              const res = onResponse(this[requestInfoKey], this);
              res != null &&
                Object.defineProperty(this, 'response', { get: () => res });
            });

          if (onRequest?.(this[requestInfoKey], this) !== 'block')
            return value.call(this, body);
          Object.defineProperty(this, 'statusText', {
            get: () => 'block XHR: ' + this[requestInfoKey].url,
          });
          this.dispatchEvent(new ProgressEvent('error'));
        },
      }));
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
            tool.hasOwn(e[1], 'isDevToolOpened')
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
  };

  /** Dom helper @see https://developer.mozilla.org/docs/Glossary/CSS_Selector */
  const $ = Object.assign(
    /**
     * @template {string} T
     * @overload
     * @param {T} selector
     * @param {Selectable} [target=document] Default is `document`
     * @returns {Selector<T> | null}
     */
    (selector, target = document) => target.querySelector(selector),
    {
      css:
        /** @param {import('csstype').PropertiesHyphen} value */
        (value) => tool.map(value, (v, k) => `${k}:${v}`).join(';'),
      /**
       * @param {Record<string, Parameters<typeof $.css>[0]>} blocks
       * @param {DocumentOrShadowRoot} [root]
       */
      injectCss(blocks, root = document) {
        const css = tool.map(blocks, (v, k) => `${k}{${$.css(v)}}`).join('');
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(css);
        root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
      },
      mount:
        /**
         * @template {Node} T
         * @param {T} target
         * @param {Node} [root=document.body] Default is `document.body`
         */
        (target, root = document.body) => root.appendChild(target),
      /**
       * @param {Node} target
       * @param {(
       *   records: MutationRecord[],
       *   observer: MutationObserver,
       * ) => void} callback
       * @param {MutationObserverInit} config
       */
      observe(target, callback, config) {
        new MutationObserver(callback).observe(target, config);
      },
      /**
       * @template {string} T
       * @overload
       * @param {T} selector
       * @param {{ interval?: number; count?: number }} [options]
       * @returns {Promise<Selector<T>>}
       */
      async wait(selector, options) {
        const opts = {
          interval: 1e3,
          count: 30,
          ...options,
        };
        let count = 0;
        /** @type {ConstructorParameters<typeof Promise<null | Node>>[0]} */
        const executor = (resolve) => {
          window.setTimeout(() => resolve($(selector)), opts.interval);
        };
        while (true) {
          const res = await new Promise(executor);
          if (res) return res;
          if (++count > opts.count) tool.throw('wait timeout', selector);
        }
      },
    },
  );
  const $$ =
    /**
     * @template {string} T
     * @overload
     * @param {T} selector
     * @param {Selectable} [target=document] Default is `document`
     * @returns {Selector<T>[]}
     * @see https://developer.mozilla.org/docs/Glossary/CSS_Selector
     */
    (selector, target = document) => [...target.querySelectorAll(selector)];

  const ui = (() => {
    const { div, dialog, button } = van.tags;

    const container = div({ id: 'tm-ui', style: 'margin: 0; padding: 0;' });
    const root = container.attachShadow({ mode: 'open' });
    $.injectCss(
      {
        '*': {
          'font-size': '16px',
          'line-height': 1.5,
          color: '#fff',
          transition: '0.2s',
        },
        dialog: {
          border: '1px solid #fff3',
          'border-radius': '8px',
          padding: '20px 24px',
          background: 'transparent',
          'backdrop-filter': 'blur(3px)',
        },
        'dialog::backdrop': { background: '#0008' },
        button: {
          padding: '6px 12px',
          'border-radius': '4px',
          border: 'none',
          cursor: 'pointer',
          color: 'inherit',
        },
        'button:hover,button:focus-visible': { scale: 1.05, outline: 'none' },
        'button:active': { transform: 'translateY(4px)' },
      },
      root,
    );

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
            style: $.css({
              position: 'fixed',
              'z-index': 99999,
              bottom: '20px',
              left: '50%',
              translate: '-50%',
              padding: '8px 14px',
              'border-radius': '8px',
            }),
            textContent: () => props.text,
          });
          van.derive(
            () => (el.style.transform = `translateY(${props.open ? 0 : 60}px)`),
          );
          van.derive(() => (el.style.backgroundColor = props.color));

          /** @type {number | null} */
          let handle = null;
          van.derive(() => {
            if (!props.open) return;
            if (handle) {
              window.clearTimeout(handle);
              handle = null;
            }
            handle = window.setTimeout(
              () => (props.open = false),
              props.duration,
            );
          });
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
            { onpointerup: (e) => (props.open = e.target !== el) },
            () =>
              props.title &&
              div(
                {
                  style: 'font-weight:bold;font-size:18px;margin-bottom:12px;',
                },
                props.title,
              ),
            () =>
              props.content &&
              div(
                { style: 'margin-bottom:20px;white-space:pre-wrap;' },
                props.content,
              ),
            () =>
              vanX.list(
                () => div({ style: 'display:flex;gap:8px;' }),
                props.buttons,
                ({ val: btn }) => {
                  // btn.hidden ??= false;
                  btn.color ??= 'gray';
                  return button(
                    {
                      hidden: () => btn.hidden,
                      style: () => `background: ${btn.color}`,
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
           *   onclick: (this: HTMLButtonElement) => void;
           *   color?: string;
           *   hidden?: boolean;
           * }[]}
           */
          buttons: [],
        },
      ),
    };
  })();

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
      const cb = (e) => {
        e.origin === targetOrigin && e.data == comm.signal && stop();
      };
      /** @param {string} [msg] */
      const stop = (msg) => {
        msg ? log.error(msg) : log(`receive stop signal: ${targetOrigin}`);
        window.removeEventListener('message', cb);
        clearInterval(timer);
        resolve(win);
      };
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
    ...{ tool, log, hack, $, $$, ui, comm },
    /** @param {string} url */
    async import(url) {
      const res = await fetch(url);
      if (!res.ok) tool.throw('fetch error:', res);
      const type = res.headers.get('Content-Type');
      if (!type?.includes('javascript')) tool.throw('not js', type);
      const code = await res.text();
      return new Function(code)();
    },
    /** @typedef {{ [key: string]: RouteMap | (() => void) }} RouteMap */
    /** @param {string} name @param {RouteMap} map */
    router(name, map) {
      const run =
        /** @param {RouteMap[string]} [node] @param {string[]} [parts] */
        async (node, parts, route = '') => {
          if (!node) return;
          if (typeof node === 'function') {
            const id = `[${name}] ${route}`;
            if (tool.hasOwn(tm.router, id)) return; // already handled
            log(`route ${id}`, location.host);
            tm.router[id] = node;
            try {
              await node();
            } catch (error) {
              if (Error.isError(error) && error.cause === tool.throw.cause)
                return;
              log.error(`route ${id} error`, error);
            }
            return;
          }
          await run(node['']); // current handler
          if (parts == null) {
            const pathname = location.pathname.slice(1);
            parts = pathname === '/' ? [] : pathname.split('/');
          }
          const [head, ...rest] = parts;
          if (head == null) return;
          // log.debug('route part', head);
          await run(node[head], rest, route + '/' + head); // next handler
        };
      //@ts-ignore
      tm.onRouteChange(() => run(map[location.host]));
    },
    /** Do not handle hash change */
    onRouteChange: (() => {
      const queue = [];
      const trigger = () => {
        log.debug('route change', location.href);
        for (const cb of queue) cb();
      };
      window.addEventListener('click', (e) => {
        /** @type {HTMLAnchorElement} */ //@ts-ignore
        const el = e.target.closest('a');
        if (!el || !el.href || el.target === '_blank') return;
        trigger();
      });
      window.addEventListener('popstate', trigger);
      hack.override(History.prototype, 'pushState', ({ value }) => ({
        value(...e) {
          value.apply(this, e);
          trigger();
        },
      }));
      /** @param {() => void} cb */
      return (cb) => {
        cb();
        queue.push(cb);
      };
    })(),
  });

  return /** @type {typeof tm} */ (
    window['tm'] = Object.create(Object.freeze(tm))
  );
})();
