/**
 * purpose：     ajax通用解决方案
 * author：      仲强
 * version:      1.0
 * date:         2016-11-29
 * email:        gerry.zhong@outlook.com
*/
(function(window){
    //ajax参数
    var initParam ={
        time:10000,                             //超时时间（单位：毫秒）
        type:"",                                //请求类型（get、post...）
        url:"",                                 //请求接口
        data:"",                                //请求参数（格式：json对象）  例子：{"name":"gerry","age":"88"}
        async:true,                             //同|异步请求 （异步：true 同步：false）
        crossDomain:false,                     //是否为跨域请求（跨域：true 非跨域：false）
        dataType:'',                            //返回值处理（可拓展）   目前只实现：JSON
        success:function(data){},               //请求成功处理事件
        error:function(x,xx,xxx){},             //请求失败处理事件
        timeout:function(){},                   //请求超时处理事件
        requestHeader:{}                        //报文头设置（可自定义报文头）
    };

    var tool = {
        hasOwn: function(obj, key){
            return Object.prototype.hasOwnProperty.call(obj, key)
        },

        keys: function(obj){
            if(Object.keys){
                return Object.keys(obj)
            }

            var keys = []
            for(var key in obj){
                if(this.hasOwn(obj, key)) keys.push(key)
            }
            return keys
        }
        //each循环
        each:function(obj,callback){
            var keys = this.keys(obj)
            var i = 0, len = keys.length, key, item;
            while( i < len ){
              key = keys[i++];
              item = obj[key];
              callback.call(obj, item, index);
            }
        },
        //合并对象,将第二个合并到第一个对象上
        MergeObject:function(target,source){
            if(Object.assign){
                return Object.assign(target, source)
            }
            var targetKeys = this.keys(target), 
                sourceKyes = this.keys(source),
                i = 0
                len = sourceKyes.length;
            while( i < len ){
                key = sourceKyes[i++]
                target[key] = source[key];
            }
            return target;
        },
        //创建xhr对象
        createXhrObject:function(){
            var xhr;
            try{
                // IE7 已经有了XMLHttpRequest对象
                XMLHttpRequest?(xhr= new XMLHttpRequest()):(xhr= new ActiveXObject('Microsoft.XMLHTTP'));
            }catch (e){
                throw new Error('ajax:Could not create an XHR object.')
            };
            return xhr;
        },
        //ajax参数处理，可拓展
        dealWithParam:function(ajaxSetting,that,xhr){
            switch (ajaxSetting.type.toUpperCase()) {
                case "GET":
                    var getParam = "?";
                    tool.each(ajaxSetting.data,function(item,index){
                        getParam +=(encodeURI(index)+"="+encodeURI(item)+"&")
                    });
                    //处理最后一位"&"符号，其实不处理也没事，强迫症犯了，尴尬
                    getParam =getParam.substr(0,getParam.length-1);
                    //打开请求
                    xhr.open(ajaxSetting.type.toUpperCase(), ajaxSetting.url+=getParam, ajaxSetting.async);
                    break;
                case "POST":
                    //打开请求
                    xhr.open(ajaxSetting.type.toUpperCase(), ajaxSetting.url, ajaxSetting.async);
                    var postParam ="";
                    xhr.setRequestHeader("content-type","application/x-www-form-urlencoded");
                    tool.each(ajaxSetting.data,function(item,index){
                        postParam +=(index+"="+item+"&")
                    });
                    //处理最后一位"&"符号，其实不处理也没事，强迫症犯了，尴尬
                    postParam =postParam.substr(0,postParam.length-1);
                    that.postParam = postParam;
                    break;
            };
            return xhr;
        },
        /*
         * 自动根据url进行跨域报头填充(PS:该逻辑还需大量测试)
         *   接口类型：1:以http或者https开头的    2: 直接以域名或者IP地址开头的
         *       a:  截取http开头 到第3个/的字符串作为域名
         *       b:  截取开头到第1个/的字符串作为域名
         * */
        addCoreHeader:function(xhr,ajaxSetting){
            var isHasHttp = /^http/.test(ajaxSetting.url);
            var webSite = "";
            isHasHttp?(webSite = ajaxSetting.url.substring(0,ajaxSetting.url.indexOf("/",7))):(webSite = ajaxSetting.url.substring(0,ajaxSetting.url.indexOf("/")))
            xhr.setRequestHeader("Access-Control-Allow-Origin",webSite);
            return xhr;
        },
        //判断IE版本
        // 如果不是IE，返回 true
        // 若是IE，返回IE版本号
        getIEVersion:function(){
            return function() {
                // 能进到这里来，说明一定是IE
                if (window.VBArray) {
                    // 取出IE的版本
                    var mode = document.documentMode
                    // IE6、IE7 不支持documentMode，那就使用XMLHttpRequest，支持的就是IE7，否则就是IE6
                    // 至于支持documentMode的IE，则直接return
                    return mode ? mode : window.XMLHttpRequest ? 7 : 6
                } else {
                    return NaN
                }
            }()
        }
    };

    var tempObj ={
        //通用ajax
        common:function(options){
            //合并参数对象
            var ajaxSetting = tool.MergeObject(initParam,options);

            //创建xhr对象
            var xhr = tool.createXhrObject();

            //针对某些特定版本的mozillar浏览器的BUG进行修正
            xhr.overrideMimeType?(xhr.overrideMimeType("text/javascript")):(null);

            //针对IE8的xhr做处理    PS：ie8下的xhr无xhr.onload事件，所以这里做判断
            xhr.onload===undefined?(xhr.xhr_ie8=true):(xhr.xhr_ie8=false);

            //参数处理（get和post）,包括xhr.open     get:拼接好url再open   post:先open，再设置其他参数
            ajaxSetting.data === ""?(null):(xhr = tool.dealWithParam(ajaxSetting,this,xhr));

            //设置超时时间（只有异步请求才有超时时间）
            ajaxSetting.async?(xhr.timeout = ajaxSetting.time):(null);

            //设置http协议的头部
            tool.each(ajaxSetting.requestHeader,function(item,index){xhr.setRequestHeader(index,item)});

            //判断并设置跨域头部信息
            (ajaxSetting.crossDomain)?(xhr = tool.addCoreHeader(xhr,ajaxSetting)):(null);

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

            //发送请求
            xhr.send((function(result){result == undefined?(result =null):(null);return result;})(this.postParam));
        },
        //异步get请求
        get:function(url,data,success,error,timeout){
            var ajaxParam ={
                type:"get",
                url:url,
                data:data,
                success:success,
                error:error,
                timeout:timeout
            };
            ajax.common(ajaxParam);
        },
        //异步post请求
        post:function(url,data,success,error,timeout){
            var ajaxParam ={
                type:"post",
                url:url,
                data:data,
                success:success,
                error:error,
                timeout:timeout
            };
            ajax.common(ajaxParam);
        },
        //同步get请求
        // get_sync 不符合 javascript 的风格。
        // 例如 node.js 中的同步版本的方法名称都为驼峰方式。如 fs.readFileSync
        getSync:function(url,data,success,error,timeout){
            var ajaxParam ={
                type:"get",
                url:url,
                data:data,
                async:false,
                success:success,
                error:error,
                timeout:timeout
            };
            ajax.common(ajaxParam);
        },
        //同步post请求
        postSync:function(url,data,success,error,timeout){
            var ajaxParam ={
                type:"post",
                url:url,
                data:data,
                async:false,
                success:success,
                error:error,
                timeout:timeout
            };
            ajax.common(ajaxParam);
        },
        //跨域get请求
        getCross:function(url,data,success,error,timeout){
            var ajaxParam ={
                type:"get",
                url:url,
                data:data,
                crossDomain:true,
                success:success,
                error:error,
                timeout:timeout
            };
            ajax.common(ajaxParam);
        },
        //跨域post请求
        postCross:function(url,data,success,error,timeout){
            var ajaxParam ={
                type:"post",
                url:url,
                data:data,
                crossDomain:true,
                success:success,
                error:error,
                timeout:timeout
            };
            ajax.common(ajaxParam);
        }
    };

    var outputObj = function(){
        //虽然在IE6、7上可以支持，但是最好升级你的浏览器，毕竟xp已经淘汰，面向未来吧，骚年，和我一起努力吧！！
        if( tool.getIEVersion() < 7 ){
            //实在不想说：lowB，升级你的浏览器吧
            throw new Error ("Sorry,please upgrade your browser.(IE8+)");
        }

        return tempObj;
      
    };
    window.ajax = new outputObj();
})(this);