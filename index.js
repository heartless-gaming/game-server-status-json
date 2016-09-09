const gameQuery = require('game-server-query')
const serverMap = require('./heartlessgaming-serverinfo.json')

let log = console.log.bind(console)

gameQuery({type: 'csgo', host: '91.121.154.84:27015'}, function (state) {
  // console.log(state)
  if (state.error) {
    console.log('Server is offline')
  } else {
    console.log(state)
  }
})

log(serverMap)
