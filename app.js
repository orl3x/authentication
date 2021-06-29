//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GitHubStrategy = require('passport-github').Strategy;
const findOrCreate = require('mongoose-findorcreate');



const app = express();
app.use(express.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static("public"));


/////////////////////////  INITIALIZE SESSION ///////////////////////////////////
app.use(session({
    secret: 'this is my great secret',
    resave: false,
    saveUninitialized: false
}));

/////////////////////////  INITIALIZE PASSPORT ///////////////////////////////////
app.use(passport.initialize());
app.use(passport.session());



mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true});

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    githubId: String,
    secret: []
});

/////////////////////////  PLUG IN PASSPORT-LOCAL-MONGOOSE ///////////////////////////////////
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);




const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());


/////////////////////////////Serialize and Deserealize users////////////////////////////////////////////////
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      console.log(user);
      done(err, user);
    });
  });

  /////////////////////////////GOOGLE LOG IN STRATEGY//////////////////////////////////////////////////

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID_GOOGLE,
    clientSecret: process.env.CLIENT_SECRET_GOOGLE,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
      //console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

  /////////////////////////////FACEBOOK LOG IN STRATEGY//////////////////////////////////////////////////

passport.use(new FacebookStrategy({
    clientID: process.env.CLIENT_ID_FACEBOOK,
    clientSecret: process.env.CLIENT_SECRET_FACEBOOK,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


/////////////////////////////////////////GitHub LOG IN STRATEGY///////////////////////////////////////////////////////////////
passport.use(new GitHubStrategy({
    clientID: process.env.CLIENT_ID_GITHUB,
    clientSecret: process.env.CLIENT_SECRET_GITHUB ,
    callbackURL: "http://localhost:3000/auth/github/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ githubId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

///////////////////////////////HOME/////////////////////////////////////////////////
app.get("/", (req, res)=>{
    res.render("home");
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

  app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to secrets page.
    res.redirect('/secrets');
  });

  app.get('/auth/facebook',
  passport.authenticate('facebook'));

  app.get("/auth/facebook/secrets", 
  passport.authenticate('facebook', {failureRedirect: '/login'}),
   function(req, res){
      res.redirect('/secrets');
  })

  app.get('/auth/github',
  passport.authenticate('github'));

app.get('/auth/github/secrets', 
  passport.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

///////////////////////////////SECRETS ROUTE/////////////////////////////////////////////////
app.get("/secrets", function(req, res){
    if(req.isAuthenticated()){
      User.find({secret: {$ne: null}}, function(err, foundUsers){
        if(err){
          console.log(err);
        }else{
          res.render("secrets", {users: foundUsers});
        }
      })
        
    }else{
        //res.send("Wrong email or password");
        res.redirect("/login");
    }
});
///////////////////////////////REGISTER/////////////////////////////////////////////////
app.route("/register")
.get(function(req, res){
    res.render("register", {repeatedUser: ""});
})
.post(function(req, res){
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            const repeatedUser = "The email that you entered is already registered.";
            res.render("register", {repeatedUser: repeatedUser});
        }else{
            passport.authenticate("local")(req,res, function(){
                res.redirect("/secrets");
            })
        }
        })
});


///////////////////////////////LOG IN/////////////////////////////////////////////////
app.route("/login")
.get(function(req, res){
    res.render("login");
})

.post(function(req, res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if(err){
            res.send("Wrong email or password.")
        }else{
            passport.authenticate('local')(req, res, function(){
                res.redirect("/secrets");
            })
        }
    })
});


////////////////////////////SUBMIT A SECRET///////////////////////////////////////////

app.get("/submit", function(req, res){
  if(req.isAuthenticated()){
    res.render('submit');
  }else{
    res.redirect('/login');
  }
 
})

app.post('/submit', function(req, res){
  console.log(req.user._id);
  console.log(req.body.secret);
  User.findOne({_id: req.user._id}, function(err, foundUser){
    if(err){
      console.log(err)
    }else{
      foundUser.secret.push(req.body.secret);
      foundUser.save(function(err){
        if(err){
          console.log(err)
        }else{

          res.redirect('/secrets');
        }
      });
    }
  })
})

///////////////////////////////LOG OUT/////////////////////////////////////////////////
app.get("/logout", function(req, res){
    req.logout();
    res.redirect('/');
})



app.listen(3000, function(){
    console.log("Server running on port 3000");
})