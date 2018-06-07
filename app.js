const express= require('express');
const bodyParser= require('body-parser');
const mongoose= require('mongoose');
const expressSession= require('express-session');
const methodOverride= require('method-override');
const flash = require('connect-flash');

const passport = require('passport'),
	  LocalStrategy = require('passport-local');

const User = require('./models/user');
const Comment = require('./models/comment');
const Campground= require('./models/campground');

const app= express();
const PORT = process.env.PORT ? process.env.PORT : 3000;
const MONGODBPORT= process.env.MONGODBPORT || 27017;
const mongoDbUrl= process.env.MONGODBCONNECTOR;


//require ROUTES
const campgroundRoutes = require("./routes/campgrounds"),
	  commentsRoutes   = require("./routes/comments"),
	  indexRoutes	   = require("./routes/index"),
	  pwRecover		   = require("./routes/pwrecover");

const seedDB= require('./seed');	//remove everything from DB and seed it with new Data

mongoose.connect(mongoDbUrl);
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static(__dirname+'/public'));
app.use(methodOverride('_method'));
app.use(flash());

// seedDB();	// call the seeding function
app.locals.moment = require('moment');

// PASSPORT CONFIGURATION
app.use(expressSession({
	secret: "Testsecret123",
	resave: false,
	saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
	res.locals.currentUser= req.user;
	res.locals.error= req.flash("error");
	res.locals.success= req.flash("success");
	next();
});

app.use(indexRoutes);
app.use(pwRecover)
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentsRoutes);

app.listen(PORT, () => {
	console.log(`YelpCamp Server is listening`);
})