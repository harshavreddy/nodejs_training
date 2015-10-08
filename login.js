var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var nunjucks = require('nunjucks');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
app.use(express.static('views'));

nunjucks.configure('views', {
    autoescape: true,
    express: app
});

var USER_NAME = "harsha";
var PASSWORD = "harsha1234";

app.get('/', function (req, res) {
  res.redirect("/login");
});


app.get('/login', function (req, res) {
  var extraData = {err: ''};
  res.render('login.html', {extraData: extraData});

});

app.post('/login', urlencodedParser, function (req, res) {

 // Prepare output in JSON format
  var user_name = req.body.user_name;
  var password = req.body.password;

  if (user_name === USER_NAME && password === PASSWORD) {
    res.render('home.html', {user_name: user_name});
  } else {
    var err = "Invalid user name and password";
    res.render('login.html', {err: err}); 
  }

});


var server = app.listen(8081, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log(server.address());

  console.log("Example app listening at http://%s:%s", host, port);

});