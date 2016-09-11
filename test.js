const color = require('chalk')
const isIp = require('is-ip')
const Promise = require('bluebird')
const readFile = Promise.promisify(require('fs').readFile)
const writeFile = Promise.promisify(require('fs').writeFile)
const gameQuery = require('game-server-query')

let log = console.log.bind(console)

let gameServerMap = 'heartlessgaming-serverinfo.json'

let logResult = function (res) {
  log(res)
}

let logError = function (err) {
  log(color.yellow(err))
}

let readJson = function (json) {
  return JSON.parse(json)
}

/*
 * get the Params for the game query funtion
 */
let getServerInfo = function (json) {
  let gameServerJson = json

  let getIp = function () {
    return new Promise(function (resolve, reject) {
      let ip = gameServerJson.gameServerIp

      if (ip) {
        if (isIp(ip)) resolve(ip)
        else reject(color.yellow('Ip address badly formatted in json file.'))
      } else {
        reject(color.yellow('No ip found in json file.'))
      }
    })
  }

  let getGames = function () {
    return new Promise(function (resolve, reject) {
      let games = gameServerJson.games
      let gamesIds = []

      if (Array.isArray(games)) {
        games.map(function (game) {
          gamesIds.push(game.gameId)
        })
        resolve(gamesIds)
      } else {
        reject(color.yellow('Games not an array in json file.'))
      }
    })
  }
  /*
   * Returns an array of object with the GameIds and is gameQueryPorts
   */
  let getGameIdsAndPorts = function (getGamesResult) {
    return new Promise(function (resolve, reject) {
      let ports = []
      getGames.then(function (games) {
        games.map(function (game) {
          if (Array.isArray(game.gameServer)) {
            game.gameServers.map(function (gameServer) {
              ports.push(gameServer.port)
            })
            resolve(ports)
          } else {
            reject(color.yellow('gameServers not an array in json file'))
          }
        })
      })
    })
  }

  let gameQueryParams = [
    getIp,
    getGameIdsAndPorts
  ]

  return Promise.all(gameQueryParams)
}

let doGameQuery = function (gameId, ip, port) {
  return new Promise(function (resolve, reject) {
    return gameQuery({type: gameId, host: ip + ':' + port}, function (res) {
      if (res.error) reject(res.error)
      else resolve(res)
    })
  })
}

readFile(gameServerMap, 'utf8')
  .then(readJson)
  .then(getServerInfo)
  .then(logResult)
  .catch(logError)

/*
 * asynchonous gameQuery
 */
// let gameQueries = [
//   doGameQuery('csgo', '91.121.154.84', 27015)
// ]

// let topkek = [
//   setTimeout(function () { console.log('2 sec') }, 2000),
//   setTimeout(function () { console.log('1 sec') }, 1000)
// ]

// let serverQueries = [
//   doGameQuery('csgo', '91.121.154.84', 27016),
//   doGameQuery('csgo', '91.121.154.84', 27015),
//   doGameQuery('csgo', '91.121.154.84', 27017),
//   doGameQuery('killingfloor', '91.121.154.84', 7708)
// ]

// serverQueries.push(doGameQuery('killingfloor', '91.121.154.84', 7709))

// Promise.all(serverQueries)
//   .then(function (res) {
//     res.map(function (serverRespond) {
//       log(serverRespond.name)
//       log(serverRespond.players)
//     })
//   })
//   .catch(logError)

log('If you see me first congrats. This code is Asychonous !')
