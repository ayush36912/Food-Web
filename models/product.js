const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  expireDate: {
    type: Date,
    required: true,
  },
  category: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }]
},{timestamps:true});

module.exports = mongoose.model('Product', productSchema);
