const path = require('path');
const fs = require('fs');


const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');

const adminRoutes = require('./routes/adminRoutes');
const errorController = require('./controllers/error');
const userRoutes = require('./routes/userRoutes');
const authRoutes=require('./routes/authRoutes');

const Admin=require('./models/admin');
const User=require("./models/user");

const app = express();


app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const MONGODB_URI =
  'mongodb://127.0.0.1:27017/NewDB2';

  const store1 = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'session_admin'
  });
  const store2 = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions_user'
  });
  const csrfProtection = csrf();

var storage=multer.diskStorage({
  destination:function(req,file,cb){
    cb(null,'images');
  },
  filename:function(req,file,cb){
    cb(null,file.fieldname+"-"+Date.now()+path.extname(file.originalname));
  }
})
 
app.use((req,res,next)=>{
  let upload=multer({
    storage:storage,
    fileFilter:(req,file,cb)=>{
      try{
        if(file.mimetype=="image/png" || file.mimetype=="image/jpg"||file.mimetype=="image/jpeg"){
          cb(null,true);
        }
        else{
          throw err;
        }
      }
      catch(e){console.log('error here');}
    }
  }).single("image");
 
  upload(req,res,async function(err){
    if(err){
      throw err
    }
    else{
      next()
    }
  })
});


app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store1,
    name: 'admin-session-id'
  })
);
// app.use(
//   session({
//     secret: 'my secret',
//     resave: false,
//     saveUninitialized: false,
//     store: store2,
    
//   })
// );
// app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  if (req.session && req.session.userId) 
  {
    User.findById(req.session.user._id, (err, user) => {
      if (user) {
        req.user = user;
        console.log(user);
        // req.session.role = 'user';
      }
      next();
    });
  } else {
    next();
  }
});
// app.use((req, res, next) => {
//   if (req.session && req.session.adminId) 
//   {
//     Admin.findById(req.session.admin._id, (err, admin) => {
//       if (admin) {
//         req.admin = admin;
//         req.session.role = 'admin';
//       }
//       next();
//     });
//   } else {
//     next();
//   }
// });
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  // res.locals.csrfToken = req.csrfToken();
  next();
});

app.use('/',authRoutes);
app.use('/admin', adminRoutes);
app.use('/user',userRoutes);


app.use((req, res, next) => {
  res.status(404).render('error', { message: 'Page Not Found' });
});

mongoose
  .connect(MONGODB_URI)
  .then(result => {
    console.log('server started on 3000');
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  });
