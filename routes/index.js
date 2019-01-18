const express = require("express"),
  passport = require("passport"),
  middleware = require("../middleware");

const User = require("../models/user");
const router = express.Router();

// root Route
router.get("/", (req, res) => {
  res.render("landing");
});

//show register form
router.get("/register", (req, res) => {
  res.render("register", { page: "register" });
});

// handle sign up logic
router.post("/register", (req, res) => {
  const { username, password } = req.body.user;

  User.register(new User(req.body.user), password, (err, user) => {
    if (err) {
      return res.render("register", { error: err.message });
    } else {
      passport.authenticate("local", function(err, user) {
        req.flash("success", `Successfully signed up! Welcome ${username}`);
        res.redirect("/campgrounds");
      })(req, res);
    }
  });
});

// show login form
router.get("/login", (req, res) => {
  res.render("login", { page: "login" });
});

// handle login logic
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
  }),
  (req, res) => {
    //everything is done in middleware
  }
);

router.get("/users/:id/edit", middleware.isLoggedIn, (req, res) => {
  User.findById(req.user._id, (err, currentUser) => {
    if (err) {
      return res.redirect("/", { error: err.message });
    } else {
      res.render("profile/edit", { currentUser });
    }
  });
});

router.put("/users/:id", middleware.isLoggedIn, (req, res) => {
  res.send("CHANGE USER PROFILE");
});

//logout logic
router.get(
  "/logout",
  middleware.flashMessages({
    type: "success",
    text: "Successfully loged out"
  }),
  (req, res) => {
    req.logout();
    res.redirect("/");
  }
);

module.exports = router;
