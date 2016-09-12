
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

      var transporter = nodemailer.createTransport(
        readFile('smtpParams.js', 'utf8').catch(logError)
      )

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
            // reject(info)
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
