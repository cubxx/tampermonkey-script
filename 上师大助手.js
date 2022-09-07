// ==UserScript==
// @name         上师大助手
// @namespace    https://github.com/cubxx
// @version      0.1
// @description  阿巴阿巴阿巴阿巴
// @author       Cubxx
// @include        /shnu\./
// @icon         https://www.shnu.edu.cn/favicon.ico
// @grant        none
// ==/UserScript==

(function(){
    //健康之路自动填写
    if(document.URL=='https://yqfk.shnu.edu.cn/Default.aspx'){
        document.getElementById('lnkReport').click();
    }
    if(document.URL=='https://yqfk.shnu.edu.cn/DayReport.aspx'){
        (function(){
            var AutoSubmit=function() {
                document.getElementById('p1_ChengNuo-inputEl').click(); //我承诺阿巴阿巴
                document.getElementById('fineui_9-inputEl').click(); //在上海校内
                document.getElementById('fineui_12-inputEl').click(); //住校
                document.getElementById('fineui_15-inputEl').click(); //不是家庭住址
                document.getElementById('fineui_18-inputEl').click(); //否
                document.getElementById('fineui_20-inputEl').click(); //否
                document.getElementById('fineui_22-inputEl').click(); //否
                document.getElementById('p1_ctl01_btnSubmit').onclick=()=>{document.getElementById('fineui_37').click();}; //直接提交
                document.getElementById('p1_ctl01_btnSubmit').click(); //自动提交
            };
            window.onload=AutoSubmit;
        })();
    }

    //学习通直达
    if(document.URL=='http://shnu.fy.chaoxing.com/portal'){
        (function(){
            var 进入空间=document.getElementsByClassName('courseZone fr')[0];
            if(进入空间){ 进入空间.children[1].target='_self'; 进入空间.children[1].click();}
            else{ document.getElementsByClassName('loginSub')[1].click();} //统一认证登录
        })();
    }

    //cas自动登录
    if(document.URL.includes('https://cas.shnu.edu.cn/cas/login?service=')){
        (function(){
            var cuid=document.getElementById('un');
            var pd=document.getElementById('pd');
            var submit=document.getElementsByClassName('login_box_landing_btn')[0];
            setInterval(()=>{
                if(submit&&cuid.value&&pd.value) submit.click();
            },300);
        })();
    }

    //教务系统定位到课表
    if(document.URL=='https://course.shnu.edu.cn/eams/home.action'){
        (function(){
            var stop=setInterval(()=>{
                var url=document.URL;
                var td=document.getElementsByClassName('scroll_box')[0];
                if(td){
                    if(url=='https://course.shnu.edu.cn/eams/home.action') td.children[6].children[0].click();
                    else{clearInterval(stop);}
                }
            },200);
        })();
    }

})();