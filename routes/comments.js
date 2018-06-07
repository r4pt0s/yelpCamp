const express= require("express"),
	  router= express.Router({mergeParams: true});

const middleware= require("../middleware");

const Campground = require("../models/campground"),
      Comment    = require("../models/comment");  


// New Comment Form
router.get("/new", middleware.isLoggedIn, (req, res) => {
	Campground.findById(req.params.id, (err, campground) =>{
		if(err){
			console.log(err);
		}else{
			res.render('comments/new', {campground});		
		}
	});		
});

// Add new Comment to DB
router.post("/", middleware.isLoggedIn, (req,res) => {

	Campground.findById(req.params.id, (err, campground) => {
		if(err){
			console.log(err);
		}else{
			Comment.create(req.body.comment, (err, comment) =>{
				if(err){
					console.log(err);
				}else{
                    // add username and id to comments
                    comment.author.id= req.user._id;
                    comment.author.username= req.user.username;

                    //save comment
                    comment.save();
                    
					campground.comments.push(comment);
					campground.save((err, entry) => {
						req.flash("success", "Thanks for your comment!!");
						res.redirect(`/campgrounds/${campground._id}`);
					});
					
				}
			});			
		}
	});
});

// Edit Route GET for Edit form 
router.get("/:comment_id/edit", middleware.checkCommentOwnership, (req, res) => {
	Comment.findById(req.params.comment_id, (err, comment)=> {
		if(err){
			console.log(err);
			res.redirect('back');
		}else{
			res.render("comments/edit", {campground_id: req.params.id, comment});
		}
	});
	
});

//Edit Route PUT to update the comment
router.put("/:comment_id", middleware.checkCommentOwnership, (req,res) => {
	Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, (err, updatedComment) => {
		if(err){
			res.redirect(`/campgrounds/${req.params.id}`);
		}else{
			req.flash("success", "Successfully updated comment!!")
			res.redirect(`/campgrounds/${req.params.id}`);
		}
	});

});

// DESTROY ROUTE DELETE
router.delete("/:comment_id", middleware.checkCommentOwnership, (req, res) => {
	Comment.findByIdAndRemove(req.params.comment_id, (err, deleted) => {
		if(err){
			res.redirect(`/campgrounds/${req.params.id}`);
		}else{
			req.flash("success", "Successfully deleted comment");
			res.redirect(`/campgrounds/${req.params.id}`);
		}
	});
});

module.exports= router;