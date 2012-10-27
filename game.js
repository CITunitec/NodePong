var io = require('socket.io')
  , utils = require('./utils')
  , sock
  , rooms = {}
  , clients = { dummy : true }


exports.init = function(server) {
  sock = io.listen(server)
  sock.set('log level', 0)
  sock.on('connection', connected)
}


function connected(client) {
  var iam
    , enemy
    , code = 'dummy' // This value is unimportant
    , room // The code of the room owner

  while (clients[code]) {
    code = utils.shortcode()
  }

  clients[code] = client

  client.on('new', function() {
    console.log('new')
    room = code
    iam = 0
    rooms[room] = [{
      code   : code
    , points : 0
    }]
    client.emit('ready', {
      alright : true
    , players : rooms[room]
    })
  })

  client.on('join', function(_code) {
    room = _code
    if (!rooms[room]) {
      return
    }
    iam = 1
    var alright = rooms[room] && rooms[room].length === 1
      , ready
    if (alright) {
      // There is such room
      rooms[room][1] = {
        code   : code
      , points : 0
      }
    }
    ready = {
      alright : alright
    , players : rooms[room]
    }
    client.emit('ready', ready)
    clients[rooms[room][0].code].emit('ready', ready)
  })

  client.on('moved', function(y) {
    if (!rooms[room]) {
      return
    }
    if (!enemy) {
      enemy = clients[rooms[room][iam ^ 1].code]
    }
    if (enemy && enemy.emit) {
      enemy.emit('moved', y)
    }
  })

  client.on('ball', function(ball) {
    if (!rooms[room]) {
      return
    }
    if (!enemy) {
      enemy = clients[rooms[room][iam ^ 1].code]
    }
    if (enemy && enemy.emit) {
      enemy.emit('ball', ball)
    }
  })

  client.on('point', function(who) {
    if (enemy && enemy.emit) {
      enemy.emit('point', who)
    }
  })

  client.on('disconnect', function() {
    if (rooms[room]) {
      delete rooms[room]
    }
    client.emit('user disconnected')
    console.log('Disconnected')
  })
}
