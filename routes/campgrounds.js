const express= require("express"),
      router= express.Router();

const Campground = require("../models/campground");    
const middleware= require("../middleware");
const NodeGeocoder = require('node-geocoder');
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);


//Show all Campgrounds
router.get('/', (req,res) => {

	if (req.query.search) {
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');

		Campground.find({name: regex}, (err, allCampgrounds) =>{
			if(err){
				console.log(err);
			}else{
				res.render('campgrounds/index', { campgrounds: allCampgrounds, page: 'campgrounds'});
			}
		});
	}else{
		Campground.find({}, (err, allCampgrounds) =>{
			if(err){
				console.log(err);
			}else{
				res.render('campgrounds/index', { campgrounds: allCampgrounds, page: 'campgrounds'});
			}
		})
	}
});

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, (req, res)=> {
	// get data from form and add to campgrounds array
	const {name, price, image, description} = req.body;
	const author = {
		id: req.user._id,
		username: req.user.username
	}
	geocoder.geocode(req.body.location, function (err, data) {
	  if (err || !data.length) {
		req.flash('error', 'Invalid address');
		return res.redirect('back');
	  }
	  const lat = data[0].latitude;
	  const lng = data[0].longitude;
	  const location = data[0].formattedAddress;
	  const newCampground = {name,image, description, author, location, lat, lng};
	  // Create a new campground and save to DB
	  Campground.create(newCampground, (err, newlyCreated) =>{
		  if(err){
			  console.log(err);
		  } else {
			  //redirect back to campgrounds page
			  console.log(newlyCreated);
			  res.redirect("/campgrounds");
		  }
	  });
	});
  });

// Show Add new Campground Form
router.get('/new', middleware.isLoggedIn, (req, res) => {
	res.render('campgrounds/new');
});

// Show selected Campground
router.get("/:id", (req,res) => {

	Campground.findById(req.params.id).populate('comments').exec((err,item) =>{
		if(err){
			console.log(err);
		} else {
			res.render('campgrounds/show', { campground: item});
		}
	});
});

//Edit campground GET Request
router.get("/:id/edit", middleware.checkCampgroundOwnership, (req,res) => {
	Campground.findById(req.params.id, (err, campground)=> {
		if(err){
			console.log(err);
		}else{
			res.render('campgrounds/edit', {campground});
		}
	});
});

//Update Campground Put Request
router.put("/:id", middleware.checkCampgroundOwnership, (req,res) => {
	geocoder.geocode(req.body.location, function (err, data) {
		if (err || !data.length) {
		  req.flash('error', 'Invalid address');
		  console.log(err);
		  return res.redirect('back');
		}
		req.body.campground.lat = data[0].latitude;
		req.body.campground.lng = data[0].longitude;
		req.body.campground.location = data[0].formattedAddress;

		Campground.findByIdAndUpdate(req.params.id, req.body.campground, (err, data)=>{
			if(err){
				res.redirect('/campgrounds');
			}else{
				req.flash("success", "Successfully updated campground");
				res.redirect(`/campgrounds/${req.params.id}`);
			}
		});
	});
});

//Destroy Camground DELETE Request
router.delete("/:id", middleware.checkCampgroundOwnership, (req, res) => {
	Campground.findByIdAndRemove(req.params.id, (err, success) => {
		if(err){
			res.redirect(`/campgrounds/${req.params.id}`);
		}else{
			req.flash("success", "Successfully deleted campground !!");
			res.redirect('/campgrounds/');
		}
	})
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports= router;