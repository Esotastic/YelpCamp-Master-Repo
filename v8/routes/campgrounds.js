var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");


//INDEX - shows all campgrounds currently in DB
router.get("/", function(req, res){
  Campground.find({}, function(err, allCampgrounds){
    if(err){
      console.log(err);
    } else {
       res.render("campgrounds/index", {campgrounds: allCampgrounds});
    }
  });
});

//NEW - show form to create new campground
router.get("/new", function(req, res){
  res.render("campgrounds/new");
});

//CREATE - creates new campgrounds and reroutes to INDEX
router.post("/", function(req, res){
  //get data from form and add to campgrounds array
  var name = req.body.name;
  var image = req.body.image;
  var desc = req.body.description;
  var newCampground = {name: name, image: image, description: desc};
  //Create a new campground and save to database
  Campground.create(newCampground, function(err, newlyCreated){
    if(err){
        console.log(err);
    }else{
      res.redirect("/campgrounds");
    }
  });
});

//SHOW - shows more info about a single campground
router.get("/:id", function(req, res){
  Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
    if(err){
      console.log(err);
    }else{
      res.render("campgrounds/show", {campground: foundCampground});
    }
  });
});

module.exports = router;
