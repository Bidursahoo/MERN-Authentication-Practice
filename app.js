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
// const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const findOrCreate = require('mongoose-findorcreate')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const encryption = require("mongoose-encryption")
// const md5 = require("md5");
// const bcrypt = require("bcrypt");


// const saltRound = 10;





app.use(express.static("public"))
app.set("view engine" , "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));
// app.use(session({
//   secret: 'keyboard cat',
//   resave: false,
//   saveUninitialized: true,
//   cookie: { secure: true }
// }))
app.use(session({
  secret:"hello bidur",
  resave: false,
  saveUninitialized: true,
   cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());






mongoose.connect("mongodb://127.0.0.1:27017/secretsDB" )
//mongoose.set("useCreateIndex",true);






const userSchema = new mongoose.Schema({
  username : String,
  password : String,
  googleId: String,
  secret:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);






const User = new mongoose.model("User" , userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// passport.serializeUser(function(user, done){
//   done(null, user.id);
// });
// passport.deserializeUser(function(id, done){
//   User.findById(id)
//   .then(user => {
//     done(null, user);
//   })
//   .catch(err => {
//     done(err, null);
//   });
// });




passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets"
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile);
  User.findOrCreate({ username: profile.displayName, googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));



// passport.use(new GoogleStrategy({
//   clientID:     process.env.clientid,
//   clientSecret: process.env.clientsecret,
//   callbackURL: "http://localhost:3000/auth/google/secrets",
//   passReqToCallback:true
//   // userProfileURL: "http://www.googleapis.com/oauth2/v3/userinfo"
// },
// function( accessToken, refreshToken, profile, done) {
//   User.findOrCreate({ googleId: profile.id }, function (err, user) {
//     return done(err, user);
//   });
// }
// ));



app.get("/", (req,res)=>{
    res.render("home")
});
// app.get("/auth/google" , (req,res)=>{
//   passport.authenticate("google" , { scope:
//     [ 'profile' ] })
// })
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
);
app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/secrets');
  });

app.get("/login" , (req,res)=>{
    res.render("login")
});
app.get("/register" , (req,res)=>{
    res.render("register")
});

app.get("/secrets", (req, res)=> {
    User.find({"secret": {$ne:null}}).then((foundUsers)=>{
      res.render("secrets", {usersWithSecrets: foundUsers})
    })




    // if (req.isAuthenticated()) {
    //   res.render("secrets");
    // } else {
    //   res.redirect("/login");
    // }
  });
app.get("/submit" , (req,res)=>{
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
})
app.post("/submit" , (req,res)=>{
  const submitedSecret = req.body.secret;
  console.log(req.user.id);
  User.findById(req.user.id ).then((userFound)=>{
    userFound.secret = submitedSecret;
    userFound.save().then(()=>{
      res.redirect("/secrets");
    });
  })
})

app.post("/register" , (req,res)=>{
    let {username , password} = req.body;
    User.register({ username }, password, (err, user)=>{
        if (err) {
          console.log(err);
          res.redirect("/register");
        } else {
          user.save();
          passport.authenticate("local")(req, res , ()=> {
            res.redirect("/secrets");
          });
        }
      }); 
});
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


app.get("/logout" , (req,res)=>{
  req.logout(function(err){
    if(err){
      console.log(err);
    }else{
      res.redirect("/")
    }
  });
});




app.get( '/auth/google/secrets',
    passport.authenticate( 'google', {
        successRedirect: '/secrets',
        failureRedirect: '/register'
}));   





app.listen(3000, (req,res)=>{
    console.log("server started at 3000")
});