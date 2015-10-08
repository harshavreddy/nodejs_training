app.get('/setup', function(req, res) {

  // create a sample user
  var nick = new User({ 
    name: 'harsha', 
    password: 'harsha123',
    admin: 0 
  });

  // save the sample user
  nick.save(function(err, savedUser) {
    if (err) throw err;

    console.log('User saved successfully');
    res.json({ success: true,  savedUser: savedUser});
  });
});