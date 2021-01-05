//Tips:版本号规则为x1.x2.x3
//x1为整个版本更新，如果对应客户端获得的x1比服务端的小，那么就不进行热更
//x2为进行整包更新的时候，会对所有版本的版本号设置
//x3为单个游戏包更新，对单个游戏包的版本号设置
//TODO:目前只能暂时通过人为调用命令行设置，后续看看是否有其他方案来自动设置，如：选择整个版本更新，自动对x1+1，选择整包更新，自动对x2+1，选择单个游戏更新，自动对x3+1

//############################具体的打包配置，不区分了，直接写到文件里来#############################//
// var bundleList = {};

// var _resources="resources";
// bundleList[_resources]=[
//     "resources",
//     "game_com",
//     "com_snd"
// ];

// var _2_hzmj="2_hzmj";
// bundleList[_2_hzmj]=[
//     "2_hzmj_res",
//     "2_hzmj_snd",
// ];

//############################具体的打包配置，不区分了，直接写到文件里来#############################//
var allGameConfig = require('./assets/resources/script/all_game_config');
var bundleList = require('./hotupdate/bundle_list');

var create_pack=require('./hotupdate/create_pack');


//var buildVersion="1.0.0";
var buildVersion="";
//var buildUrl="http://localhost/remote-assets/";
var buildUrl="";
//var dest = './remote-assets/';
var dest = '';
//var src = './jsb/';
var src = '';

// var copySrc='';

//Tips:版本号规则为x1.x2.x3
//0:全部打包，1：打包大厅 2：打包单个游戏 3全部打包（提升大版本号）
//0:所有更新包的 x2+1, 1.resouces的 x3+1 2.单独游戏的x3+1 3. 所有的x1+1
var buildType=-1;
var packGameId=-1;


// Parse arguments
var i = 2;
while ( i < process.argv.length) {
    var arg = process.argv[i];

    
    switch (arg) {
    case '-u' :
        buildUrl = process.argv[i+1];
        i += 2;
        break;
    case '-v' :
        buildVersion=process.argv[i+1];
        i += 2;
        break;
    case '-s' :
        src = process.argv[i+1];
        i += 2;
        break;
    case '-d' :
        dest = process.argv[i+1];
        i += 2;
        break;
    // case '-ds' :
    //     copySrc = process.argv[i+1];
    //     i += 2;
    //     break;
    case '-buildType':
        buildType=process.argv[i+1];
        i += 2;
        break;
    case '-gameId':
        packGameId=process.argv[i+1];
        i += 2;
        break;
    default :
        i++;
        break;
    }
}




if (buildType==-1) {
    console.log("please input buildType like -buildType 0 tips 0:全部打包，1：打包大厅 2：打包单个游戏 3全部打包（提升大版本号）");
    return;
}

if (src=="") {
    console.log("please input src like -s build/jsb-link/");
    return;
}

if (dest=="") {
    console.log("please input dest like -d assets/resources/");
    return;
}

if (buildUrl=="") {
    console.log("please input url like -u http://192.168.2.76/remote-assets/");
    return;
}


if (buildType==2) {
    if (packGameId==-1) {
        console.log("please input gameId like -gameId 2");
        return;
    }
}

create_pack.initInfo(buildUrl,src,dest);

if (buildType==0) {
    for (const key in bundleList) {
        create_pack.initManifest(key);
        create_pack.buildOnePack(key);
    }
    for (const key in allGameConfig) {
        create_pack.buildGameVersion(key);
        create_pack.copyHotUpdateFiles(key)
    }
}else if (buildType==1) {
    create_pack.initManifest(allGameConfig["9999"]);
    create_pack.buildOnePack(allGameConfig["9999"]);
    create_pack.buildGameVersion("9999");
    create_pack.copyHotUpdateFiles("9999")
}else if (buildType==2) {
    if (allGameConfig[packGameId]!=null && allGameConfig[packGameId]!="") {
        create_pack.initManifest(allGameConfig[packGameId]);
        create_pack.buildOnePack(allGameConfig[packGameId]);
        create_pack.buildGameVersion(packGameId);
        create_pack.copyHotUpdateFiles(packGameId)
    }else{
        console.log("没有对应游戏，请去all_game_config.js以及bundle_list.js里添加");
    }
}
