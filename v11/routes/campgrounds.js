var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware/");
var NodeGeocoder = require('node-geocoder');

var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};

var geocoder = NodeGeocoder(options);

//INDEX - shows all campgrounds currently in DB
router.get("/", function(req, res){
  if(req.query.search){
    const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    Campground.find({name: regex}, function(err, allCampgrounds){
      if(err){
        console.log(err);
      } else {
        if(allCampgrounds.length === 0) {
          req.flash("error", "Sorry, no campgrounds match your query. Please try again.");
          return res.redirect("/campgrounds");
        }
         res.render("campgrounds/index", {campgrounds: allCampgrounds, page: "campgrounds"});
      }
    });
  } else {
    Campground.find({}, function(err, allCampgrounds){
      if(err){
        console.log(err);
      } else {
         res.render("campgrounds/index", {campgrounds: allCampgrounds, page: "campgrounds"});
      }
    });
  }
});

//NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res){
  res.render("campgrounds/new");
});

//CREATE - creates new campgrounds and reroutes to INDEX
router.post("/", middleware.isLoggedIn, function(req, res){
  //get data from form and add to campgrounds array
  var name = req.body.name;
  var price = req.body.price;
  var image = req.body.image;
  var desc = req.body.description;
  var author = {
    id: req.user._id,
    username: req.user.username
  }
  geocoder.geocode(req.body.location, function(err, data){
    if(err || !data.length){
      req.flash("error", "Invalid Address!");
      return res.redirect("back");
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    var newCampground = {
      name: name,
      price: price,
      image: image,
      description: desc,
      author: author,
      location: location,
      lat: lat,
      lng: lng
    };
    //Create a new campground and save to database
    Campground.create(newCampground, function(err, newlyCreated){
      if(err){
          console.log(err);
      }else{
        res.redirect("/campgrounds");
      }
    });
  });
});

//SHOW - shows more info about a single campground
router.get("/:id", function(req, res){
  Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
    if(err|| !foundCampground){
      req.flash("error", "Campground not found.");
      res.redirect("back");
    }else{
      res.render("campgrounds/show", {campground: foundCampground});
    }
  });
});

//EDIT CAMPGROUND ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
          res.render("campgrounds/edit", {campground: foundCampground});
    });
});

//UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampgroundOwnership, function(req,res){
  geocoder.geocode(req.body.location, function(err, data){
    if(err || !data.length) {
      req.flash("error", "Invalid Address");
      return res.redirect("back");
    }
    req.body.campground.lat = data[0].latitude;
    req.body.campground.lng = data[0].longitude;
    req.body.campground.location = data[0].formattedAddress;
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground) {
      if(err){
        req.flash("error", err.message);
        res.redirect("/campgrounds");
      } else {
        req.flash("success", "Successfully Updated!");
        res.redirect("/campgrounds/"+req.params.id);
      }
    });
  });
});

//DESTROY CAMPGROUND ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
  Campground.findByIdAndRemove(req.params.id, function(err){
    if(err){
      res.redirect("/campgrounds");
    } else {
      res.redirect("/campgrounds");
    }
  });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;
