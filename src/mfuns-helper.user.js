// ==UserScript==
// @name         Mfuns助手
// @version      0.1
// @author       Cubxx
// @include      /https\:\/\/(www|m)\.mfuns\.net\//
// @updateURL    https://github.com/Cubxx/tampermonkey-script/raw/main/src/mfuns-helper.user.js
// @downloadURL  https://github.com/Cubxx/tampermonkey-script/raw/main/src/mfuns-helper.user.js
// @icon         https://www.mfuns.net/favicon.ico
// @grant        none
// ==/UserScript==

(function () {
    const { dom, ui, util } = tm;

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
                    document.cookie.match(
                        /(access|mfuns)_token=([^;]+)/,
                    )?.[2] ?? '',
                ),
            },
        });
        const json = await res.json();
        localStorage.setItem(signKey, new Date().toDateString());
        console.log('签到 ', json);
        ui.snackbar.show(json.msg);
    })();
    // 网页端播放视频
    tm.matchURL(/m.mfuns.net\/video/, () => {
        /** @type {HTMLDivElement | null} */
        const el = document.$('.v-window__container .text-h6');
        if (el) {
            el.onclick = function () {
                location.host = 'www.mfuns.net';
            };
        }
    });
    // 视频搬运工具
    tm.matchURL(/www.mfuns.net\/create\/video/, () => {
        const bv_api = 'https://video_api.kms233.com/bili/';
        //@ts-ignore
        const _main = util.debounce(main, 1e3);
        window.addEventListener('message', (e) => {
            if (e.origin == 'https://www.bilibili.com') {
                console.log('收到信号', e.data);
                _main(e.data);
                //@ts-ignore
                e.source?.postMessage('mfuns get', e.origin); //发送回应信号
            }
        });
        // fns
        async function main({ bvid, desc, pic, title, copyright, owner_name }) {
            const [formElm, uploadElm] =
                document.$('.mf-create-video')?.children ?? [];
            formElm[0].value = title;
            formElm[0].dispatchEvent(new InputEvent('input'));
            formElm[3].click();
            const el = formElm.$('div[contenteditable=true]');
            if (el) {
                el.textContent = (
                    copyright == 1 ? [bvid, `作者：${owner_name}`] : []
                )
                    .concat(desc)
                    .join('\n');
            }
            formElm[1].click();
            await setDialog(pic.replace('http://', 'https://'));
            uploadElm.$('button')?.click();
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
                if (getCurrentDialog()) util.exit('未关闭dialog');
            }, 30);
        }
        function waitFnUntilTimeout(fn, maxCount = 10) {
            let count = 0;
            return new Promise((resolve, reject) => {
                tm.invokeUntilNoError = () => {
                    if (count > maxCount) return reject('执行超时');
                    count++;
                    resolve(fn());
                };
            });
        }
        function getElmUntilNoError(fn) {
            return new Promise((resolve) => {
                tm.invokeUntilNoError = () => {
                    const elm = fn();
                    if (elm) resolve(elm);
                    else util.exit(fn.name + '无法获取元素');
                };
            });
        }
        const getCurrentDropdown = () =>
            document
                .$$('.v-binder-follower-content')
                .filter((e) => e.childElementCount)[0];
        const getCurrentDialog = () =>
            document.$('.mf-modal-dialog__container-content');
    });
})();
