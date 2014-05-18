var redis = require("redis");
var log = require("../../core/log.js");
var lodash,_ = require('lodash');

var prettyprint = function(obj) {
	var cache = [];
	JSON.stringify(obj, function(key, value) {
	    if (typeof value === 'object' && value !== null) {
	        if (cache.indexOf(value) !== -1) {
	            // Circular reference found, discard key
	            return;
	        }
	        // Store value in our collection
	        cache.push(value);
	    }
	    console.log(value);
	    return value;
	});
	cache = null; // Enable garbage collection
};

// This component takes in trades from redis and 
// converts them into the appropriate structures
// required by the UI and other components
// and republishes them to redis and to the ui via websocket
var TradeDataSource = function (exchange, channel, multiplexer) {
	var trade_data = [];
	var _exchange = exchange;
	var _channel = channel;
	
	log.debug(_exchange + ' datasource - creating redis client');
	var redisclient = redis.createClient();
	redisclient.on("subscribe", function(channel, count) {
	    log.debug(_exchange + ' subscribed.. '+_channel);
	});
	
	log.debug('registering socket channels: '+_exchange);
	var askchannel = multiplexer.registerChannel(_exchange+'_ask');
	var bidchannel = multiplexer.registerChannel(_exchange+'_bid');
	
	var askconns = [];
	var bidconns = [];
	
	askchannel.on('connection', function(conn) {
		var _conn = conn["conn"];
		var headers = _conn["headers"];
		log.debug('registered socket client: ask - '+_exchange+' for conn: '+JSON.stringify(headers));
		askconns.push(conn);
	});
	bidchannel.on('connection', function(conn) {
		var _conn = conn["conn"];
		var headers = _conn["headers"];
		log.debug('registered socket client: bid - '+_exchange+' for conn: '+JSON.stringify(headers));
		bidconns.push(conn);
	})
	
	
	redisclient.on("message", function(channel, message) {
	    log.debug('channel: '+channel + '    message: '+message);

		if( message != null ) {
			//if( _.pluck(message, 'market') == _channel) {

				var msgdata = JSON.parse(message, function(key, value) { return value; });
				//log.debug('msg data = '+JSON.stringify(msgdata));
				// ensure it is an array
				//var trade = [].concat(msgdata);
				// extract the data tuples
				//trade = _.pluck( msgdata, "data" );
				var trade = msgdata["data"];
				//log.debug(_exchange +' trade = '+JSON.stringify(trade));
				trade_data.push(trade);
				
				//log.debug('trade_data: '+JSON.stringify(trade_data));
		
		
				/*	function vwap(data) {
						var total_vol = 0;
						var running_vwap = 0;
						_.each(data, item) {
							var vol = item["amount"];
							total_vol += vol;
							var price = item["price"];
							running_vwap += (vol * price);
						}
						var vwap = 0;
						if(total_vol != 0)
							vwap = (running_vwap / total_vol);
						return vwap;
					} */
				//if( _.contains(trade, {trade_type: "ask"}) ) {
					var ask_data;
					// HACK
					// e.g. bitstamp doesn't have bid/ask - so #HACK assume all are ask for now
					if( trade_data.hasOwnProperty('trade_type') ) {
						ask_data = _.filter(trade_data, {trade_type: "ask"});
					} else {
						ask_data = trade_data;
					}
					//var ask_vwap = vwap(ask_data);
					var sort_ask_data = _.sortBy(ask_data, 'price');
					var ask_data = _.first(sort_ask_data, 5).reverse();
					//console.log(_exchange + ' datasource[ask] = '+ JSON.stringify(ask_data));
					redisclient.emit(_exchange, {"ask_data": ask_data} );
					
					
					if (askconns) {
						log.debug('publishing ask data for '+_exchange);
						_.each(askconns, function(conn) {
							conn.write(JSON.stringify(ask_data));
						});
					};
					//redisclient.emit(_exchange, {"ask_vwap": ask_vwap});
					//ioclient.emit(_exchange+"_ask_vwap", {"ask_vwap": ask_vwap});
				//} else {
					var bid_data = _.filter(trade_data, {trade_type: "bid"});
					var sort_bid_data = _.sortBy(bid_data, 'price');
					var bid_data = _.first(sort_bid_data, 5);
					//console.log(_exchange + ' datasource[bid] = '+ JSON.stringify(bid_data));
					redisclient.emit(_exchange, {"bid_data": bid_data} );
					if (bidconns) {
						log.debug('publishing bid data for '+_exchange);
						_.each(bidconns, function(conn) {
							conn.write(JSON.stringify(bid_data));
						});
					};
				//}
		//	}
    	}
	});

	redisclient.on("unsubscribe", function(channel, count) {
		log.debug(_exchange + ' unsubscribing');
		redisclient.end();
	});

	log.debug('datasource subscribing to '+_exchange);
	redisclient.subscribe(_exchange+'trade');
};


module.exports = TradeDataSource;