var redis = require("redis");
var log = require("../../core/log.js");
var lodash = require('lodash');

var BTCTradeDataSource = function (options) {
	this._formatter = options.formatter;
	this._columns = options.columns;
	var _buytrades = {};
	var _selltrades = {};
	
	var redisclient = redis.createClient();
	redisclient.on("subscribe", function(channel, count) {
	    log.debug('subscribed.. '+channel);
	});
	
	redisclient.on("message", function(channel, message) {
	    log.debug('channel: '+channel + '    message: '+message);
		var data = message["data"];
		log.debug('data = '+data);
//	    if(data && data.trade_type && message.data.trade_type == "ask") {
//			_buytrades[data["tid"]] = data;
//		} else {
//			_selltrades[data["tid"]] = data;
//		}
		console.log('datasource[buy] = '+ _buytrades);
		console.log('datasource[sell] = '+ _selltrades);
	});

	redisclient.on("unsubscribe", function(channel, count) {
		log.debug('unsubscribing');
		if(count == 0) {
			redisclient.end();
		}
	});

	redisclient.subscribe("gekkotrade");
};

BTCTradeDataSource.prototype = {

	/**
	 * Returns stored column metadata
	 */
	columns: function () {
		return this._columns;
	},

	/**
	 * Called when Datagrid needs data. Logic should check the options parameter
	 * to determine what data to return, then return data by calling the callback.
	 * @param {object} options Options selected in datagrid (ex: {pageIndex:0,pageSize:5,search:'searchterm'})
	 * @param {function} callback To be called with the requested data.
	 */
	data: function (options, callback) {
		
		var self = this;

		if( self._buytrades != null ) {
			
			// Prepare data to return to Datagrid
			var data = self._buytrades;
			var count = _.length(data);
			var startIndex = 0;
			var endIndex = 10;
			var end = (endIndex > count) ? count : endIndex;
			var pages = 1;
			var page = 1;
			var start = 1;

			// Allow client code to format the data
			if (self._formatter) self._formatter(data);

			// Return data to Datagrid
			callback({ data: data, start: start, end: end, count: count, pages: pages, page: page });

		} else {

			// No search. Return zero results to Datagrid
			callback({ data: [], start: 0, end: 0, count: 0, pages: 0, page: 0 });

		}
	}
};

module.exports = BTCTradeDataSource;