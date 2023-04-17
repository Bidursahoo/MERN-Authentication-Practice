//jshint esversion:6
require("dotenv").config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const app = express();
const session = require("express-session");
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose");
// const encryption = require("mongoose-encryption")
// const md5 = require("md5");
// const bcrypt = require("bcrypt");


// const saltRound = 10;





app.use(express.static("public"))
app.set("view engine" , "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(session({
    secret: process.env.sessionsecret,
    resave : false,
    saveUninitialized : false
}));
app.use(passport.initialize());
app.use(passport.session());








mongoose.connect("mongodb://localhost:27017/secretsDB" , {useNewUrlParser : true})
const userSchema = new mongoose.Schema({
    email : String,
    password : String
})
userSchema.plugin(passportLocalMongoose)
// const secret = process.env.secret;
// userSchema.plugin(encryption , {secret: process.env.secret , encryptedFields : ["password"]})
const User = new mongoose.model("User" , userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.get("/", (req,res)=>{
    res.render("home")
})
app.get("/login" , (req,res)=>{
    res.render("login")
})
app.get("/register" , (req,res)=>{
    res.render("register")
})
app.get("/secrets", (req, res)=> {
    if (req.isAuthenticated()) {
      res.render("secrets");
    } else {
      res.redirect("/login");
    }
  });
app.post("/register" , (req,res)=>{
    // bcrypt.hash(req.body.password, saltRound, function(err, hash) {
    //     const newUser = new User({
    //         email : req.body.username,
    //         password : hash
    //     })
    //     newUser.save().then((result) =>{
    //         res.render("secrets")
    //     })
    // });
    User.register({ username: req.body.username }, req.body.password, function(err, user) {
        if (err) {
          console.log(err);
          res.redirect("/register");
        } else {
          passport.authenticate("local")(req, res, function() {
            res.redirect("/secrets");
          });
        }
      });
    
    
})
app.post("/login", (req,res)=>{
    const user = new User({
      username: req.body.username,
      password : req.body.password
    });
    req.login(user , function(err){
      if(err){
        console.log(err)
        res.redirect("/login")
      }else{
        passport.authenticate("local")(req, res, function() {
          res.redirect("/secrets");
        });
      }
    })

});
// app.post("/login" , (req,res)=>{
    // let username = req.body.username;
    // // let password = md5(req.body.password);
    // let password = req.body.password;
    // User.findOne({ email : username}).then((result)=>{
        
    //     if(result){
    //         // if(result.password === password){
    //         //     res.render("secrets")
    //         // }
    //         bcrypt.compare(password, result.password, function(err, res2) {
    //         // result == true
    //         if(res2 == true){
    //             res.render("secrets");
    //         }
    //         });
    //     }
    // }) 
// })

app.get("/logout" , (req,res)=>{
  req.logout(function(err){
    if(err){
      console.log(err);
    }else{
      res.redirect("/")
    }
  });
})

app.listen(3000, (req,res)=>{
    console.log("server started at 3000")
})