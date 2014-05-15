var express = require('express');
var http = require('http');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var log = require('../../core/log.js');
var redis = require('redis');

var BTCTradeDataSource = require('./BTCTradeDataSource');

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
var io = require('socket.io').listen(server);

console.log('creating socket');
io.on('connection', function(client) {
    const redisClient = redis.createClient()
    redisClient.subscribe('gekkotrade');
 
    redisClient.on("message", function(channel, message) {
        //Channel is e.g 'score.update'
        client.emit(channel, message);
    });
 
    client.on('disconnect', function() {
        redisClient.quit();
    });
});

console.log('creating datasource');

var datasource = new BTCTradeDataSource({
    // Column definitions for Datagrid
    columns: [{
        property: 'date',
        label: 'Date',
        sortable: false
    },{
        property: 'price',
        label: 'Price',
        sortable: false
    },{
        property: 'amount',
        label: 'Amount',
        sortable: false
    },{
        property: 'tid',
        label: 'Txn ID',
        sortable: false
    },{
        property: 'price_currency',
        label: 'USD',
        sortable: false
    },{
        property: 'item',
        label: 'Item',
        sortable: false
    },{
        property: 'trade_type',
        label: 'Trade Type',
        sortable: false
    }],

    // Create IMG tag for each returned image
    formatter: function (items) {
       // $.each(items, function (index, item) {
       //     item.image = '<img src="' + flickrUrl(item) + '"></a>';
       // });
    }
});
app.datasource = datasource;
server.listen(3001);

module.exports = app;
