const express = require('express');
const Expo = require('expo-server-sdk');

const app = express();
const expo = new Expo();

app.use(express.json());

app.get('/', function(req, res) {
  console.log(req);
  res.send('Hello World!');
});

app.post('/send-token', function(req, res) {
  console.log(req.body.token);
  const token = req.body.token;
  if (!Expo.isExpoPushToken(token)) {
    console.error(`Push token ${token} is not a valid Expo push token`);
  }
  expo
    .sendPushNotificationAsync({
      to: token,
      sound: 'default',
      body: 'Admin notification',
      data: { message: 'This is a test notification' },
    })
    .then(console.log, console.error);
  res.send('OK');
});

app.listen(3000, function() {
  console.log('Example app listening on port 3000!');
});
