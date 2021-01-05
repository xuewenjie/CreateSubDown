var bundleList = require('./bundle_list');
var allGameConfig = require('../assets/resources/script/all_game_config');
var fs_expand = require('./fs_expand');
var fs = require('fs');
var create_app_pack={}

var buildInApkList=["9999","0"]
var src="";



create_app_pack.initInfo=function(_buildInApkList,_src){
    buildInApkList=_buildInApkList;
    src=_src;
}


var checkInBuildList=function(dicName){
    for (let i = 0; i < buildInApkList.length; i++) {
        var id=buildInApkList[i];
        var id_name=allGameConfig[id];
        var bundleInfo=bundleList[id_name];
        if (bundleInfo) {
            for (let j = 0; j < bundleInfo.length; j++) {
                if ((dicName+'')==bundleInfo[j]) {
                    return true;
                }
            }
        }
    }
    return false;
}

create_app_pack.removeOtherPack=function(){

    // if (!fs.existsSync(copysrc)) {
    //     fs.mkdirSync(copysrc);
    // }else{
    //     fs_expand.removeDir(copysrc);
    //     fs.mkdirSync(copysrc);
    // }

    //暂时去掉copy这一步
    var subpaths = fs.readdirSync(src);
    // for (let i = 0; i < subpaths.length; i++) {
    //     if (subpaths[i][0] === '.') {
    //         continue;
    //     }
    //     fs_expand.copyDir(src+subpaths[i]+"/",copysrc+subpaths[i]+"/");
    // }

    for (let i = 0; i < subpaths.length; i++) {
        if (subpaths[i][0] === '.') {
            continue;
        }
        var isIn=checkInBuildList(subpaths[i]);
        if (!isIn) {
            fs_expand.removeDir(src+subpaths[i]);
        }
    }

    //TODO:把game_version_project.manifest里面的内容删减，只保留打在包里的内容
    //console.log("操作成功，下面可用开始打包了")
}


module.exports = create_app_pack;