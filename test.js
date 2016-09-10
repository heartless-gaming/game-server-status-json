const color = require('chalk')
const Promise = require('bluebird')
const readFile = Promise.promisify(require('fs').readFile)
// const gameQuery = Promise.promisify(require('game-server-query'))
const gameQuery = require('game-server-query')

let log = console.log.bind(console)

let logResult = function (res) {
  log(res)
}

let logError = function (err) {
  log(color.yellow(err))
}

let readJson = function (json) {
  return JSON.parse(json)
}

let getServerInfo = function (json) {
  // pass the ip and the rest of the json for the getgames
  let getIp = function (json) {
    return new Promise(function (resolve, reject) {
      if (json.ip) {
        resolve({'ip': json.ip, 'games': json.games})
      } else {
        reject(color.blue('No ip found in json file.'))
      }
    })
  }

  let getGames = function (getIpResult) {
    let ip = getIpResult.ip
    let games = getIpResult.games

    return Promise.all(games.map(function (game) {
      return {'ip': ip, gameId: game.gameId, 'gameServers': game.gameServers}
    }))
  }

  // let getGamesServer = function (getGamesResult) {

  // }

  return getIp(json).then(getGames)
}

// readFile('test.json', 'utf8')
//   .then(readJson)
//   .then(getServerInfo)
//   .then(logResult)
//   .catch(logError)

// let doGameQuery = function (gameId, gameServerIp, gamePort) {
//   gameQuery({type: gameId, host: gameServerIp + ':' + gamePort})
//     .then(function (res) {
//       return res
//     })
// }

// let serverQueries = [
//   doGameQuery('csgo', '91.121.154.84', 27015),
//   doGameQuery('csgo', '91.121.154.84', 27016),
//   doGameQuery('killingfloor', '91.121.154.84', 7707),
//   doGameQuery('killingfloor', '91.121.154.84', 7708)
// ]

// doGameQuery('csgo', '91.121.154.84', 27015)
//   .then(logResult)
//   .catch(logError)

// Promise.all(serverQueries)
//   .then(logResult)
//   .catch(logError)

// gameQuery({type: 'csgo', host: '91.121.154.84:27015'})
//   .then(logResult)
//   .catch(logError)

var doGameQuery = function (gameId, ip, port) {
  return new Promise(function (resolve, reject) {
    return gameQuery({type: gameId, host: ip + ':' + port}, function (res) {
      if (res.error) {
        reject(res.error)
      } else {
        resolve(res)
      }
    })
  })
}

doGameQuery('csgo', '91.121.154.84', 27015)
  .then(logResult)
  .catch(logError)

log('If you see me first congrats. This code is Asychonous !')
