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
  var newUser = new User({
    username: req.body.username,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    avatar: req.body.avatar
  });

  if(req.body.adminCode === "code123") {
    newUser.isAdmin = true;
  }
  User.register(newUser, req.body.password, function(err, user){
    if(err){
      req.flash("error", err.message);
      return res.render("/register", {error: err.message});
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

//forgot password
router.get('/forgot', function(req, res) {
  res.render('forgot');
});

router.post("/forgot", function(req, res){
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf){
        var token = buf.toString("hex");
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user){
        if(!user) {
          req.flash("error", "No account with that email exists!");
          return res.redirect("/forgot");
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 360000; //1 hour

        user.save(function(err){
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: "yelpcamppassreset@gmail.com",
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: "yelpcamppassreset@gmail.com",
        subject: "YelpCamp Password Reset",
        text: "You are receiving this because you (or someone else) have requested a reset of your YelpCamp password." +
        "Please click on the following link, or paste it into your browser and follow the prompts." +
        "http://" + req.headers.host + "/reset/" + token +"\n\n" +
        "If you didn't request this, please ignore this email and your password will remain unchanged."
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log("mail sent");
        req.flash("success", "An email has been sent to " + user.email + " with further instructions.");
        done(err, "done");
      });
    }
  ], function(err) {
    if(err) return next(err);
    res.redirect("/forgot");
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});


module.exports = router;
