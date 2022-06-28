require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const validator = require('validator');
const dns = require('dns');

// Mongoose
let mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true});

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({extended: false}));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

const Schema = mongoose.Schema;

const urlSchema = new Schema({
  original_url: {type: String, required: true},
  short_url: Number
});

let urlModel = mongoose.model("URL", urlSchema);

const ERROR_OBJECT = {error: 'invalid url'};

app.post("/api/shorturl",async function(req, res, next) {
  let originalURL = req.body.url;

  console.log("original url:", originalURL);
  
  if(!originalURL || !validator.isURL(originalURL)) {
    res.json(ERROR_OBJECT);
  } else {

  let duplicate = await urlModel.findOne({original_url: originalURL});
  
  if(duplicate) {
     console.log("Duplicate found:",duplicate.original_url, duplicate.short_url);
    res.json({
      original_url: duplicate.original_url,
      short_url: duplicate.short_url
    });
  } else {
    let shortURL = Math.floor(Math.random() * 1000);
    console.log("short url", shortURL);
    let toSave = {
        original_url: originalURL,
        short_url: shortURL
    };

    let newURL = new urlModel(toSave);
    await newURL.save();
    res.json(toSave);
  }
  }
  
});

app.get("/api/shorturl/:shorturl?", (req, res) => {
  let shortURL = req.params.shorturl;
  
  if(!shortURL) {
    res.status(401).json(ERROR_OBJECT);
  } else {
    urlModel.findOne({short_url: shortURL})
    .select("original_url -_id")
    .exec((err, urlObj) => {
      if(err) res.status(401).json(ERROR_OBJECT);      
      res.redirect(urlObj.original_url);
    });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
