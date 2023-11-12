// ==UserScript==
// @name         shnu助手
// @namespace    shnu_helper
// @version      0.1
// @description  阿巴阿巴阿巴阿巴
// @author       Cubxx
// @include      /shnu\./
// @icon         https://www.shnu.edu.cn/favicon.ico
// @require      https://github.com/Cubxx/My-Tampermonkey-Script/raw/master/%24tm.js
// @updateURL    https://github.com/Cubxx/My-Tampermonkey-Script/raw/master/shnu助手.js
// @downloadURL  https://github.com/Cubxx/My-Tampermonkey-Script/raw/master/shnu助手.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    //学习通免登录
    $tm.urlFunc(/shnu.fy.chaoxing.com\/portal$/, () => {
        location.href = 'https://i.mooc.chaoxing.com/';
    });

    //cas自动登录
    $tm.urlFunc(/cas.shnu.edu.cn\/cas\/login\?service=/, () => {
        (function submit() {
            const cuid = $('#un'),
                pd = $('#pd'),
                btn = $('.login_box_landing_btn');
            if (btn && cuid.value && pd.value) {
                return btn.click();
            } else {
                setTimeout(submit, 1e3);
            }
        })();
    });

    //教务系统
    $tm.urlFunc(/^https\:\/\/course.shnu.edu.cn\/eams\/home.action$/, () => {
        const stop = setInterval(() => {
            const grp = $('.menu > li', 1).filter((e) => e.innerText === '公共服务')[0];
            const btn = grp?.$('li > a', 1).filter((e) => e.innerText === '全校开课查询')[0];
            if (!btn) {
                return;
            }
            let currentUrl = '';
            Object.assign(btn, {
                innerText: btn.innerText + '\n(双击运行脚本)',
                onmouseenter() {
                    currentUrl = location.href;
                },
                ondblclick() {
                    open(currentUrl + '&pageNo=1&pageSize=10000');
                },
            });
            clearInterval(stop);
        }, 1e3);
    });

    //查找课程
    $tm.urlFunc(/course.shnu.edu.cn\/eams\/stdSyllabus!search.action/, () => {
        //添加input元素
        const div = $tm.addElmsGroup({
            box: {},
            arr: [
                ...['星期', '节次', '周次', '教室'].map((e) => {
                    return {
                        tag: 'input',
                        style: 'width: 70px',
                        placeholder: e,
                    };
                }),
                {
                    id: 'filter',
                    tag: 'input',
                    type: 'button',
                    value: '脚本筛选',
                    onclick() {
                        const has_find_string = query_info_elms
                            .concat(query_data_elms)
                            .some((e) => !!e.value);
                        if (has_find_string) {
                            filter();
                        }
                    },
                },
            ],
        });
        $('#taskListForm .gridbar').appendChild(div);

        //定义变量
        const lesson_thead = $('#taskListForm thead'),
            lesson_tbody = $('#taskListForm tbody');
        const query_info_elms = div.$('input[placeholder]', 1), //length:4
            query_data_elms = lesson_thead.children[0].$('input:not([id])', 1); //length:9
        // const data_key_elms = lesson_thead.children[1].$('th', 1).filter(e => !e.childElementCount); //length:10
        const Lessons = record();
        window.Lessons = Lessons;
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopImmediatePropagation();
                $('#filter').onclick();
            }
        });

        function record() {
            //elm => Lesson
            return lesson_tbody.$('tr[class]', 1).map((elm) => {
                const id = elm.$('.gridselect>input').value;
                const infos = contents[id]
                    .split('<br>')
                    .map((e) => e.trim().replace(/ +/g, ' ').split(' '));
                const data = elm.$('td:not([class])', 1).map((e) => e.innerText); //length:10
                return { id, elm, infos, data };
            });
        }
        function filter() {
            function isOK_data(lesson) {
                return query_data_elms.every((e, i) => {
                    const find_string = e.value;
                    return find_string ? lesson.data[i].includes(find_string) : true;
                });
            }
            function isOK_info(lesson) {
                return lesson.infos.some((info) => {
                    return query_info_elms.every((e, i) => {
                        const find_string = e.value;
                        return find_string ? info[i - 1]?.includes(find_string) : true;
                    });
                });
            }
            Lessons.forEach((lesson) => {
                lesson.elm.style.display = isOK_data(lesson) && isOK_info(lesson) ? '' : 'none';
            });
            console.log('筛选成功');
        }
    });
})();
