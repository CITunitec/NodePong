var io = require('socket.io')
  , utils = require('./utils')
  , sock
  , rooms = {}
  , clients = {}

exports.init = function(server) {
  sock = io.listen(server)
  sock.on('connection', connected)
}


function connected(client) {
  var room
    , iam
    , enemy
  clients[client.id] = client
  client.on('new', function() {
    console.log('new')
    room = client.id
    iam = 0
    rooms[room] = [{
      id     : client.id
    , points : 0
    }]
    client.emit('ready', {
      alright : true
    , players : rooms[client.id]
    })
  })

  client.on('join', function(_room) {
    room = _room
    if (!rooms[room]) {
      return
    }
    iam = 1
    var alright = rooms[room] && rooms[room].length === 1
      , ready
    if (alright) {
      rooms[room][1] = {
        id     : client.id
      , points : 0
      }
    }
    ready = {
      alright : alright
    , players : rooms[room]
    }
    client.emit('ready', ready)
    clients[rooms[room][0].id].emit('ready', ready)
  })

  client.on('moved', function(y) {
    if (!rooms[room]) {
      return
    }
    if (!enemy) {
      enemy = clients[rooms[room][iam ^ 1].id]
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
      enemy = clients[rooms[room][iam ^ 1].id]
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
    if (rooms[client.id]) {
      delete rooms[client.id]
    }
    client.emit('user disconnected')
    console.log('Disconnected')
  })
}
