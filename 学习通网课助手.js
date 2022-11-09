// ==UserScript==
// @name         学习通网课助手
// @namespace    https://github.com/cubxx
// @version      0.1
// @description  I'm lazy dog
// @author       Cubxx
// @match      https://*.chaoxing.com/*
// @icon         https://mooc.chaoxing.com/favicon.ico
// @grant        none
// ==/UserScript==

(function () {
    //自动下一节
    if (document.URL.includes('mycourse/studentstudy?')) {
        window.onload = () => {
            let lis = document.getElementsByClassName('posCatalog_select'); //右侧菜单所有元素
            let c = lis.length;
            for (let i = 0; i < lis.length; i++) {
                if (lis[i].childElementCount == 3 && lis[i].children[1].value == '1') { c = i; break; } //获取第一个未完成任务点
                //if(lis[i].className.includes('posCatalog_active')){ c=i; break;} //获取当前选中任务点
            }
            lis[c].children[0].click();
            let stop = setInterval(() => { //自动向下
                let duration = parseInt(sessionStorage.getItem('dur'));
                let time = parseInt(sessionStorage.getItem('time'));
                if ((duration && time >= duration) || lis[c].childElementCount != 3) {
                    //if(c<lis.length && lis[c].childElementCount!=3){
                    c++;
                    (lis[c].childElementCount == 1) && c++;
                    lis[c].children[0].click();
                    sessionStorage.setItem('time', 0);
                }
                document.getElementById('iframe').contentDocument
                    .getElementsByTagName('iframe')[0].contentDocument
                    .getElementsByClassName('liveCard')[0] && clearInterval(stop);
            }, 5 * 1000); //每5s检查一次
        }
    }

    //控制播放
    if (document.URL.includes('ananas/modules/video/index.html?v=')) {
        window.onerror = () => { return true } //隐藏报错
        let v;
        let duration = 0, n = 0;
        let stop = setInterval(() => {
            v = document.getElementById('video_html5_api');
            //播放
            v.play();
            //拉取进度条
            duration = v.duration;
            sessionStorage.setItem('dur', duration);
            //v.currentTime=duration-10;
            //静音
            v.volume = 0;
            //解锁进度条
            let seekbar = videojs.getComponent("SeekBar");
            seekbar.prototype.handleMouseDown = function (c) {
                seekbar.prototype.__proto__.handleMouseDown.call(this, c);
            }
            seekbar.prototype.handleMouseMove = function (c) {
                seekbar.prototype.__proto__.handleMouseMove.call(this, c);
            }
            seekbar.prototype.handleMouseUp = function (c) {
                seekbar.prototype.__proto__.handleMouseUp.call(this, c);
            }
            videojs("video").off("seeked");
            //解锁鼠标
            Ext.apply = null;
            //解锁倍数
            videojs("video").playbackRate = function () { };

            if (v && seekbar && !isNaN(duration)) {
                clearInterval(stop);
                window.v = v;
            }
        }, 2000);
        //倍数控制
        setInterval(() => {
            sessionStorage.setItem('time', v.currentTime);
            /*if(duration&&duration-10<=v.currentTime){
                v.playbackRate=1;
            }else{ v.playbackRate=4;}*/
        }, 5 * 1000)
    } //*/

    //模拟阅读
    if (document.URL.includes('ztnodedetailcontroller')) {
        let li = document.getElementsByClassName('wh wh'), n = 0;
        window.onblur = null;
        setInterval(() => {
            n++;
            if (0 == n % parseInt(Math.random() * 60 + 60)) { //每1-2min滚动一次
                window.onfocus();
                let a = li[parseInt(Math.random() * li.length)];
                if (a.tagName == 'A' && Math.random() < 0.1) a.click();
                window.scrollTo(0, Math.random() * 10000);
            }
        }, 1000);
    }

    //直播回放
    if (document.URL.includes('zhibo.chaoxing.com') && !document.URL.includes('iframe')) {
        alert('脚本加载完成');
        let n = 0;
        setInterval(() => {
            $.ajax({ //直播2
                url: "https://zhibo.chaoxing.com/saveTimePc",
                type: "get",
                data: {
                    "streamName": 'LIVENEW2B7266W1vdoid14590138181722',
                    "vdoid": 'vdoid14590138181722',
                    "userId": userId,
                    "isStart": 1,
                    "t": new Date().getTime(),
                    "courseId": courseId
                },
                success: function (data) { }
            });
            $.ajax({ //直播1
                url: "https://zhibo.chaoxing.com/saveTimePc",
                type: "get",
                data: {
                    "streamName": 'LIVENEW12n520oOvdoid14590128F3P5Q5',
                    "vdoid": 'vdoid14590128F3P5Q5',
                    "userId": userId,
                    "isStart": 1,
                    "t": new Date().getTime(),
                    "courseId": courseId
                },
                success: function (data) { }
            });
            n++;
            if (n % 2 == 0) {
                console.clear();
                console.log('已观看 ' + n / 2 + ' 分钟');
            }
        }, 30 * 1000);
    }//*/
})();