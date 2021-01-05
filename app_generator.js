var create_app_pack = require('./hotupdate/create_app_pack')
var fs_expand = require('./hotupdate/fs_expand');
var fs = require('fs');
var allGameConfig = require('./assets/resources/script/all_game_config');
var path = require('path');
var create_pack=require('./hotupdate/create_pack');

var buildInApkList=["9999","0"]
var src="";

var copySrc="";
var dest="";
var buildUrl="";

var i = 2;
while ( i < process.argv.length) {
    var arg = process.argv[i];

    
    switch (arg) {
    case '-in' :
        var listStr=process.argv[i+1];
        var list = listStr.split(',');
        for (let i = 0; i < list.length; i++) {
            buildInApkList.push(list[i]+'');
        }
        i += 2;
        break;
    case '-s' :
        src = process.argv[i+1];
        i += 2;
        break;
    case '-sc' :
        copySrc = process.argv[i+1];
        i += 2;
        break;
    case '-d' :
        dest = process.argv[i+1];
        i += 2;
        break;
    case '-u' :
        buildUrl = process.argv[i+1];
        i += 2;
        break;
    default :
        i++;
        break;
    }
}


// var checkInBuildList=function(dicName){
//     for (let i = 0; i < buildInApkList.length; i++) {
//         //console.log("buildInApkList="+buildInApkList[i]);
//         var id=buildInApkList[i];
//         var id_name=allGameConfig[id];
//         var bundleInfo=bundleList[id_name];
//         if (bundleInfo) {
//             for (let j = 0; j < bundleInfo.length; j++) {
//                 //console.log("bundleInfo[j]="+bundleInfo[j]);
//                 if ((dicName+'')==bundleInfo[j]) {
//                     return true;
//                 }
//             }
//         }
//     }
//     return false;
// }

// var removeOtherPack=function(){

//     if (!fs.existsSync(copysrc)) {
//         fs.mkdirSync(copysrc);
//     }else{
//         fs_expand.removeDir(copysrc);
//         fs.mkdirSync(copysrc);
//     }

//     var subpaths = fs.readdirSync(src);
//     for (let i = 0; i < subpaths.length; i++) {
//         if (subpaths[i][0] === '.') {
//             continue;
//         }
//         fs_expand.copyDir(src+subpaths[i]+"/",copysrc+subpaths[i]+"/");
//     }


//     for (let i = 0; i < subpaths.length; i++) {
//         if (subpaths[i][0] === '.') {
//             continue;
//         }
//         var isIn=checkInBuildList(subpaths[i]);
//         if (!isIn) {
//             fs_expand.removeDir(src+subpaths[i]);
//         }
//     }

//     //TODO:把game_version_project.manifest里面的内容删减，只保留打在包里的内容
//     console.log("操作成功，下面可用开始打包了")
// }

create_app_pack.initInfo(buildInApkList,src);

create_app_pack.removeOtherPack();

//删除对应目录下的文件
if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest);
}else{
    fs_expand.removeDir(dest);
    fs.mkdirSync(dest);
}

//fs_expand.removeDir(dest)
//拷贝pack到目录下
for (let i = 0; i < buildInApkList.length; i++){
    var packAge=allGameConfig[buildInApkList[i]];
    // copysrc=>dest
    //name = packAge+'_project.manifest'
    var copyToFile=path.join(dest, packAge+'_project.manifest');
    var targetFile=path.join(copySrc, packAge+'_project.manifest');
    fs.copyFileSync(targetFile,copyToFile);
}
//生成新的版本文件到目录下
//dest
//path=path.join(dest, 'game_version_project.manifest')
create_pack.initInfo("","",dest);
for (let i = 0; i < buildInApkList.length; i++){
    var packAge=allGameConfig[buildInApkList[i]];
    create_pack.initManifest(packAge);
    create_pack.buildGameVersion(buildInApkList[i]);
}
