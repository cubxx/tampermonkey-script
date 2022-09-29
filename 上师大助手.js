// ==UserScript==
// @name         上师大助手
// @namespace    https://github.com/cubxx
// @version      0.1
// @description  阿巴阿巴阿巴阿巴
// @author       Cubxx
// @include      /shnu\./
// @icon         https://www.shnu.edu.cn/favicon.ico
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    //健康之路自动填写
    {
        if (document.URL == 'https://yqfk.shnu.edu.cn/Default.aspx') {
            document.getElementById('lnkReport').click();
        }
        if (document.URL == 'https://yqfk.shnu.edu.cn/DayReport.aspx') {
            var AutoSubmit = function () {
                document.getElementById('p1_ChengNuo-inputEl').click(); //我承诺阿巴阿巴
                //document.getElementById('fineui_5').children[1]; //随申码
                //document.getElementById('fineui_6').children[1]; //行程卡
                document.getElementById('fineui_9-inputEl').click(); //在上海校内
                document.getElementById('fineui_12-inputEl').click(); //住校
                document.getElementById('fineui_15-inputEl').click(); //不是家庭住址
                document.getElementById('fineui_17-inputEl').click(); //是
                document.getElementById('fineui_19-inputEl').click(); //是
                document.getElementById('fineui_22-inputEl').click(); //否
                document.getElementById('p1_ctl01_btnSubmit').onclick = () => { document.getElementById('fineui_37').click(); } //直接提交
                document.getElementById('p1_ctl01_btnSubmit').click(); //自动提交
            };
            window.onload = AutoSubmit;
        }
    }

    //学习通免登录
    {
        if (document.URL == 'http://shnu.fy.chaoxing.com/portal') {
            // location.href = 'http://passport2.chaoxing.com/logout.html?refer=http://shnu.fy.chaoxing.com/logout.jsp';
            var enter = document.getElementsByClassName('courseZone fr')[0].children[1];
            if (enter) { enter.target = '_self', enter.click(); }
            else { document.getElementsByClassName('loginSub')[1].click(); } //统一认证登录
        }
    }

    //cas自动登录
    {
        if (document.URL.includes('https://cas.shnu.edu.cn/cas/login?service=')) {
            var cuid = document.getElementById('un');
            var pd = document.getElementById('pd');
            var submit = document.getElementsByClassName('login_box_landing_btn')[0];
            setInterval(() => {
                if (submit && cuid.value && pd.value) submit.click();
            }, 1000);
        }
    }

    //教务系统定位到课表
    {
        if (document.URL == 'https://course.shnu.edu.cn/eams/home.action') {
            var stop = setInterval(() => {
                var url = document.URL;
                var td = document.getElementsByClassName('scroll_box')[0];
                if (td) {
                    if (url == 'https://course.shnu.edu.cn/eams/home.action') td.children[6].children[0].click();
                    else { clearInterval(stop); }
                }
            }, 1000); //每300ms执行一次
        }
    }

})();//*/