cd ../..
nohup node gekko config = btce_config.js &> btce_output.log &
nohup node gekko config = bitstamp_config.js &> bitstamp_output.log &
cd web/btctrader
nohup npm start &> web_output.log &
