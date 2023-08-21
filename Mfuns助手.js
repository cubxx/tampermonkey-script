// ==UserScript==
// @name         Mfuns助手
// @namespace    mfuns_helper
// @version      0.1
// @description  用于提升网站体验
// @author       Cubxx
// @include      /https\:\/\/www\.mfuns\.[a-zA-Z]+\//
// @require      https://cubxx.github.io/My-Tampermonkey-Script/$tm.js
// @require      file:///D:/Learn/JavaScript/My-Tampermonkey-Script/Mfuns%E5%8A%A9%E6%89%8B.js
// @icon         https://m.kms233.com/static/icon/icon.png
// @grant        none
// ==/UserScript==

(async function () {
    // 搬运工具
    !async function () {
        //创建输入框
        const [inp, btn] = $tm.addElms({
            arr: [{
                tag: 'input',
                id: 'inpvid',
                placeholder: '  输入av/BV号...',
                maxLength: '12',
                style: `position:fixed; top:0; left:0; width:110px; height:20px; border:none; padding-bottom:40px; z-index:9999; background-color:#0000; opacity:0.5;`,
                oninput() { //防抖
                    const _this = this;
                    this.stop && clearTimeout(this.stop);
                    this.stop = setTimeout(() => {
                        config = undefined;
                        vid = _this.value;
                        //jsonp跨源 通过vid 请求接口
                        const res = checkVid(vid);
                        if (res.isAv || res.isBv) {
                            //检查vid格式
                            const vid_code = res.isAv ? '&aid=' + vid.slice(2) :
                                res.isBv ? '&bvid=' + vid : '';
                            //更新script标签的src
                            script_elm?.remove();
                            script_elm = addScriptElm(`${bv_data_api}${vid_code}&callback=_callback`);
                            state = 1;
                        }
                    }, 500);
                }
            }, {
                tag: 'input',
                id: 'inpok',
                type: 'button',
                value: '开冲',
                style: `position:fixed; top:20px; left:0;  width:110px; height:20px; border:none; z-index:9999; background-color:#0003; opacity:0.5;`,
                onclick() {
                    //根据config 写入上传信息
                    const elm = $('.jinsom-publish-words-bar');
                    if (!elm && config) {
                        if (config.code !== 0) alert(config.message + '\ncode:' + config.code);
                        else {
                            jinsom_publish_power('video'); //环境函数 打开上传界面
                            const stop = setInterval(() => {
                                writeVideoInfo(config) && clearInterval(stop), (state = 2);
                            }, 100);
                        }
                    } else alert('输入有误\nav号长度应小于13\nbv号长度应为12');
                }
            }]
        }).map(e => document.body.appendChild(e));

        //根据vid自动写入 跨源
        const bv_api = 'https://video_api.kms233.com/bili/',
            bv_data_api = 'https://api.bilibili.com/x/web-interface/view?jsonp=jsonp';
        let script_elm, config, vid = '';
        window._callback = function (res) { //json回调函数 将响应写入config
            config = res;
            if (config.data) {
                config.data.url = bv_api + vid;
                config.data.content = 'Bili: https://www.bilibili.com/video/' + vid;
            }
        }

        //监听bilivideo传入信号
        var state = 0;
        window.addEventListener('message', e => {
            if (e.origin == 'https://www.bilibili.com') {
                console.log('收到信号', e.data);
                switch (state) {
                    case 0: {
                        inp.value = e.data;
                        inp.oninput();
                        break;
                    }
                    case 1: btn.onclick(); break;
                    case 2: e.source.postMessage('OK', e.origin); break; //发送回应信号
                }
            }
        });

        //vid格式检查
        function checkVid(vid) {
            let res = { isAv: false, isBv: false }
            if (vid.slice(0, 2) == 'av' && vid.length <= 12) res.isAv = true;
            else if (/[bv,BV,Bv,bV]/.test(vid.slice(0, 2)) && vid.length == 12) res.isBv = true;
            return res
        }
        //通过src 创建script标签
        function addScriptElm(src) {
            console.log('创建script成功', src);
            return document.body.appendChild(Object.assign(document.createElement('script'), {
                src: src,
                onerror() { alert('bilibiil api 失效') }
            }));
        }
        //写入上传信息
        function writeVideoInfo(config) {
            const elm = $('.jinsom-publish-words-bar');
            if (elm) {
                const url = $('#jinsom-video-url'),
                    pic = $('#jinsom-video-img-url'),
                    title = $('#jinsom-pop-title') || (elm.children[0].click(), $('#jinsom-pop-title')),
                    content = $('#jinsom-pop-content');

                if (url && pic && title && content) { //界面元素加载完成
                    url.value = config.data.url;
                    pic.value = config.data.pic;
                    title.value = config.data.title;
                    content.value = config.data.content;
                    $('.jinsom-publish-words-topic').innerHTML = '<span data="#搬运#">##搬运##</span>';

                    if (url.value && pic.value && title.value && content.value) { //全部写入后
                        console.log(config.data);
                        return true
                    }
                } else debugger;
            } else return false;
        }
    }();
})();
