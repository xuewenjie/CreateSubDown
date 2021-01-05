require("hot_update_jsloader")

cc.Class({
    extends: cc.Component,

    properties: {
        progressLbl:cc.Label,
    },

    start () {

        // var storagePath=((jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'remote_asset');
        // cc.log("storagePath=",storagePath);

        this.startHotUpdate("http://192.168.2.103:8080/job/NewHidog_Android/ws/assetsPack/");
    },


    //开始检查热更
    startHotUpdate(remoteUrl){
        if (CC_JSB&&!CC_PREVIEW||true) {
            cc.log("CC_JSB&&!CC_PREVIEW")
            hot_update_utils.initHotUpdate(remoteUrl);
            hot_update_utils.loadOrCreateAllManifest(()=>{
                //热更resources 热更lobby
                //检查resources是否需要热更，该热更需要重启游戏，所以会有黑屏一下的问题
                //然后检查lobby是否需要热更,结束后进入游戏
                this.hotUpdateResources();
                // //再查看大厅是否需要热更
                // //hot_update_utils.startUpdate(9999,()=>{},()=>{});
            });
        }else{
            cc.log("模拟器或者非NATIVE下不需要检查热更，直接进入游戏");
            this.progressLbl.string+="模拟器或者非NATIVE下不需要检查热更，直接进入游戏\n";
            this.loadGame();
        }
    },

    //开始检查基础模块热更
    hotUpdateResources(){
        cc.log("开始检查基础模块热更")
        this.progressLbl.string+="开始检查基础模块热更\n";
        if (hot_update_utils.isNeedUpdate(9999)[0]) {
            hot_update_utils.startUpdate(9999,this.hotUpdateResourcesCb.bind(this),()=>{this.hotUpdateLobby()})
        }else{
            cc.log("基础模块不需要更新")
            this.progressLbl.string+="基础模块不需要更新\n";
            this.hotUpdateLobby();
        }
    },

    hotUpdateResourcesCb(){
        
    },

    //开始检查大厅模块热更
    hotUpdateLobby(){
        cc.log("开始检查大厅模块热更")
        this.progressLbl.string+="开始检查大厅模块热更\n";
        if (hot_update_utils.isNeedUpdate(0)[0]) {
            hot_update_utils.startUpdate(0,this.hotUpdateLobbyCb.bind(this),()=>{this.loadGame()})
        }else{
            cc.log("大厅模块不需要更新")
            this.progressLbl.string+="大厅模块不需要更新\n";
            this.loadGame();
        }
    },

    hotUpdateLobbyCb(){

    },

    //开始游戏
    loadGame:function(){

        cc.log("开始游戏，加载大厅和公共资源的Bundle");

        function cb (err) {
            if (err) {
                cc.log("加载错误")
                return;
            }
            function cb (err) {
                if (err) {
                    cc.log("加载错误")
                    return;
                }
                let bundle = cc.assetManager.getBundle('lobby');
    
                cc.log("加载结束，跳转到MainScene");
                this.progressLbl.string+="加载结束，跳转到MainScene\n";
                bundle.loadScene('main_scene', function (err, scene) {
                    if (err) {
                        cc.log("加载错误",err);
                        return;
                    }
                    cc.director.runScene(scene);
                });
                
            }
            cc.assetManager.loadBundle("lobby", cb.bind(this));
        }
        cc.assetManager.loadBundle("game_com", cb.bind(this));
    },


});
