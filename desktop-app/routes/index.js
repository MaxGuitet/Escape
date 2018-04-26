const Expo = require('expo-server-sdk');

/**
 * GET routes
 */

exports.index = function(req, res) {
  res.render('index', {
    sendMessage: function() {
      console.log('test');
    }
  });
};

/**
 * POST routes
 */

exports.receiveToken = function(req, res) {
  const token = req.body.token;
  if (!Expo.isExpoPushToken(token)) {
    console.error(`Push token ${token} is not a valid Expo push token`);
  }

  // Update app token
  req.app.locals.token = token;
  res.render('index');
};
