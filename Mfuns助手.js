// ==UserScript==
// @name         Mfuns助手
// @namespace    mfuns_helper
// @version      0.1
// @description  用于提升网站体验
// @author       Cubxx
// @include      /https\:\/\/(www|m)\.mfuns\.net\//
// @require      https://github.com/Cubxx/My-Tampermonkey-Script/raw/master/%24tm.js
// @icon         https://m.kms233.com/static/icon/icon.png
// @grant        none
// ==/UserScript==

(function () {
    // 签到
    !async function () {
        const signKey = '上次签到时间';
        if (localStorage.getItem(signKey) == new Date().toDateString()) {
            // $tm.tip('今日已签到');
            return;
        }
        await $tm.libs.axios.use();
        axios.get('https://api.mfuns.net/v1/sign/sign', {
            headers: {
                'Authorization': decodeURIComponent(document.cookie.match(/(access|mfuns)_token=([^;]+)/)[2])
            }
        }).then(res => {
            localStorage.setItem(signKey, new Date().toDateString());
            console.log('签到 ', res);
            $tm.tip('签到成功');
        }, err => {
            console.log('签到 ', err);
            $tm.tip('签到失败');
        });
    }();
    // 网页端播放视频
    $tm.urlFunc(/m.mfuns.net\/video/, () => {
        $('.v-window__container .text-h6').onclick = function () {
            location.host = 'www.mfuns.net';
        };
    });
    // 视频搬运工具
    $tm.urlFunc(/www.mfuns.net\/create\/video/, () => {
        const bv_api = 'https://video_api.kms233.com/bili/';
        const _main = main.debounce(1e3);
        window.addEventListener('message', e => {
            if (e.origin == 'https://www.bilibili.com') {
                console.log('收到信号', e.data);
                _main(e.data);
                e.source.postMessage('mfuns get', e.origin); //发送回应信号                
            }
        });
        // fns
        async function main({ bvid, desc, pic, title, copyright, owner_name }) {
            const [formElm, uploadElm] = $('.mf-create-video').children;
            formElm[0].value = title;
            formElm[0].dispatchEvent(new InputEvent("input"));
            formElm[3].click();
            formElm.$('div[contenteditable=true]').textContent = (copyright == 1 ? [bvid, `作者：${owner_name}`] : []).concat(desc).join('\n');
            formElm[1].click();
            await setDialog(pic.replace('http://', 'https://'));
            uploadElm.$('button').click();
            await setDialog(title, bv_api + bvid);
        }
        async function setDialog(...args) {
            // 下拉框
            const dropdown = await getElmUntilNoError(getCurrentDropdown);
            dropdown.$('.n-dropdown-option-body', 1).filter(e => e.innerText == '网络链接')[0].click();
            // dialog
            const content = await getElmUntilNoError(getCurrentDialog);
            content.$('input', 1).map((e, i) => {
                e.value = args[i];
                e.dispatchEvent(new InputEvent("input"));
            });
            const btn = content.$('button', 1).filter(e => e.innerText != '取消')[0];
            btn.click();
            btn.parentElement.nodeListener(list => {
                list.forEach(({ addedNodes }) => {
                    addedNodes.forEach(e => e.click());
                });
                return 1;
            }, { childList: true });
            await waitFnUntilTimeout(() => {
                if (getCurrentDialog()) throw '未关闭dialog';
            }, 30);
        }
        function waitFnUntilTimeout(fn, maxCount = 10) {
            let count = 0;
            return new Promise((resolve, reject) => {
                $tm.invokeUntilNoError = () => {
                    if (count > maxCount) return reject('执行超时');
                    count++;
                    resolve(fn());
                };
            });
        }
        function getElmUntilNoError(fn) {
            return new Promise(resolve => {
                $tm.invokeUntilNoError = () => {
                    const elm = fn();
                    if (elm) resolve(elm);
                    else throw fn.name + '无法获取元素';
                };
            });
        }
        const getCurrentDropdown = () => $('.v-binder-follower-content', 1).filter(e => e.childElementCount)[0];
        const getCurrentDialog = () => $('.mf-modal-dialog__container-content');
    });
})();
