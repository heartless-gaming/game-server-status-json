const color = require('chalk')
const isIp = require('is-ip')
const Promise = require('bluebird')
const readFile = Promise.promisify(require('fs').readFile)
const writeFile = Promise.promisify(require('fs').writeFile)
const gameQuery = require('game-server-query')
const chokidar = require('chokidar')
const moment = require('moment')
const nodemailer = require('nodemailer')
const sendmailTransport = require('nodemailer-sendmail-transport')

const log = console.log.bind(console)

const gameServerMap = 'heartlessgaming-serverinfo.json'
const gameServerStatusJson = 'heartlessgaming-serverstatus.json'

let logResult = function (res) {
  log(res)
}

let logError = function (err) {
  log(color.yellow(err))
}

let readJson = function (jsonFile) {
  let parseJson = function (json) {
    return new Promise(function (resolve) {
      resolve(JSON.parse(json))
    })
  }

  let parsingError = function () {
    log(`Parsing of ${jsonFile} failed`)
  }

  return readFile(jsonFile, 'utf8')
    .then(parseJson)
    .catch(parsingError)
}

let doGameQuery = function (gameId, ip, queryPort) {
  return new Promise(function (resolve, reject) {
    return gameQuery({type: gameId, host: `${ip}:${queryPort} `}, function (res) {
      if (res.error) reject('doGameQuery failed : ' + color.red(res.error))
      else resolve(res)
    })
  })
}

/*
 * Returns an array of doGameQuery funtion
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

  let buildGameServerQueries = function (gameServerIp) {
    return new Promise(function (resolve, reject) {
      let ip = gameServerIp
      let games = gameServerJson.games
      let gameQueries = []

      if (Array.isArray(games)) {
        games.map(function (game) {
          let gameId = game.gameId
          if (gameId !== undefined) {
            if (Array.isArray(game.gameServers)) {
              game.gameServers.map(function (gameServer) {
                let gameQueryPort = gameServer.queryPort
                gameQueries.push(doGameQuery(gameId, ip, gameQueryPort))
              })
            } else {
              reject(color.yellow('gameServers not an array in json file'))
            }
          }
        })
        resolve(gameQueries)
      } else {
        reject(color.yellow('Games not an array in json file.'))
      }
    })
  }

  return getIp(json)
    .then(buildGameServerQueries)
}

let doGameQueries = function (gameQueries) {
  return Promise.all(gameQueries)
}

let printPlayers = function (gameServersQueriesResult) {
  gameServersQueriesResult.map(function (queryResult) {
    log(`${queryResult.players.length} players on ${queryResult.name}`)
  })
}

let updateGameStatusJson = function (gameServersQueriesResult) {
  gameServersQueriesResult.map(function (queryResult) {
    log(`${queryResult.players.length} players on ${queryResult.name}`)
  })
}

readJson(gameServerMap)
  .then(getServerInfo)
  .then(doGameQueries)
  .then(updateGameStatusJson)
  .catch(logError)

log('If you see me first congrats. This code is Asynchonous !')
