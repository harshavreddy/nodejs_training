// =======================
// get the packages we need ============
// =======================
var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');
var async       = require("async");
var util        = require("util");
var promise     = require("bluebird");

var jwt         = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config      = require('./config'); // get our config file
var User        = require('./app/models/user'); // get our mongoose model
var Token       = require('./app/models/token');

// Promisify all mongoose functions
promise.promisifyAll(mongoose);

// =======================
// configuration =========
// =======================
var port = process.env.PORT || 8080; // used to create, sign, and verify tokens
var db = mongoose.connect(config.database); // connect to database

mongoose.connection.on('connected', function () {
  console.log("DB connected");
});

mongoose.connection.on('error', function (err) {
  console.log("DB connection error: %s", err);
});

mongoose.connection.on('disconnected', function () {
  console.log("DB diconnected");
});

app.set('superSecret', config.secret); // secret variable

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));

// =======================
// routes ================
// =======================
// basic route
app.get('/', function (req, res) {
  res.send('Hello! The API is at http://localhost:' + port + '/api');
});

// API ROUTES -------------------
// we'll get to these in a second

app.post('/setup', function (req, res) {

  // create a sample user
  var userDetails = new User({
    name: req.body.name,
    password: req.body.password,
    admin: 0
  });


  userDetails.save()
    .then(function (savedUser) {
      console.log('User saved successfully');
      res.json({ success: true,  savedUser: savedUser});
    })
    .catch(function (err) {
      console.log('User saved failure');
      res.json({ success: false,  error: err});
    });
});


// Authenticate the user and return the token.
app.post('/authenticate', function (req, res) {

  // find the user
  User.findOne({ name: req.body.name})
    .then(function (user) {
      if (!user) {
        res.json({ success: false, message: 'Authentication failed. User not found.' });
      } else if (user) {
      // check if password matches
        if (user.password !== req.body.password) {
          res.json({ success: false, message: 'Authentication failed. Wrong password.' });
        } else {
          // if user is found and password is right
          // create a token
          var token = jwt.sign(user, app.get('superSecret'), {
            expiresInMinutes: 1440 // expires in 24 hours
          });
          console.log("token", token);
          return token;
        }
      }
    })
    .then(function (token) {
       
     return Token.remove({user: req.body.name})
        .then(function (removedToken) {
          console.log("Successfully removed existing token");
          return token;
        })
        .catch(function (err) {
          res.json({
            success: false,
            message: 'Failed to removed existing token!',
            error: err
          });
        });
    })
    .then(function (token) {
      // create a new token for the user
      console.log('token1', token);
      console.log('name', req.body.name);
      var tokenObj = new Token({
        token: token,
        user: req.body.name,
      });
      // save the sample user and token into tokens
      tokenObj.save()
        .then(function (savedToken) {
          // return the information including token as JSON
          res.json({
            success: true,
            message: 'Enjoy your token!',
            token: savedToken
          });
        })
        .catch(function (err) {
          res.json({
            success: false,
            message: 'Failed to insert new token into tokens table!',
            error: err
          });
        });
    })
    .catch(function (err) {
      res.json({
        success: false,
        message: 'Failed to find the user in users table!',
        error: err
      });
    });
});

// =======================
// start the server ======
// =======================
app.listen(port);
console.log('Magic happens at http://localhost:' + port);
