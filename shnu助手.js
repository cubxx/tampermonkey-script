// ==UserScript==
// @name         shnu助手
// @namespace    shnu_helper
// @version      0.1
// @description  阿巴阿巴阿巴阿巴
// @author       Cubxx
// @include      /shnu\./
// @icon         https://www.shnu.edu.cn/favicon.ico
// @require      https://cubxx.github.io/My-Tampermonkey-Script/$tm.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    //学习通免登录
    $tm.urlFunc(/^http\:\/\/shnu.fy.chaoxing.com\/portal$/, () => {
        // location.href = 'http://passport2.chaoxing.com/logout.html?refer=http://shnu.fy.chaoxing.com/logout.jsp';
        const enter = $('.courseZone');
        if (enter) { enter.$('a').target = '_self', enter.$('a').click(); }
        else { $('.loginSub', 1)[1].click(); } //统一认证登录
    });

    //cas自动登录
    $tm.urlFunc(/cas.shnu.edu.cn\/cas\/login\?service=/, () => {
        const cuid = $('#un'),
            pd = $('#pd'),
            btn = $('.login_box_landing_btn');
        !async function submit() {
            if (btn && cuid.value && pd.value) {
                return btn.click();
            } else {
                await new Promise(resolve => setTimeout(resolve, 1e3));
                await submit();
            }
        }();
    });

    //教务系统
    $tm.urlFunc(/^https\:\/\/course.shnu.edu.cn\/eams\/home.action$/, () => {
        const stop = setInterval(() => {
            const td = $('.scroll_box', 1)[3];
            if (td) {
                const btn = td.children[0].children[0];
                btn.innerText += '\n(双击运行脚本)';
                btn.ondblclick = function () {
                    open(`${location.href}&pageNo=1&pageSize=10000`);
                };
                clearInterval(stop);
            }
        }, 1000);
    });

    //查找课程
    $tm.urlFunc(/course.shnu.edu.cn\/eams\/stdSyllabus!search.action/, () => {
        //添加input元素
        const div = $tm.addElmsGroup({
            box: {},
            arr: [...['星期', '节次', '周次', '教室'].map(e => {
                return {
                    tag: 'input',
                    style: 'width: 70px',
                    placeholder: e,
                }
            }), {
                tag: 'input',
                type: 'button',
                value: '脚本筛选',
                onclick() {
                    const has_find_string = query_info_elms.concat(query_data_elms).some(e => !!e.value);
                    if (has_find_string) filter();
                },
            }]
        });
        $('#taskListForm .gridbar').appendChild(div);

        //定义变量
        const lesson_thead = $('#taskListForm thead'),
            lesson_tbody = $('#taskListForm tbody');
        const query_info_elms = div.$('input[placeholder]', 1), //length:4
            query_data_elms = lesson_thead.children[0].$('input:not([id])', 1); //length:9
        // const data_key_elms = lesson_thead.children[1].$('th', 1).filter(e => !e.childElementCount); //length:10
        window.Lessons = record();

        function record() {
            //elm => Lesson
            return lesson_tbody.$('tr[class]', 1).map(tr => {
                const id = tr.$('.gridselect>input').value;
                const infos = contents[id].split('<br>').map(e => e.trim().replace(/ +/g, ' ').split(' '));
                const data = tr.$('td:not([class])', 1).map(e => e.innerText); //length:10
                return { id, elm: tr, infos, data };
            });
        }
        function filter() {
            for (let lesson of Lessons) {
                //data匹配
                let isOK_data = true; //data是否匹配
                query_data_elms.forEach((e, i) => {
                    const find_string = e.value;
                    if (find_string) isOK_data &&= lesson.data[i].includes(find_string); //全部find_string匹配，才成功
                });
                //infos匹配
                let isOK_info;
                for (let info of lesson.infos) {
                    isOK_info = true;
                    //info为['教师',...]或['']
                    query_info_elms.forEach((e, i) => {
                        const find_string = e.value;
                        if (find_string) isOK_info &&= info[i - 1]?.includes(find_string); //有find_string，且info为['']时。isOK_info为false
                    });
                    if (isOK_info) break; //只要有一个info匹配，则成功
                }
                //判断是否显示
                lesson.elm.style.display = (isOK_data && isOK_info) ? '' : 'none';
            }
            console.log('筛选成功');
        }
    });

})();