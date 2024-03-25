const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const addressSchema = new Schema({
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
  },
},{timestamps:true});

const Address = mongoose.model('Address', addressSchema);

module.exports = Address;