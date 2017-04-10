import { loadFile } from './loader'
import { $warn } from './debug'
import { parseJSON } from './lang'
import { config, resetVisualProportion } from '../config/index'

const CEIL = Math.ceil
const FLOOR = Math.floor
const slashRE = /\/$/

/**
 * 去掉后缀的斜杠
 * @return {[type]} [description]
 */
export function slashPostfix(resource) {
  if(resource && slashRE.test(resource)) {
    return resource.substring(0, resource.length - 1)
  }
  return resource
}


/**
 * 动态加载link
 * @return {[type]} [description]
 */
export function loadStyle(fileName, callback) {
  let path = config.launch ?
    config.launch.resource + '/gallery/' + fileName + '.css' :
    config.data.pathAddress + fileName + '.css'
  let node = loadFile(path, callback)
  node && node.setAttribute('data-type', fileName)
}


/**
 * 设置快速的文件解释正则
 * 每个图片在点击的时候，需要解析文件的一些参数
 * 这里正则只做一次匹配
 */
let brModelRE = null
export function setFastAnalysisRE() {
  brModelRE = null
    //如果存在brModelType
  if(config.launch && config.launch.brModelType && config.launch.brModelType !== 'delete') {
    //(\w+[_a|_i]?)([.hi|.mi]*)$/i
    brModelRE = new RegExp(`(\\w+[${config.launch.brModelType}]?)([.${config.baseImageSuffix}]*)$`, 'i')
  }
}

/**
 * 获取正确的图片文件名
 * 因为图片可能存在
 * .mi.jpg
 * .mi.php
 * .hi.jpg
 * .hi.php
 * 等等这样的地址
 * @return
    original: "1d7949a5585942ed.jpg"
    suffix  : "1d7949a5585942ed.mi.jpg"
 */
export function analysisImageName(src) {
  let suffix = src
  let original = src
  let result

  //如果存在brModelType
  if(brModelRE) {
    result = src.match(brModelRE)
    if(result && result.length) {
      suffix = result[0]
      original = result[1]
    } else {
      $warn('zoom-image-brModelType解析出错,result：' + result)
    }
  }
  //有基础后缀
  //suffix: 1d7949a5585942ed.mi.jpg
  //original: 1d7949a5585942ed.jpg
  else if(config.baseImageSuffix) {
    /*
        0 1d7949a5585942ed.mi.jpg"
        1 "1d7949a5585942ed"
        2 : ".mi"
        3: ".jpg"
     */
    result = src.match(/(\w+)(\.\w+)(\.\w+)$/)
    if(result && result.length) {
      suffix = result[0]
      original = result[1] + result[3]
    } else {
      $warn('zoom-image-suffix解析出错,result：' + result)
    }
  }
  //如果没有后缀
  else {
    //"1d7949a5585942ed.jpg"
    result = src.match(/\w+\.\w+$/)
    if(result && result.length) {
      suffix = original = result[0]
    } else {
      $warn('zoom-image解析出错,result：' + result)
    }
  }
  return {
    original, //原始版
    suffix //带有后缀
  }
}


/*给地址增加私有后缀*/
function insertImageUrlSuffix(originalUrl, suffix) {
  if(originalUrl && suffix) {
    //brModelType 没有类型后缀
    if(config.launch && config.launch.brModelType && config.launch.brModelType !== 'delete') {
      return originalUrl.replace(/\w+/ig, '$&' + '.' + suffix)
    }
    //带后缀
    return originalUrl.replace(/\w+\./ig, '$&' + suffix + '.')
  }
  return originalUrl
}


/*获取高清图文件*/
export function getHDFilePath(originalUrl) {
  if(config.useHDImageZoom && config.imageSuffix && config.imageSuffix['1440']) {
    return getFileFullPath(insertImageUrlSuffix(originalUrl, config.imageSuffix['1440']), 'getHDFilePath')
  }
  return ''
}


/*文件是图片格式*/
export function hasImages(fileName) {
  return /\.[jpg|png|gif]+/i.test(fileName)
}

/*获取文件的全路径*/
export function getFileFullPath(fileName, type) {

  if(!fileName) {
    return ''
  }

  const launch = config.launch
  if(launch) {

    /*
    如果启动了基础图匹配,替换全部
    并且要是图片
    并且没有私有后缀
    */
    if(config.baseImageSuffix &&
      hasImages(fileName) &&
      -1 === fileName.indexOf(`.${config.baseImageSuffix}.`)) {
      /*"50f110321f467d25474b9dba9b342f0a.png"
        1 : "50f110321f467d25474b9dba9b342f0a"
        2 : "png"
      */
      let fileMatch = fileName.match(/(\w+)\.(\w+)$/)
      let name = fileMatch[1]
      let type = fileMatch[2]
      fileName = `${fileMatch[1]}.${config.baseImageSuffix}.${fileMatch[2]}`
    }

    /*
      支持webp图
      1 如果启动brModelType
      2 并且是图片
      3 并且没有被修改过
    */
    if(launch.brModelType && hasImages(fileName) && !/\_[i|a]+\./i.test(fileName)) {
      if(Xut.plat.isBrowser) { //手机浏览器访问
        let fileMatch = fileName.match(/\w+([.]?[\w]*)\1/ig)
        let name
        let suffix = ''
        if(fileMatch.length === 3) {
          name = fileMatch[0]
          suffix = '.' + fileMatch[1]
        } else {
          name = fileMatch[0]
        }
        //content/13/gallery/106d9d86fa19e56ecdff689152ecb28a_i.mi
        return `${config.data.pathAddress + name}${config.launch.brModelType}${suffix}`
      } else {
        //手机app访问
        //content/13/gallery/106d9d86fa19e56ecdff689152ecb28a.mi
        return `${config.data.pathAddress + name}${suffix}`
      }
    }
  }
  return config.data.pathAddress + fileName
}

/**
 * 获取资源
 * @param  {[type]} url [description]
 * @return {[type]}     [description]
 */
export function getResources(url) {
  var option;
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, false);
  xhr.send(null);
  option = parseJSON(xhr.responseText);
  return option;
}

export function createFn(obj, id, callback) {
  var cObj = obj[id];
  if(!cObj) {
    cObj = obj[id] = {};
  }
  callback.call(cObj);
}

/**
 * 执行脚本注入
 */
export function execScript(code, type) {
  //过滤回车符号
  var enterReplace = function(str) {
    return str.replace(/\r\n/ig, '').replace(/\r/ig, '').replace(/\n/ig, '');
  }
  try {
    new Function(enterReplace(code))()
  } catch(e) {
    $warn('加载脚本错误', type)
  }
}

/**
 * 创建gif随机数
 * @return {[type]} [description]
 */
export function createRandomImg(url) {
  return url + `?${Math.random()}`
}

/**
 * 路径替换
 * svg html文件的路径是原始处理的
 * 如果动态切换就需要替换
 * @return {[type]} [description]
 */
export function replacePath(svgstr) {
  if(config.launch) {
    //如果能找到对应的默认路径，则替换
    if(-1 !== svgstr.indexOf('content/gallery/')) {
      svgstr = svgstr.replace(/content\/gallery/ig, config.data.pathAddress)
    }
  }
  return svgstr
}

/**
 * 转化缩放比
 */
const converProportion = function({
  width,
  height,
  left,
  top,
  padding,
  proportion,
  zoomMode, //缩放比模式
  getStyle
}) {

  if(!proportion) {
    $warn('没有传递缩放比,取全局config')
    proportion = config.proportion
  }

  //页眉，保持横纵比
  //计算顶部显示中线位置
  //如果溢出就溢出，高度设置为白边中线
  if(zoomMode === 1) {
    let visualTop = getStyle.visualTop
    let proportionalHeight = CEIL(height * proportion.width) || 0;
    return {
      width: CEIL(width * proportion.width) || 0,
      height: proportionalHeight,
      left: CEIL(left * proportion.left) || 0,
      top: -visualTop / 2 - proportionalHeight / 2 || 0,
      padding: CEIL(padding * proportion.width) || 0,
      isHide: proportionalHeight > visualTop //正比高度大于显示高度，隐藏元素
    }

  }
  //页脚，保持横纵比
  //计算底部显示中线位置
  //如果溢出就隐藏，高度设置为白边中线
  else if(zoomMode === 2) {
    let visualTop = getStyle.visualTop
    let proportionalHeight = CEIL(height * proportion.width) || 0;
    return {
      width: CEIL(width * proportion.width) || 0,
      height: proportionalHeight,
      left: CEIL(left * proportion.left) || 0,
      top: getStyle.visualHeight + visualTop / 2 - proportionalHeight / 2 || 0,
      padding: CEIL(padding * proportion.width) || 0,
      isHide: proportionalHeight > visualTop //正比高度大于显示高度，隐藏元素
    }
  }
  //图片正比缩放，而且保持上下居中
  else if(zoomMode === 3) {
    //高度为基本比值
    if(proportion.width > proportion.height) {
      let originalWidth = CEIL(width * proportion.width) || 0
      let proportionalWidth = CEIL(width * proportion.height) || 0
      let proportionalLeft = Math.abs(proportionalWidth - originalWidth) / 2
      left = CEIL(left * proportion.left) + proportionalLeft
      return {
        width: proportionalWidth,
        height: CEIL(height * proportion.height) || 0,
        left: left,
        top: CEIL(top * proportion.top) || 0,
        padding: CEIL(padding * proportion.width) || 0
      }
    } else {
      //宽度作为基本比值
      let originalHeight = CEIL(height * proportion.height) || 0
      let proportionalHeight = CEIL(height * proportion.width) || 0
      let proportionalTop = Math.abs(proportionalHeight - originalHeight) / 2
      top = CEIL(top * proportion.top) + proportionalTop
      return {
        width: CEIL(width * proportion.width) || 0,
        height: proportionalHeight,
        left: CEIL(left * proportion.left) || 0,
        top: top,
        padding: CEIL(padding * proportion.width) || 0
      }
    }

  }
  //默认缩放比
  else {
    return {
      width: CEIL(width * proportion.width) || 0,
      height: CEIL(height * proportion.height) || 0,
      left: CEIL(left * proportion.left) || 0,
      top: CEIL(top * proportion.top) || 0,
      padding: CEIL(padding * proportion.width) || 0
    }
  }
}


export function setProportion(...arg) {
  return converProportion(...arg)
}


/*
 * 修复元素的尺寸
 * @type {[type]}
 */
export function reviseSize({
  results,
  proportion,
  zoomMode,
  getStyle
}) {

  //不同设备下缩放比计算
  let layerSize = converProportion({
    proportion,
    zoomMode,
    getStyle,
    width: results.width,
    height: results.height,
    left: results.left,
    top: results.top
  })

  //新的背景图尺寸
  let backSize = converProportion({
    proportion,
    zoomMode,
    getStyle,
    width: results.backwidth,
    height: results.backheight,
    left: results.backleft,
    top: results.backtop
  })

  //赋值新的坐标
  results.scaleWidth = layerSize.width
  results.scaleHeight = layerSize.height
  results.scaleLeft = layerSize.left
  results.scaleTop = layerSize.top

  //元素状态
  if(layerSize.isHide) {
    results.isHide = layerSize.isHide
  }

  //背景坐标
  results.scaleBackWidth = backSize.width
  results.scaleBackHeight = backSize.height
  results.scaleBackLeft = backSize.left
  results.scaleBackTop = backSize.top

  return results
}


/**
 * 随机Url地址
 * @param  {[type]} url [description]
 * @return {[type]}     [description]
 */
function randomUrl(url) {
  return url + '?r=' + new Date().getTime()
}

/**
 *  读取SVG内容
 *  @return {[type]} [string]
 */
export function readFile(path, callback, type) {

  let paths
  let name
  let data
  let svgUrl

  /**
   * js脚本加载
   */
  let loadJs = (fileUrl, fileName) => {
    loadFile(randomUrl(fileUrl), function() {
      data = window.HTMLCONFIG[fileName];
      if(data) {
        callback(data)
        delete window.HTMLCONFIG[fileName];
      } else {
        $warn('js文件加载失败，文件名:' + path);
        callback('')
      }
    })
  }


  //con str
  //externalFile使用
  //如果是js动态文件
  //content的html结构
  if(type === "js") {
    paths = config.getSvgPath() + path;
    name = path.replace(".js", '')
    loadJs(paths, name)
    return
  }

  /**
   * 如果配置了convert === 'svg'
   * 那么所有的svg文件就强制转化成js读取
   */
  if(config.launch && config.launch.convert === 'svg') {
    path = path.replace('.svg', '.js')
    name = path.replace(".js", '')
    svgUrl = config.getSvgPath() + path
    loadJs(svgUrl, name) //直接采用脚本加载
    return
  }


  /**
   * ibooks模式 单独处理svg转化策划给你js,加载js文件
   */
  if(Xut.IBooks.CONFIG) {
    //如果是.svg结尾
    //把svg替换成js
    if(/.svg$/.test(path)) {
      path = path.replace(".svg", '.js')
    }
    //全路径
    paths = config.getSvgPath().replace("svg", 'js') + path;
    //文件名
    name = path.replace(".js", '');
    //加载脚本
    loadFile(randomUrl(paths), function() {
      data = window.HTMLCONFIG[name] || window.IBOOKSCONFIG[name]
      if(data) {
        callback(data)
        delete window.HTMLCONFIG[name];
        delete window.IBOOKSCONFIG[name]
      } else {
        $warn('编译:脚本加载失败，文件名:' + name)
        callback('');
      }
    })
    return
  }


  //svg文件
  //游览器模式 && 非强制插件模式
  if(Xut.plat.isBrowser && !config.isPlugin) {
    //默认的地址
    svgUrl = config.getSvgPath().replace("www/", "") + path

    //mini杂志的情况，不处理目录的www
    if(config.launch && config.launch.resource) {
      svgUrl = config.getSvgPath() + path
    }

    $.ajax({
      type: 'get',
      dataType: 'html',
      url: randomUrl(svgUrl),
      success: function(svgContent) {
        callback(svgContent);
      },
      error: function(xhr, type) {
        $warn('svg文件解释出错，文件名:' + path);
        callback('');
      }
    })
    return
  }


  /**
   * 插件读取
   * 手机客户端模式
   */
  Xut.Plugin.ReadAssetsFile.readAssetsFileAction(config.getSvgPath() + path, function(svgContent) {
    callback(svgContent);
  }, function(err) {
    callback('')
  });

}
