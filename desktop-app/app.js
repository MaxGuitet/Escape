const express = require('express');
const exphbs = require('express-handlebars');
const Expo = require('expo-server-sdk');

const app = express();
const expo = new Expo();

app.use(express.json());
app.set('views', __dirname + '/views');
app.set('view engine', 'handlebars');
app.engine('handlebars', exphbs({ defaultLayout: 'main' }));

app.get('/', function(req, res) {
  res.render('home');
});

app.locals.token = null;

app.post('/set-token', function(req, res) {
  const token = req.body.token;
  if (!Expo.isExpoPushToken(token)) {
    console.error(`Push token ${token} is not a valid Expo push token`);
  }
  app.locals.token = token;
  res.send('OK');
});

app.post('/send-message', function(req, res) {
  expo
    .sendPushNotificationAsync({
      to: app.locals.token,
      sound: 'default',
      body: 'Admin notification',
      data: { message: req.body.message },
    })
    .then(console.log, console.error);
});

app.listen(3000, function() {
  console.log('Example app listening on port 3000!');
});
