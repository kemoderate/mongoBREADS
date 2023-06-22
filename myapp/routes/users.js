var express = require('express');
var router = express.Router();
const { MongoClient } = require('mongodb');
// Connection URL
const mongoURL = 'mongodb://localhost:27017/';

/* GET users listing. */
router.get('/', async (req, res, next) =>{
  try {
    const client = await MongoClient.connect(mongoURL, {
      useNewUrlParser : true,
      useUnifiedTopology : true
    });
    console.log('Connected to MongoDB');
    const db = client.db();

    const collection = db.collection('data');
    const data = await collection.find().toArray();

    res.json(data)
  } catch (error) {
    console.error('Error Connecting to MongoDB:',error)
    res.status(500).send('Internal Server Error')
  }
});

module.exports = router;