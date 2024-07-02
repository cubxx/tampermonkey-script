// ==UserScript==
// @name         学习通助手
// @version      0.1
// @author       Cubxx
// @match        https://*.chaoxing.com/*
// @icon         https://www.chaoxing.com/images/favicon.ico
// @updateURL    https://github.com/Cubxx/tampermonkey-script/raw/main/src/chaoxing-helper.user.js
// @downloadURL  https://github.com/Cubxx/tampermonkey-script/raw/main/src/chaoxing-helper.user.js
// @grant        none
// ==/UserScript==

(function () {
    const { Dom, ui, util } = tm;
    const doc = new Dom(document);

    //选择未完成的小节
    tm.matchURL(/mycourse\/studentstudy/, () => {
        window.addEventListener('load', () => {
            /** 右侧菜单所有未完成小节 */
            const list = doc
                .$$('.posCatalog_select')
                .filter(
                    (e) => e.el.id.startsWith('cur') && !e.$('.icon_Completed'),
                );
            for (var index = 0; index < list.length; index++) {
                if (+(list[index].$('input')?.el.value ?? 0) === 2) break;
                if (index === list.length - 1) index = 0;
            }
            (self['nextVideo'] = function (i = index) {
                if (++i < list.length) {
                    list[i].$('.posCatalog_name')?.el.click();
                }
            })(index - 1);
        });
    });

    //视频
    tm.matchURL(/ananas\/modules\/video\/index.html\?v=/, () => {
        function main() {
            if (!top) return;
            const videoDom = doc.$('video#video_html5_api');
            if (!videoDom) return;
            top['v'] = Object.assign(videoDom, {
                autoplay: true,
                muted: true,
                playbackRate: 2, //倍速
                pause() {
                    console.log('阻止暂停执行');
                },
            });
            videoDom.on(
                'pause',
                (e) => {
                    videoDom.el.paused && videoDom.el.play();
                    e.stopImmediatePropagation();
                    console.log('阻止暂停回调');
                },
                true,
            );
            setTimeout(() => videoDom.el.play());
            const player = (top['p'] = window['videojs'].getPlayer(
                videoDom.el['playerId'],
            ));
            player.playbackRate = () => videoDom.el.playbackRate;
            player.finished = true; //进度条解锁
            window['Ext'].fly(top).un('mouseout'); //鼠标解锁
            player.off('pause'); //防暂停
            //隐藏弹窗
            const el = doc.$('.ans-timelineobjects');
            el?.observe(() => el.hide(), { childList: true, subtree: true });
            //完成任务点后下一节
            const btn = new Dom(parent.document).$('.ans-job-icon');
            btn?.observe(() => top?.['nextVideo'](), { attributes: true });
        }
        main();
    });

    //章节测验
    tm.matchURL(/work\/doHomeWorkNew/, () => {
        function parse() {
            const text = '这里应该为答案';
            return new Map(
                text.split('\n\n').map((e) => {
                    const arr = e.split('\n');
                    const tasks = {
                        7: () => {
                            arr.splice(0, 1);
                            return tasks[6]();
                        },
                        6: () => {
                            const [question, A, B, C, D, answer] = arr;
                            const ans = answer.replace('我的答案：', '');
                            const options = (
                                ans.length > 1 ? ans.split('') : [ans]
                            ).map((e) => ({ A, B, C, D })[e].slice(2));
                            return [question.slice(6), options + ''];
                        },
                        3: () => {
                            arr.splice(0, 1);
                            return tasks[2]();
                        },
                        2: () => {
                            const [question, answer] = arr;
                            return [
                                question.slice(6),
                                answer.replace('我的答案：', ''),
                            ];
                        },
                        1: () => [null, null],
                    };
                    return tasks[arr.length]();
                }),
            );
        }
        if (!top) return;
        /**
         * Key 为题目，value 为答案
         *
         * @type {Map<string, string>}
         */
        const answerMap = (top['answerMap'] ??= parse());
        function addTip(e, text, color) {
            e.innerHTML += `<span style="color:${color};padding-left: 20px;">${text}</span>`;
        }
        function answer(question, options) {
            const ans =
                answerMap.get(question) ??
                addTip(options[0].parentElement, '找不到题目', 'red');
            for (const e of options) {
                const a = e.$('a');
                if (ans?.includes(a.innerText)) {
                    e.click();
                    addTip(a, '找到答案', 'green');
                }
            }
        }
        doc.$$('form .singleQuesId').forEach((e) =>
            answer(e.$('.fontLabel')?.el.innerText.split('\n')[1], e.$$('li')),
        );
        requestIdleCallback(() => location.reload());
    });

    //阅读
    tm.matchURL(/ztnodedetailcontroller/, () => {
        window.onblur = null;
        Object.defineProperty(document, 'hidden', {
            get: () => false,
        });
        const initTime = Date.now();
        let i = 0;
        setInterval(() => {
            scrollTo(0, Math.random() * window.innerHeight);
            i++;
            if (i > 12) {
                i = 0;
                console.log(
                    `已阅读document.${((Date.now() - initTime) / 6e4).toFixed(2)} 分钟`,
                );
            }
        }, 5e3);
        requestIdleCallback(() => location.reload());
    });

    //直播
    tm.matchURL(/zhibo.chaoxing.com/, () => {
        if (self !== top) return;
        console.info = () => {};
        window['myVid'].volume = 0;
        window['player'].on('play', () => {
            window['progressNotReached'] = false;
            window['player'].pause();
        });
        //上传时间
        let n = 0;
        setInterval(() => {
            window['jQuery'].ajax({
                url: './saveTimePc',
                type: 'get',
                data: {
                    streamName: window['streamName'],
                    vdoid: window['vdoid'],
                    userId: window['userId'],
                    isStart: 1,
                    t: Date.now(),
                    courseId: window['courseId'],
                },
                success() {},
            });
            n++;
            if (n % 2 == 0) {
                console.log(`已观看document.${n / 2} 分钟`);
            }
        }, 3e4);
        //获取进度
        self['progressUrl'] =
            'https://mooc1.chaoxing.com/ananas/live/liveinfo?' +
            new URLSearchParams({
                liveid: window['liveId'],
                userid: window['userId'],
                clazzid: window['classId'],
                knowledgeid: window['knowledgeId'],
                courseid: window['courseId'],
                jobid: window['jobId'],
                ut: 's',
                callback: 'getPercentValue',
            });
    });

    //课程
    tm.matchURL(/mycourse\/stu/, () => {
        doc.$(`#boxscrollleft .stuNavigationList ul li`)
            ?.$('a[title=章节]')
            ?.el.click();
    });

    //作业
    tm.matchURL(/work\/dowork/, () => {
        Dom.h('input', {
            type: 'button',
            value: '复制',
            style: { position: 'absolute', top: 0 },
            onclick() {
                let text = [
                    ...doc.$$(
                        `#submitForm>div h2,.questionLi>*:not(.stem_answer,:empty)`,
                    ),
                ]
                    .map((e) => e.el.innerText.replace(/\n+/g, '\n'))
                    .join('');
                navigator.clipboard
                    .writeText(text)
                    .then((e) => ui.snackbar.show('复制成功'));
            },
        }).mount('#submitForm');
    });

    //资料
    tm.matchURL(/ueditorupload\/read/, () => {
        doc.$$(
            /** @type {string} */ ('.mainCon,#reader,#reader>iframe'),
        ).forEach((e) =>
            e.set({
                style: {
                    width: '90%',
                    textAlign: 'center',
                },
            }),
        );
        const dom = doc.$('#reader')?.$('iframe');
        if (!dom) return;
        dom.set({ style: { height: 1e4 + 'px' } });
        dom.observe(
            () => {
                dom.set({ style: { height: '' } });
            },
            { attributes: true },
        );
    });
    tm.matchURL(/ananas\/modules\/pdf/, () => {
        const dom = doc.$('iframe#docContainer');
        if (!dom) return;
        dom.set({ style: { height: '100%' } });
        dom.observe(
            () => {
                doc.$('#img')?.set({ style: { height: '100%' } });
            },
            { childList: true },
        );
    });
})();
