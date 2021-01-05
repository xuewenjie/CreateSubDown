var hot_update_utils = (function() {
    var storagePath =  "";
    var localPath = "update_version/";
    var emptyFileName="project.manifest";
    var versionFileName="game_version_project";
    var remoteUrl="";
    var assetsManager = null;
    var updateCb =null;
    var successCb =null;

    var gameVersions={};
    var remoteGameVersion={};

    var hotUpdateQueue=[];

    var isUpdating=false;
    
    var nowUpdateGameId="";

    var initHotUpdate = function(_remoteUrl){
        remoteUrl=_remoteUrl;
    };

    //加载所有已经热更过的配置文件
    var loadOrCreateAllManifest=function(cb){
        //从网上下载最新的gameversions，然后赋值给remoteGameVersion
        var url=remoteUrl+versionFileName+".manifest"
        cc.assetManager.loadRemote(url, function (err, Asset) {
            remoteGameVersion=JSON.parse(Asset._nativeAsset);
            // for (const key in remoteGameVersion) {
            //     cc.log("key="+key+"   value="+remoteGameVersion[key]);
            // }
            //cc.sys.localStorage.removeItem('gameVersions');


            gameVersions=cc.sys.localStorage.getItem('gameVersions');
            gameVersions=JSON.parse(gameVersions);

            //cc.log("gameVersions="+gameVersions);
            if (!gameVersions) {
                cc.log("load base manifest path="+localPath+versionFileName);
                cc.resources.load(localPath+versionFileName, cc.Asset, function (error, manifest) {
                    if (error) {
                        cc.log("没有找到默认的版本文件，错误")
                        return;
                    }
                    
                    gameVersions=JSON.parse(manifest._$nativeAsset);
                    cc.sys.localStorage.setItem("gameVersions", JSON.stringify(gameVersions));
                    
                    for (const key in gameVersions) {
                        cc.log("从默认位置读取的游戏的版本key="+key+"   value="+gameVersions[key]);
                    }

                    // var sss=cc.sys.localStorage.getItem('gameVersions');
                    // cc.log("sss="+sss);
                    
                    if (cb) cb();
                });
            }else{
                
                for (const key in gameVersions) {
                    cc.log("已经有的游戏的版本="+key+"="+gameVersions[key]);
                }
                if (cb) cb();
            }
            
        });
    };


    var hasGame=function(gameId){
        gameId = gameId +'';
        var bundle=all_game_config[gameId];
        cc.log("bundle="+bundle+",gameVersions[bundle]="+gameVersions[bundle])
        //查看version是否有这个游戏
        return gameVersions[bundle]?true:false;
    };

    var updateGameVersion=function(){
        if (nowUpdateGameId!="") {
            var gameId=nowUpdateGameId;
            var bundle=all_game_config[gameId];
            var version=remoteGameVersion[bundle];
            var _gameVersions=cc.sys.localStorage.getItem('gameVersions');
            _gameVersions=JSON.parse(_gameVersions);
            _gameVersions[bundle]=version;

            
            cc.sys.localStorage.setItem("gameVersions", JSON.stringify(_gameVersions));
            gameVersions=_gameVersions;
            nowUpdateGameId="";
        }
        
    }

    //是否需要更新，gameId为游戏id，0表示大厅
    var isNeedUpdate=function(gameId){
        gameId = gameId +'';
        var bundle=all_game_config[gameId];
        var versionRemote=remoteGameVersion[bundle];
        var versionlocal=gameVersions[bundle];
        cc.log("versionRemote="+versionRemote+",versionlocal="+versionlocal);
        //远程没有这个版本号，那么就返回不需要更新
        if (versionRemote==null || versionRemote=="") {
            return [false];
        }
        //本地没有这个版本号，那么就返回需要更新
        if (versionlocal==null || versionRemote=="") {
            return [true];
        }
        //TODO:如果在更新列表里，也返回false,提示已经在列表里

        //
        if (versionCompareHandle(versionlocal,versionRemote)<0) {
            //版本号低，需要更新
            return [true];
        }
        //不需要更新
        return [false];
        
    };

    //开始更新，如果当前正在更新，那么将其加入到队列，当前热更完成之后自动启动更新
    var startUpdate = function(gameId,_updateCb,_successCb){
        if (isNeedUpdate(gameId)[0]==false) {
            cc.log("不需要更新");
            if(_successCb) _successCb();
            return;
        }


        if (isUpdating==true) {
            //查看是否已经在等待队列中
            var isExist=false;
            for (let i = 0; i < hotUpdateQueue.length; i++) {
                if (hotUpdateQueue[i].gameId==gameId) {
                    isExist=true;
                }
            }
            if (!isExist) {
                hotUpdateQueue.push({gameId:gameId,updateCb:_updateCb,successCb:_successCb})
            }
            return;
        }
        isUpdating=true;
        // if (isNeedUpdate(gameId)[0]==false) {
        //     //不需要更新
        // }
        

        gameId = gameId +'';
        nowUpdateGameId=gameId;
        updateCb =_updateCb;
        successCb=_successCb;

        var bundle=all_game_config[gameId];

        storagePath=((jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'remote_asset');
        cc.log("storagePath=",storagePath);
        
        if (!jsb.fileUtils.isDirectoryExist(storagePath)) {
            jsb.fileUtils.createDirectory(storagePath);
        }

        var bundlePath=storagePath+"/"+bundle;
        if (!jsb.fileUtils.isDirectoryExist(bundlePath)) {
            jsb.fileUtils.createDirectory(bundlePath);
        }

        

        updateCb=_updateCb;
        successCb=_successCb;

        assetsManager=new jsb.AssetsManager('', bundlePath, versionCompareHandle);

        assetsManager.setVerifyCallback(function (_path, asset) {
            var compressed = asset.compressed;
            var expectedMD5 = asset.md5;
            var relativePath = asset.path;
            var size = asset.size;
            if (compressed) {
                return true;
            }
            else {
                return true;
            }
        });

        if (cc.sys.os   === cc.sys.OS_ANDROID) {
            assetsManager.setMaxConcurrentTask(2);
        };

        getLocalHasManifest(bundle,(url)=>{
            // if (cc.loader.md5Pipe) {
            //     url = cc.loader.md5Pipe.transformURL(url);
            // }
            assetsManager.loadLocalManifest(url);
            checkUpdate();
        });
    };

    //获取本地的manifest，如果不存在,就生成一个默认的
    //TODO:修改成，如果本地存在，就拷贝一份到热更的地址，方便后期修改热更的网络地址
    var getLocalHasManifest = function(bundle,cb){
        cc.log("localPath+bundle+'_project'="+localPath+bundle+'_project')
        cc.resources.load(localPath+bundle+'_project', cc.Asset, function (error, manifest) {
            if (error) {
                var url=createEmptyManifest(bundle);
                if(cb) cb(url);
                return;
            }

            cc.log("getLocalHasManifest=",manifest);

            var manifest=manifest._$nativeAsset;
            manifest=JSON.parse(manifest);
            var buildUrl=remoteUrl+bundle;
            manifest.packageUrl = remoteUrl;
            manifest.remoteManifestUrl = buildUrl + '_project.manifest';
            manifest.remoteVersionUrl = buildUrl + '_project.manifest';
            var url=createManifest(bundle,manifest);
            if(cb) cb(url);
        });
    };

    //生成一个默认的manifest
    var createEmptyManifest = function(bundle){
        var manifest={};
        var buildUrl=remoteUrl+bundle;
        manifest.packageUrl = remoteUrl;
        manifest.remoteManifestUrl = buildUrl + '_project.manifest';
        manifest.remoteVersionUrl = buildUrl + '_project.manifest';
        manifest.version="0.0.0";
        manifest.assets={};
        manifest.searchPaths=[];

        return createManifest(bundle,manifest);


        // var url=storagePath+"\\"+bundle+"\\"+emptyFileName;
        // cc.log("createEmptyManifest url="+url);
        
        // if (!jsb.fileUtils.isDirectoryExist(url)) {
        //     cc.log("start create empty file ")
        //     var manifest={};
        //     var buildUrl=remoteUrl+bundle;
        //     manifest.packageUrl = buildUrl;
        //     manifest.remoteManifestUrl = buildUrl + '_project.manifest';
        //     manifest.remoteVersionUrl = buildUrl + '_project.manifest';
        //     manifest.version="0.0.0";
        //     manifest.assets={};
        //     manifest.searchPaths=[];
        //     jsb.fileUtils.writeStringToFile(JSON.stringify(manifest),url);
        //     cc.log("end create empty file ")
        // }
        // return url;
    };

    var createManifest = function(bundle,manifest){
        var url=storagePath+"\\"+bundle+"\\"+emptyFileName;
        cc.log("createEmptyManifest url="+url);
        
        if (!jsb.fileUtils.isDirectoryExist(url)) {
            jsb.fileUtils.writeStringToFile(JSON.stringify(manifest),url);
            cc.log("end create empty file ")
        }
        return url;
    }

    //检查更新
    var checkUpdate = function () {
        cc.log("开始检查更新");
        if (assetsManager.getState() === jsb.AssetsManager.State.UNINITED) {
            cc.log("请先初始化本地更新文件");
            return;
        }
        if (!assetsManager.getLocalManifest() || !assetsManager.getLocalManifest().isLoaded()) {
            return;
        }
        assetsManager.setEventCallback(checkCb);

        assetsManager.checkUpdate();
        //this._updating = true;
    };

    //检查更新的回调
    var checkCb = function (event) {
        cc.log('Code: ' + event.getEventCode());
        switch (event.getEventCode())
        {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                cc.log("No local manifest file found, hot update skipped.");
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                cc.log("Fail to download manifest file, hot update skipped.");
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                cc.log("Already up to date with the latest remote version.");
                downloadSuccess();
                break;
            case jsb.EventAssetsManager.NEW_VERSION_FOUND:
                assetsManager.setEventCallback(null);
                hotUpdate();
                break;
            default:
                return;
        }
    };

    //开始更新
    var hotUpdate = function () {
        cc.log("检测到更新，开始更新")
        assetsManager.setEventCallback(updateCb1);
        assetsManager.update();
    };

    //更新过程的回调
    var updateCb1= function (event) {
        switch (event.getEventCode())
        {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                dowloadFailed("No local manifest file found, hot update skipped.");
                break;
            case jsb.EventAssetsManager.UPDATE_PROGRESSION:
                // cc.log("downLoad file progress="+event.getDownloadedFiles() + ' / ' + event.getTotalFiles());
                // cc.log("downLoad byte progress="+event.getDownloadedBytes() + ' / ' + event.getTotalBytes());
                if (updateCb) updateCb(event.getDownloadedFiles(),event.getTotalFiles());
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                //cc.log("Fail to download manifest file, hot update skipped.");
                dowloadFailed("Fail to download manifest file, hot update skipped.");
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                //cc.log("Already up to date with the latest remote version.");
                dowloadFailed("Already up to date with the latest remote version.");
                break;
            case jsb.EventAssetsManager.UPDATE_FINISHED:
                //cc.log("Update finished.");
                downloadSuccess();
                break;
            case jsb.EventAssetsManager.UPDATE_FAILED:
                //cc.log("Update failed.");
                dowloadFailed("Update failed.");
                break;
            case jsb.EventAssetsManager.ERROR_UPDATING:
                //cc.log('Asset update error: ' + event.getAssetId() + ', ' + event.getMessage());
                dowloadFailed('Asset update error: ' + event.getAssetId() + ', ' + event.getMessage());
                break;
            case jsb.EventAssetsManager.ERROR_DECOMPRESS:
                dowloadFailed(jsb.EventAssetsManager.ERROR_DECOMPRESS);
                break;
            default:
                break;
        }

    };

    //热更成功
    var downloadSuccess = function(){
        cc.log("热更成功,gameId="+nowUpdateGameId);
        assetsManager.setEventCallback(null);
        //var searchPaths = jsb.fileUtils.getSearchPaths();
        //mylog.xwj.log("searchPaths=",searchPaths);
        // var newPaths = assetsManager.getLocalManifest().getSearchPaths();
        // console.log(JSON.stringify(newPaths));

        //var bundle=all_game_config[nowUpdateGameId];
        //var newPaths=storagePath+"\\"+bundle;
        //console.log("newPaths="+newPaths);
        //console.log("searchPaths1="+searchPaths);

        //Array.prototype.unshift.apply(searchPaths, newPaths);
        //console.log("searchPaths2="+searchPaths);
        //jsb.fileUtils.setSearchPaths(searchPaths);

        cc.log("热更成功2");
        isUpdating=false;
        //cc.log("重置searchPaths成功");
        if (nowUpdateGameId=="9999") {
            updateGameVersion();
            cc.log("热更成功,热更了基础模块，刷新下游戏");
            cc.game.restart();
        }else{
            successCb();
            updateGameVersion();
            needNextUpdate();
        }
        
    };

    //热更失败
    var dowloadFailed = function(error){
        assetsManager.setEventCallback(null);
        isUpdating=false;
        successCb(error);
    };

    //检查热更队列里是否有在等待的热更，有的话取出来就继续更新
    var needNextUpdate = function(){
        //{gameId:gameId,updateCb:_updateCb,successCb:_successCb}
        if (hotUpdateQueue.length>0) {
            startUpdate(hotUpdateQueue[0].gameId,hotUpdateQueue[0].updateCb,hotUpdateQueue[0].successCb);
            hotUpdateQueue.splice(0, 1);
        }
    };

    //更新版本比较函数 <0表示需要更新
    var versionCompareHandle = function(versionA, versionB){
        cc.log("JS Custom Version Compare: version A is " + versionA + ', version B is ' + versionB);
        var vA = versionA.split('.');
        var vB = versionB.split('.');
        for (var i = 0; i < vA.length; ++i) {
            var a = parseInt(vA[i]);
            var b = parseInt(vB[i] || 0);
            if (a === b) {
                continue;
            }
            else {
                return a - b;
            }
        }
        if (vB.length > vA.length) {
            return -1;
        }
        else {
            return 0;
        }
    };

    var addGameSearchPath = function(gameId){
        gameId = gameId +'';
        var bundle=all_game_config[gameId];
        var _storagePath=((jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'remote_asset');
        _storagePath=_storagePath+"/"+bundle;

        jsb.fileUtils.addSearchPath(_storagePath);
    };

    /**
     * 修改.manifest文件
     * @param {新的升级包地址} newAppHotUpdateUrl 
     * @param {本地project.manifest文件地址} localManifestPath 
     * @param {修改manifest文件后回调} resultCallback 
     */
    var modifyAppLoadUrlForManifestFile=function(gameId,newAppHotUpdateUrl) {
        try {
            gameId = gameId +'';
            var bundle=all_game_config[gameId];
            var _storagePath=((jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'remote_asset');
            _storagePath=_storagePath+"/"+bundle;

            if (jsb.fileUtils.isFileExist(_storagePath + '/project.manifest')) {
                console.log("有下载的manifest文件");
                let loadManifest = jsb.fileUtils.getStringFromFile(storagePath + '/project.manifest');
                let manifestObject = JSON.parse(loadManifest);
                manifestObject.packageUrl = newAppHotUpdateUrl;
                manifestObject.remoteManifestUrl = manifestObject.packageUrl+"/"+bundle + '_project.manifest';
                manifestObject.remoteVersionUrl = manifestObject.packageUrl+"/"+bundle + '_project.manifest';
                let afterString = JSON.stringify(manifestObject);
                let isWritten = jsb.fileUtils.writeStringToFile(afterString, storagePath + '/project.manifest');
                console.log("Written Status : ", isWritten);
            }
            // else {
            //     /**
            //      * 执行到这里说明App之前没有进行过热更，所以不存在热更的remoteAssets文件夹。
            //      */

            //     /**
            //      * remoteAssets文件夹不存在的时候，我们就主动创建“remoteAssets”文件夹，并将打包时候的project.manifest文件中升级包地址修改后，存放到“remoteAssets”文件夹下面。
            //      */
            //     let initializedManifestPath = ((jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'remoteAssets');
            //     if (!jsb.fileUtils.isDirectoryExist(initializedManifestPath)) jsb.fileUtils.createDirectory(initializedManifestPath);

            //     console.log("storagePath==", initializedManifestPath);
            //     console.log("没有下载的manifest文件", newAppHotUpdateUrl);
            //     console.log("新的地址->", newAppHotUpdateUrl);
            //     console.log("本地manifest文件地址->", localManifestPath);
            //     //修改原始manifest文件
            //     let originManifestPath = localManifestPath;
            //     let originManifest = jsb.fileUtils.getStringFromFile(originManifestPath);
            //     let originManifestObject = JSON.parse(originManifest);
            //     originManifestObject.packageUrl = newAppHotUpdateUrl;
            //     originManifestObject.remoteManifestUrl = originManifestObject.packageUrl + 'project.manifest';
            //     originManifestObject.remoteVersionUrl = originManifestObject.packageUrl + 'version.manifest';
            //     let afterString = JSON.stringify(originManifestObject);
            //     let isWritten = jsb.fileUtils.writeStringToFile(afterString, initializedManifestPath + '/project.manifest');
            //     resultCallback(initializedManifestPath + '/project.manifest');
            //     if (isWritten) {
            //         cc.sys.localStorage.setItem("appHotUpdateUrl", newAppHotUpdateUrl);
            //     }
            //     console.log("Written Status : ", isWritten);
            // }

        } catch (error) {
            console.log("读写manifest文件错误!!!(请看错误详情-->) ", error);
        }

    };

    return {
        initHotUpdate:initHotUpdate,
        loadOrCreateAllManifest:loadOrCreateAllManifest,
        startUpdate:startUpdate,
        isNeedUpdate:isNeedUpdate,
        hasGame:hasGame,
        addGameSearchPath:addGameSearchPath,
        modifyAppLoadUrlForManifestFile:modifyAppLoadUrlForManifestFile,
    };
})();

module.exports = hot_update_utils;
