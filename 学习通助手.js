// ==UserScript==
// @name         学习通网课助手
// @namespace    chaoxing_helper
// @version      0.1
// @description  null
// @author       Cubxx
// @match      https://*.chaoxing.com/*
// @icon         https://mooc.chaoxing.com/favicon.ico
// @require      https://github.com/Cubxx/My-Tampermonkey-Script/raw/master/%24tm.js
// @updateURL    https://github.com/Cubxx/My-Tampermonkey-Script/raw/master/学习通助手.js
// @downloadURL  https://github.com/Cubxx/My-Tampermonkey-Script/raw/master/学习通助手.js
// @grant        none
// ==/UserScript==

(function () {
    //选择未完成的小节
    $tm.urlFunc(/mycourse\/studentstudy/, () => {
        $tm.onload = () => {
            /**右侧菜单所有未完成小节 */
            const list = $('.posCatalog_select', 1).filter(
                (e) => e.id.startsWith('cur') && !e.$('.icon_Completed'),
            );
            for (var index = 0; index < list.length; index++) {
                if (+list[index].$('input').value === 2) break;
                if (index === list.length - 1) index = 0;
            }
            (self.nextVideo = function (i = index) {
                if (++i < list.length) {
                    list[i].$('.posCatalog_name').click();
                }
            })(index - 1);
        };
    });

    //视频
    $tm.urlFunc(/ananas\/modules\/video\/index.html\?v=/, () => {
        $tm.invokeUntilNoError = () => {
            const videoElm = (top.v = Object.assign($('video#video_html5_api'), {
                autoplay: true,
                muted: true,
                playbackRate: 2, //倍速
                pause() {
                    console.log('阻止暂停执行');
                },
            }));
            videoElm.addEventListener(
                'pause',
                (e) => {
                    videoElm.paused && videoElm.play();
                    e.stopImmediatePropagation();
                    console.log('阻止暂停回调');
                },
                true,
            );
            setTimeout(() => videoElm.play());
            const player = (top.p = videojs.getPlayer(videoElm.playerId));
            player.playbackRate = () => videoElm.playbackRate;
            player.finished = true; //进度条解锁
            Ext.fly(top).un('mouseout'); //鼠标解锁
            player.off('pause'); //防暂停
            $('.ans-timelineobjects').nodeListener(function () {
                this.style.display = 'none';
            }); //隐藏弹窗
            parent.document
                .$('.ans-job-icon')
                .nodeListener(() => top.nextVideo(), { attributes: true }); //完成任务点后下一节
        };
    });

    //章节测验
    $tm.urlFunc(/work\/doHomeWorkNew/, () => {
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
                            const options = (ans.length > 1 ? ans.split('') : [ans]).map((e) =>
                                ({ A, B, C, D }[e].slice(2)),
                            );
                            return [question.slice(6), options + ''];
                        },
                        3: () => {
                            arr.splice(0, 1);
                            return tasks[2]();
                        },
                        2: () => {
                            const [question, answer] = arr;
                            return [question.slice(6), answer.replace('我的答案：', '')];
                        },
                        1: () => [null, null],
                    };
                    return tasks[arr.length]();
                }),
            );
        }
        /**
         * key 为题目，value 为答案
         * @type {Map<string, string>}
         */
        const answerMap = (top.answerMap ??= parse());
        function addTip(e, text, color) {
            e.innerHTML += `<span style="color:${color};padding-left: 20px;">${text}</span>`;
        }
        function answer(question, options) {
            const ans =
                answerMap.get(question) ?? addTip(options[0].parentElement, '找不到题目', 'red');
            for (const e of options) {
                const a = e.$('a');
                if (ans?.includes(a.innerText)) {
                    e.click();
                    addTip(a, '找到答案', 'green');
                }
            }
        }
        document
            .$('form .singleQuesId', 1)
            .forEach((e) => answer(e.$('.fontLabel').innerText.split('\n')[1], e.$('li', 1)));
        requestIdleCallback(() => location.reload());
    });

    //阅读
    $tm.urlFunc(/ztnodedetailcontroller/, () => {
        window.onblur = null;
        Object.defineProperty(document, 'hidden', {
            get() {
                return false;
            },
        });
        const initTime = Date.now();
        let i = 0;
        setInterval(() => {
            scrollTo(0, Math.random() * window.innerHeight);
            i++;
            if (i > 12) {
                i = 0;
                console.log(`已阅读 ${((Date.now() - initTime) / 6e4).toFixed(2)} 分钟`);
            }
        }, 5e3);
        requestIdleCallback(() => location.reload());
    });

    //直播
    $tm.urlFunc(/zhibo.chaoxing.com/, () => {
        if (self !== top) return;
        console.info = () => {};
        myVid.volume = 0;
        player.on('play', () => {
            progressNotReached = false;
            player.pause();
        });
        //上传时间
        let n = 0;
        setInterval(() => {
            jQuery.ajax({
                url: './saveTimePc',
                type: 'get',
                data: {
                    streamName,
                    vdoid,
                    userId,
                    isStart: 1,
                    t: Date.now(),
                    courseId,
                },
                success() {},
            });
            n++;
            if (n % 2 == 0) {
                console.log(`已观看 ${n / 2} 分钟`);
            }
        }, 3e4);
        //获取进度
        self.progressUrl =
            'https://mooc1.chaoxing.com/ananas/live/liveinfo?' +
            new URLSearchParams({
                liveid: liveId,
                userid: userId,
                clazzid: classId,
                knowledgeid: knowledgeId,
                courseid: courseId,
                jobid: jobId,
                ut: 's',
                callback: 'getPercentValue',
            }).toString();
        // self.getPercentValue = function (data) {
        //     const p = data.temp.data.percentValue;
        //     console.log('已观看百分比：', p);
        //     if (p >= 90) self.close();
        // };
        // setInterval(function () {
        //     document.$('#jsonp')?.remove();
        //     document.head.appendChild(
        //         Object.assign(document.createElement('script'), {
        //             id: 'jsonp',
        //             src: self.progressUrl,
        //         }),
        //     );
        // }, 5 * 6e4);
    });

    //课程
    $tm.urlFunc(/mycourse\/stu/, () => {
        $(`#boxscrollleft .stuNavigationList ul li a[title=章节]`)?.click();
    });

    //作业
    $tm.urlFunc(/work\/dowork/, () => {
        $('#submitForm').appendChild(
            $tm.addElms({
                arr: [
                    {
                        tag: 'input',
                        type: 'button',
                        value: '复制',
                        style: `position: absolute;top: 0;`,
                        onclick() {
                            let text = [
                                ...$(
                                    `#submitForm>div h2,.questionLi>*:not(.stem_answer,:empty)`,
                                    1,
                                ),
                            ]
                                .map((e) => e.innerText.replace(/\n+/g, '\n'))
                                .join('');
                            navigator.clipboard.writeText(text).then((e) => $tm.tip('复制成功'));
                        },
                    },
                ],
            })[0],
        );
    });

    //资料
    $tm.urlFunc(/ueditorupload\/read/, () => {
        $('.mainCon,#reader,#reader>iframe', 1).forEach(
            (e) => (e.style = 'width:90%;text-align:center;'),
        );
        $('#reader>iframe').height = 1e4 + 'px';
        $('#reader>iframe').nodeListener(
            function () {
                this.style.height = '';
            },
            { attributes: true },
        );
    });
    $tm.urlFunc(/ananas\/modules\/pdf/, () => {
        $('#docContainer').style = 'height:100%;';
        $('#docContainer').nodeListener((e) => {
            $('#img').style = 'height:100%;';
        });
    });
})();
