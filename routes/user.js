var router = require('express').Router();
var User = require('../models/user');
var Cart = require('../models/cart');
var async = require('async');
var passport = require('passport');
var passportConf = require('../config/passport');

router.get('/login', function(req, res){
  if (req.user) return res.redirect('/');
  res.render('accounts/login', {
    message: req.flash('loginMessage')
  });
});

router.post('/login', passport.authenticate('local-login', {
  successRedirect: '/profile',
  failureRedirect: '/login',
  failureFlash: true
}));

router.get('/profile',function(req, res, next){
  User.findOne({ _id: req.user._id}, function(err, user){
    if (err) return next(err);

    res.render('accounts/profile', {user: user});
  });
});

router.get('/signup',function(req,res,next){
  res.render('accounts/signup',{
    errors: req.flash('errors')
  });
});

router.post('/signup', function(req,res,next){

  async.waterfall([
    function(callback) {
      var user = new User();
      user.profile.firstName = req.body.firstName;
      user.profile.lastName = req.body.lastName;
      user.profile.phonenumber = req.body.phonenumber;
      user.profile.address = req.body.address;
      user.email = req.body.email;
      user.password = req.body.password;
      user.profile.picture = user.gravatar();

      User.findOne({ email:req.body.email}, function(err,existingUser){
        if (existingUser){
          req.flash('errors', 'An account with that email address already exists !');
          // console.log(re.body.email + " is already existing");
          return res.redirect('/signup');
        }else{
          user.save(function(err,user){
            if (err) return next(err);

            callback(null, user);
            // return res.redirect('/');
            // res.json("New user has been created");
          });
        }
      });
    },

    function(user) {
      var cart = new Cart();
      cart.owner = user._id;
      cart.save(function(err) {
        if (err) return next(err);
        req.logIn(user, function(err) {
          if (err) return next(err);
          res.redirect('/profile');
        });
      });
    }
  ]);
  // user.save(function(err){
  //   if(err) return next(err);
  //
  //   res.json('Successfully created a new user');
  // });
});

router.get('/logout', function(req, res, next) {
  req.logout();
  res.redirect('/');
});

router.get('/edit-profile', function(req,res, next) {
  res.render('accounts/edit-profile.ejs', { message: req.flash('success')});
});

router.post('/edit-profile', function(req, res, next) {
  User.findOne({ _id:req.user._id }, function(err, user){
    if (err) return next(err);

    if (req.body.firstName) user.profile.firstName = req.body.firstName;
    if (req.body.address) user.profile.address = req.body.address;

    user.save(function(err) {
      if (err) return next(err);
      req.flash('success', 'Successfully updated your profile');
      return res.redirect('/edit-profile');
    });
  });
});

module.exports = router;
