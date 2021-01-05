var bundleList = require('./bundle_list');
var allGameConfig = require('../assets/resources/script/all_game_config');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var fs_expand = require('./fs_expand');

var create_pack={}
var manifest = {
    packageUrl: 'http://localhost/remote-assets/',
    remoteManifestUrl: 'http://localhost/remote-assets/project.manifest',
    remoteVersionUrl: 'http://localhost/remote-assets/version.manifest',
    version: '1.0.0',
    assets: {},
    searchPaths: []
};
var buildUrl=""
var buildVersion=""
var src=""
var dest=""

function getVersion(packAge){
    var versionFilePath = path.join(dest, packAge+'_project.manifest');
    console.log("versionFilePath="+versionFilePath);
    if (fs.existsSync(versionFilePath)) {
        var readStr=fs.readFileSync(versionFilePath);
        var readObj=JSON.parse(readStr);
        var version=readObj.version;
        //var manifestData=JSON.parse(fs.readFileSync(versionFilePath));
        return version;
    }
    return "1.0.0";
}

function getVersionFromVersionFile(packAge){
    //var packAge=allGameConfig[gameId];
    var gameVersionFilePath = path.join(dest, 'game_version_project.manifest');
    console.log(" getVersionFromVersionFile versionFilePath="+gameVersionFilePath);
    if (fs.existsSync(gameVersionFilePath)) {
        var readStr=fs.readFileSync(gameVersionFilePath);
        console.log(" getVersionFromVersionFile readStr="+readStr);
        console.log("readObj packAge="+packAge);
        var readObj=JSON.parse(readStr);
        if (readObj[packAge]) {
            console.log("readObj[packAge]="+readObj[packAge]);
            return readObj[packAge]
        }
    }
    return "1.0.0";
}

create_pack.initInfo=function(_buildUrl,_src,_dest){
    buildUrl=_buildUrl;
    src=_src;
    dest=_dest;
}

create_pack.initManifest=function (packAge){
    manifest = {
        packageUrl: 'http://localhost/remote-assets/',
        remoteManifestUrl: 'http://localhost/remote-assets/project.manifest',
        remoteVersionUrl: 'http://localhost/remote-assets/project.manifest',
        version: '1.0.0',
        assets: {},
        searchPaths: []
    };
    manifest.packageUrl = buildUrl;
    manifest.remoteManifestUrl = buildUrl + packAge+'_project.manifest';
    manifest.remoteVersionUrl = buildUrl + packAge+'_project.manifest';
    //对于buildVersion,先看是否已经有对应的在了，如果有的话，那么就获取这个，然后随后会调用build_version对于各种情况进行版本号增加
    //如果当前这个文件不存在，那么就是1.0.0
    //buildVersion=getVersion(packAge);
    buildVersion=getVersionFromVersionFile(packAge)
    manifest.version=buildVersion;
    manifest.assets={};
    manifest.searchPaths=[];
}

function readDir (dir, obj) {
    //console.log("dir="+dir);
    var stat = fs.statSync(dir);
    if (!stat.isDirectory()) {
        return;
    }
    var subpaths = fs.readdirSync(dir), subpath, size, md5, compressed, relative;
    for (var i = 0; i < subpaths.length; ++i) {
        if (subpaths[i][0] === '.') {
            continue;
        }
        subpath = path.join(dir, subpaths[i]);
        stat = fs.statSync(subpath);
        if (stat.isDirectory()) {
            readDir(subpath, obj);
        }
        else if (stat.isFile()) {
            // Size in Bytes
            size = stat['size'];
            md5 = crypto.createHash('md5').update(fs.readFileSync(subpath)).digest('hex');
            compressed = path.extname(subpath).toLowerCase() === '.zip';

            relative = path.relative(src, subpath);
            relative = relative.replace(/\\/g, '/');
            relative = encodeURI(relative);
            obj[relative] = {
                'size' : size,
                'md5' : md5
            };
            if (compressed) {
                obj[relative].compressed = true;
            }
        }
    }
}

var mkdirSync = function (path1) {
    try {
        fs.mkdirSync(path1);
    } catch(e) {
        if ( e.code != 'EEXIST' ) throw e;
    }
}

create_pack.buildOnePack = function(packAge){
    // Iterate assets and src folder
    if (packAge=="resources") {
        readDir(path.join(src, 'src'), manifest.assets);
    }
    for (let i = 0; i < bundleList[packAge].length; i++) {
        readDir(path.join(src, 'assets/'+bundleList[packAge][i]), manifest.assets);
    }

    var destManifest = path.join(dest, packAge+'_project.manifest');
    var destVersion = path.join(dest, packAge+'_version.manifest');

    mkdirSync(dest);

    fs.writeFileSync(destManifest, JSON.stringify(manifest));
}

create_pack.buildGameVersion=function(gameId){
    //查看game_version.manifest是否已经存在
    var gameVersionFilePath = path.join(dest, 'game_version_project.manifest');
    if (fs.existsSync(gameVersionFilePath)) {
        //存在，看看对应游戏是否已经存在
        var gameVersionData=JSON.parse(fs.readFileSync(gameVersionFilePath));
        if (gameVersionData[allGameConfig[gameId]]!=null&&gameVersionData[allGameConfig[gameId]]!="") {
            //存在,不管他

            
        }else{
            //不存在，往里面添加
            gameVersionData[allGameConfig[gameId]]=buildVersion;
            fs.writeFileSync(gameVersionFilePath, JSON.stringify(gameVersionData));
        }
    }else{
        //不存在,创建game_version.manifest，并把当前游戏放进去
        var gameVersionData={}
        gameVersionData[allGameConfig[gameId]]=buildVersion;
        fs.writeFileSync(gameVersionFilePath, JSON.stringify(gameVersionData));
    }
}

create_pack.copyHotUpdateFiles=function(gameId){
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest);
    }
    //找到对应的文件拷贝到发布目录或者临时拷贝目录
    var packAge=allGameConfig[gameId];

    //游戏资源重新拷贝src下的assets以及src
    var assetsPath=path.join(dest, 'assets');
    //console.log("assetsPath="+assetsPath);
    if (!fs.existsSync(assetsPath)) {
        fs.mkdirSync(assetsPath);
    }
    var bundleInfo=bundleList[packAge];
    for (let i = 0; i < bundleInfo.length; i++) {
        var assetsPath=path.join(src, 'assets/'+bundleInfo[i]);
        var copyToPath=path.join(dest, 'assets/'+bundleInfo[i]);
        
        if (!fs.existsSync(copyToPath)) {
            fs.mkdirSync(copyToPath);
        }else{
            fs_expand.removeDir(copyToPath);
            fs.mkdirSync(copyToPath);
        }
        fs_expand.copyDir(assetsPath,copyToPath);
    }
    if (gameId=="9999") {
        var assetsPath=path.join(src, 'src');
        var copyToPath=path.join(dest, 'src');
        if (!fs.existsSync(copyToPath)) {
            fs.mkdirSync(copyToPath);
        }else{
            fs_expand.removeDir(copyToPath);
            fs.mkdirSync(copyToPath);
        }
        fs_expand.copyDir(assetsPath,copyToPath);
    }
}


module.exports = create_pack;