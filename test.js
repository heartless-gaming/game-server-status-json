const color = require('chalk')
const isIp = require('is-ip')
const Promise = require('bluebird')
const readFile = Promise.promisify(require('fs').readFile)
const http = require('http')
const writeFile = Promise.promisify(require('fs').writeFile)
const gameQuery = require('game-server-query')
const request = require('request-promise')
const nodemailer = require('nodemailer')
const sendmailTransport = require('nodemailer-sendmail-transport')

const log = console.log.bind(console)

const gameServerMap = 'heartlessgaming-serverinfo.json'
const gameServerStatusJsonFile = 'heartlessgaming-serverstatus.json'

let logResult = function (res) {
  log(res)
}

let logError = function (err) {
  log(color.yellow(err))
}

let readJson = function (json) {
  return JSON.parse(json)
}

let doGameQuery = function (gameId, ip, queryPort) {
  return new Promise(function (resolve, reject) {
    return gameQuery({type: gameId, host: ip + ':' + queryPort}, function (res) {
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
    log(queryResult.players.length + ' players on ' + queryResult.name)
  })
}

// readFile(gameServerMap, 'utf8')
//   .then(readJson)
//   .then(getServerInfo)
//   .then(doGameQueries)
//   .then(printPlayers)
//   .catch(function (err) {
//     log(err)
//   })

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

// let serverQueries = []

// serverQueries.push(doGameQuery('csgo', '91.121.154.84', 27016))
// serverQueries.push(doGameQuery('csgo', '91.121.154.84', 27015))
// serverQueries.push(doGameQuery('csgo', '91.121.154.84', 27017))
// serverQueries.push(doGameQuery('killingfloor', '91.121.154.84', 7708))
// serverQueries.push(doGameQuery('killingfloor', '91.121.154.84', 7709))
// serverQueries.push(doGameQuery('killingfloor', '91.121.154.84', 7710))
// serverQueries.push(doGameQuery('insurgency', '91.121.154.84', 27018))
// serverQueries.push(doGameQuery('hl2dm', '91.121.154.84', 27021))

// Promise.all(serverQueries)
//   .then(function (res) {
//     res.map(function (serverRespond) {
//       log(serverRespond.players.length + ' players on ' + serverRespond.name)
//     })
//   })
//   .catch(logError)

/*
 * Calling the steam masterserver
 */
// let requestOptions = {
//   uri: steamApiCallUrl,
//   json: true
// }

// request(requestOptions)
//   .then(logResult)
//   .catch(logError)

/*
 * Testting mail sending
 */
let sendEmail = function (mailContent) {
  return new Promise(function (resolve, reject) {
    let mailSubject = '[Game Server Status] TIME TO FIX YOUR FUCKING SERVER'
    let mailFrom = ['game-server-status@heartlessgaming.com']
    let mailTo = ['skullmasher@heartlessgaming.com']

    let transporter = nodemailer.createTransport(sendmailTransport({
      path: '/usr/bin/mail/'
    }))

    transporter.sendMail({
      from: mailFrom,
      to: mailTo,
      subject: mailSubject,
      html: mailContent
    }, function (err, info) {
      if (err) {
        log(err)
        reject(err)
      } else {
        log(info)
        // if (info.accepted.length !== 0) {
        //   log(`Mail as been sent to : ${info.accepted}`)
        //   resolve(`Mail as been sent to : ${info.accepted}`)
        // } else {
        //   log('The mail was not accepted.')
        //   log(info)
        //   reject(info)
        // }
      }
    })
  })
}
// sendEmail('<h1>Hello There</h1>')
//   .then(logResult)
//   .catch(logError)

/*
 * Learning the promise way of writing a file with nodeJS
 */
let fileContent = '{"gameServerIp":"91.121.154.84","games":[{"gameName":"Counter-Strike : Global Offensive","gameId":"csgo","gameServers":[{"serverName":"Heartless Gaming | Public Competitive - tick 128","port":27015,"queryPort":27015,"isSourceGame":true,"players":"0 / 10"},{"serverName":"Heartless Gaming | Deathmatch FFA Only D2 - tick 128","port":27016,"queryPort":27016,"isSourceGame":true,"players":"0 / 16"},{"serverName":"Heartless Gaming | Deathmatch FFA HSMOD Only D2 - tick 128","port":27017,"queryPort":27017,"isSourceGame":true,"players":"0 / 16"}]},{"gameName":"Killing Floor","gameId":"killingfloor","gameServers":[{"serverName":"Heartless Gaming | HARD Long","port":7707,"queryPort":7708,"players":"0 / 6"},{"serverName":"Heartless Gaming | HARD Suicidal","port":7708,"queryPort":7709,"players":"0 / 6"},{"serverName":"Heartless Gaming | Killing Floor Private","port":7709,"queryPort":7710,"players":"0 / 6"}]},{"gameName":"Insurgency","gameId":"insurgency","gameServers":[{"serverName":"Heartless Gaming | Insurgency COOP - tick 128","port":27018,"queryPort":27018,"isSourceGame":true,"players":"0 / 6"}]},{"gameName":"Half-life 2: Deathmatch","gameId":"hl2dm","gameServers":[{"serverName":"Heartless Gaming | Half-Life 2 Deathmatch - Vanilla","port":27021,"queryPort":27021,"isSourceGame":true,"players":"0 / 16"}]}]}'

writeFile(gameServerStatusJsonFile, fileContent)
  .catch(logError)

log('If you see me first congrats. This code is Asychonous !')
