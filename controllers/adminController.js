const mongoose = require('mongoose');

const bcrypt = require('bcryptjs');
const fileHelper = require('../util/file');

const { validationResult, check } = require('express-validator');

const Product = require('../models/product');
const Category=require('../models/category');
const Admin=require("../models/admin");
const User=require("../models/user");
const Checkout = require('../models/checkout');
const Address = require('../models/address');
const Cart=require('../models/cart');

const notifier = require('node-notifier');

exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  
  res.render('admin/login', {
    path: '/admin/login',
    pageTitle: 'Login',
    errorMessage: message,
    oldInput: {
      email: '',
      password: ''
    },
    validationErrors: []
  });
};


exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/login', {
      path: '/admin/login',
      pageTitle: 'Login',
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  Admin.findOne({ email: email })
    .then(user => {
      if (!user) {
        return res.status(422).render('admin/login', {
          path: '/admin/login',
          pageTitle: 'Login',
          errorMessage: 'Invalid email or password.',
          validationErrors: []
        });
      }
      bcrypt
        .compare(password, user.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              console.log(err);
              res.redirect('/admin/get-all-products');
            });
          }
          return res.status(422).render('admin/login', {
            path: '/admin/login',
            pageTitle: 'Login',
            errorMessage: 'Invalid email or password.',
            validationErrors: []
          });
        })
        .catch(err => {
          console.log(err);
          res.redirect('/admin/login');
        });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};


exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};


exports.getAddProduct = async(req, res, next) => {
  
  const category=await Category.find();
  const catName=await category.map(cat=>cat);
  

  res.render('admin/add-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    category:catName,
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: []
  });
};

exports.postAddProduct = async(req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  const expireDate=req.body.expireDate;
  const date=expireDate;
  const category=req.body.category;
 // console.log(category);
  


  const categor=await Category.find();
  const catName=await categor.map(cat=>cat.name);
  const catName2=await categor.map(cat=>cat._id);
  

  const filteredIds2 = catName2.filter(objId => !category.includes(objId.toString()));
  const catName3=filteredIds2.map(obj=>obj.toString());
  //console.log(catName3);

  const categoryNames = await Category.find({ _id: { $in: category } }, 'name');
  const categoryNames2=categoryNames.map(category => category);
  //console.log(categoryNames2);
  
  const categoryNames3 = await Category.find({ _id: { $in: catName3 } }, 'name');
  const categoryNames4=categoryNames3.map(category => category);
  //console.log(categoryNames4);

    
  if (!image) {
    return res.status(422).render('admin/add-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description,
        expireDate:date,
        category : categoryNames2
      },
      category:categoryNames4,
      errorMessage: 'Attached file is not an image.',
      validationErrors: []
    });
  }
  const errors = validationResult(req);
  // console.log(errors);

  if (!errors.isEmpty()) {
   // console.log(errors.array());
    return res.status(422).render('admin/add-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description,
        expireDate:date,
        category : categoryNames2
      },
      category:categoryNames4,
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }


  // console.log(errorMessage);
  const imageUrl = image.path;

  const product = new Product({
    title: title,
    price: price,
    description: description,
    image: imageUrl,
    expireDate:expireDate,
    category:category
  });
  product
    .save()
    .then(result => {
      console.log('Created Product');
      //console.log(result);
      res.redirect("/admin/add-product");
      notifier.notify({
        title: 'Product Added',
        message: 'The product has been added successfully',
        sound: false, // Play a notification sound
        wait: true // Wait with callback until user action is taken on notification
    });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditProduct = async(req, res, next) => {
  const prodId = req.params.productId;
  const category=await Category.find();
  const catName=await category.map(cat=>cat);
  const catName2=await category.map(cat=>cat._id).map(obj=>obj.toString());

  const product =await Product.findById(prodId).populate('category');

  
  const oldCategory=await product.category.map(obj=>obj);
  //console.log(oldCategory);
  const oldCategory2=await product.category.map(obj=>obj._id).map(obj=>obj.toString());

  const restCategory=catName2.filter(id=> !oldCategory2.includes(id));

  const restCategory2=await Category.find({_id:{$in:restCategory}},'name');
  //console.log(restCategory2);
    
    if (!product) {
      return res.redirect('/admin/get-all-products');
    }
    
    const date = new Date(product.expireDate);
    const year = date.getFullYear();
    let month = (date.getMonth() + 1).toString().padStart(2, '0'); 
    let day = date.getDate().toString().padStart(2, '0');
    const oldDate = `${year}-${month}-${day}`;

    res.render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: true,
      expireDate:oldDate,
      OldC:oldCategory,
      RestC:restCategory2,
      product: product,
      hasError: false,
      errorMessage: null,
      validationErrors: []
    });
};

exports.postEditProduct = async(req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  //console.log(updatedTitle);
  const updatedPrice = req.body.price;
  const image = req.file;
  const updatedexpireDate=req.body.expireDate;
  const date=updatedexpireDate;
  const updatedDesc = req.body.description;
  const imageUrl = image.path;
  const category=req.body.category;
  const errors = validationResult(req);
  // console.log(errors);

  const categor=await Category.find();
  const catName=await categor.map(cat=>cat.name);
  const catName2=await categor.map(cat=>cat._id);
  

  const filteredIds2 = catName2.filter(objId => !category.includes(objId.toString()));
  const catName3=filteredIds2.map(obj=>obj.toString());
  //console.log(catName3);

  const categoryNames = await Category.find({ _id: { $in: category } }, 'name');
  const categoryNames2=categoryNames.map(category => category);
  //console.log(categoryNames2);
  
  const categoryNames3 = await Category.find({ _id: { $in: catName3 } }, 'name');
  const categoryNames4=categoryNames3.map(category => category);
  //console.log(categoryNames4);

  if (!errors.isEmpty()) {
    //console.log(errors.array());
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: false,
      hasError: true,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc,
        
        
      },
      expireDate:date,
      OldC : categoryNames2,
      RestC:categoryNames4,
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  Product.findById(prodId)
    .then(product => {
      // if (product.userId.toString() !== req.user._id.toString()) {
      //   return res.redirect('/');
      // }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      product.expireDate=updatedexpireDate;
      product.image=imageUrl;
      product.category=category;

      return product.save()
      .then(result => {
        console.log('UPDATED PRODUCT!'+result);
        
        notifier.notify({
          title: 'Product Updated',
          message: 'The product has been updated successfully',
          sound: true, // Play a notification sound
          wait: true, // Wait with callback until user action is taken on notification
          style: {
            backgroundColor: '#FF0000', // Red background color
            textColor: '#FFFFFF', // White text color
            borderRadius: 5, // 5px border radius
            time: 5000, // 5 seconds
        }
      });
      const previousPage = req.session.previousPage || '/';
      console.log(previousPage);
        res.redirect(previousPage);
      });
    })
    .catch(err => {
      console.log('error here4'+err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

const ITEMS_PER_PAGE = 5;
exports.getAllProducts = (req, res, next) => {
  req.session.previousPage = req.originalUrl;

  const page = +req.query.page || 1;
  let totalItems;
  const products = Product.find().populate('category')
  .countDocuments()
  .then(np=>{
    totalItems=np;

    return Product.find().populate('category')
    .skip((page-1)*ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE);

  })
  .then(product=>{
    res.render('admin/products', {
      prods: product,
      pageTitle: 'All Products',
      path: '/admin/get-all-products',
      currentPage:page,
      hasNextPage:(ITEMS_PER_PAGE*page)<totalItems,
      hasPreviousPage:page>1,
      nextPage:page+1,
      previousPage:page-1,
      lastPage:Math.ceil(totalItems/ITEMS_PER_PAGE),
      editing: false,
      hasError: false,
      errorMessage: null,
      validationErrors: []
    });
  })
 

};


exports.getAddCategory = async(req, res, next) => {

  req.session.previousPage=await req.originalUrl;
  const category=await Category.find();;
  const categoryNames =await category.map(category => category);

  // console.log(categoryNames);

  res.render('admin/category', {
    pageTitle: 'Add Category',
    path: '/admin/add-category',
    categoryy:categoryNames,
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: []
  });
};

exports.postAddCategory = async(req, res, next) => {
  const name = req.body.name;
  req.session.previousPage=await req.originalUrl;
  const categor=await Category.find();
  const categoryNames =await categor.map(category => category);
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    console.log(errors.array()[0].msg);
    return res.status(422).render('admin/category', {
      pageTitle: 'Add Category',
      path: '/admin/add-category',
      editing: false,
      hasError: true,
      cata:{
        name:name
      },
      categoryy:categoryNames,
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
      
    });
  }
  const category = new Category({
    name:name
  });

  category
    .save()
    .then(result => {
      console.log('Created category');
      notifier.notify({
        title: 'Category Added',
        message: 'Category Added Successfully',
        style: {
            backgroundColor: '#FF0000', // Red background color
            textColor: '#FFFFFF', // White text color
            borderRadius: 5, // 5px border radius
            time: 5000, // 5 seconds
        }
    });
      res.redirect("/admin/add-category")
    })
    .catch(err => {
      console.log('error6'+err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};


exports.postdeleteCategory=async(req,res)=>{
  const categoryId = req.body.categoryId;
  Category.findById(categoryId)
    .then(category => {
      if (!category) {
        return next(new Error('Category not found.'));
      }
      return Category.deleteOne({ _id: categoryId});
    })
    .then(() => {
      console.log('Category_deleted');
      // const checkout=Checkout.find().populate('items.product');
      // res.redirect('/admin/get-all-products');
      notifier.notify({
        title: 'Cetegory Deleted',
        message: 'category Deleted Successfully',
        style: {
            backgroundColor: '#FF0000', // Red background color
            textColor: '#FFFFFF', // White text color
            borderRadius: 5, // 5px border radius
            time: 5000, // 5 seconds
        }
    });
    
    return res.redirect('/admin/add-category');
    })
    .catch(err => {
      console.log('erro10'+err);
    });
};

exports.getAllProductsByCategory=async(req,res)=>{

  req.session.previousPage=req.originalUrl;
  const categoryId=await req.query.categoryId;
// console.log(categoryId);
  const products = await Product.find({ category: categoryId }).populate('category');
  const prods=await products.map(product=>product); 

  res.render('admin/cat-products', {
    prods: prods,
    pageTitle: 'Cat-Products',
    path: '/admin/get-products',
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: []
  });
};

exports.getDetails=async(req,res)=>{

  const productId=await req.query.productId;
  req.session.previousPage=req.originalUrl;
  const product=await Product.findById(productId).populate('category');
  res.render('admin/details',{
    product:product,
    pageTitle:Product,
    path:'/admin/details',
    editing:false,
    hasError:false,
    previousPage:req.session.previousPage || '/',
    errorMessage:null,
    validationErrors:[]
  });

};

// exports.getaddCategoryToProduct = (req, res, next) => {
//   const prodId = req.params.productId;
//   Product.findById(prodId)
//   .then(product=>{
//     if (!product) {
//       return res.redirect('/');
//     }
//     Category.find()
//     .then(category => {
//       if (!category) {
//         return res.redirect('/');
//       }
//       res.render('admin/add-category', {
//         pageTitle: 'Add category to product',
//         path: 'admin/products/add-category',
//         editing: false,
//         hasError: false,
//         category:category,
//         product:product,
//         errorMessage: null,
//         validationErrors: []
//       });
//     }).catch(err=>{
//       console.log('error99'+err);
//       const error = new Error(err);
//       error.httpStatusCode = 500;
//       return next(error);
//     });
//   }).catch(err=>{
//     console.log('error88'+err);
//     const error = new Error(err);
//       error.httpStatusCode = 500;
//       return next(error);
//   });
  
// };

// exports.postaddCategoryToProduct = async (req, res,next) => {
//   try {
//     const productId = req.body.productId;
//     const categoryId = req.body.category;
    
//     const product = await Product.findById(productId);
//     if (!product) {
//       return res.status(404).json({ message: 'Product not found' });
//     }
   
//     if (product.category.includes(categoryId)) {
//       notifier.notify({
//         title: 'Category already exists',
//         message: 'Category Added Successfully',
//         style: {
//             backgroundColor: '#FF0000', // Red background color
//             textColor: '#FFFFFF', // White text color
//             borderRadius: 5, // 5px border radius
//             time: 5000, // 5 seconds
//         }
//     });
//       res.redirect('/admin/get-all-products');
//     }

//     const updatedProduct = await Product.findByIdAndUpdate(productId,{ $push: { category: categoryId } },{ new: true });
//       console.log(updatedProduct);
//       console.log('product updated ');
//       notifier.notify({
//         title: 'Category Added',
//         message: 'Category Added Successfully',
//         style: {
//             backgroundColor: '#FF0000', // Red background color
//             textColor: '#FFFFFF', // White text color
//             borderRadius: 5, // 5px border radius
//             time: 5000, // 5 seconds
//         }
//     });
//       res.redirect('/admin/get-all-products');
  

//     } catch (err) {
//     console.log("error7"+err);
//     const error = new Error(err);
//       error.httpStatusCode = 500;
//       return next(error);

//   }
// };

exports.postdeleteProduct=(req,res)=>{
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return next(new Error('Product not found.'));
      }
      fileHelper.deleteFile(product.image);
      return Product.deleteOne({ _id: prodId});
    })
    .then(() => {
      console.log('DESTROYED PRODUCT');
      // const checkout=Checkout.find().populate('items.product');
      // res.redirect('/admin/get-all-products');
      notifier.notify({
        title: 'Product Deleted',
        message: 'Product Deleted Successfully',
        style: {
            backgroundColor: '#FF0000', // Red background color
            textColor: '#FFFFFF', // White text color
            borderRadius: 5, // 5px border radius
            time: 5000, // 5 seconds
        }
    });
   
    res.redirect('/admin/get-all-products');
    })
    .catch(err => {
      console.log('erro10'+err);
    });
};


exports.postremoveCategoryToProduct=async (req,res)=>{
  try {
    const productId = req.body.productId;
    const categoryId = req.body.categoryId;

    const updatedProduct = await Product.findByIdAndUpdate(productId, { $pull: { category: categoryId } }, { new: true });
    console.log(updatedProduct);

    console.log('Category removed from product');
    notifier.notify({
      title: 'Category Removed',
      message: 'Category Removed Successfully',
      style: {
          backgroundColor: '#FF0000', // Red background color
          textColor: '#FFFFFF', // White text color
          borderRadius: 5, // 5px border radius
          time: 5000, // 5 seconds
      }
  });
  const previousPage = req.session.previousPage || '/';
  console.log(previousPage);
    res.redirect(previousPage);
  
  } 
  catch (err) {
    console.log("Error12: " + err);
    const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
  }
};


exports.autoDeleteProduct=async(req,res)=>{

  const schedule = require('node-schedule');

schedule.scheduleJob('0 0 * * *', async () => {
  try {
    
    const expiredProducts = await Product.find({ expireDate: { $lte: new Date() } });

    for (const product of expiredProducts) {
      await Product.findByIdAndDelete(product._id);
      console.log(`Product ${product._id} deleted.`);
    }
  } catch (err) {
    console.error('Error deleting expired products:', err);
    const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);

  }
});

}


exports.getAllUser=async(req,res)=>{
  try{
    const users =await User.find().populate('address');
  
      res.render('admin/all-user', {
        users: users,
        pageTitle: 'All user',
        path: '/admin/all-user',
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors: []
      })}
  
      catch(err){
  console.log('err17'+err);
  const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
      }
};

exports.getAllCheckouts=async(req,res)=>{

  const userId = req.params.userId; // Assuming userId is passed as a parameter

  const checkout=await Checkout.find({ user: userId }).populate('address').populate('products');

  res.render('admin/all-checkout', {
    pageTitle: 'User Orders',
    path: '/admin/all-checkout',
    checkout:checkout,
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: []
  })
  

};


