// Learn cc.Class:
//  - https://docs.cocos.com/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        enterGame1Btn:cc.Button,
        downGame1Btn:cc.Button,
        enterGame2Btn:cc.Button,
        downGame2Btn:cc.Button,
        msgLbl:cc.Label,
        gameLayer:cc.Node,
    },


    start () {
        this.enterGame1Btn.node.on('click',this.enterGame1,this);
        this.downGame1Btn.node.on('click',this.downGame1,this);
        this.enterGame2Btn.node.on('click',this.enterGame2,this);
        this.downGame2Btn.node.on('click',this.downGame2,this);
    },

    enterGame1(){
        if (!hot_update_utils.hasGame(2)) {
            this.msgLbl.string="没有这个游戏，需要下载"
            return;
        }
        cc.log("enterGame1");
        if (hot_update_utils.isNeedUpdate(2)[0]) {
            this.msgLbl.string="有这个游戏，但需要更新"
            return;
        }
        
        cc.log("进入游戏");
        this.msgLbl.string="进入游戏"

        hot_update_utils.addGameSearchPath(2);
        function cb (err) {
            // if (err) {
            //     cc.log("加载错误")
            //     return;
            // }
            // let bundle = cc.assetManager.getBundle(all_game_config["2"]+"_res");

            // bundle.load(`ui/prefab/game_layout_test`,cc.Prefab, (err,prefab)=>{
            //     let newNode = cc.instantiate(prefab);
            //     this.node.addChild(newNode);
            // });
        }

        cc.assetManager.loadBundle(all_game_config["2"]+"_res", cb.bind(this));
    },

    downGame1(){
        if (hot_update_utils.isNeedUpdate(2)[0]) {
            this.msgLbl.string="开始更新游戏"
            hot_update_utils.startUpdate(2,
                ()=>{},
                ()=>{
                    this.msgLbl.string="游戏更新结束"
                })
        }else{
            this.msgLbl.string="不需要更新游戏"
        }
        cc.log("downGame1");
    },

    enterGame2(){
        cc.log("enterGame2");
    },

    downGame2(){
        cc.log("downGame2");
    },
});
