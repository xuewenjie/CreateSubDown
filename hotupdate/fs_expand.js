var fs = require('fs');

var fs_expand ={}

fs_expand.removeDir=function(url) {
    // 读取原路径
    const STATUS = fs.statSync(url);
    // 如果原路径是文件
    if (STATUS.isFile()) {
        //删除原文件
        fs.unlinkSync(url);
 
    //如果原路径是目录
    } else if (STATUS.isDirectory()) {
        //如果原路径是非空目录,遍历原路径
        //空目录时无法使用forEach
        fs.readdirSync(url).forEach(item => {
            //递归调用函数，以子文件路径为新参数
            fs_expand.removeDir(`${url}/${item}`);
        });
        //删除空文件夹
        fs.rmdirSync(url);
    };
};


// fs_expand.copyDir=function(originalUrl, targetUrl) {
//     try {
//         //console.log("originalUrl="+originalUrl);
//         //console.log("targetUrl="+targetUrl);
//         // 读取原路径
//         const STATUS = fs.statSync(originalUrl);
//         // 获得原路径的末尾部分
//         // 此部分亦可通过path模块中的basename()方法提取
//         const fileName = originalUrl.split("/")[originalUrl.split("/").length - 1];
//         // 如果原路径是文件
//         if (STATUS.isFile()) {
//             // 在新目录中创建同名文件，并将原文件内容追加到新文件中
//             fs.writeFileSync(`${targetUrl}/${fileName}`, fs.readFileSync(originalUrl));
 
//             //如果原路径是目录
//         } else if (STATUS.isDirectory()) {
//             //在新路径中创建新文件夹
//             fs.mkdirSync(`${targetUrl}/${fileName}`);
//             //如果原路径是非空目录,遍历原路径
//             //空目录时无法使用forEach
//             fs.readdirSync(originalUrl).forEach(item => {
//                 //更新参数，递归调用
//                 fs_expand.copyDir(`${originalUrl}/${item}`, `${targetUrl}/${fileName}`);
//             });
//         }
//     } catch (error) {
//         console.log("路径" + "有误"+"error="+error);
//     };
// };

fs_expand.copyDir=function(src,dst){
    let paths = fs.readdirSync(src); //同步读取当前目录
    paths.forEach(function(path){
      var _src=src+'/'+path;
      var _dst=dst+'/'+path;
      fs.stat(_src,function(err,stats){ //stats 该对象 包含文件属性
        if(err)throw err;
        if(stats.isFile()){ //如果是个文件则拷贝
          let readable=fs.createReadStream(_src);//创建读取流
          let writable=fs.createWriteStream(_dst);//创建写入流
          readable.pipe(writable);
        }else if(stats.isDirectory()){ //是目录则 递归
            fs_expand.checkDirectory(_src,_dst,fs_expand.copyDir);
        }
      });
    });
  }
fs_expand.checkDirectory=function(src,dst,callback){
    fs.access(dst, fs.constants.F_OK, (err) => {
      if(err){
        fs.mkdirSync(dst);
        callback(src,dst);
      }else{
        callback(src,dst);
      }
     });
  };

module.exports = fs_expand;
