var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Campground = require("../models/campground");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");

//ROOT ROUTE
router.get("/", function(req, res) {
  res.render("landing");
});


//==================
//AUTH routes
//==================

//show register form
router.get("/register", function(req, res){
  res.render("register", {page: "register"});
});
//handle sign-up logic
router.post("/register", function(req, res){
  var newUser = new User({username: req.body.username});
  if(req.body.adminCode === "code123") {
    newUser.isAdmin = true;
  }
  User.register(newUser, req.body.password, function(err, user){
    if(err){
      req.flash("error", err.message);
      return res.redirect("/register", {error: err.message});
    }
    passport.authenticate("local")(req, res, function(){
      req.flash("success", "Successfully Signed Up! Nice to meet you " + req.body.username);
      res.redirect("/campgrounds");
    });
  });
});

//show login form
router.get("/login", function(req, res){
  res.render("login", {page: "login"});
});

//handles login logic
router.post("/login",passport.authenticate("local", {
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
  }), function(req, res){
});

//logout route
router.get("/logout", function(req, res){
  req.logout();
  req.flash("success", "You have been logged out.")
  res.redirect("/campgrounds");
});


module.exports = router;
