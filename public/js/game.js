window.init = (function() {

  var $
    , io
    , socket
    , owner = false

  // jQuery Handlers
  var $player1
    , $player2
    , $pp1
    , $pp2
    , $ball
    , $lock
    , $newGame
    , $wait

  // In-game variables
  var players = [null, null]

  function startIO(io) {
    socket = io.connect('/')
    socket.on('connect', connected)
    socket.on('ready', ready)
    socket.on('moved', moved)
    socket.on('ball' , moveBall)
    socket.on('score', score)
    socket.on('disconnected', disconnected)
  }

  function connected() {
    newGame()
  }

  function disconnected() {
    alert('Disconnected. Restarting the game.')
    window.location = '/'
  }

  function newGame() {
    var $new = $newGame.find('.new')
      , $join = $newGame.find('.join')
      , $room = $newGame.find('.room')
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
      if (state.code) {
        startWait(state.code)
      } else {
        startGame()
      }
    }
  }

  function startWait(code) {
    owner = true
    $newGame.fadeOut(500, function() {
      $wait.find('.code').html(code)
      $wait.fadeIn(500)
    })
  }

  function startGame() {
    $lock.fadeOut(500, function() {
      $player1.show()
      $player2.show()
      $ball.show()
      players[0] = owner ? $player1 : $player2
      players[1] = owner ? $player2 : $player1
      if (owner) {
        socket.emit('start game')
      }
      $(window).mousemove(movePlayer)
    })
  }

  function score(data) {
    (data.who ? $pp2 : $pp1).html(data.score)
  }

  function moveBall(P) {
    $ball.css({
      'margin-left' : P[0]
    , 'margin-top'  : P[1]
    })
  }

  function movePlayer(e) {
    var y = e.pageY - 100
    players[0].css({ 'margin-top' : y })
    socket.emit('moved', y)
  }

  function moved(y) {
    if (players[1]) {
      players[1].css({ 'margin-top' : y })
    }
  }

  return function(w) {
    io = w.io
    $ = w.$

    $player1 = $('#player1')
    $player2 = $('#player2')
    $pp1 = $('.points.player1')
    $pp2 = $('.points.player2')
    $ball = $('#ball')

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
