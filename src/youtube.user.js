// ==UserScript==
// @name        youtube
// @version     0.1
// @author      cubxx
// @match       *://*.youtube.com/*
// @updateURL   https://cdn.jsdelivr.net/gh/cubxx/tampermonkey-script/src/youtube.user.js
// @downloadURL https://cdn.jsdelivr.net/gh/cubxx/tampermonkey-script/src/youtube.user.js
// @icon        https://www.youtube.com/s/desktop/00d073cd/img/logos/favicon.ico
// @grant       none
// ==/UserScript==

(function () {
  if (top !== self) return;

  const { $, ui, _ } = tm;

  // modify video height
  $('div#player')?.observe(
    (ob) => {
      const dom = $('div#player-container-inner');
      if (dom) {
        dom.el.style.setProperty('--ytd-watch-flexy-height-ratio', '11.5');
        $('.ytp-cued-thumbnail-overlay-image')?.set({
          style: { 'background-size': 'contain' },
        });
        ob.disconnect();
      }
    },
    { subtree: true, childList: true },
  );

  // don not close control
  const moviePlayerEl = $('div#movie_player');
  if (!moviePlayerEl) return _.exit('No movie player element found');
  moviePlayerEl.observe(
    (ob) => {
      if (moviePlayerEl.el.classList.contains('ytp-autohide')) {
        moviePlayerEl.el.classList.remove('ytp-autohide');
      }
    },
    { attributes: true, attributeFilter: ['class'] },
  );

  // copy subtitle
  const captionEl = $('div#ytp-caption-window-container');
  if (!captionEl) return _.exit('No caption element found');
  captionEl.on('click', async () => {
    const text = captionEl.el.textContent;
    // window.open(
    //   'https://www.deepl.com/en/translator#en/zh-hans/' + text,
    //   '_blank',
    // );
    await navigator.clipboard.writeText(text);
    ui.snackbar.show('Caption copied to clipboard');
  });
})();
