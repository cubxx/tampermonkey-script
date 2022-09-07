// ==UserScript==
// @name         全局功能
// @namespace    https://github.com/cubxx
// @version      0.1
// @description  设计模式开关 广告隐藏
// @author       Cubxx
// @include    *
// @exclude  /chaoxing/
// @icon         data:image/svg+xml,%3C?xml version='1.0' encoding='utf-8'?%3E%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Cg id='XMLID_273_'%3E%3Cg id='XMLID_78_'%3E%3Cpath id='XMLID_83_' class='st0' d='M304.8,0H95.2C42.6,0,0,42.6,0,95.2v209.6C0,357.4,42.6,400,95.2,400h209.6 c52.6,0,95.2-42.6,95.2-95.2V95.2C400,42.6,357.4,0,304.8,0z M106.3,375C61.4,375,25,338.6,25,293.8c0-44.9,36.4-81.3,81.3-81.3 c44.9,0,81.3,36.4,81.3,81.3C187.5,338.6,151.1,375,106.3,375z M293.8,375c-44.9,0-81.3-36.4-81.3-81.3 c0-44.9,36.4-81.3,81.3-81.3c44.9,0,81.3,36.4,81.3,81.3C375,338.6,338.6,375,293.8,375z'/%3E%3C/g%3E%3Cg id='XMLID_67_' class='st2'%3E%3Cpath id='XMLID_74_' class='st3' d='M304.8,0H95.2C42.6,0,0,42.6,0,95.2v209.6C0,357.4,42.6,400,95.2,400h209.6 c52.6,0,95.2-42.6,95.2-95.2V95.2C400,42.6,357.4,0,304.8,0z M106.3,375C61.4,375,25,338.6,25,293.8c0-44.9,36.4-81.3,81.3-81.3 c44.9,0,81.3,36.4,81.3,81.3C187.5,338.6,151.1,375,106.3,375z M293.8,375c-44.9,0-81.3-36.4-81.3-81.3 c0-44.9,36.4-81.3,81.3-81.3c44.9,0,81.3,36.4,81.3,81.3C375,338.6,338.6,375,293.8,375z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E
// @grant        none
// ==/UserScript==

(function(){
    //设计模式
    var 设计开关=true;
    (function() {
        var btn=document.createElement('input');
        btn.id='设计模式_开关';
        btn.type='button';
        btn.onclick=function(){
            if(设计开关){
                document.designMode = 'on';
                btn.value='设计模式-开';
                btn.style.color='#fff';
                btn.style.backgroundColor='#000';
            }else{
                document.designMode = 'off';
                btn.value='设计模式-关';
                btn.style.color='#000';
                btn.style.backgroundColor='#ffffff00';
            }
            设计开关=!设计开关;
        };
        btn.onmouseout=function(){btn.style.opacity=0.05; btn.style.left='-100px'; };
        btn.onmousemove=function(){btn.style.opacity=1; btn.style.left='0px'; };
        btn.style='position: fixed;	\
bottom: 50px;	left: -100px;	\
z-index: 9999;	border: 0;  \
width: 120px;	height: 40px;	\
color: #000;	background-color:#ffffff00;  \
font: bold 17px/20px caption;';
        btn.style.opacity=0.1;
        btn.value='设计模式-关';
        setInterval(function(){
            if(document.getElementById('设计模式_开关')===null){ document.body.appendChild(btn); }
        },1000);
    })();

    //广告删除
    (function(){
        var loop_num=0,stop_num=0 ;
        function classArray(classname){ return document.getElementsByClassName(classname) }
        var stop=setInterval(function(){
            var loop_valid=false;
            var ads=[
                ...classArray('adsbygoogle'), //google
                ...classArray('b_ad'), //bing-搜索
                //...classArray('Pc-card Card'), //zhihu-首页
                //...classArray('_2z1q32z'), //baidu-搜索
                //...classArray(''), //
                //...classArray(''), //
                ...classArray('') //
            ];
            for(var ad of ads){
                if(ad.style.display!='none'){
                    //ad.style.display='none';
                    ad.remove();
                    loop_valid=true;}
            }
            if(loop_valid) loop_num++;
            if(loop_num>=stop_num){ clearInterval(stop); }
        },100);
    })();

})();
