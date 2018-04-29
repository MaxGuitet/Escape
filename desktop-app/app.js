const http = require('http');

const express = require('express');
const exphbs = require('express-handlebars');
const session = require('express-session');
const io = require('socket.io');

const app = express();
const server = http.Server(app);
const IO = io(server);

app.use(express.json());
app.use(express.static('public'));
app.use(
  session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
  })
);

app.set('views', __dirname + '/views');
app.set('view engine', 'handlebars');

app.engine('handlebars', exphbs({ defaultLayout: 'main' }));

const messages = [];
let mainConnexion = null;
let timer = null;

app.locals.isTimerRunning = false;
app.locals.remainingTime = 3600;

app.get('/', function(req, res) {
  // Only allow one connexion from localhost
  if (!/^localhost/.test(req.headers.host)) {
    res.render('error', { notAuthorised: true });
    return;
  }
  if (mainConnexion && req.sessionID !== mainConnexion) {
    res.render('error');
    return;
  }

  mainConnexion = req.sessionID;

  res.render('home', {
    messages,
  });
});

function startTimer() {
  timer = setInterval(() => {
    if (app.locals.remainingTime === 0) {
      stopTimer();
      return;
    }
    app.locals.remainingTime -= 1;
    IO.emit('app timer updated', app.locals.remainingTime);
  }, 1000);
}

function stopTimer() {
  clearInterval(timer);
}

IO.on('connection', function(socket) {
  socket.on('send message', function(message) {
    messages.push(message);
    IO.emit('messages updated', JSON.stringify(messages));
    IO.emit('app message', JSON.stringify(message));
  });

  socket.on('toggle timer', function() {
    if (app.locals.isTimerRunning) {
      stopTimer();
    } else {
      startTimer();
    }
    app.locals.isTimerRunning = !app.locals.isTimerRunning;
  });

  socket.on('reset timer', function() {
    stopTimer();
    app.locals.remainingTime = 3600;
    IO.emit('app timer updated', app.locals.remainingTime);
  });
});

server.listen(3000, function() {
  console.log('Game master app listening on port 3000');
});
