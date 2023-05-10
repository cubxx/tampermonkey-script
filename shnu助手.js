// ==UserScript==
// @name         shnu助手
// @namespace    shnu_helper
// @version      0.1
// @description  阿巴阿巴阿巴阿巴
// @author       Cubxx
// @include      /shnu\./
// @icon         https://www.shnu.edu.cn/favicon.ico
// @require    https://cubxx.github.io/$tm.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    //学习通免登录
    $tm.urlFunc(/^http\:\/\/shnu.fy.chaoxing.com\/portal$/, () => {
        // location.href = 'http://passport2.chaoxing.com/logout.html?refer=http://shnu.fy.chaoxing.com/logout.jsp';
        var enter = $('.courseZone');
        if (enter) { enter.$('a').target = '_self', enter.$('a').click(); }
        else { $('.loginSub', 1)[1].click(); } //统一认证登录
    });

    //cas自动登录
    $tm.urlFunc(/cas.shnu.edu.cn\/cas\/login\?service=/, () => {
        var cuid = $('#un');
        var pd = $('#pd');
        var submit = $('.login_box_landing_btn');
        setInterval(() => {
            if (submit && cuid.value && pd.value) submit.click();
        }, 1000);
    });

    //教务系统
    $tm.urlFunc(/^https\:\/\/course.shnu.edu.cn\/eams\/home.action$/, () => {
        let stop = setInterval(() => {
            let td = $('.scroll_box', 1)[3];
            if (td) {
                let btn = td.children[0].children[0];
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
        let div = $('#taskListForm div div');
        $tm.addElms([...['星期', '节次', '周次', '教室'].map((e, i) => {
            return {
                tag: 'input',
                style: 'width: 100px',
                id: 'input_' + i,
                placeholder: e,
            }
        }), {
            tag: 'input',
            type: 'button',
            value: '脚本筛选',
            onclick: function () {
                filter($('#input_0').value, $('#input_1').value, $('#input_2').value, $('#input_3').value);
            }
        }]).map(e => div.appendChild(e));

        //定义变量
        let lesson_thead = $('#taskListForm div table thead'),
            lesson_tbody = $('#taskListForm div table tbody');
        window.course = record();

        function Lesson(id, elm, info, data) {
            this.id = id;
            this.elm = elm;
            this.info = info;
            this.data = data;
        }
        function record() {
            let lesson_elms = Object.values(lesson_tbody.children),
                lessons = [];
            lesson_elms.forEach(e => {
                //elm 转为 Lesson数据
                if (e.tagName && e.tagName === 'TR') {
                    //录入id
                    let lesson_id = e.children[0].children[0].value;
                    //录入info
                    let lesson_info = contents[lesson_id].split('<br>');
                    lesson_info.forEach((e, i, arr) => {
                        arr[i] = arr[i].replace(/  /g, ' ').split(' ');
                    })
                    //录入data
                    let lesson_data = [],
                        keys_elms = lesson_thead.children[1].children;
                    for (let i = 1; i < keys_elms.length - 1; i++) {
                        // lesson_data[keys_elms[i].id.replace(/\./g, '_') || 'lesson_teacher'] = e.children[i].innerText;
                        lesson_data.push(e.children[i].innerText);
                    }
                    lessons.push(new Lesson(lesson_id, e, lesson_info, lesson_data));
                }
            });
            return lessons;
        }
        function filter(day = '', hour = '', week = '', classroom = '') {
            let lessons_ed = [],
                all_find_string = day + hour + week + classroom;
            for (let lesson of course) {
                //data匹配
                let isOK_data = true; //data是否匹配
                let input_elms = lesson_thead.children[0].children;
                for (let i = 1; i < input_elms.length - 1; i++) {
                    //全部find_string匹配，才成功
                    let find_string = input_elms[i].$('input').value;
                    find_string && (isOK_data *= lesson.data[i - 1].includes(find_string));
                    all_find_string += find_string;
                }
                //info匹配多个String
                let isOK_info;
                for (let info_i of lesson.info) {
                    isOK_info = true;
                    //只要有一个info_i匹配，则成功
                    if (info_i.length != 1) {
                        //全部find_string匹配，info_i才匹配
                        [1, 2, 3, 4].forEach(e => {
                            let find_string = $('#input_' + (e - 1)).value;
                            find_string && (isOK_info *= info_i[e].includes(find_string));
                        });
                    } else isOK_info = false; //没有info
                    if (isOK_info) break; //info_i匹配成功，则退出
                }
                //判断是否有检索词
                if (all_find_string === '') { lessons_ed = course; break; }
                else if (isOK_data && isOK_info) { lessons_ed.push(lesson); }
                else; //这个lesson不匹配
            }
            update(lessons_ed);
            return lessons_ed;
        }
        function update(lessons) {
            //仅显示lessons的课程
            lesson_tbody.innerHTML = '';
            lessons.forEach(lesson => {
                lesson_tbody.appendChild(lesson.elm);
            });
            console.log('脚本筛选成功');
        }
    });

})();//*/