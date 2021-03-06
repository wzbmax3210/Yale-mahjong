var http = require('http')
var url = require('url')
var port = process.argv[2]
var fs = require('fs')
const NODE_PATH = require('path')

if(!port){
  console.log('请指定端口号好不啦？\nnode server.js 8888 这样不会吗？')
  process.exit(1)
}

var server = http.createServer(function(request, response){
  var parsedUrl = url.parse(request.url, true)
  var pathWithQuery = request.url
  var queryString = ''
  if(pathWithQuery.indexOf('?') >= 0){ queryString = pathWithQuery.substring(pathWithQuery.indexOf('?')) }
  var path = parsedUrl.pathname
  var query = parsedUrl.query
  var method = request.method
  let responseJson = {
    success: true,
    msg: ''
  }
  let nameMap = {
    xiaoga: '小嘎',
    zhangzong: '张总',
    chenmao: '陈毛',
    zhongzong: '钟总',
    wudong: '吴董',
    xiaohei: '小黑',
    luobo: '罗博',
    laizong: '赖总',
    zhibo: '直播',
  }

  console.log('有请求发送！路径（带查询参数）为：' + pathWithQuery)

  if (path === '/getRank' && method === 'GET') {
    response.setHeader('Content-Type', 'text/json;charset=utf-8')
    responseJson.msg = 'SUCCESS'
    responseJson.data = {}
    responseJson.data.rank = JSON.parse(fs.readFileSync(NODE_PATH.resolve(__dirname, './rank.json')))
    responseJson.data.match = JSON.parse(fs.readFileSync(NODE_PATH.resolve(__dirname, './match.json')))
    response.write(JSON.stringify(responseJson))
    response.end()
  } else if (path === '/updateRank' && method === 'POST') {
    const array = []
    response.setHeader('Content-Type', 'text/json;charset=utf-8')
    request.on('data', chunk => {
      array.push(chunk)
    })
    request.on('end', () => {
      const string = Buffer.concat(array).toString()
      if (string === '{}') {
        responseJson.success = false
        responseJson.msg = 'without rank message'
      } else {
        const updateRankData = JSON.parse(string)
        const rankArray = JSON.parse(fs.readFileSync(NODE_PATH.resolve(__dirname, './rank.json')))
        const matchArray = JSON.parse(fs.readFileSync(NODE_PATH.resolve(__dirname, './match.json')))
        const date = new Date().toLocaleString()
        let changLog = ''
        let unshiftMatch = {
          date: date,
          detail: {}
        }

        for (let key in updateRankData) {
          if (updateRankData.hasOwnProperty(key) && updateRankData[key] !== '') {
            unshiftMatch.detail[nameMap[key]] = updateRankData[key]
          }
        }
        matchArray.unshift(unshiftMatch)

        rankArray.map(v => {
          let updateRank = 0
          for (let key in nameMap) {
            if (nameMap[key] === v.name) {
              updateRank = updateRankData[key]
            }
          }
          if (updateRank !== '' && !isNaN(Number(updateRank))) {
            v.lastRank = Number(updateRank)
            v.rank += Number(updateRank)
            changLog += `${v.name} ${date} 战绩${updateRank} 总战绩${v.rank}\n`
          }
        })
        changLog += `--------------------------------------------------\n`
        fs.writeFileSync(NODE_PATH.resolve(__dirname, './rank.json'), JSON.stringify(rankArray))
        fs.writeFileSync(NODE_PATH.resolve(__dirname, './match.json'), JSON.stringify(matchArray))
        fs.appendFileSync(NODE_PATH.resolve(__dirname, '../log/changelog.txt'), changLog)
      }
      response.write(JSON.stringify(responseJson))
      response.end()
    })
  } else {
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/html;charset=utf-8')
    const filePath = path === '/' ? '/index.html' : path
    const suffix = filePath.substring(filePath.lastIndexOf('.'))
    const fileTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
    }
    response.setHeader('Content-Type', `${fileTypes[suffix] || 'text/html'};charset=utf-8`)
    let content
    try {
      // 默认首页为index.html
      content = fs.readFileSync(`./public${filePath}`)
    } catch (e) {
      content = 'file not exists'
      response.statusCode = 404
    }
    response.write(content)
    response.end()
  }
})

server.listen(port)
console.log('监听 ' + port + ' 成功\n请打开 http://localhost:' + port)
