//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

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
    password: String
});

/////////////////////////  PLUG IN PASSPORT-LOCAL-MONGOOSE ///////////////////////////////////
userSchema.plugin(passportLocalMongoose);




const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

///////////////////////////////HOME/////////////////////////////////////////////////
app.get("/", (req, res)=>{
    res.render("home");
})


///////////////////////////////SECRETS ROUTE/////////////////////////////////////////////////
app.get("/secrets", function(req, res){
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
});
///////////////////////////////REGISTER/////////////////////////////////////////////////
app.route("/register")
.get(function(req, res){
    res.render("register");
})
.post(function(req, res){
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register");
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
            console.log(err);
        }else{
            passport.authenticate('local')(req, res, function(){
                res.redirect("/secrets");
            })
        }
    })
});

///////////////////////////////LOG OUT/////////////////////////////////////////////////
app.get("/logout", function(req, res){
    req.logout();
    res.redirect('/');
})



app.listen(3000, function(){
    console.log("Server running on port 3000");
})