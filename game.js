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
  var code = 'dummy' // This value is unimportant
    , room // The code of the room owner
    , user  = 0
    , enemy = 0
    , enemyClient = null
    , map = {
        width  : 700
      , height : 350
      , center : [
          335 // 700/2 - 15
        , 160 // 350/2 - 15
        ]
      }
    , players
    , ball  = {
        P   : [map.center[0], map.center[1]] // Position
      , V   : [-1, 0]
      , dt  : 5 // Frames per Second
      , dto : 5 // fps original value
      , dtf : 0.5 // fps growth factor
      , maxdt : 10
      }
    , score = [0, 0]
    , time  = 20
    , interval

  // Generating the code
  while (clients[code]) {
    code = utils.shortcode()
  }
  clients[code] = client

  client.on('new', function() {
    room = code
    rooms[room] = {
      players : [ [30, 100] ] // According to the class .player1 in the css
    }
    players = rooms[room].players // pointer
    user  = 0
    enemy = 1
    client.emit('ready', {
      alright : true
    , code    : code
    })
  })

  client.on('join', function(_code) {
    var ready

    room = _code
    if (rooms[room] === undefined || rooms[room].players.length !== 1) {
      return
    }

    user  = 1
    enemy = 0
    enemyClient = clients[room]
    rooms[room].players[1] = [640, 100] // According to the class .player2 in the css
    rooms[room].enemy = code
    players = rooms[room].players // pointer

    ready = {
      alright : true
    }

    client.emit('ready', ready)
    enemyClient.emit('ready', ready)
  })

  client.on('start game', function() {
    enemyClient = clients[rooms[room].enemy]
    // My excuse to this is that it should not be created for every user,
    // but only for the owners of the game.
    // It can't be out because it uses scope variables.
    interval = setInterval(function() {
      if (!rooms[room]) {
        clearInterval(interval)
      }
      var messages = {}
        , i = 0
        , diffx
        , diffy
        , border_left   = ball.P[0]
        , border_right  = map.width - ball.P[0]
        , border_top    = ball.P[1]
        , border_bottom = map.height - ball.P[1]
      if (border_left < 0) {
        score[1] += 1
        messages.score = { who : 1, score : score[1] }
        return sendMessages(messages)
      } else
      if (border_right < 31) {
        score[0] += 1
        messages.score = { who : 0, score : score[0] }
        return sendMessages(messages)
      } else
      if (border_top < 0 || border_bottom < 31) {
        ball.V[1] *= -1
      } else {
        for (; i < 2; i++) {
          diffx = Math.abs(players[i][0] - ball.P[0])
          diffy = players[i][1] - ball.P[1] + 35
          if (diffx < 30 && diffy < 65 && diffy > -65) {
            ball.V[0] *= -1
            ball.V[1] = diffy / -65
            if (ball.dt < ball.maxdt) {
              ball.dt += Math.abs(ball.V[1])
            }
            break
          }
        }
      }
      ball.P[0] += ball.V[0] * ball.dt
      ball.P[1] += ball.V[1] * ball.dt
      messages.ball = ball.P
      sendMessages(messages)
    }, time)
  })

  function sendMessages(messages) {
    var k
      , v
    if (messages.score) {
      if (ball.dt < ball.maxdt) {
        ball.dt = ball.dto + (ball.dtf *= 1.1)
      }
      v = ball.V[0]
      ball.V[0] = 0
      ball.V[1] = 0
      ball.P[0] = map.center[0]
      ball.P[1] = map.center[1]
      messages.ball = ball.P

      // Reposition delay
      setTimeout(function() {
        ball.V[0] = v
      }, 500)

    }
    for (k in messages) {
      client.emit(k, messages[k])
      enemyClient.emit(k, messages[k])
    }
  }

  client.on('moved', function(y) {
    if (rooms[room]) {
      rooms[room].players[user][1] = y
      enemyClient.emit('moved', y)
    }
  })

  client.on('disconnect', function() {
    if (rooms[room]) {
      delete rooms[room]
    }
    client.emit('disconnected')
  })
}
