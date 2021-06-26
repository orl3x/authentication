//jshint esversion:6
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');

const app = express();
app.use(express.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static("public"));


mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = {
    email: String,
    password: String
}

const User = new mongoose.model("User", userSchema);
///////////////////////////////HOME/////////////////////////////////////////////////
app.get("/", (req, res)=>{
    res.render("home");
})


///////////////////////////////REGISTER/////////////////////////////////////////////////
app.route("/register")
.get(function(req, res){
    res.render("register");
})
.post(function(req, res){
    const email = req.body.username;
    const password = req.body.password;
    
    const newUser = new User({
        email: email,
        password: password
    });
    newUser.save(function(err){
        if(err){
            console.log(err);
        }else{
            console.log("New user added succesfully.")
            res.render("secrets");
        }
    });
});


///////////////////////////////LOG IN/////////////////////////////////////////////////

app.route("/login")
.get(function(req, res){
    res.render("login");
})

.post(function(req, res){
    const userName = req.body.username;
    const password = req.body.password;

    User.findOne({email: userName}, function(err, foundUser){
        if(err){
            console.log(err);
        }else{
        if(foundUser){
            if(foundUser.password === password){
                res.render("secrets");
            }
        }
        }
    })
})



app.listen(3000, function(){
    console.log("Server running on port 3000");
})