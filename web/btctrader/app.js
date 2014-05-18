var express = require('express');
var http = require('http');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var log = require('../../core/log.js');
var redis = require('redis');
var lodash,_ = require('lodash');
var sockjs = require('sockjs');
var websocket_multiplex = require('websocket-multiplex');
var sockjs_opts = {sockjs_url: "http://cdn.sockjs.org/sockjs-0.3.min.js"};


var datasource = require('./TradeDataSource.js');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

var server = http.createServer(app);
//var io = require('socket.io').listen(server);
//io.set('log level', 1);
var service = sockjs.createServer(sockjs_opts);
var multiplexer = new websocket_multiplex.MultiplexServer(service);
service.installHandlers(server, {prefix:'/multiplex'});

var datasources = {
    "btce": datasource('btce', 'BTCe-USD-BTC', multiplexer),
    "bitstamp": datasource('bitstamp', 'Bitstamp-USD-BTC', multiplexer),
    "cexio": datasource('cexio', 'cexio-USD-BTC', multiplexer)
};


server.listen(3001, '0.0.0.0');

module.exports = app;
