const http = require('http');
const fs = require('fs');

const express = require('express');
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

app.engine('html', require('ejs').renderFile);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');

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

  // res.render('home', {
  //   imagesList: function() {
  //     try {
  //       return fs.readdirSync('./public/images').map(function(fileName) {
  //         return {
  //           display: fileName,
  //           url: `/images/${fileName}`,
  //           encoded: encodeURIComponent(fileName),
  //         };
  //       });
  //     } catch (err) {
  //       return [];
  //     }
  //   },
  //   messages: function() {
  //     return Array.from(messages).sort(
  //       (messageA, messageB) => (messageA.time < messageB.time ? 1 : -1)
  //     );
  //   },
  //   helpers: {
  //     formatTime: function() {
  //       if (!this.time) {
  //         return '';
  //       }
  //       return `${this.time.getHours()}:${
  //         this.time.getMinutes() < 10 ? '0' : ''
  //       }${this.time.getMinutes()}:${
  //         this.time.getSeconds() < 10 ? '0' : ''
  //       }${this.time.getSeconds()}`;
  //     },
  //   },
  // });

  res.render('main');
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
  socket.on('send message', function(text) {
    messages.push({
      text,
      time: new Date(),
    });
    IO.emit('messages updated', messages);
    IO.emit('app message', JSON.stringify(text));
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
    if (!fs.existsSync(`./public/images/${fileName}`)) {
      IO.emit('message error', 'Fichier non trouvé');
      return;
    }

    try {
      const fileBuffer = fs.readFileSync(`./public/images/${fileName}`);
      const { height, width } = calculatePNGDimensions(fileBuffer);
      IO.emit('app send image', {
        fileBuffer,
        height,
        width,
      });

      messages.push({
        text: `Image envoyée: ${fileName}`,
        time: new Date(),
      });
      IO.emit('messages updated', messages);
    } catch (err) {
      IO.emit('message error', "Impossible d'envoyer le fichier");
    }
  });
});

server.listen(3000, function() {
  // eslint-disable-next-line no-console
  console.log('Interface Maître du jeu accessible à http://localhost:3000');
});
