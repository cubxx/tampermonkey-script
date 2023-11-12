// ==UserScript==
// @name         学习通网课助手
// @namespace    chaoxing_helper
// @version      0.1
// @description  null
// @author       Cubxx
// @match      https://*.chaoxing.com/*
// @icon         https://mooc.chaoxing.com/favicon.ico
// @require      https://github.com/Cubxx/My-Tampermonkey-Script/raw/master/%24tm.js
// @grant        none
// ==/UserScript==

(function () {
    //选择未完成的视频
    $tm.urlFunc(/mycourse\/studentstudy/, () => {
        $tm.onload = () => {
            const list = $('.posCatalog_select', 1).filter(e => e.id.slice(0, 3) === 'cur'); //右侧菜单所有小节
            let cur;
            for (let i = 0; i < list.length; i++) {
                //选择未完成的
                if (list[i].$('input')?.value === '1') {
                    cur = i - 1;
                    break;
                }
            }
            self.nextVideo = function () {
                cur++;
                if (cur < list.length) {
                    list[cur].$('.posCatalog_name').click();
                }
            };
            self.nextVideo();
        };
    });

    //视频
    $tm.urlFunc(/ananas\/modules\/video\/index.html\?v=/, () => {
        $tm.invokeUntilNoError = async () => {
            const videoElm = Object.assign($('video#video_html5_api'), {
                autoplay: true,
                muted: true,
                volume: 0
            });
            await videoElm.play();
            const player = videojs.getPlayer(videoElm.playerId);
            player._v = videoElm;
            player.playbackRate = () => videoElm.playbackRate;
            player.off('seeked'); //进度条解锁
            Ext.fly(top).un('mouseout'); //鼠标解锁
            Ext.fly(top).on('visibilitychange', e => { //切换页面继续播放
                setTimeout(() => {
                    if (player.paused()) {
                        player.play();
                        console.log('切换页面继续播放');
                    }
                }, 1e2);
            });
            $('.ans-timelineobjects').style.display = 'none';
            $('.ans-timelineobjects').nodeListener(() => player.play()); //回答问题时继续播放
            parent.document.$('.ans-job-icon').nodeListener(() => top.nextVideo(), { attributes: true }); //完成任务点后下一节
            // player.options_.plugins.seekBarControl.sendLog(player, 'playing', videoElm.duration.toFixed(0) - 1, player.seekBarControl());
            top._p = player;
        };
    });

    //章节测验
    $tm.urlFunc(/work\/doHomeWorkNew/, () => {
        document.designMode = 'on';
    });

    //阅读
    $tm.urlFunc(/ztnodedetailcontroller/, () => {
        const initTime = +new Date();
        window.onblur = null;
        setInterval(() => {
            scrollTo(0, Math.random() * window.innerHeight);
            window.onfocus();
            console.log('已阅读 ' + ((+new Date() - initTime) / 6e4).toFixed(2) + ' 分钟');
        }, 5e3);
    });

    //直播
    $tm.urlFunc(/zhibo.chaoxing.com/, () => {
        if (self !== top) {
            return;
        }
        console.info = () => { };
        myVid.volume = 0;
        player.on('play', () => progressNotReached = false);
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
                    t: +new Date(),
                    courseId,
                },
                success() { }
            });
            n++;
            if (n % 2 == 0) {
                console.log('已观看 ' + n / 2 + ' 分钟');
            }
        }, 3e4);
        //获取进度
        self.progressUrl = 'https://mooc1.chaoxing.com/ananas/live/liveinfo?' + new URLSearchParams({
            liveid: liveId,
            userid: userId,
            clazzid: classId,
            knowledgeid: knowledgeId,
            courseid: courseId,
            jobid: jobId,
            ut: 's',
        });
    });

    //课程
    $tm.urlFunc(/mycourse\/stu/, () => {
        $(`#boxscrollleft .stuNavigationList ul li a[title=章节]`)?.click();
    });

    //作业
    $tm.urlFunc(/work\/dowork/, () => {
        $('#submitForm').appendChild($tm.addElms({
            arr: [{
                tag: 'input', type: 'button', value: '复制', style: `position: absolute;top: 0;`, onclick() {
                    let text = [...$(`#submitForm>div h2,.questionLi>*:not(.stem_answer,:empty)`, 1)].map(e => e.innerText.replace(/\n+/g, '\n')).join('');
                    navigator.clipboard.writeText(text).then(e => $tm.tip('复制成功'));
                }
            }]
        })[0]);
    });

    //资料
    $tm.urlFunc(/ueditorupload\/read/, () => {
        $('.mainCon,#reader,#reader>iframe', 1).forEach(e => e.style = 'width:90%;text-align:center;');
        $('#reader>iframe').height = 1e4 + 'px';
        $('#reader>iframe').nodeListener(function () { this.style.height = ''; }, { attributes: true });
    });
    $tm.urlFunc(/ananas\/modules\/pdf/, () => {
        $('#docContainer').style = 'height:100%;';
        $('#docContainer').nodeListener(e => { $('#img').style = 'height:100%;' });
    });
})();
