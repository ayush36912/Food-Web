const mongoose = require('mongoose');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const fileHelper = require('../util/file');

const path = require('path');

const PDFDocument = require('pdfkit');
const notifier = require('node-notifier');

const { validationResult, check, checkExact } = require('express-validator');

const Product = require('../models/product');
const Address= require("../models/address");
const Cart = require("../models/cart");
const Checkout=require("../models/checkout");
const User=require("../models/user");
const Category = require('../models/category');
const product = require('../models/product');
const checkout = require('../models/checkout');



exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  
  res.render('user/login', {
    path: '/user/login',
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
    return res.status(422).render('user/login', {
      path: '/user/login',
      pageTitle: 'Login',
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        return res.status(422).render('user/login', {
          path: '/user/login',
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
              res.redirect('/user/get-all-prods/all-prods');
            });
          }
          return res.status(422).render('user/login', {
            path: '/user/login',
            pageTitle: 'Login',
            errorMessage: 'Invalid email or password.',
            validationErrors: []
          });
        })
        .catch(err => {
          console.log(err);
          res.redirect('/user/login');
        });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('user/signup', {
    path: '/user/signup',
    pageTitle: 'Signup',
    hasError:false,
    errorMessage: message,
    
    validationErrors: []
  });
};

exports.postSignup = (req, res, next) => {
  const name=req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const countryCode=req.body.countryCode;
  const phoneNo=req.body.phoneNo;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render('user/signup', {
      path: '/user/signup',
      pageTitle: 'Signup',
      hasError:true,
      errorMessage: errors.array()[0].msg,
      oldInput: {
        name:name,
        email: email,
        password: password,
        confirmPassword: req.body.confirmPassword,
        countryCode:countryCode,
        phoneNo:phoneNo
      },
      validationErrors: errors.array()
    });
  }
  bcrypt
    .hash(password, 12)
    .then(hashedPassword => {
      const user = new User({
        email: email,
        password: hashedPassword,
        countryCode:countryCode,
        phoneNo:phoneNo,
        name:name
      });
      return user.save();
    })
    .then(result => {
      res.redirect('/user/login');
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








exports.getAllProds=async(req,res)=>{
  const user=req.session.user;

  const cart = await Cart.findOne({ user:user });
 
  if (!cart) {
      const cart=new Cart({ user:user, items: [] });
      cart.save()
      console.log("empty cart created for new user");
  }
   const category= await Category.find();
   const categoryNames= await category.map(cat=>cat);
   
   res.render('user/products', {
    category: categoryNames,
    pageTitle: 'Products',
    path: '/user/get-all-prods',
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: []
  });

};

const ITEMS_PER_PAGE = 3;

exports.getAllProducts=async(req,res)=>{

  
  req.session.previousPage=req.originalUrl;
  const cartt = await Cart.findOne({ user:req.session.user._id });
 
  if (!cartt) {
      const cart=new Cart({ user:req.session.user._id, items: [] });
      cart.save()
      console.log("empty cart created for new user");
  }
  const users =await User.findById(req.session.user._id);
  const page = +req.query.page || 1;
    let totalItems;

  const cart=await Cart.findOne({user:req.session.user._id}).populate('items.product');

  // const data=await res.json(cart);
  // console.log(data);

  Product.find().populate('category')

  
  
  .countDocuments()
  .then(np=>{
    
    totalItems=np;

    return Product.find().populate('category')
    .skip((page-1)*ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE);

  })
  .then(prod=>{
    // if(prod.includes(cart.items.product._id.toString())){
    //   console.log("got it");
    // }
    // console.log(prod);
    res.render('user/prods', {
            prods: prod,
            pageTitle: 'All Products',
            user:users,
            cart:cart,
            path: '/user/get-all-prods/all-prods',
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

exports.getCatProducts=async(req,res)=>{

  
  req.session.previousPage=req.originalUrl;
  const cart=await Cart.findOne({user:req.session.user._id}).populate('items.product');
  const categoryId=await req.query.category;
  const users =await User.findById(req.session.user._id);
  const products = await Product.find({ category: categoryId }).populate('category');
  const prods=await products.map(product=>product); 

  res.render('user/cat-prods', {
    prods: prods,
    user:users,
    cart:cart,
    pageTitle: 'Products',
    path: '/user/get-all-prods/get-cat-prods',
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: []
  });

};


exports.getAddress=(req,res)=>{
 
 const userId=req.params.userId;

 User.findById(userId)
 .then(user=>{
    if(!user){
      return res.redirect("/user/get-all-prods");
    }

  res.render('user/address', {
    pageTitle: 'Add Address',
    path: '/user/address',
    user:user,
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: []
  });

 })
 .catch(err=>{
    console.log('err15'+err);
    const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
 })
}
var http = require('http');
exports.postAddress=async(req,res)=>{

  const street=req.body.street;
  const address_line=req.body.address_line;
  const city=req.body.city;
  const postalCode=req.body.postalCode;
  const country=req.body.country;
  const userId=req.body.userId;

const address=new Address({
  street:street,
  address_line:address_line,
  country:country,
  postalCode:postalCode,
  city:city
});
address.save()
.then(result=>{
  console.log('address added successfully');
  notifier.notify({
    title: 'Address Added',
    message: 'Address Added Successfully',
    style: {
        backgroundColor: '#FF0000', // Red background color
        textColor: '#FFFFFF', // White text color
        borderRadius: 5, // 5px border radius
        time: 5000, // 5 seconds
    }
});
})
.catch(err=>{
  console.log('err17'+err);
  const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
});


  const updatedUser= await User.findByIdAndUpdate(userId,{ $push: {address:address} }, { new: true } );
  updatedUser.save();
  console.log('user updated');
  const previousPage = req.session.previousPage || '/';
    
    // Redirect back to the previous page
    res.redirect(previousPage);

}
exports.postDeleteAddress=async(req,res,next)=>{

  const addressId=req.body.addressId;
  console.log(addressId);
  Address.findById(addressId)
  .then(address => {
    if (!address) {
      return next(new Error('Address not found.'));
    }
    return Address.deleteOne({ _id: addressId});
  })
  .then(() => {
    console.log('Address_deleted');
    
    notifier.notify({
      title: 'Address Deleted',
      message: 'Address Deleted Successfully',
      style: {
          backgroundColor: '#FF0000', // Red background color
          textColor: '#FFFFFF', // White text color
          borderRadius: 5, // 5px border radius
          time: 5000, // 5 seconds
      }
  });
  
  return res.redirect('/user/profile');
  })
  .catch(err => {
    console.log('erro10'+err);
  });
 
};



exports.getUser=async(req,res)=>{

  //req.session.user = user;
  const user=req.session.user;
  // console.log(user);
  req.session.previousPage = req.originalUrl;
  const users =await User.findById(user._id).populate('address');

 
  res.render('user/profile', {
    pageTitle: 'My Profile',
    path: '/user/profile',
    user:users,
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: []
  });

};

exports.getEditProfile=async(req,res)=>{

  const userId=await req.params.userId;
  const user=await User.findById(userId);

  res.render('user/edit-profile', {
    pageTitle: 'Edit Profile',
    path: '/user/edit-profile',
    user:user,
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: []
  });

};

exports.postEditProfile=async(req,res)=>{

  const name=req.body.name;
  const email=req.body.email;
  const countryCode=req.body.countryCode;
  const phoneNo=req.body.phoneNo;
  const userId=req.body.userId;
  // console.log(userId);
  const userPassword=req.body.oldpassword;
  const hashedPassword=req.body.hashedpassword;
  const newPW=req.body.password;


  bcrypt.compare( userPassword, hashedPassword)
    .then(isMatch => {
        if (isMatch) {
            console.log("Password is correct");
            User.findById(userId)
                .then(user => {
                  bcrypt.hash(newPW, 12)
                  .then(hashedPassword => {
                      user.name=name;
                      user.email=email;
                      user.countryCode=countryCode;
                      user.phoneno=phoneNo;
                      user.password=  hashedPassword;

                    return user.save()
                    .then(result => {
                      console.log('UPDATED USER!'+result);
                      return res.redirect('/user/profile');
                    })
                    .catch(err=>{
                      console.log(err+"error here");
                    })
                  })

                  
                })
                .catch(err=>{
                  console.log(err+"error here222222");
                })


        } else {
            console.log("Please enter Right previous password");

            res.render('user/edit-profile', {
              pageTitle: 'Edit Profile',
              path: '/user/edit-profile',
              user:{
                name:name,
                email:email,
                countryCode:countryCode,
                phoneNo:phoneNo,
              },
              editing: false,
              hasError: false,
              errorMessage: "Please enter Right previous password",
              validationErrors: []
            });
        }
    })
    .catch(err => {
        // Handle any errors
        console.error(err);
    });
    
    
  



};

exports.getDetails=async(req,res)=>{

  const productId=await req.query.productId;
  const product= await Product.findById(productId).populate('category');

 
  res.render('user/details', {
    pageTitle: 'Product Details',
    path: '/user/details',
    product:product,
    editing: false,
    hasError: false,
    previousPage:req.session.previousPage||'/',
    errorMessage: null,
    validationErrors: []
  });

};


exports.postAddtoCart=async(req,res)=>{
try{
  const productId=req.body.productId;
  const user=req.session.user;

 const cart = await Cart.findOne({ user:user });

 if (!cart) {
     const cart=new Cart({ user:user, items: [] });
     cart.save()
     console.log("empty cart created for new user");
 }

 const existingItem = cart.items.find(item => item.product.toString() === productId);
// console.log(existingItem);
 if (existingItem) {
     existingItem.quantity += 1;
 } 
 else 
 {
     cart.items.push({ product: productId, quantity: 1 });
 }

 await cart.save()
 .then(result=>{
  notifier.notify({
    title: 'Cart',
    message: 'Product added to cart',
    style: {
        backgroundColor: '#FF0000', // Red background color
        textColor: '#FFFFFF', // White text color
        borderRadius: 5, // 5px border radius
        time: 5000, // 5 seconds
    }
});
  res.redirect(req.session.previousPage);
 })
} 
catch (err) {
 console.error(err);
 res.status(500).json({ message: 'Internal server error' });
}

}


exports.postplus=async(req,res)=>{
  const productId=req.body.productId;
  const user=req.session.user;
 
 const cart = await Cart.findOne({ user:user });
 const existingItem = cart.items.find(item => item.product.toString() === productId);

 if (existingItem && existingItem.quantity<10000) {
     existingItem.quantity += 1;
     
 }
//  if(existingItem.quantity===10000){
  
//  }
 await cart.save();
  res.redirect(req.session.previousPage);
};


exports.postupdate=async(req,res)=>{
  const productId=req.body.productId;
  const user=req.session.user;
  const quantity=req.body.quantity;
 
 const cart = await Cart.findOne({ user:user });
 const existingItem = cart.items.find(item => item.product.toString() === productId);

 if (existingItem) {
     existingItem.quantity =quantity;
 } 
 await cart.save();
 res.redirect(req.session.previousPage);
};


exports.postminus=async(req,res)=>{
  const productId=req.body.productId;
  const user=req.session.user;
//  console.log(productId);
 const cart = await Cart.findOne({ user:user });
 const existingItem = cart.items.find(item => item.product.toString() === productId);

 if(existingItem.quantity==1){
  cart.items = cart.items.filter(item => item.product.toString() !== productId);
  await cart.save()
  .then(result=>{
    console.log("removed");
    
    notifier.notify({
      title: 'Removed',
      message: 'Product removed from cart',
      style: {
          backgroundColor: '#FF0000', // Red background color
          textColor: '#FFFFFF', // White text color
          borderRadius: 5, // 5px border radius
          time: 5000, // 5 seconds
      }
  });
  return res.redirect(req.session.previousPage);
  })
  .catch(err=>{
    console.log("errrroor"+err);
    const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
  })
 }else{

  existingItem.quantity -= 1; 
 await cart.save();
 return res.redirect(req.session.previousPage);
  
 }
 
};


exports.getCart=async(req,res)=>{

  req.session.previousPage=req.originalUrl;

  const user=req.session.user._id;
 const cart = await Cart.findOne({ user:user }).populate('items.product');
 if (!cart) {
  return res.status(404).json({ message: 'Cart not found' });
}
 const cartt = cart.items.filter(item => item.product);
let sum=0;
cartt.forEach(item=>{
  sum=sum+item.product.price*item.quantity;
})
console.log(cartt);
res.render('user/cart', {
      pageTitle: 'My Cart',
      user:user,
      cart:cartt,
      total:sum,
      path: '/user/getcart',
      editing: false,
      hasError: false,
      errorMessage: null,
      validationErrors: []
    });
};


exports.removeCart=async(req,res)=>{

  const user=req.session.user;
  const productId=req.body.productId;
  const cart = await Cart.findOne({ user:user });

  
  cart.items = cart.items.filter(item => item.product.toString() !== productId);
  await cart.save()
  .then(result=>{
    console.log("removed");
    notifier.notify({
      title: 'Removed',
      message: 'Product removed from cart',
      style: {
          backgroundColor: '#FF0000', // Red background color
          textColor: '#FFFFFF', // White text color
          borderRadius: 5, // 5px border radius
          time: 5000, // 5 seconds
      }
  });
    return res.redirect("/user/getcart");
  })
  .catch(err=>{
    console.log("errrroor"+err);
    const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
  })

};



exports.getCheckOut=async(req,res)=>{
  req.session.previousPage = req.originalUrl;
  const user=req.session.user;

  const userr=await User.findById(user._id).populate('address');
  const cart = await Cart.findOne({ user:user });
  const product=await cart.populate('items.product');


  if (!cart) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  const cartt = cart.items.filter(item => item.product);
  // console.log(cartt);
  let sum=0;
  cartt.forEach(item=>{
    sum=sum+item.product.price*item.quantity;
  })
  // console.log(sum);
  res.render('user/checkout', {
        pageTitle: 'User CheckOut',
        user:userr,
        product:product,
        cart:cartt,
        total:sum,
        path: '/user/checkout',
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors: []
      });

};

exports.postCheckOut=async(req,res)=>{

  const total=req.body.total;
  const user=req.session.user._id;
  const userDetail=await User.findById(user);
  const address=req.body.address;
  await Cart.updateOne({ user: user}, { $set: { items: [] } });
  const addressMain=await Address.findById(address);
  // console.log(addressMain);

  const cartItems=req.body.cartItems;
  
const itemsArray = JSON.parse(cartItems);

// const cat=await res.json(itemsArray);

// console.log(cat);

const extractedData = itemsArray.map(item => ({
    
      _id:item.product._id,
      title:item.product.title,
      price:item.product.price,
      quantity:item.quantity

}));
const addressData= {
  street:addressMain.street,
  address_line:addressMain.address_line,
  city:addressMain.city,
  postalCode:addressMain.postalCode,
  country:addressMain.country
};

// console.log(addressData);
  const checkout = new Checkout({
    user:user,
    total:total,
    address:addressData,
   products:extractedData
  });
  checkout
    .save()
    .then(result=>{
      console.log(result);
      return res.redirect("/user/my-orders");
    })
    .catch(err=>{
        console.log(err+"eroror");
      });
};

exports.getOrders= async(req,res)=>{

  const user=req.session.user._id;

  
    const checkout=await Checkout.find({user:user}).populate('address').populate("products");
    
     console.log(checkout);
    res.render('user/orders', {
      pageTitle: 'My Orders',
      checkout :checkout,
      path: '/user/my-orders',
      editing: false,
      hasError: false,
      errorMessage: null,
      validationErrors: []
    });

};


exports.getInvoice=async(req,res)=>{

  const user=req.session.user._id;
  const userDetail=await User.findById(user);

  
  const checkout=req.query.checkoutId;

  const checkoutData=await Checkout.findById(checkout).populate("address").populate("products");

  console.log(checkoutData);


  const date=new Date(checkoutData.updatedAt);
  const year=date.getFullYear();

  const month=(date.getMonth()+1).toString().padStart(2,'0');
  const day=date.getDate().toString().padStart(2,'0');
  const newDate=day+'-'+month+'-'+year;







  function generateRandomInvoiceNumber(prefix, length) {
    const randomNumber = Math.floor(Math.random() * Math.pow(10, length));
    const paddedNumber = String(randomNumber).padStart(length, '0');
    return `${prefix}${paddedNumber}`;
}
  


  // Example usage:
  const prefix = "INV-";
  const length = 8;

  const invoiceName = 'invoice-' + generateRandomInvoiceNumber(prefix, length) + '.pdf';
  const invoicePath = path.join('data', 'invoices', invoiceName);

    const pdfDoc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'inline; filename="' + invoiceName + '"'
    );
    pdfDoc.pipe(fs.createWriteStream(invoicePath));
    pdfDoc.pipe(res);

    pdfDoc.fontSize(26).text('Invoice', {underline: true});
    pdfDoc.text('---------------------------------');
    pdfDoc.fontSize(20).text('User-Name :-  ' + userDetail.name);
    pdfDoc.fontSize(20).text('Phone_no :-  '+'+'+userDetail.countryCode+' '+ userDetail.phoneNo);
    pdfDoc.fontSize(20).text('Email :-  ' + userDetail.email);
    pdfDoc.text('                                                 ');
    checkoutData.products.forEach(product => {
      pdfDoc
        .fontSize(14)
        .text(
          product.title +
            ' - ' +
            product.quantity +
            ' x ' +
            '$' +
            product.price
        );
    });
    pdfDoc.text('-----------------------------------------------');
    pdfDoc.fontSize(20).text('Total Price: $' + checkoutData.total);

    pdfDoc.text('                                                 ');

    
    pdfDoc.fontSize(20).text('Delivery Address');
    pdfDoc.fontSize(15).text(checkoutData.address[0].street+','+checkoutData.address[0].address_line+','+checkoutData.address[0].city+','+'PIN :- '+checkoutData.address[0].postalCode+','+checkoutData.address[0].country);
    
    pdfDoc.text('                                                 ');
    pdfDoc.fontSize(13).text('Order Date :- ' + newDate);
    
    
    pdfDoc.end();





};