const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name:{
    type:String,
    required:true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  phoneNo: {
    type: Number,
    required: true
    //unique: true
    //match: /^[0-9]{10}$/, // Regex pattern for a 10-digit number
  },
  countryCode: {
    type: Number,
    required: true,
  },
  address: [{
    type: Schema.Types.ObjectId,
    ref: 'Address'
  }]
  
},{timestamps:true});

module.exports = mongoose.model('User', userSchema);





// cart: {
//     items: [
//       {
//         productId: {
//           type: Schema.Types.ObjectId,
//           ref: 'Product',
//           required: true
//         },
//         quantity: { type: Number, required: true }
//       }
//     ]
//   }