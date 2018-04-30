const http = require('http');
const fs = require('fs');

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
    imagesList: function() {
      try {
        return fs.readdirSync('./images').map(function(fileName) {
          return {
            display: fileName,
            encoded: encodeURIComponent(fileName),
          };
        });
      } catch (err) {
        return [];
      }
    },
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

function calculatePNGDimensions(buffer) {
  if (buffer.toString('ascii', 12, 16) === 'CgBI') {
    return {
      width: buffer.readUInt32BE(32),
      height: buffer.readUInt32BE(36),
    };
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
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

  socket.on('send image', function(name) {
    const fileName = decodeURIComponent(name);
    if (!fs.existsSync(`./images/${fileName}`)) {
      IO.emit('message error', 'Fichier non trouvé');
      return;
    }

    try {
      const fileBuffer = fs.readFileSync(`./images/${fileName}`);
      const { height, width } = calculatePNGDimensions(fileBuffer);
      IO.emit('app send image', {
        fileBuffer,
        height,
        width,
      });
    } catch (err) {
      IO.emit('message error', 'Fichier non trouvé');
    }
  });
});

server.listen(3000, function() {
  console.log('Game master app listening on port 3000');
});
