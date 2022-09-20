// ==UserScript==
// @name         全局功能
// @namespace    https://github.com/cubxx
// @version      0.1
// @description  设计模式开关 广告隐藏
// @author       Cubxx
// @include    *
// @exclude   file:///*
// @icon         data:image/svg+xml,%3C?xml version='1.0' encoding='utf-8'?%3E%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Cg id='XMLID_273_'%3E%3Cg id='XMLID_78_'%3E%3Cpath id='XMLID_83_' class='st0' d='M304.8,0H95.2C42.6,0,0,42.6,0,95.2v209.6C0,357.4,42.6,400,95.2,400h209.6 c52.6,0,95.2-42.6,95.2-95.2V95.2C400,42.6,357.4,0,304.8,0z M106.3,375C61.4,375,25,338.6,25,293.8c0-44.9,36.4-81.3,81.3-81.3 c44.9,0,81.3,36.4,81.3,81.3C187.5,338.6,151.1,375,106.3,375z M293.8,375c-44.9,0-81.3-36.4-81.3-81.3 c0-44.9,36.4-81.3,81.3-81.3c44.9,0,81.3,36.4,81.3,81.3C375,338.6,338.6,375,293.8,375z'/%3E%3C/g%3E%3Cg id='XMLID_67_' class='st2'%3E%3Cpath id='XMLID_74_' class='st3' d='M304.8,0H95.2C42.6,0,0,42.6,0,95.2v209.6C0,357.4,42.6,400,95.2,400h209.6 c52.6,0,95.2-42.6,95.2-95.2V95.2C400,42.6,357.4,0,304.8,0z M106.3,375C61.4,375,25,338.6,25,293.8c0-44.9,36.4-81.3,81.3-81.3 c44.9,0,81.3,36.4,81.3,81.3C187.5,338.6,151.1,375,106.3,375z M293.8,375c-44.9,0-81.3-36.4-81.3-81.3 c0-44.9,36.4-81.3,81.3-81.3c44.9,0,81.3,36.4,81.3,81.3C375,338.6,338.6,375,293.8,375z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E
// @grant        none
// ==/UserScript==

(function () {
    var global = document.createElement('div');
    global.id = '全局功能组';

    { //设计模式
        let 设计开关 = true;
        let btn = document.createElement('input');
        btn.id = '设计模式';
        btn.type = 'button';
        btn.onclick = function () {
            if (设计开关) {
                document.designMode = 'on';
                btn.value = '设计模式-开';
                btn.style.color = '#fff';
                btn.style.backgroundColor = '#000';
            } else {
                document.designMode = 'off';
                btn.value = '设计模式-关';
                btn.style.color = '#000';
                btn.style.backgroundColor = '#fff0';
            }
            设计开关 = !设计开关;
        };
        btn.style = 'position:fixed;z-index:9999;border:1px solid #000;width:120px;height:40px;color:#000;background-color:#fff0;font:bold 17px/20px caption;';
        btn.style.top = '0px', btn.style.left = '-110px';
        btn.value = '设计模式-关';
        setInterval(function () {
            if (!document.body.contains(btn)) { global.appendChild(btn); }
        }, 1000);
        let _mmove = document.onmousemove || function () { }
        btn.onmousedown = function (e) {
            var ex = e.clientX, ey = e.clientY,
                px = parseFloat(window.getComputedStyle(btn).left),
                py = parseFloat(window.getComputedStyle(btn).top);
            var dx = px - ex, dy = py - ey;
            document.onmousemove = function (e) {
                var ex = e.clientX, ey = e.clientY;
                btn.style.left = dx + ex + 'px';
                btn.style.top = dy + ey + 'px';
                设计开关 = false;
                _mmove(e);
            }
            btn.onmouseup = function () {
                document.onmousemove = _mmove;
                if (parseFloat(btn.style.left) < 0) btn.style.left = '-110px';
                if (parseFloat(btn.style.top) < 0) btn.style.top = '0px';
            }
        }
    }

    { //广告删除
        var loop_num = 0, stop_num = 0;
        function classArray(classname) { return document.getElementsByClassName(classname) }
        var stop = setInterval(function () {
            var loop_valid = false;
            var ads = [
                ...classArray('adsbygoogle'), //google
                ...classArray('b_ad'), //bing-搜索
                //...classArray('Pc-card Card'), //zhihu-首页
                //...classArray('_2z1q32z'), //baidu-搜索
                //...classArray(''), //
                //...classArray(''), //
                ...classArray('') //
            ];
            for (var ad of ads) {
                if (ad.style.display != 'none') {
                    //ad.style.display='none';
                    ad.remove();
                    loop_valid = true;
                }
            }
            if (loop_valid) loop_num++;
            if (loop_num >= stop_num) { clearInterval(stop); }
        }, 100);
    }

    /*{ //邮箱发送
        var btn=document.createElement('input');
        btn.id='邮箱发送';
        btn.type='button';
        btn.onclick=function(){
            var str=window.getSelection().toString();
            if(str){} //loading...//
        }
        setInterval(function(){
            if(document.body.contains(btn)){ global.appendChild(btn); }
        },1000);
    }    */

    //选择复制
    let _onkeydown = document.onkeydown || function () { };
    document.onkeydown = function (e) { //Ctrl+C
        (e.ctrlKey && e.keyCode === 67 && window.getSelection().toString()) && document.execCommand('copy');
        _onkeydown(e);
    }

    document.body.appendChild(global);

    //超职教育
    if (document.URL.includes('open.talk-fun.com/player.php')) {
        window.onload = function () {
            let stop = setInterval(() => {
                let intro = document.getElementsByClassName('teaser-container')[0]
                intro && (
                    clearInterval(stop),
                    intro.style.display = 'none',
                    MT.pause = () => { },
                    Mt.play(),
                    document.getElementsByClassName('player_speed_type')[0].children[5].click()
                );
            }, 1000);
        }
    }
})();
