// ==UserScript==
// @name         全局功能
// @namespace    https://github.com/cubxx
// @version      0.1
// @description  设计模式开关 广告隐藏
// @author       Cubxx
// @include    *
// @exclude   file:///*
// @exclude   https://cubxx.github.io/*
// @exclude   http://127.0.0.1:*/*
// @icon         data:image/svg+xml,%3C?xml version='1.0' encoding='utf-8'?%3E%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Cg id='XMLID_273_'%3E%3Cg id='XMLID_78_'%3E%3Cpath id='XMLID_83_' class='st0' d='M304.8,0H95.2C42.6,0,0,42.6,0,95.2v209.6C0,357.4,42.6,400,95.2,400h209.6 c52.6,0,95.2-42.6,95.2-95.2V95.2C400,42.6,357.4,0,304.8,0z M106.3,375C61.4,375,25,338.6,25,293.8c0-44.9,36.4-81.3,81.3-81.3 c44.9,0,81.3,36.4,81.3,81.3C187.5,338.6,151.1,375,106.3,375z M293.8,375c-44.9,0-81.3-36.4-81.3-81.3 c0-44.9,36.4-81.3,81.3-81.3c44.9,0,81.3,36.4,81.3,81.3C375,338.6,338.6,375,293.8,375z'/%3E%3C/g%3E%3Cg id='XMLID_67_' class='st2'%3E%3Cpath id='XMLID_74_' class='st3' d='M304.8,0H95.2C42.6,0,0,42.6,0,95.2v209.6C0,357.4,42.6,400,95.2,400h209.6 c52.6,0,95.2-42.6,95.2-95.2V95.2C400,42.6,357.4,0,304.8,0z M106.3,375C61.4,375,25,338.6,25,293.8c0-44.9,36.4-81.3,81.3-81.3 c44.9,0,81.3,36.4,81.3,81.3C187.5,338.6,151.1,375,106.3,375z M293.8,375c-44.9,0-81.3-36.4-81.3-81.3 c0-44.9,36.4-81.3,81.3-81.3c44.9,0,81.3,36.4,81.3,81.3C375,338.6,338.6,375,293.8,375z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E
// @grant        none
// ==/UserScript==

(function () {
    if (self === top) { //不添加在iframe中
        let _mmove = document.onmousemove || function () { };
        let hidd_left = -95;
        let elm = {
            style: 'padding:0;border:none;width:auto;height:35px;color:#fff;background-color:#fff0;font:bold 17px/20px caption;',
            onmousedown: function (e) {
                let _this = this;
                var ex = e.clientX, ey = e.clientY,
                    px = parseFloat(window.getComputedStyle(this).left),
                    py = parseFloat(window.getComputedStyle(this).top);
                var dx = px - ex, dy = py - ey;
                document.onmousemove = function (e) {
                    var ex = e.clientX, ey = e.clientY;
                    _this.style.left = dx + ex + 'px';
                    _this.style.top = dy + ey + 'px';
                    _mmove(e);
                }
                this.onmouseup = function () {
                    document.onmousemove = _mmove;
                    if (parseFloat(this.style.left) < 0) this.style.left = hidd_left + 'px';
                    if (parseFloat(this.style.top) < 0) this.style.top = '0px';
                }
            },
            onclick: function (obj, on_off, func1, func2 = () => { }) {
                if (on_off) func1(), obj.style.backgroundColor = '#fff0';
                else func2(), obj.style.backgroundColor = '#fff5';
            }
        }
        let find_frame = function (doc, func) { //不能解决iframe跨域问题
            if (doc === null) { console.log('this.contentDocument == null'); return false; }
            function get_frame() { return [...doc.getElementsByTagName('iframe'), ...doc.getElementsByTagName('frame')] }
            func();
            for (let f of get_frame()) { find_frame(f.contentDocument, func) }
        }
        var global = document.createElement('div');
        global.id = '全局功能组';
        global.style = 'display:flex;flex-direction:column;position:fixed;top:0;\
		left:' + hidd_left + 'px;z-index:9999;width:100px;background-color:#0000;mix-blend-mode:difference;border:3px solid #fff;border-radius:10px;margin:0px';
        global.onmousedown = elm.onmousedown;

        { //设计模式
            let 设计开关 = false;
            let btn = document.createElement('input');
            btn.id = '设计模式';
            btn.type = 'button';
            btn.value = '设计模式';
            btn.style = elm.style;
            btn.onmousedown = function () {
                let ismove = false;
                btn.onmousemove = function () { ismove = true }
                btn.onmouseup = function () {
                    !ismove && (elm.onclick(this, 设计开关,
                        () => { find_frame(document, () => { document.designMode = 'off' }) },
                        () => { find_frame(document, () => { document.designMode = 'on' }) }),
                        设计开关 = !设计开关)
                }
            }
            setInterval(function () { !document.contains(btn) && global.appendChild(btn) }, 1000); //
        }

        { //邮箱发送
            let btn = document.createElement('input');
            btn.id = '邮箱发送';
            btn.type = 'button';
            btn.value = '邮箱发送';
            btn.style = elm.style;
            btn.onmousedown = function () {
                let ismove = false;
                btn.onmousemove = function () { ismove = true }
                btn.onmouseup = function () {
                    !ismove && elm.onclick(this, 1, () => {
                        let str = window.getSelection().toString();
                        if (str && /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/.test(str)) window.open('mailto:' + str);
                        else alert('邮箱格式错误\n' + (str || '空'));
                    })
                }
            }
            setInterval(function () { !document.contains(btn) && global.appendChild(btn) }, 1000); //
        }
        document.body.appendChild(global);
    } //*/

    const _onload = window.onload;
    window.onload = (...e) => { //广告删除
        _onload && _onload(e);
        function classArray(classname) { return document.getElementsByClassName(classname) }
        let loop_num = 0, stop_num = 0;
        let stop = setInterval(function () {
            let loop_valid = false;
            let ads = [
                ...classArray('adsbygoogle'), //google
                ...classArray('pb-ad'), //google
                ...classArray('google-auto-placed'), //google
                ...classArray('b_ad'), //bing-搜索
                //...classArray('Pc-card Card'), //zhihu-首页
                //...classArray('_2z1q32z'), //baidu-搜索
                //...classArray(''), //
                //...classArray(''), //
                ...classArray(''), //
                document.getElementById('player-ads'), //ytb-ads
                document.getElementById('masthead-ad') //ytb-ads
            ];
            for (let ad of ads) {
                if (ad && ad.style.display != 'none') {
                    //ad.style.display='none';
                    ad.remove();
                    loop_valid = true;
                }
            }
            if (loop_valid) loop_num++;
            if (loop_num >= stop_num) { clearInterval(stop); }
        }, 100);
    } //*/

    //选择复制
    const _onkeydown = document.onkeydown;
    document.onkeydown = function (e) { //Ctrl+C
        if (e.ctrlKey && e.keyCode === 67) {
            let content = window.getSelection().toString();
            content && navigator.clipboard.writeText(content);
        }
        _onkeydown && _onkeydown(e);
    }

    //直接跳转
    if (document.URL.includes('link.zhihu.com') ||
        document.URL.includes('link.csdn.net') ||
        document.URL.includes('c.pc.qq.com')) {
        setTimeout(() => {
            document.URL.includes('link.zhihu.com') && (location.href = document.getElementsByClassName('link')[0].innerHTML); //知乎
            document.URL.includes('link.csdn.net') && document.getElementsByClassName('loading-btn')[0].click(); //CSDN
            document.URL.includes('c.pc.qq.com') && (location.href = document.getElementById('url').innerText); //QQ
        }, 100);
    }

    //谷歌学术镜像
    if (document.URL.includes('xs.zidianzhan.net')) {
        document.getElementById('mainshadow').remove();
    }

    //document.designMode='on';
})();
