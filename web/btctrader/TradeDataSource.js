var redis = require("redis");
var log = require("../../core/log.js");
var lodash,_ = require('lodash');


// This component takes in trades from redis and 
// converts them into the appropriate structures
// required by the UI and other components
// and republishes them to redis and to the ui via websocket
var TradeDataSource = function (exchange, channel, ioclient) {
	var trade_data = [];
	var _exchange = exchange;
	var _channel = channel;
	
	log.debug(_exchange + ' datasource - creating redis client');
	var redisclient = redis.createClient();
	redisclient.on("subscribe", function(channel, count) {
	    log.debug(_exchange + ' subscribed.. '+_channel);
	});
	
	redisclient.on("message", function(channel, message) {
	    log.debug('channel: '+channel + '    message: '+message);

		if( message != null ) {
			//if( _.pluck(message, 'market') == _channel) {

				var msgdata = JSON.parse(message, function(key, value) { return value; });
				log.debug('msg data = '+JSON.stringify(msgdata));
				// ensure it is an array
				//var trade = [].concat(msgdata);
				// extract the data tuples
				//trade = _.pluck( msgdata, "data" );
				var trade = msgdata["data"];
				//log.debug(_exchange +' trade = '+JSON.stringify(trade));
				trade_data.push(trade);
				
				log.debug('trade_data: '+JSON.stringify(trade_data));
		
				//if( _.contains(trade, {trade_type: "ask"}) ) {
					var ask_data = _.filter(trade_data, {trade_type: "ask"});
					var sort_ask_data = _.sortBy(ask_data, 'price');
					var ask_data = _.first(sort_ask_data, 5).reverse();
					console.log(_exchange + ' datasource[ask] = '+ JSON.stringify(ask_data));
					redisclient.emit(_exchange, {"ask_data": ask_data} );
					ioclient.emit(_exchange+'_ask', {"ask_data": ask_data} );
				//} else {
					var bid_data = _.filter(trade_data, {trade_type: "bid"});
					var sort_bid_data = _.sortBy(bid_data, 'price');
					var bid_data = _.first(sort_bid_data, 5).reverse();
					console.log(_exchange + ' datasource[bid] = '+ JSON.stringify(bid_data));
					redisclient.emit(_exchange, {"bid_data": bid_data} );
					ioclient.emit(_exchange+'_bid', {"bid_data": bid_data} );
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