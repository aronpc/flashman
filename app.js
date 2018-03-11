
var fs = require('fs');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var fileUpload = require('express-fileupload');
var User = require('./models/user');

var index = require('./routes/index');

var app = express();

mongoose.connect('mongodb://' + process.env.FLM_MONGODB_HOST + ':27017/flashman');

// check administration user existence
User.find({is_superuser: true}, function(err, matchedUsers) {
  if (err || !matchedUsers || 0 === matchedUsers.length) {
    let newSuperUser = new User({
      name: process.env.FLM_ADM_USER,
      password: process.env.FLM_ADM_PASS,
      is_superuser: true,
    });
    newSuperUser.save();
  }
});

// release dir must exists
if (!fs.existsSync(process.env.FLM_IMG_RELEASE_DIR)) {
  fs.mkdirSync(process.env.FLM_IMG_RELEASE_DIR);
}

// check secret file and load if available
var companySecret = {};
try {
  var fileContents = fs.readFileSync('./secret.json', 'utf8');
  companySecret = JSON.parse(fileContents);
} catch (err) {
  if (err.code === 'ENOENT') {
    console.log('Shared secret file not found!');
    companySecret['secret'] = '';
  } else if (err.code === 'EACCES') {
    console.log('Cannot open shared secret file!');
    companySecret['secret'] = '';
  } else {
    throw err;
  }
}
app.locals.secret = companySecret.secret;

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));
app.use(logger('dev'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(require('express-session')
  ({secret: 'aSjdh%%$@asdy8ajoia7qnL&34S0))L',
     resave: false,
     saveUninitialized: false,
   })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(fileUpload());

app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
