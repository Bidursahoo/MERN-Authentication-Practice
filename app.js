//jshint esversion:6
require("dotenv").config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose")
const app = express();
const encryption = require("mongoose-encryption")
app.use(express.static("public"))
app.set("view engine" , "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));



mongoose.connect("mongodb://localhost:27017/secretsDB" , {useNewUrlParser : true})
const userSchema = new mongoose.Schema({
    email : String,
    password : String
})
// const secret = process.env.secret;
userSchema.plugin(encryption , {secret: process.env.secret , encryptedFields : ["password"]})
const User = new mongoose.model("User" , userSchema);





app.get("/", (req,res)=>{
    res.render("home")
})
app.get("/login" , (req,res)=>{
    res.render("login")
})
app.get("/register" , (req,res)=>{
    res.render("register")
})
app.post("/register" , (req,res)=>{
    const newUser = new User({
        email : req.body.username,
        password : req.body.password
    })
    newUser.save().then((result) =>{
        res.render("secrets")
    })
})
app.post("/login" , (req,res)=>{
    let username = req.body.username;
    let password = req.body.password;
    User.findOne({ email : username}).then((result)=>{
        if(result){
            if(result.password === password){
                res.render("secrets")
            }
        }
    }) 
})

app.listen(3000, (req,res)=>{
    console.log("server started at 3000")
})