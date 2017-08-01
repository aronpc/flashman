# README #

Tool created to manage flash firmware of OpenWRT devices

1. install mongodb 3.2+.
    * make sure to not change the default port 27017.
	* https://docs.mongodb.com/manual/installation/
2. install nodejs 6.4.0+.
	* `curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -`
	* `sudo apt-get install -y nodejs`

* install pm2 via npm `$ npm install pm2 -g`
* install FlashMan dependencies: `$ npm install`
* setup FlashMan: `$ npm run setup`
* to start it: `$ pm2 start flashman`
* to close it: `$ pm2 stop flashman`
