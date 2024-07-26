// ==UserScript==
// @name        mfuns-h
// @version     0.1
// @author      cubxx
// @include     /https\:\/\/(www|m)\.mfuns\.net\//
// @updateURL   https://cdn.jsdelivr.net/gh/cubxx/tampermonkey-script/src/mfuns-h.user.js
// @downloadURL https://cdn.jsdelivr.net/gh/cubxx/tampermonkey-script/src/mfuns-h.user.js
// @icon        https://www.mfuns.net/favicon.ico
// @grant       none
// ==/UserScript==

(function () {
  const { $, $$, ui, _, log, comm } = tm;

  // 签到
  !(async function () {
    const signKey = '上次签到时间';
    if (localStorage.getItem(signKey) == new Date().toDateString()) {
      // ui.snackbar.show('今日已签到');
      return;
    }
    const res = await fetch('https://api.mfuns.net/v1/sign/sign', {
      headers: {
        Authorization: decodeURIComponent(
          document.cookie.match(/(access|mfuns)_token=([^;]+)/)?.[2] ?? '',
        ),
      },
    });
    const json = await res.json();
    localStorage.setItem(signKey, new Date().toDateString());
    log('签到 ', json);
    ui.snackbar.show(json.msg);
  })();
  // 网页端播放视频
  tm.matchURL(
    [
      /m.mfuns.net\/video/,
      () => {
        $('.v-window__container .text-h6')?.set({
          onclick() {
            location.host = 'www.mfuns.net';
          },
        });
      },
    ],
    // 视频搬运工具
    [
      /www.mfuns.net\/create\/video/,
      () => {
        const bv_api = 'https://video_api.kms233.com/bili/';
        comm.receive('https://www.bilibili.com').then(main);
        // fns
        async function main({ bvid, desc, pic, title, copyright, owner_name }) {
          const [formDom, uploadDom] = $('.mf-create-video')?.children ?? [];
          formDom[0].value = title;
          formDom[0].dispatchEvent(new InputEvent('input'));
          formDom[3].click();
          const el = formDom.$('div[contenteditable=true]')?.set({
            textContent: (copyright == 1 ? [bvid, `作者：${owner_name}`] : [])
              .concat(desc)
              .join('\n'),
          });
          formDom[1].click();
          await setDialog(pic.replace('http://', 'https://'));
          uploadDom.$('button')?.el.click();
          await setDialog(title, bv_api + bvid);
        }
        async function setDialog(...args) {
          // 下拉框
          const dropdown = await getElmUntilNoError(getCurrentDropdown);
          dropdown
            .$$('.n-dropdown-option-body')
            .filter((e) => e.innerText == '网络链接')[0]
            .click();
          // dialog
          const content = await getElmUntilNoError(getCurrentDialog);
          content.$$('input').map((e, i) => {
            e.value = args[i];
            e.dispatchEvent(new InputEvent('input'));
          });
          const btn = content
            .$$('button')
            .filter((e) => e.innerText != '取消')[0];
          btn.click();
          btn.parentElement.nodeListener(
            (list) => {
              list.forEach(({ addedNodes }) => {
                addedNodes.forEach((e) => e.click());
              });
              return 1;
            },
            { childList: true },
          );
          await waitFnUntilTimeout(() => {
            if (getCurrentDialog()) _.exit('未关闭dialog');
          }, 30);
        }
        function waitFnUntilTimeout(fn, maxCount = 10) {
          let count = 0;
          return new Promise((resolve, reject) => {
            // tm.invokeUntilNoError = () => {
            //   if (count > maxCount) return reject('执行超时');
            //   count++;
            //   resolve(fn());
            // };
          });
        }
        function getElmUntilNoError(fn) {
          return new Promise((resolve) => {
            // tm.invokeUntilNoError = () => {
            //   const elm = fn();
            //   if (elm) resolve(elm);
            //   else _.exit(fn.name + '无法获取元素');
            // };
          });
        }
        const getCurrentDropdown = () =>
          $$('.v-binder-follower-content').filter(
            (e) => e.el.childElementCount,
          )[0];
        const getCurrentDialog = () => $('.mf-modal-dialog__container-content');
      },
    ],
  );
})();
