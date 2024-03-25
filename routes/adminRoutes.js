const path = require('path');

const express = require('express');
const { check, body } = require('express-validator');
const adminController = require('../controllers/adminController');
const moment = require('moment');
const Admin = require('../models/admin');
const multer = require('multer');

const router = express.Router();
const isAuth=require("../middlewares/isAuth");

const Category = require('../models/category');

const Product= require('../models/product');

router.get('/login', adminController.getLogin);

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
  adminController.postLogin
);

router.post('/logout',isAuth, adminController.postLogout);


router.get('/add-product',isAuth, adminController.getAddProduct);
router.post('/add-product',
  [
    body('title')
      .isString()
      .isLength({ min: 3 })
      .trim()
      .withMessage("enter title minimum length 3"),
    body('price')
      .isFloat()
      .withMessage("enter valid price amount"),
    body('description')
      .isLength({ min: 5, max: 400 })
      .trim()
      .withMessage("enter description minimum length 5 and maximum 400"),
     
    
  ],isAuth,adminController.postAddProduct);

router.get('/edit-product/:productId',isAuth,  adminController.getEditProduct);
router.post('/edit-product',[
  body('title')
    .isString()
    .isLength({ min: 3 })
    .trim()
    .withMessage("enter title minimum length 3"),
  body('price')
    .isFloat()
    .withMessage("enter valid price amount"),
  body('description')
    .isLength({ min: 5, max: 400 })
    .trim()
    .withMessage("enter description minimum length 5 and maximum 400"),
],isAuth,adminController.postEditProduct);


router.get('/add-category',isAuth,adminController.getAddCategory);
router.post('/add-category',[ 
  body('name')
  .isString()
  .isLength({ min: 3 })
  .trim()
  .custom((value, { req }) => {
    return Category.findOne({ name: value }).then(userDoc => {
      if (userDoc) {
        return Promise.reject(
          'category already exists'
        );
      }
    });
    
  })
],
isAuth,adminController.postAddCategory);
router.post('/delete-category',isAuth,adminController.postdeleteCategory);
// router.get('/products/add-category/:productId',isAuth,adminController.getaddCategoryToProduct);
// router.post('/products/add-category',isAuth,adminController.postaddCategoryToProduct);

router.post('/products/remove-category',isAuth,adminController.postremoveCategoryToProduct);

router.get('/get-all-products',isAuth,adminController.getAllProducts);
router.get('/get-products',isAuth,adminController.getAllProductsByCategory);

router.get('/details',isAuth,adminController.getDetails);

//admin e delete krvu hse toj thse
router.post('/delete-product',isAuth,adminController.postdeleteProduct);

//expire date thay atle automatically delete thai jay
router.post('/auto-delete',isAuth,adminController.autoDeleteProduct);


router.get('/all-user',isAuth,adminController.getAllUser);
router.get('/all-checkout/:userId',adminController.getAllCheckouts);











module.exports = router;
