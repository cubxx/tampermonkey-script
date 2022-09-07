// ==UserScript==
// @name         Mfuns助手
// @namespace    https://github.com/cubxx
// @version      0.1
// @description  输入正确的vid后自动打开投稿界面
// @author       Cubxx
// @include        /^https\:\/\/www\.mfuns\.[a-zA-Z]*\/$/
// @require
// @icon         https://m.kms233.com/static/icon/icon.png
// @grant        none
// ==/UserScript==

window.onload = function () {
    //自动签到
    var sign=document.getElementsByClassName('sign opacity')[0];
    if(sign.className=='sign opacity'){ sign.click(); document.getElementsByClassName('layui-layer-ico layui-layer-close layui-layer-close2')[0].click(); }
    //删除右下角气泡
    var del = setInterval(function () {
        var elm = document.getElementById('jinsom-plugin-barrage');
        if (elm) { elm.remove(); clearInterval(del) }
    }, 100) //*/

    var inp = document.createElement('input'); //输入框
    inp.id = 'inpbv'; inp.placeholder = '  输入av/BV号...'; inp.maxLength = '12';
    inp.onclick = () => { inp.style.opacity = inp.style.opacity == 0 ? 0.5 : 0; btn.style.opacity = btn.style.opacity == 0 ? 0.5 : 0; };
    inp.style = 'position:fixed; top:0; left:0; width:110px; height:20px; border:none; padding-bottom:40px; z-index:9999; background-color:#0000; opacity:0.5;';
    document.body.appendChild(inp);
    var btn = document.createElement('input'); //提交
    btn.id = 'inpok';
    btn.type = 'button'; btn.value = '开冲';
    btn.style = 'position:fixed; top:20px; left:0;  width:110px; height:20px; border:none; z-index:9999; background-color:#0003; opacity:0.5;';
    document.body.appendChild(btn);

    var open_count = 0;
    //监听bilivideo传入信号
    window.addEventListener('message', (e) => { //e.origin = https://www.bilibili.com
        if(e.origin == 'https://www.bilibili.com'){
            if (open_count == 0) {
                inp.value = e.data;
                inp.oninput(); //请求bilivideo api
            }
            auto_write(res);
            if (open_count == 2) e.source.postMessage('right', e.origin); //发送回应信号
        }
    });

    //根据填写vid自动写入 （实现跨源）
    var api = 'https://video_api.kms233.com/bili/',
        bilivideo = 'https://api.bilibili.com/x/web-interface/view?jsonp=jsonp&';
    function addScript(src) { //通过src 创建script
        var script = document.createElement('script');
        script.src = src;
        script.onerror = function () { open_count = 2; alert('bilibiil api 失效') }
        document.body.appendChild(script);
        console.log('请求bili api')
        return script;
    }

    var script_tag, res, vid = '';
    inp.oninput = function () { //json跨源 通过vid 请求接口 写入res
        vid = inp.value;
        script_tag ? script_tag.remove() : undefined;
        if ((vid.slice(0, 2) == 'av' && vid.length <= 12) ||
            (/[bv,BV,Bv,bV]/.test(vid.slice(0, 2)) && vid.length == 12)) {
            window.get = r => {
                res = r;
                if (r.data) {
                    res.data.url = api + vid;
                    res.data.content = 'Bili: https://www.bilibili.com/video/' + vid;
                }
            }
            var arg;
            if (vid.slice(0, 2) == 'av') arg = 'aid=' + vid.slice(2);
            else if (/[bv,BV,Bv,bV]/.test(vid.slice(0, 2))) arg = 'bvid=' + vid;
            else { alert('vid格式错误'); }
            script_tag = addScript(bilivideo + arg + "&callback=get");
        } else { res = undefined; }
    }
    btn.onclick = function () { //通过res 调用auto_write
        var elm = document.getElementsByClassName('jinsom-publish-words-bar')[0];
        if (!elm) {
            if (res) {
                open_count = 0; //初始化参数
                if (res.code !== 0) alert(res.message + '\ncode:' + res.code);
                else {
                    btn.value = '载入中...';
                    var stop = setInterval(() => {
                        auto_write(res);
                        if (open_count == 2) clearInterval(stop);
                    }, 100)
                    }
            } else alert('输入有误\nav号长度应小于13\nbv号长度应为12');
        }
    }

    //根据对象e 自动写入信息 //需要多次执行
    function auto_write(e) {
        var elm = document.getElementsByClassName('jinsom-publish-words-bar')[0];
        if (elm) { //界面加载完成
            var url = document.getElementById('jinsom-video-url'),
                img = document.getElementById('jinsom-video-img-url'),
                title = document.getElementById('jinsom-pop-title'),
                content = document.getElementById('jinsom-pop-content');
            if (!title) elm.children[0].click();

            if (url && img && title && content) { //界面元素加载完成
                if (!url.value) url.value = e.data.url; //写入视频链接
                if (!img.value) img.value = e.data.pic; //写入封面链接
                if (!title.value) title.value = e.data.title; //写入标题
                if (!content.value) content.value = e.data.content; //写入简介
                document.getElementsByClassName('jinsom-publish-words-topic pop')[0].innerHTML = '<span data="#搬运#">##搬运##</span>';

                if (url.value && img.value && title.value && content.value) { //全部写入后
                    if (open_count == 1) { //仅执行一次
                        console.log(e.data);
                        btn.value = '开冲';
                        open_count++;
                        return 'right';
                    }
                }
            }
        } else {
            var opn = document.getElementsByClassName('fa-toggle-right')[0];
            if (opn && open_count == 0) { opn.click(); open_count++; } //打开一次界面
        }
    }
}
