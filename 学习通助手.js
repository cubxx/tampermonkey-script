// ==UserScript==
// @name         学习通网课助手
// @namespace    chaoxing_helper
// @version      0.1
// @description  null
// @author       Cubxx
// @match      https://*.chaoxing.com/*
// @icon         https://mooc.chaoxing.com/favicon.ico
// @require      https://cubxx.github.io/My-Tampermonkey-Script/$tm.js
// @grant        none
// ==/UserScript==

(function () {
    //自动下一节
    $tm.urlFunc(/mycourse\/studentstudy/, () => {
        $tm.onload = () => {
            const lis = document.getElementsByClassName('posCatalog_select'); //右侧菜单所有元素
            let c = lis.length;
            //选择任务点
            for (let i = 0; i < lis.length; i++) {
                if (lis[i].childElementCount == 3 && lis[i].children[1].value == '2') { c = i; break; } //获取未完成任务点为2
                //if(lis[i].className.includes('posCatalog_active')){ c=i; break;} //获取当前选中
            }
            lis[c].children[0].click();
            //自动向下
            const stop = setInterval(() => {
                const duration = parseInt(sessionStorage.getItem('dur')),
                    time = parseInt(sessionStorage.getItem('time'));
                if ((duration && time >= duration) || lis[c].childElementCount != 3) {
                    //if(c<lis.length && lis[c].childElementCount!=3){
                    c++;
                    (lis[c].childElementCount == 1) && c++;
                    lis[c].children[0].click();
                    sessionStorage.setItem('time', 0);
                }
                lis[c].innerText.includes('直播') && clearInterval(stop);
            }, 5 * 1000); //每5s检查一次
        };
    });

    //视频
    $tm.urlFunc(/ananas\/modules\/video\/index.html\?v=/, () => {
        // window.onerror = () => { return true } //隐藏报错
        let v;
        let duration = 0, n = 0;
        const stop = setInterval(() => {
            v = $('#video_html5_api');
            //播放
            v.play();
            //拉取进度条
            duration = v.duration;
            sessionStorage.setItem('dur', v.duration);
            //v.currentTime = duration;
            //静音
            v.volume = 0;
            //解锁进度条
            const seekbar = videojs.getComponent("SeekBar");
            seekbar.prototype.handleMouseDown = function (c) { seekbar.prototype.__proto__.handleMouseDown.call(this, c); }
            seekbar.prototype.handleMouseMove = function (c) { seekbar.prototype.__proto__.handleMouseMove.call(this, c); }
            seekbar.prototype.handleMouseUp = function (c) { seekbar.prototype.__proto__.handleMouseUp.call(this, c); }
            videojs("video").off("seeked");
            //解锁鼠标
            Ext.apply = function () { };
            //倍数
            videojs("video").playbackRate = function () { return v.playbackRate = 2 };
            if (v && seekbar && !isNaN(duration)) {
                clearInterval(stop);
                // window.v = v;
            }
        }, 2000);
        //倍数控制
        setInterval(() => {
            sessionStorage.setItem('time', v.currentTime);
        }, 5 * 1000);
    });

    //阅读
    $tm.urlFunc(/ztnodedetailcontroller/, () => {
        const data = $('script')[39].innerHTML.match(/data = {([\s\S]*?)height/)[1].replace(/[\t\n\s]*/g, '').split(',').slice(0, 2).map(e => { return e.split(':')[1].slice(1, -1) })
        const ctid = data[1];
        setInterval(() => {
            setSetting({
                resourceID: data[0] + "," + ctid,
                resourceType: "special",
                from: 0,
                passportUID: getCookie("_uid"),
                t: window["t-" + ctid],
                token: window["token-" + ctid],
            })
        }, 10 * 1000);
    });

    //直播
    $tm.urlFunc(/zhibo.chaoxing.com/, () => {
        alert('脚本加载完成'); //进度https://mooc1.chaoxing.com/ananas/live/liveinfo
        //解除拖拽
        player.currentTime(myVid.duration);
        //记录时间
        let n = 0;
        setInterval(() => {
            $.ajax({
                url: "https://zhibo.chaoxing.com/saveTimePc",
                type: "get",
                data: {
                    "streamName": streamName,
                    "vdoid": vdoid,
                    "userId": userId,
                    "isStart": 1,
                    "t": new Date().getTime(),
                    "courseId": courseId
                },
                success: function () { }
            });
            n++;
            if (n % 2 == 0) {
                console.clear();
                console.log('已观看 ' + n / 2 + ' 分钟');
            }
        }, 30 * 1e3);
    });

    //课程
    $tm.urlFunc(/mycourse\/stu/, () => {
        //设置子页面
        !function (arr) {
            let sub = '章节';
            arr.forEach(([reg, text]) => reg.test(document.title) && (sub = text));
            $(`#boxscrollleft .stuNavigationList ul li a[title=${sub}]`).click();
        }([
            [/统计/, '作业'],
        ]);
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
