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
const steamApiCallFile = 'heartlessgaming-steamapi.json'

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

readFile(gameServerMap, 'utf8')
  .then(readJson)
  .then(getServerInfo)
  .then(doGameQueries)
  .then(printPlayers)
  .catch(function (err) {
    log(err)
  })

/*
 * Send an email if a server is detected as 'bad version' or other if
 * the server is not listed in the steammaster server.
 */
let watchSteamApiCallFile = chokidar.watch(steamApiCallFile)

// Is valve sending us a reject field ?
let isRejected = function (json) {
  return new Promise(function (resolve, reject) {
    const now = `[ ${moment().format('YYYY/MM/DD HH:mm:ss')} ]`

    if (json.response.success) {
      let gameServers = json.response.servers
      let gameServersErrors = []

      // Search for reject field in the json file
      gameServers.map(function (gameServer) {
        if (gameServer.reject) gameServersErrors.push({'game': gameServer.gamedir, 'gamePort': gameServer.gameport, 'rejectReason': gameServer.reject})
      })

      if (gameServersErrors.length > 0) {
        reject(gameServersErrors)
      } else {
        resolve(`${now} Steam api call OK`)
      }
    } else {
      reject('Response success is false')
    }
  })
}

let SteamApiCallError = function (err) {
  const now = `[ ${moment().format('YYYY/MM/DD HH:mm:ss')} ]`

  let prepareMailContent = function () {
    return new Promise(function (resolve) {
      let mailContent = {html: '', text: ''}

      if (Array.isArray(err)) {
        err.map(function (gameError) {
          mailContent.html += `<p>${now} ${gameError.game} on port ${gameError.gamePort} as been rejected because: ${gameError.rejectReason}</p>`
          mailContent.text += `${now} ${gameError.game} on port ${gameError.gamePort} as been rejected because: ${gameError.rejectReason}`
        })
        resolve(mailContent)
      } else {
        mailContent.html = err
        mailContent.text = err
        resolve(mailContent)
      }
    })
  }

  /*
   * Send mail to alert an Heartless Member
   * Content must be an html string
   */
  let sendEmail = function (mailContent) {
    return new Promise(function (resolve, reject) {
      let mailSubject = '[Game Server Status] TIME TO FIX YOUR FUCKING SERVER'
      let mailFrom = ['game-server-status@heartlessgaming.com']
      let mailTo = ['skullmasher@heartlessgaming.com']

      var transporter = nodemailer.createTransport(sendmailTransport({
        path: '/usr/sbin/sendmail'
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
          if (info.accepted.length !== 0) {
            log(`${now} Mail as been sent to : ${info.accepted}`)
            resolve(`${now} Mail as been sent to : ${info.accepted}`)
          } else {
            log('The mail was not accepted.')
            log(info)
            reject(info)
          }
        }
      })
    })
  }

  return prepareMailContent()
    .then(sendEmail)
    .then(logResult)
    .catch(logError)
}

watchSteamApiCallFile
  .on('change', (path, stats) => {
    readFile(path)
      .then(readJson)
      .then(isRejected)
      .then(logResult)
      .catch(SteamApiCallError)
  })
  .on('error', error => log(`Watcher error: ${error}`))

log('If you see me first congrats. This code is Asynchonous !')
