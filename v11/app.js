var express       = require("express"),
    app           = express(),
    bodyParser    = require("body-parser"),
    mongoose      = require("mongoose"),
    flash         = require("connect-flash"),
    moment        = require("moment"),
    passport      = require("passport"),
    LocalStrategy = require("passport-local"),
    Campground    = require("./models/campground"),
    Comment       = require("./models/comment"),
    User          = require("./models/user"),
    seedDB        = require("./seeds");
    methodOverride = require("method-override");


//requiring routes
var commentRoutes    = require("./routes/comments"),
    campgroundRoutes = require("./routes/campgrounds"),
    authRoutes       = require("./routes/index");


mongoose.connect(process.env.DEVDB);
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = require("moment");


// seedDB();  //seeds database

//PASSPORT CONFIGURATION
app.use(require("express-session")({
  secret:"The elbow macaroni is over.",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

app.use(authRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);


app.listen(process.env.PORT || 3000, process.env.IP || "localhost", function(){
  console.log("YelpCamp server is running.");
});
