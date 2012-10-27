window.init = (function() {

  var $
    , io
    , socket
    , game
    , owner = false

  // jQuery Handlers
  var $game
    , $player1
    , $player2
    , $pp1
    , $pp2
    , $ball
    , $lock
    , $newGame
    , $wait
    , $error

  // In-game variables
  var map = {
        width  : 0
      , height : 0
      , center : []
      }
    , players = [{ $ : null, P : [0, 0] }, { $ : null, P : [0, 0] }]
    , time  = 20
    , ball  = {
        P   : [0, 0] // Position
      , V   : [-1, 0]
      , dt  : 5 // Frames per Second
      , dto : 5 // fps original value
      , dtf : 0.5 // fps growth factor
      }
    , points = [0, 0]

  function startIO(io) {
    console.log(':io')
    socket = io.connect('/')
    socket.on('connect', connected)
    socket.on('ready', ready)
    socket.on('moved', moved)
  }

  function connected() {
    console.log('Connected')
    newGame()
  }

  function newGame() {
    var $new = $newGame.find('.new')
      , $join = $newGame.find('.join')
      , $room = $newGame.find('.room')
    $error = $newGame.find('.error')
    $lock.show()
    $new.on('click', function(e) {
      e.preventDefault()
      console.log(':new')
      socket.emit('new')
    })
    $join.on('click', function(e) {
      e.preventDefault()
      socket.emit('join', $room.val())
    })
  }

  function ready(state) {
    if (state.alright) {
      switch (state.players.length) {
        case 1: startWait(state); break;
        case 2: startGame(state); break;
      }
    } else {
      $error.html(state.error).show()
    }
  }

  function startWait(state) {
    owner = true
    $newGame.fadeOut(500, function() {
      $wait.find('.code').html(state.players[0].code)
      $wait.fadeIn(500)
    })
  }

  function startGame(state) {
    if (state) {
      game = state
    }
    $lock.fadeOut(500, function() {
      $player1.show()
      $player2.show()
      $ball.show()
      if (state) {
        players[0].$ = owner ? $player1 : $player2
        players[0].P[0] = players[0].$.css('margin-left')
        players[0].P[0] = + players[0].P[0].substr(0, players[0].P[0].length - 2)
        players[0].P[1] = players[0].$.css('margin-top')
        players[0].P[1] = + players[0].P[1].substr(0, players[0].P[1].length - 2)
        players[1].$ = owner ? $player2 : $player1
        players[1].P[0] = players[1].$.css('margin-left')
        players[1].P[0] = + players[1].P[0].substr(0, players[1].P[0].length - 2)
        players[1].P[1] = players[1].$.css('margin-top')
        players[1].P[1] = + players[1].P[1].substr(0, players[1].P[1].length - 2)
      }
      ball.P[0] = map.center[0]
      ball.P[1] = map.center[1]
      if (owner) {
        ball.V[1] = 0
        ball.dt = ball.dto + (ball.dtf *= 1.1)
      }
      if (state) {
        if (owner) {
          setInterval(function() {
            socket.emit('ball', ball)
          }, time)
          setInterval(moveBall, time)
        } else {
          socket.on('ball', movedBall)
          socket.on('point', point)
        }
        $(window).mousemove(movePlayer)
      }
    })
  }

  function moveBall() {
    var i = 0
      , diffx
      , diffy
      , border_left   = ball.P[0]
      , border_right  = map.width - ball.P[0]
      , border_top    = ball.P[1]
      , border_bottom = map.height - ball.P[1]
    if (border_left < 0) {
      $pp2.html(++points[1])
      socket.emit('point', 1)
      return startGame()
    } else
    if (border_right < 31) {
      $pp1.html(++points[0])
      socket.emit('point', 0)
      return startGame()
    } else
    if (border_top < 0 || border_bottom < 31) {
      ball.V[1] *= -1
    } else {
      for (; i < 2; i++) {
        diffx = Math.abs(players[i].P[0] - ball.P[0])
        diffy = players[i].P[1] - ball.P[1] + 35
        if (diffx < 30 && diffy < 65 && diffy > -65) {
          // P += V * (d/t)
          ball.V[0] *= -1
          ball.V[1] = diffy / -65
          ball.dt += Math.abs(ball.V[1])
          break
        }
      }
    }
    ball.P[0] += ball.V[0] * ball.dt
    ball.P[1] += ball.V[1] * ball.dt
    movedBall(ball)
  }

  function point(who) {
    (who ? $pp2 : $pp1).html(++points[who])
  }

  function movedBall(ball) {
    $ball.css({
      'margin-left' : ball.P[0]
    , 'margin-top'  : ball.P[1]
    })
  }

  function movePlayer(e) {
    var y = e.pageY - 100
    players[0].$.css({ 'margin-top' : y })
    players[0].P[1] = y
    socket.emit('moved', y)
  }

  function moved(y) {
    players[1].$.css({ 'margin-top' : y })
    players[1].P[1] = y
  }

  return function(w) {
    io = w.io
    $ = w.$

    $player1 = $('#player1')
    $player2 = $('#player2')
    $pp1 = $('.points.player1')
    $pp2 = $('.points.player2')
    $ball = $('#ball')
    $game = $('#game')

    map.width = $game.width()
    map.height = $game.height()
    map.center = [map.width/2 - 15, map.height/2 - 15]

    $ball.css({
      'margin-left' : map.center[0]
    , 'margin-top'  : map.center[1]
    })

    $lock = $('#lock')
    $newGame = $('#newGame')
    $wait = $('#wait').fadeOut(0)

    console.log(':init')
    startIO(io)
  }

})()

window.onload = function() {
  console.log(':onload')
  window.init(window)
}
