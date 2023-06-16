var express = require('express');
var router = express.Router();
const moment = require('moment');
const ObjectId = require('mongodb').ObjectId


/* GET home page. */

router.get('/', (req,res)=>{
  res.render('indexVanilla')
})

router.get('/jquery',(req,res)=>{
  res.render('indexJquery')
})




module.exports = router;