// ==UserScript==
// @name        tm-ui
// @version     0.2
// @author      cubxx
// @match       *://*/*
// @updateURL   https://cdn.jsdelivr.net/gh/cubxx/tampermonkey-script/src/tm-ui.user.js
// @downloadURL https://cdn.jsdelivr.net/gh/cubxx/tampermonkey-script/src/tm-ui.user.js
// @icon        data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="%23bff" viewBox="0 0 1 1"><rect width="1" height="1"/></svg>
// @grant       none
// ==/UserScript==

(function () {
  const { $, signal, defineComponent, log } = tm;

  function test(setup) {
    defineComponent('test', setup);
    lit.render(
      lit.html`<tm-test style="${$.style({
        // position: 'fixed',
        // top: 0,
        // left: 0,
        // 'z-index': 9999,
      })}"></tm-test>`,
      document.body,
    );
  }

  defineComponent(
    'dialog',
    function (props) {
      return () =>
        lit.html`<dialog><slot name="content">${props.content()}</slot></dialog>`;
    },
    ['content'],
  );
  // test(function () {
  //   const [count, setCount] = signal.createSignal(0);
  //   return () =>
  //     lit.html`<tm-dialog content="${count()}" @click=${(e) => setCount(count() + 1)}></tm-dialog>`;
  // });
  defineComponent(
    'button',
    function (props) {
      return () => lit.html`<button>${props.text()}</button>`;
    },
    ['text'],
  );
  defineComponent(
    'form',
    function (props) {
      return () => lit.html``;
    },
    [],
  );
  defineComponent(
    'text',
    function (props) {
      return () => lit.html``;
    },
    [],
  );
  defineComponent(
    'select',
    function (props) {
      return () => lit.html``;
    },
    [],
  );
  defineComponent(
    'slider',
    function (props) {
      return () => lit.html``;
    },
    [],
  );
  defineComponent(
    'menu',
    function (props) {
      return () => lit.html``;
    },
    [],
  );
})();
