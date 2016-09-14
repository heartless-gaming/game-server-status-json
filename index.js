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

const gameServerMap = 'heartlessgaming-servermap.json'
const gameServerStatusJson = 'heartlessgaming-serverstatus.json'

let logResult = function (res) {
  log(res)
}

let logError = function (err) {
  log(color.yellow(err))
}

/*
 * Returns a parsed json file
 */
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

/*
 * Write a json file
 */
let writeJson = function (jsonFileName, fileContent) {
  let encodeJson = function (json) {
    return new Promise(function (resolve) {
      resolve(JSON.stringify(json))
    })
  }

  let encodeError = function () {
    log(`writing of ${jsonFileName} FAILED`)
  }

  let writeJsonFile = function (encodedJson) {
    log(encodedJson)
    return writeFile(jsonFileName, encodedJson)
  }

  return encodeJson(fileContent)
    .then(writeJsonFile)
    .catch(encodeError)
}

/*
 * Return the result of a game server query
 */
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
let buildGameQueries = function (gameServerJson) {
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

  return getIp(gameServerJson)
    .then(buildGameServerQueries)
}

/*
 * Actually execute an array of game server query all at the same time.
 */
let doGameQueries = function (gameQueries) {
  return Promise.all(gameQueries)
}

/*
 * Build an array that put each game query result into is own game array
 */
let formatQueriesResult = function (gameServersQueriesResult) {
  let formatedQueriesResult = [[]]
  let previousGame = gameServersQueriesResult[0].query.type
  let i = 0

  gameServersQueriesResult.map(function (gameServerQuery) {
    // Si la gameServerQuery.query.type changent je pouse les requete suivante dans la suite de l'array formatedQueriesResult
    if (previousGame === gameServerQuery.query.type) {
      formatedQueriesResult[i].push({players: gameServerQuery.players.length, maxplayers: gameServerQuery.maxplayers})
    } else {
      i++
      previousGame = gameServerQuery.query.type
      formatedQueriesResult[i] = [{players: gameServerQuery.players.length, maxplayers: gameServerQuery.maxplayers}]
    }
  })
  return formatedQueriesResult
}

/*
 *  Build a json containing all the game server info to be used by the frontend
 */
let updateGameStatusJson = function (formatedQueriesResult) {
  let readGameServerMap = function () {
    return readJson(gameServerMap)
  }

  let updateGameServersInfo = function (gameServerMap) {
    let gameServersInfo = gameServerMap
    for (let i = 0, l = gameServersInfo.games.length; i < l; i++) {
      let games = gameServersInfo.games
      for (let j = 0, l = games[i].gameServers.length; j < l; j++) {
        games[i].gameServers[j].players = `${formatedQueriesResult[i][j].players} / ${formatedQueriesResult[i][j].maxplayers}`
      }
    }

    return gameServersInfo
  }

  return readGameServerMap()
    .then(updateGameServersInfo)
}

let writeGameServerStatusJson = function (fileContent) {
  return writeJson(gameServerStatusJson, fileContent)
}

readJson(gameServerMap)
  .then(buildGameQueries)
  .then(doGameQueries)
  .then(formatQueriesResult)
  .then(updateGameStatusJson)
  .then(writeGameServerStatusJson)
  .catch(logError)

log('If you see me first congrats. This code is Asynchonous !')
