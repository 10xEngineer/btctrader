var express = require('express');
var router = express.Router();
//var BTCTradeDataSource = require('../BTCTradeDataSource');

/* GET home page. */
router.get('/', function(req, res) {
	
	console.log('in / router');
/*	var datasource = new BTCTradeDataSource({
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
	console.log(datasource);
	*/
  res.render('index', { title: 'BTCtrader' });
});

module.exports = router;
