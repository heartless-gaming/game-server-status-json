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
/*
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
}*/

/*
 * Return an array object with game id, server ip and port
 */
let getServerInfo = function (json) {

}

let doGameQuery = function (gameId, ip, port) {
  return new Promise(function (resolve, reject) {
    return gameQuery({type: gameId, host: ip + ':' + port}, function (res) {
      if (res.error) reject(res.error)
      else resolve(res)
    })
  })
}

// readFile('test.json', 'utf8')
//   .then(readJson)
//   .then(getServerInfo)
//   .then(logResult)
//   .catch(logError)

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

let serverQueries = [
  doGameQuery('csgo', '91.121.154.84', 27016),
  doGameQuery('csgo', '91.121.154.84', 27015),
  doGameQuery('killingfloor', '91.121.154.84', 7708)
]

serverQueries.push(doGameQuery('killingfloor', '91.121.154.84', 7709))

Promise.race(serverQueries)
  .then(function (res) {
    log(res)
    // res.map(function (serverRespond) {
    //   log(serverRespond.name)
    // })
  })
  .catch(logError)

  // .then(logResult)
  // .catch(logError)
// doGameQuery('killingfloor', '91.121.154.84', 7708).then(logResult).catch(logError)

log('If you see me first congrats. This code is Asychonous !')
