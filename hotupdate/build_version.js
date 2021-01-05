//设置打包进app的小游戏的版本信息,其实就是生成assets\resources\update_version下的game_version.manifest
var build_version={}


//Tips:版本号规则为x1.x2.x3
//0:全部打包，1：打包大厅 2：打包单个游戏 3全部打包（提升大版本号）
//0:所有更新包的 x2+1, 1.resouces的 x3+1 2.单独游戏的x3+1 3. 所有的x1+1

build_version.build=function(buildType,gameId){
    if (buildType==0) {
        //对于生成的所有manifest x2+1
    }else if(buildType==1) {
        //对于resources_project.manifest和resources_version.manifest的x3+1
    }else if(buildType==2) {
        //对于单个游戏的x3+1，以及游戏的版本文件里对应的游戏v3+1
    }else if(buildType==2) {
        //对于生成的所有manifest x1+1
    }
}

module.exports = build_version;