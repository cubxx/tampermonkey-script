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
            let AutoSubmit = function () {
                if (!document.getElementById('p1_ChengNuo-inputEl')) return false;
                document.getElementById('p1_ChengNuo-inputEl').click(); //我承诺阿巴阿巴
                //document.getElementById('fineui_5').children[1]; //随申码
                //document.getElementById('fineui_6').children[1]; //行程卡
                document.getElementById('fineui_9-inputEl').click(); //在上海校内
                document.getElementById('fineui_12-inputEl').click(); //住校
                document.getElementById('fineui_15-inputEl').click(); //不是家庭住址
                document.getElementById('fineui_18-inputEl').click(); //否
                document.getElementById('fineui_20-inputEl').click(); //否
                document.getElementById('fineui_22-inputEl').click(); //否
                document.getElementById('p1_ctl01_btnSubmit').onclick = () => { document.getElementById('fineui_37').click(); } //直接提交
                document.getElementById('p1_ctl01_btnSubmit').click(); //自动提交
                return true;
            };
            let key = setInterval(() => {
                if (AutoSubmit()) clearInterval(key);
            }, 100);
        }
    }

    //学习通免登录
    {
        if (document.URL == 'http://shnu.fy.chaoxing.com/portal') {
            // location.href = 'http://passport2.chaoxing.com/logout.html?refer=http://shnu.fy.chaoxing.com/logout.jsp';
            var enter = document.getElementsByClassName('courseZone fr')[0];
            if (enter) { enter.children[1].target = '_self', enter.children[1].click(); }
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

    //教务系统
    {
        if (document.URL == 'https://course.shnu.edu.cn/eams/home.action') {
            let stop = setInterval(() => {
                let url = document.URL;
                /* var td = $('.scroll_box')[0];
                if (td) {
                    if (url == 'https://course.shnu.edu.cn/eams/home.action') td.children[6].children[0].click();
                    else { clearInterval(stop); }
                } */
                let td = $('.scroll_box')[3];
                if (td) {
                    let btn = td.children[0].children[0];
                    btn.innerText += '\n(双击运行脚本)';
                    btn.ondblclick = function () {
                        open('https://course.shnu.edu.cn/eams/stdSyllabus!search.action?lesson.semester.id=302&pageNo=1&pageSize=10000');
                    };
                    clearInterval(stop);
                }
            }, 1000); //每300ms执行一次
        }
    }

    //查找课程
    {
        if (document.URL.includes('https://course.shnu.edu.cn/eams/stdSyllabus!search.action')) {
            let domain = 'https://course.shnu.edu.cn/eams/stdSyllabus!search.action',
                parameters = 'lesson.semester.id=322&pageSize=10000',
                url = domain + '?' + parameters;
            // document.URL != url && open(url, '_self');

            //添加input元素
            let div = $('#taskListForm > div > div')[0];
            ['星期', '节次', '周次', '教室'].forEach((e, i) => {
                let inp = document.createElement('input');
                inp.style.width = '100px';
                inp.id = 'input_' + i;
                inp.placeholder = e;
                div.appendChild(inp);
            });
            let btn = document.createElement('input');
            btn.type = 'button';
            btn.value = '脚本筛选';
            btn.onclick = function () {
                filter($('#input_0')[0].value, $('#input_1')[0].value, $('#input_2')[0].value, $('#input_3')[0].value);
            }
            div.appendChild(btn);

            //定义变量
            let lesson_thead = $('#taskListForm > div > table > thead')[0],
                lesson_tbody = $('#taskListForm > div > table > tbody')[0];
            window.course = record();

            /**
             * Lesson类
             * @param {String} id 
             * @param {HTMLElement} elm 
             * @param {Array} info 
             * @param {Array} data 
             */
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
                        let find_string = input_elms[i].getElementsByTagName('input')[0].value;
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
                                let find_string = $('#input_' + (e - 1))[0].value;
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

        }
    }

})();//*/