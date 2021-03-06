/**
 * content下的svg转化成js
 * 1.方便跨域操作
 * 2.不需要发送ajax请求
 */
const stats = []
const fs = require("fs")
const _ = require("underscore")
const utils = require('../utils')

const readFile = (path) => {
  let data = fs.readFileSync(path, {
    // flag: 'r+',
    encoding: 'utf8'
  })
  return data
}

const writeFile = (filename, content) => {
  fs.writeFileSync(filename, content, {
    encoding: 'utf8',
    flag: 'w+'
  })
}


/**
 * 转化svg为js
 * @param  {[type]} path [description]
 * @return {[type]}      [description]
 */
const convertFile = function(path) {

  /*如果已经转化过了*/
  let convertedPath = path + '/converted.txt'
  let exists = fs.existsSync(convertedPath)
  if (exists) {
    let data = readFile(convertedPath)
    if (data) {
      utils.log(`conver svg:${data} --- ${path}`, 'info')
      return
    }
  }

  // utils.log(`start convert svg --- ${path}`, 'cyan')

  let files = fs.readdirSync(path)

  if (!files.length) {
    utils.log(`empty file --- ${path}`, 'error')
    return
  }

  /*获取有效的svg文件*/
  let svgfiles = [];
  _.each(files, function(url, index) {
    if (/.svg$/i.test(url)) {
      svgfiles.push(url)
    }
  })


  if (!svgfiles.length) {
    utils.log(`empty svg file --- ${path}`, 'cyan')
    return
  }

  /**
   * 开始转化
   */
  let total = svgfiles.length
  let count = total - 1
  let filename
  let data
  let str
  let handle

  while (count >= 0) {
    filename = svgfiles[count]
    readPath = path + '/' + filename;
    data = readFile(readPath)

    filename = filename.replace('.svg', '')
    str = 'window.HTMLCONFIG[\'' + filename + '\']=' + JSON.stringify(data)

    handle = writeFile(path + '/' + filename + '.js', str)
    if (handle) {
      utils.log(`convert svg failure`)
      return
    } else {
      // utils.log(`converted svg is ${readPath}`)
    }

    if (!count) {
      utils.log(`convert ${total} files`)
      writeFile(convertedPath, total)
      return
    }
    count--
  }
}


/**
 * 递归检测有资源的目录
 * 必须要是gallery目录
 * 包含
 * 1 content gallery
 * 2 widget gallery
 * @return {[type]} [description]
 */
const checkDir = function(path) {
  const files = fs.readdirSync(path)
  _.each(files, function(file) {
    const stat = fs.lstatSync(path + file);
    /*如果是目录*/
    if (stat.isDirectory()) {
      if (file === 'gallery') {
        convertFile(path + file)
      } else {
        checkDir(path + file + '/')
      }
    }
  })

}


module.exports = function(path) {
  checkDir(path)
}
