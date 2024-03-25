
const express = require('express');



const router = express.Router();


exports.getMainPage = (req, res, next) => {
    res.render('admin/mainpg', {
        pageTitle: 'Foodie Club',
        path: '/',
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors: []
      });
}

