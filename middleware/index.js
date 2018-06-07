const Campground = require("../models/campground"),
	  Comment    = require("../models/comment"); 
	  

// all middleware goes here

let middlewareObj= {};

middlewareObj.checkCommentOwnership= (req, res, next) => {
	if(req.isAuthenticated()){
		Comment.findById(req.params.comment_id, (err,foundComment) =>{
			if(err){
				res.redirect("back");
			}else{
				if(foundComment.author.id.equals(req.user._id)){
					next();
				}else{
					res.redirect("back");
				}
			}
			
		});
	}else{
		//user is not authenticated
		req.flash("error", "You don't have permission to do that!!");
		res.redirect("back");
	}
}

middlewareObj.checkCampgroundOwnership = (req, res, next) => {
	if(req.isAuthenticated()){
		Campground.findById(req.params.id, (err,foundCampground) =>{
			if(err){
				res.redirect("back");
			}else{
				if(foundCampground.author.id.equals(req.user._id)){
					next();
				}else{
					res.redirect("back");
				}
			}
			
		});
	}else{
		//user is not authenticated
		req.flash("error", "You don't have permission to do that!!");
		res.redirect("back");
	}
}

middlewareObj.isLoggedIn= (req, res, next) => {
    if(req.isAuthenticated()){
        return next();
	}
	
	req.flash("error", "You have to be logged in to do that!");
    res.redirect("/login");
}

middlewareObj.flashMessages= (messageObj) => {
	return (req, res, next) => {
		req.flash(messageObj.type, messageObj.text);
		next();
	}
}

module.exports= middlewareObj;