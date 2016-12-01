# ajax
ajax设计方案封装库

####整理原声ajax设计方案原因如下：
  1. 从资源合理利用的角度以及网站优化角度去想，每次为了那几个功能，去引用一个框架，不划算
  2. 拜读了w3c的ajax的设计方案，包括level1和level2的规范，有种豁然开朗的感觉
  3. 有朋友遇到ajax的跨域方案，各种纠结在心里，导致内心不能舒畅
  4. 自己的框架底层也要需要用到ajax的基础功能，（get post请求，对于level2的上传暂时没用到）
  5. 最关键的也是之前对这块概念十分模糊，所以开始整理ajax这块的设计方案

####一些概念：
  * 浏览器的同源策略：浏览器最基本的安全功能，同源是指，域名，协议，端口相同（所以我写的接口部署端口分别为1122和2211即不是同源，属于跨域）    
  * ajax：是一种技术方案，依赖的是CSS/HTML/Javascript，最核心依赖是浏览器提供的XMLHttpRequest对象，这个对象使得浏览器可以发出HTTP请求与接收HTTP响应。 
  * nginx：是一个高性能的HTTP和反向代理服务器    
  * IIS:微软开发的的服务器，window系统自带  
  * XMLHttpRequest 兼容性如下：       
  ![](http://images2015.cnblogs.com/blog/801930/201611/801930-20161129224459115-1023971996.png)
  * XMLHttpRequest Level 1主要存在以下缺点：
    1. 受同源策略的限制，不能发送跨域请求；
    2. 不能发送二进制文件（如图片、视频、音频等），只能发送纯文本数据；
    3. 发送和获取数据的过程中，无法实时获取进度信息，只能判断是否完成；   
  * XMLHttpRequest Level 1主要存在以下缺点：
    1. 可以发送跨域请求，在服务端允许的情况下；
    2. 支持发送和接收二进制数据；
    3. 新增formData对象，支持发送表单数据；   
    4. 发送和获取数据时，可以获取进度信息；   
    5. 可以设置请求的超时时间；   

####开始准备如下：
  * 纯前端代码
  * nginx反向代理服务器（前后端分离用）
  * 后台2套接口（端口：1122，端口：2211）  PS：一份必须支持跨域请求
  * IIS服务器（部署后台接口）
  * chrome插件postman（接口测试）
  * IE、chrome、firefox、Opera、safari、edge 6大浏览器，做兼容性测试
  
###XMLHttpRequest发送请求步骤：
  1. 实例化XMLHttpRequest对象（IE8-9是微软封装的ActiveXObject('Microsoft.XMLHTTP')）获得一个实例
  2. 通过实例open一个请求，设置发送类型和接口以及同异步
  3. 如有需要配置报文，以及各种事件（success，error，timeout等）
  4. IIS服务器（部署后台接口）
  5. 调用实例的send方法，发送http/https的请求
  6. 服务器回调，客户端接收，并做响应处理
  
####核心代码：
    //创建xhr对象
    var xhr = createXhrObject();

    //针对某些特定版本的mozillar浏览器的BUG进行修正
    xhr.overrideMimeType?(xhr.overrideMimeType("text/javascript")):(null);

    //针对IE8的xhr做处理 PS：ie8下的xhr无xhr.onload事件，所以这里做判断
    xhr.onload===undefined?(xhr.xhr_ie8=true):(xhr.xhr_ie8=false);

    //参数处理（get和post）,包括xhr.open     get:拼接好url再open   post:先open，再设置其他参数
    ajaxSetting.data === ""?(null):(xhr = dealWithParam(ajaxSetting,this,xhr));

    //设置超时时间（只有异步请求才有超时时间）
    ajaxParam.async?(xhr.timeout = ajaxSetting.time):(null);

    //设置http协议的头部
    each(ajaxSetting.requestHeader,function(item,index){xhr.setRequestHeader(index,item)});
    //onload事件（IE8下没有该事件）
    xhr.onload = function(e) {
        if(this.status == 200||this.status == 304){
            ajaxSetting.dataType.toUpperCase() == "JSON"?(ajaxSetting.success(JSON.parse(xhr.responseText))):(ajaxSetting.success(xhr.responseText));
        }else{
            /*
             *  这边为了兼容IE8、9的问题，以及请求完成而造成的其他错误，比如404等
             *   如果跨域请求在IE8、9下跨域失败不走onerror方法
             *       其他支持了Level 2 的版本 直接走onerror
             * */
            ajaxSetting.error(e.currentTarget.status, e.currentTarget.statusText);
        }
    };

    //xmlhttprequest每次变化一个状态所监控的事件（可拓展）
    xhr.onreadystatechange = function(){
        switch(xhr.readyState){
            case 1://打开
                //do something
                break;
            case 2://获取header
                //do something
                break;
            case 3://请求
                //do something
                break;
            case 4://完成
                //在ie8下面，无xhr的onload事件，只能放在此处处理回调结果
                xhr.xhr_ie8?((xhr.status == 200 || xhr.status == 304)?(ajaxSetting.dataType.toUpperCase() == "JSON"?(ajaxSetting.success(JSON.parse(xhr.responseText))):(ajaxSetting.success(xhr.responseText))):(null)):(null);
                break;
        };
    };

    //ontimeout超时事件
    xhr.ontimeout = function(e){
        ajaxSetting.timeout(999,e?(e.type):("timeout"));   //IE8 没有e参数
        xhr.abort();  //关闭请求
    };

    //错误事件，直接ajax失败，而不走onload事件
    xhr.onerror = function(e){
        ajaxSetting.error();
    };

    xhr.send((function(result){this.postParam == undefined?(result =null):(result=this.postParam);return result;})(this.postParam));
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
