# 怎么用这些脚本？
首先你需要在浏览器安装 **油猴插件**  
在油猴的 **管理面板** 中新建用户脚本  
复制本仓库的脚本源码，全部粘贴至新建脚本中
# 脚本说明（部分）
## [上师大助手.js](/上师大助手.js)
健康之路自动填报：  
进入 https://yqfk.shnu.edu.cn/Default.aspx 后自动填写提交  
如果不想自动提交，可以在28行代码前加上`//`，将这行代码注释  

学习通直达：http://shnu.fy.chaoxing.com/portal 默认为cas登录  

统一认证登录：https://cas.shnu.edu.cn/cas/login?service=* 根据历史用户密码登录  

教务系统定位至课表：  
打开 https://course.shnu.edu.cn/eams/home.action 直接转到课表  
如果网页显示操作过快，可以修改65行的数字`200`，`200`表示每200ms跳转至课表一次，直至到达课表
## 
