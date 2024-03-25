const path = require('path');

const express = require('express');
const { check, body } = require('express-validator');
const userController = require('../controllers/userController');
const User=require("../models/user");
const isAuth=require("../middlewares/isAuth");


const router = express.Router();



router.get('/login', userController.getLogin);

router.get('/signup',userController.getSignup);

router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address.')
      .normalizeEmail(),
    body('password', 'Password has to be valid.')
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim()
  ],
  userController.postLogin
);

router.post(
  '/signup',
  [
    check('email')
      .isEmail()
      .withMessage('Please enter a valid email.')
      .custom((value, { req }) => {
        
        return User.findOne({ email: value }).then(userDoc => {
          if (userDoc) {
            return Promise.reject(
              'E-Mail exists already, please pick a different one.'
            );
          }
        });
        
      })
      .normalizeEmail(),
    body(
      'password',
      'Please enter a password with only numbers and text and at least 5 characters.'
    )
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
    body('confirmPassword')
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords have to match!');
        }
        return true;
      })
  ],
  userController.postSignup
);

router.post('/logout',isAuth, userController.postLogout);



router.get('/get-all-prods',isAuth, userController.getAllProds);
router.get('/get-all-prods/all-prods',isAuth, userController.getAllProducts);
router.get('/get-all-prods/get-cat-prods',isAuth, userController.getCatProducts);


router.get('/address/:userId',isAuth,userController.getAddress);
router.post('/address',isAuth,userController.postAddress);
router.post('/postDeleteAddress',isAuth,userController.postDeleteAddress);

router.get('/profile',isAuth,userController.getUser);

router.get('/edit-profile/:userId',isAuth,userController.getEditProfile);
router.post('/edit-profile',isAuth,userController.postEditProfile);
 

router.get('/details',isAuth,userController.getDetails);


router.post('/addtocart',isAuth,userController.postAddtoCart);

router.post("/plus",isAuth,userController.postplus);
router.post("/minus",isAuth,userController.postminus);
router.post("/update",isAuth,userController.postupdate);

router.get("/getcart",isAuth,userController.getCart);

router.post("/removefromcart",isAuth,userController.removeCart);


router.get("/checkout",isAuth,userController.getCheckOut);
router.post("/checkout",isAuth,userController.postCheckOut);

router.get("/my-orders",isAuth,userController.getOrders);
router.get("/invoice",isAuth,userController.getInvoice);





module.exports = router;
