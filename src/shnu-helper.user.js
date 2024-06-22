// ==UserScript==
// @name         shnu-helper
// @version      0.1
// @author       Cubxx
// @match        *://*.shnu.edu.cn/*
// @match        *://shnu.fy.chaoxing.com/portal
// @updateURL    https://github.com/Cubxx/tampermonkey-script/raw/main/src/shnu-helper.user.js
// @downloadURL  https://github.com/Cubxx/tampermonkey-script/raw/main/src/shnu-helper.user.js
// @icon         https://cas.shnu.edu.cn/cas/comm/image/shnuicon.ico
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    const { dom, ui, util } = tm;

    //学习通免登录
    tm.matchURL(/shnu.fy.chaoxing.com\/portal/, () => {
        location.href = 'https://i.mooc.chaoxing.com/';
    });

    //cas自动登录
    tm.matchURL(/cas.shnu.edu.cn\/cas\/login\?service=/, () => {
        (function submit() {
            const cuid = document.$('#un'),
                pd = document.$('#pd'),
                btn = document.$('.login_box_landing_btn');
            //@ts-ignore
            if (btn && cuid.value && pd.value) btn.click();
            else {
                setTimeout(submit, 1e3);
            }
        })();
    });

    //教务系统
    tm.matchURL(/^https\:\/\/course.shnu.edu.cn\/eams\/home.action$/, () => {
        const stop = setInterval(() => {
            const grp = document
                .$$('.menu > li')
                .filter((e) => e['innerText'] === '公共服务')[0];
            const btn = grp
                ?.$$('li > a')
                .filter((e) => e['innerText'] === '全校开课查询')[0];
            if (!btn) {
                return;
            }
            let currentUrl = '';
            Object.assign(btn, {
                innerText: btn['innerText'] + '\n(双击运行脚本)',
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
    tm.matchURL(/course.shnu.edu.cn\/eams\/stdSyllabus!search.action/, () => {
        //添加input元素
        const inputs = ['星期', '节次', '周次', '教室']
            .map((e) =>
                dom.h('input', {
                    style: 'width: 70px',
                    placeholder: e,
                }),
            )
            .concat(
                dom.h('input', {
                    id: 'filter',
                    type: 'button',
                    value: '脚本筛选',
                    onclick() {
                        const has_find_string = query_info_elms
                            .concat(query_data_elms ?? [])
                            .some((e) => !!e.value);
                        if (has_find_string) {
                            filter();
                        }
                    },
                }),
            );
        const div = dom.h('div', {}, inputs);
        div.mount('#taskListForm .gridbar');
        //定义变量
        const lesson_thead = document.$('#taskListForm thead'),
            lesson_tbody = document.$('#taskListForm tbody');
        /** @type {HTMLInputElement[]} */
        const query_info_elms = div.$$('input[placeholder]'), //length:4
            /** @type {HTMLInputElement[] | undefined} */
            query_data_elms = lesson_thead?.children[0].$$('input:not([id])'); //length:9
        // const data_key_elms = lesson_thead.children[1].$$('th').filter(e => !e.childElementCount); //length:10
        const Lessons = record();
        window['Lessons'] = Lessons;
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopImmediatePropagation();
                document.$('#filter')?.['onclick']();
            }
        });

        function record() {
            //elm => Lesson
            /** @type {HTMLTableRowElement[]} */
            const els = lesson_tbody?.$$('tr[class]') ?? [];
            return els.map((elm) => {
                const id = elm.$('.gridselect input')?.['value'];
                const infos = window['contents'][id]
                    .split('<br>')
                    .map((e) => e.trim().replace(/ +/g, ' ').split(' '));
                const data = elm
                    .$$('td:not([class])')
                    .map((e) => e['innerText']); //length:10
                return { id, elm, infos, data };
            });
        }
        function filter() {
            function isOK_data(lesson) {
                return query_data_elms?.every((e, i) => {
                    const find_string = e.value;
                    return find_string
                        ? lesson.data[i].includes(find_string)
                        : true;
                });
            }
            function isOK_info(lesson) {
                return lesson.infos.some((info) => {
                    return query_info_elms.every((e, i) => {
                        const find_string = e.value;
                        return find_string
                            ? info[i - 1]?.includes(find_string)
                            : true;
                    });
                });
            }
            Lessons.forEach((lesson) => {
                lesson.elm.style.display =
                    isOK_data(lesson) && isOK_info(lesson) ? '' : 'none';
            });
            console.log('筛选成功');
        }
    });
})();
