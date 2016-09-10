const Promise = require('bluebird')
const readFile = Promise.promisify(require('fs').readFile)
const writeFile = Promise.promisify(require('fs').writeFile)
const gameQuery = Promise.promisify(require('game-server-query'))
// const serverMap = require('./heartlessgaming-serverinfo.json')

let log = console.log.bind(console)
/*
let doGameQuery = function (gameId, gameServerIp, gamePort) {
  gameQuery({type: gameId, host: gameServerIp + ':' + gamePort})
  .then(function (res) {
    log(res)
    return res
  }).catch(function (err) {
    if (err.error === 'UDP Watchdog Timeout') {
      log('Server is offline')
      return 'Server is offline'
    } else {
      // log(err)
      return err
    }
  })
}
*/
// doGameQuery('csgo', '91.121.154.84', 27015)
readFile('heartlessgaming-serverinfo.json', 'utf8')
  .then(function (serverMap) {
    return JSON.parse(serverMap)
  })
  .then(function (parsedServerMap) {
    // let gameServerQueries = []
    return parsedServerMap.games.map(function (game) {
      return Promise.all(game.gameServers.map(function (gameServer) {
        return gameQuery({
          type: game.gameId,
          host: parsedServerMap.gameServerIp + ':' + gameServer.port
        })
      }))
    })
    // return Promise.all(gameServerQueries).then(function (res) {
    //   return res
    // })

    // var files = []
    // for (var i = 0; i < 5; ++i) {
    //   files.push(writeFile('file-' + i + '.txt', '', 'utf-8'))
    // }
    // Promise.all(files).then(function (res) {
    //   log()
    // })
  })
  .then(function (queriesResult) {
    log(queriesResult)
  })
  .catch(function (err) {
    log('ERROR')
    log(err)
  })

log('If you see me first congrats. This code is Asychonous !')
