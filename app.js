
const fs = require('fs');
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const schedule = require('node-schedule');
const mongoose = require('mongoose');
const passport = require('passport');
const fileUpload = require('express-fileupload');
let session = require('express-session');

let updater = require('./controllers/update_flashman');
let Config = require('./models/config');
let User = require('./models/user');
let Role = require('./models/role');
let index = require('./routes/index');

let app = express();

mongoose.connect('mongodb://' + process.env.FLM_MONGODB_HOST + ':27017/flashman');

// check config existence
Config.findOne({is_default: true}, function(err, matchedConfig) {
  if (err || !matchedConfig) {
    let newConfig = new Config({
      is_default: true,
      autoUpdate: true,
      pppoePassLength: 8,
    });
    newConfig.save();
  }
});

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

// check default role existence
Role.find({}, function(err, roles) {
  if (err || !roles || 0 === roles.length) {
    let managerRole = new Role({
      name: 'Gerente',
      grantWifiInfo: 2,
      grantPPPoEInfo: 2,
      grantPassShow: true,
      grantFirmwareUpgrade: true,
      grantWanType: true,
      grantDeviceId: true,
      grantDeviceActions: true,
      grantDeviceRemoval: true,
      grantDeviceAdd: true,
      grantFirmwareManage: true,
      grantAPIAccess: false,
    });
    managerRole.save();
  }
});

// release dir must exists
if (!fs.existsSync(process.env.FLM_IMG_RELEASE_DIR)) {
  fs.mkdirSync(process.env.FLM_IMG_RELEASE_DIR);
}

if (process.env.FLM_COMPANY_SECRET) {
  app.locals.secret = process.env.FLM_COMPANY_SECRET;
} else {
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
}

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(bodyParser.raw({type: 'application/octet-stream'}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));
app.use(logger(':req[x-forwarded-for] - :method :url HTTP/:http-version :status :res[content-length] - :response-time ms'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'aSjdh%%$@asdy8ajoia7qnL&34S0))L',
  resave: false,
  saveUninitialized: false,
}));

// create static routes for public libraries
app.use('/scripts/jquery',
  express.static(path.join(__dirname, 'node_modules/jquery/dist'))
);
app.use('/scripts/jquery-mask',
  express.static(path.join(__dirname, 'node_modules/jquery-mask-plugin/dist'))
);
app.use('/scripts/popper',
  express.static(path.join(__dirname, 'node_modules/popper.js/dist'))
);
app.use('/scripts/bootstrap',
  express.static(path.join(__dirname, 'node_modules/bootstrap/dist'))
);
app.use('/scripts/mdbootstrap',
  express.static(path.join(__dirname, 'node_modules/mdbootstrap'))
);
app.use('/scripts/sweetalert2',
  express.static(path.join(__dirname, 'node_modules/sweetalert2/dist'))
);
app.use('/scripts/tags-input',
  express.static(path.join(__dirname, 'node_modules/tags-input'))
);
app.use('/scripts/datatables.net',
  express.static(path.join(__dirname, 'node_modules/datatables.net'))
);
app.use('/scripts/datatables.net-bs4',
  express.static(path.join(__dirname, 'node_modules/datatables.net-bs4'))
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
  res.locals.type = 'danger';
  res.locals.message = err.message;
  res.locals.status = err.status;
  res.locals.stack = process.env.production ? '' : err.stack;

  // render the error page
  res.status(err.status || 500);
  if (req.accepts('text/html') && !req.is('application/json')) {
    res.render('error');
  } else {
    // REST API response
    return res.json({
      type: res.locals.type,
      status: res.locals.status,
      message: res.locals.message,
      stack: res.locals.stack,
    });
  }
});

app.listen(3000, function() {
  let rule = new schedule.RecurrenceRule();
  rule.hour = 20;
  rule.minute = 0;
  // Schedule automatic update
  let s = schedule.scheduleJob(rule, function() {
    updater.update();
  });
  // Force an update check to alert user on app startup
  updater.checkUpdate();
});

module.exports = app;
