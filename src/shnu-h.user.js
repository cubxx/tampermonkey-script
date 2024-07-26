// ==UserScript==
// @name        shnu-h
// @version     0.1
// @author      cubxx
// @match       *://*.shnu.edu.cn/*
// @match       *://shnu.fy.chaoxing.com/portal
// @updateURL   https://cdn.jsdelivr.net/gh/cubxx/tampermonkey-script/src/shnu-h.user.js
// @downloadURL https://cdn.jsdelivr.net/gh/cubxx/tampermonkey-script/src/shnu-h.user.js
// @icon        https://cas.shnu.edu.cn/cas/comm/image/shnuicon.ico
// @grant       none
// ==/UserScript==

(function () {
  'use strict';
  const { $, $$, log } = tm;
  tm.matchURL(
    //学习通免登录
    [
      /shnu.fy.chaoxing.com\/portal/,
      () => {
        location.href = 'https://i.mooc.chaoxing.com/';
      },
    ],
    //cas自动登录
    [
      /cas.shnu.edu.cn\/cas\/login\?service=/,
      () => {
        (function submit() {
          const cuid = $('#un'),
            pd = $('#pd'),
            btn = $('.login_box_landing_btn');
          //@ts-ignore
          if (btn && cuid.value && pd.value) btn.click();
          else {
            setTimeout(submit, 1e3);
          }
        })();
      },
    ],
    //教务系统
    [
      /^https\:\/\/course.shnu.edu.cn\/eams\/home.action$/,
      () => {
        setTimeout(() => {
          const grp = $$('.menu > li').filter(
            (e) => e.el.innerText === '公共服务',
          )[0];
          const btn = grp
            ?.$$('li>a')
            .filter((e) => e.el.innerText === '全校开课查询')[0];
          let currentUrl = '';
          btn?.set({
            innerText: btn.el.innerText + '\n(双击运行脚本)',
            onmouseenter() {
              currentUrl = location.href;
            },
            ondblclick() {
              open(currentUrl + '&pageNo=1&pageSize=10000');
            },
          });
        }, 1e3);
      },
    ],
    //查找课程
    [
      /course.shnu.edu.cn\/eams\/stdSyllabus!search.action/,
      () => {
        //添加input元素
        const inputs = ['星期', '节次', '周次', '教室']
          .map((e) =>
            $.h('input', {
              style: 'width: 70px',
              placeholder: e,
            }),
          )
          .concat(
            $.h('input', {
              id: 'filter',
              type: 'button',
              value: '脚本筛选',
              onclick() {
                const has_find_string = query_info_elms
                  .concat(query_data_elms ?? [])
                  .some((e) => !!e.el.value);
                if (has_find_string) {
                  filter();
                }
              },
            }),
          );
        const div = $.h('div', {}, inputs);
        div.mount('#taskListForm .gridbar');
        //定义变量
        const lesson_thead = $('#taskListForm thead'),
          lesson_tbody = $('#taskListForm tbody');
        const query_info_elms = div.$$('input[placeholder]'), //length:4
          query_data_elms = lesson_thead?.children[0].$$('input:not([id])'); //length:9
        // const data_key_elms = lesson_thead.children[1].$$('th').filter(e => !e.childElementCount); //length:10
        const Lessons = record();
        window['Lessons'] = Lessons;
        window.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.stopImmediatePropagation();
            $('#filter')?.el['click']();
          }
        });

        function record() {
          //elm => Lesson
          const doms = lesson_tbody?.$$('tr[class]') ?? [];
          return doms.map((dom) => {
            const id = dom.$('.gridselect')?.$('input')?.el.value;
            const infos = window['contents'][id]
              .split('<br>')
              .map((e) => e.trim().replace(/ +/g, ' ').split(' '));
            const data = dom.$$('td:not([class])').map((e) => e.el.innerText); //length:10
            return { id, dom, infos, data };
          });
        }
        function filter() {
          function isOK_data(lesson) {
            return query_data_elms?.every((e, i) => {
              const find_string = e.el.value;
              return find_string ? lesson.data[i].includes(find_string) : true;
            });
          }
          function isOK_info(lesson) {
            return lesson.infos.some((info) => {
              return query_info_elms.every((e, i) => {
                const find_string = e.el.value;
                return find_string ? info[i - 1]?.includes(find_string) : true;
              });
            });
          }
          Lessons.forEach((lesson) => {
            lesson.dom.el.style.display =
              isOK_data(lesson) && isOK_info(lesson) ? '' : 'none';
          });
          log('筛选成功');
        }
      },
    ],
  );
})();
