const fs = require('fs');
const http = require('http');

const _ = require('lodash');
const express = require('express');
const exphbs = require('express-handlebars');
const Expo = require('expo-server-sdk');
const session = require('express-session');
const io = require('socket.io');

const app = express();
const expo = new Expo();
const server = http.Server(app);
const IO = io(server);

const TOKENS_FILE = './tokens.tok';

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

app.locals.tokens = _.compact((fs.readFileSync(TOKENS_FILE).toString() || '').split('\n'));

let mainConnexion = null;
const messages = [];

app.get('/', function(req, res) {
  // Only allow one connexion at a time
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
    tokens: app.locals.tokens,
    messages,
  });
});

app.post('/set-token', function(req, res) {
  const token = req.body.token;
  if (!Expo.isExpoPushToken(token)) {
    return;
  }

  if (!_.includes(app.locals.tokens, token)) {
    fs.appendFileSync(TOKENS_FILE, `${token}\n`);
  }

  res.send('OK');
});

IO.on('connection', function(socket) {
  socket.on('send message', function(message) {
    messages.push(message);
    IO.emit('messages updated', JSON.stringify(messages));
    IO.emit('mobile message', JSON.stringify(message));
    // expo
    //   .sendPushNotificationAsync({
    //     to: app.locals.tokens[0],
    //     sound: 'default',
    //     body: 'Admin notification',
    //     data: { message },
    //   })
    //   .then(
    //     function() {
    //       messages.push(message);
    //       IO.emit('messages updated', JSON.stringify(messages));
    //     },
    //     function() {
    //       IO.emit('message error', 'Impossible d\'envoyer le message');
    //     }
    //   );
  });
});

server.listen(3000, function() {
  console.log('Example app listening on port 3000!');
});
