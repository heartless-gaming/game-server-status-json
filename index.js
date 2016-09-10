const Promise = require('bluebird')
const readFile = Promise.promisify(require('fs').readFile)
const gameQuery = Promise.promisify(require('game-server-query'))
// const serverMap = require('./heartlessgaming-serverinfo.json')

let log = console.log.bind(console)

// gameQuery({type: 'csgo', host: '91.121.154.84:27015'}).then(function (res) {
//   log(res)
// }).catch(function (err) {
//   if (err.error === 'UDP Watchdog Timeout') {
//     log('Server is offline')
//   } else {
//     log(err)
//   }
// })

readFile('heartlessgaming-serverinfo.json', 'utf8')
  .then(function (serverMap) {
    return JSON.parse(serverMap)
  }).then(function (parsedServerMap) {
    parsedServerMap.gameServers.forEach(function (res, i) {
      if (typeof res.gameId !== 'undefined') {
        // log(res.gameId)
        res.gameInfo.forEach(function (res, index) {
          log(res.port)
        })
      }
    })
  })
  .catch(function (err) {
    log('ERROR')
    log(err)
  })

log('If you see me first congrats. This code is Asychonous !')
