			// =======================
			// get the packages we need ============
			// =======================
			var express     = require('express');
			var app         = express();
			var bodyParser  = require('body-parser');
			var morgan      = require('morgan');
			var mongoose    = require('mongoose');
			var async 		= require("async");
            var util 		= require("util");
            var promise		= require("bluebird");

			var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
			var config = require('./config'); // get our config file
			var User   = require('./app/models/user'); // get our mongoose model
			var Token   = require('./app/models/token'); 

			// =======================
			// configuration =========
			// =======================
			var port = process.env.PORT || 8080; // used to create, sign, and verify tokens
			var db = mongoose.connect(config.database); // connect to database

			mongoose.connection.on('connected', function() {
			console.log("DB connected");
			});

			mongoose.connection.on('error', function(err) {
			console.log("DB connection error: %s", err);
			});

			mongoose.connection.on('disconnected', function() {
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
			app.get('/', function(req, res) {
			res.send('Hello! The API is at http://localhost:' + port + '/api');
			});

			// API ROUTES -------------------
			// we'll get to these in a second

			app.get('/setup', function(req, res) {

			// create a sample user
			var nick = new User({ 
			name: 'Nikhil', 
			password: 'nikhil123',
			admin: 0 
			});

			// save the sample user
			nick.save(function(err, savedUser) {
			if (err) throw err;

			console.log('User saved successfully');
			res.json({ success: true,  savedUser: savedUser});
			});
			});


			// API ROUTES -------------------

			// get an instance of the router for api routes
			var apiRoutes = express.Router(); 

			// route to authenticate a user (POST http://localhost:8080/api/authenticate)
			// This is using the callbacks
			apiRoutes.post('/authenticate', function(req, res) {

			   // find the user
				User.findOne({
				name: req.body.name
				}, function(err, user) {

				if (err) throw err;

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
				    
                    Token.remove({user: req.body.name}, function(err){
                        if (err) {
                           res.json({
					         success: false,
					         message: 'Error saving the token!',
					         token: token
					       });
					       return;
                        }
					    // create a sample user
					    var tokenObj = new Token({ 
					          token: token, 
					          user: req.body.name,
					    });
					    // save the sample user
					    tokenObj.save(function(err, savedToken) {
					     if (err) throw err;
                            console.log("token:", token)
                            console.log("savedToken:", savedToken)

					       // return the information including token as JSON
					       res.json({
					         success: true,
					         message: 'Enjoy your token!',
					         token: token
					       });
					    }); 
                    });

			      }	 
                }
              });
			});

			// route middleware to verify a token
			apiRoutes.use(function(req, res, next) {

			  // check header or url parameters or post parameters for token
			  var token = req.body.token || req.query.token || req.headers['x-access-token'];

			  // decode token
			  if (token) {

			    // verifies secret and checks exp
			    jwt.verify(token, app.get('superSecret'), function(err, decoded) {      
			      if (err) {
			        return res.json({ success: false, message: 'Failed to authenticate token.' });    
			      } else {
			        // if everything is good, save to request for use in other routes
			        req.decoded = decoded;    
			        next();
			      }
			    });

			  } else {

			    // if there is no token
			    // return an error
			    return res.status(403).send({ 
			        success: false, 
			        message: 'No token provided.' 
			    });
			    
			  }
			});


			// route to show a random message (GET http://localhost:8080/api/)
			apiRoutes.get('/', function(req, res) {
			res.json({ message: 'Welcome to the coolest API on earth!' });
			});

			// route to return all users (GET http://localhost:8080/api/users)
			apiRoutes.get('/users', function(req, res) {

			// User.find({}, function(err, users) {
			// res.json(users);
			// });

				User.find({}).exec().then(function(users){
					res.json(users);
				}).catch(function(err){
					console.log(err);
				});

				
			});   


			// route to return all users (GET http://localhost:8080/api/users)
			apiRoutes.get('/getTokens', function(req, res) {
			   var tokens = [];
			   User.find({},'name -_id', function(err, users) {
			      //res.json(users);
                  console.log(users);

                  async.each(users, function(user, cb){
                     Token.findOne({user: user.name}, "token -_id", function(err,token){
                        tokens.push({name: user.name, token: token.token});
						cb();
						// to simulate the Error scenario.
                        //cb(new Error("This is user error"));
                     }) 
                  }, function(err) {
                  	 if(err)
                  	 {
                  	 	console.log("error", err);
                  	 	res.status(500).json(util.inspect(err));
                  	 } else {
                  	    res.json(tokens);	
                  	 }
                  	 
                  });

			    });
			});   


			// apply the routes to our application with the prefix /api
			app.use('/api', apiRoutes);

			// Handle death

			process.on('SIGINT', function() {
			db.mongoose.connection.close();
			});

			process.on('SIGTERM', function() {
			db.mongoose.connection.close();
			});

			// =======================
			// start the server ======
			// =======================
			app.listen(port);
			console.log('Magic happens at http://localhost:' + port);
