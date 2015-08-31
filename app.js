var express = require('express');
var path = require('path');
var url = require('url');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var config = require('./config');

var domain = 'localhost';

switch (config.appsettings.env) {

	case 'test':
		domain = 'https://parallel-test.herokuapp.com';
		break;

	case 'prod':
		domain = '';
		break;
}

process.env.HOST = domain;
var routes = require('./routes/api');

var app = express();

// view engine setup
app.set('views', path.join(__dirname + '/public', 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', routes);
app.use('/api', routes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.sendFile('/error.html');
        console.log('ERROR HERE: ' + err.message);
		//res.render('error', {
		//	message: err.message,
		//	error: err
		//});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.sendFile('/error.html');
    console.log('ERROR HERE:' + err.message);
	//res.render('error', {
	//	message: err.message,
	//	error: {}
	//});
});

//Serve index.html statically
app.get('*', function (req, res) {
	res.sendFile('/index.html');
});

module.exports = app;
