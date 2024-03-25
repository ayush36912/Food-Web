const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const checkoutSchema = new Schema({
    total:{
        type:Number,
        //required:true
      },
    address: [{
        street: {
          type: String,
          required: true,
        },
        address_line: {
          type: String,
          required: true,
        },
        city: {
          type: String,
          required: true,
        },
        postalCode: {
          type: Number,
          required: true,
        },
        country: {
          type: String,
          required: true,
        }
      }],
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
    products: [
      {
        title: {
          type: String,
          required: true
        },
        price: {
          type: Number,
          required: true
        },
        quantity: {
          type: Number,
          required:true
        }
      }
    ]
   
    
},{timestamps:true});


module.exports = mongoose.model('Checkout', checkoutSchema);

