# README #

Tool created to manage flash firmware of OpenWRT/LEDE devices

## INSTRUCTIONS ##

### ON-PREMISES SETUP ###

1. install mongodb 3.2+.
    * make sure to not change the default port 27017.
	* see https://docs.mongodb.com/manual/installation/
	* TL;DR (Ubuntu 16.04)
		* `sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2930ADAE8CAF5059EE73BB4B58712A2291FA4AD5`
		* `echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.6 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.6.list`
		* `sudo apt-get update`
		* `sudo apt-get install -y mongodb-org`
2. install nodejs 6.4.0+.
	* see https://nodejs.org/en/download/package-manager/
	* TL;DR (Ubuntu 16.04)
		* `curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -`
		* `sudo apt-get install -y nodejs`

3. install mosquitto MQTT broker
	* make sure port 1883 is open on your firewall
	* see https://mosquitto.org/download/
	* TL;DR (Ubuntu 16.04)
		* `sudo apt-add-repository ppa:mosquitto-dev/mosquitto-ppa`
		* `sudo apt-get update`
		* `sudo apt-get install mosquitto` 

* install pm2 via npm `$ npm install pm2 -g`
* install FlashMan dependencies: `$ npm install`
* configure MQTT broker URL on `environment.config.json` (e.g. `mqtt:\\mymqttbroker.com`)
* setup Nginx configuration:

```
location ~ ^/(images/|javascripts/|js/|stylesheets/|fonts/|schemas/|images/) {
	root /home/localuser/flashman/public;
	access_log on;
}
```

```
location / {
	proxy_set_header X-Real-IP $remote_addr;
	proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	proxy_set_header X-NginX-Proxy true;
	proxy_set_header Upgrade $http_upgrade;
	proxy_set_header Connection 'upgrade';
	proxy_set_header Host $host;

	proxy_pass http://localhost:8000/;
	proxy_http_version 1.1;

	proxy_cache_bypass $http_upgrade;
}
```

* to start it: `$ pm2 start environment.config.js`
* to close it: `$ pm2 stop environment.config.js`
* generate a startup script to start the app at boot: `pm2 startup`
* save startup configurations with `pm2 save`

### DOCKER SETUP ###

* please use this [repository](https://github.com/guisenges/docker-flashman) and follow its instructions

## PLACING IMAGES ON FIRMWARE DIRECTORY ##

When adding new firmware images, please follow the following file format:

`<VENDOR *UPPERCASE*>_<HARDWARE MODEL *UPPERCASE*>_<HARDWARE VERSION *UPPERCASE*>_<RELEASE ID *FORMAT USED BY FLASMAN BUILDROOT CONFIGURATION>.bin`

Example:

`TP-LINK_MR3020_V1_0000-flm.bin`

## COPYRIGHT ##

Copyright (C) 2017-2018 Anlix

## LICENSE ##

This is free software, licensed under the GNU General Public License v2.
The formal terms of the GPL can be found at http://www.fsf.org/licenses/
