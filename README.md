# README #

Tool created to manage flash firmware of OpenWRT devices

## INSTRUCTIONS ##

1. install mongodb 3.2+.
    * make sure to not change the default port 27017.
	* https://docs.mongodb.com/manual/installation/
2. install nodejs 6.4.0+.
	* `curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -`
	* `sudo apt-get install -y nodejs`

* install pm2 via npm `$ npm install pm2 -g`
* install FlashMan dependencies: `$ npm install`
* configure MQTT broker URL on `config/configs.js` (e.g. `mqtt:\\mymqttbroker.com`)
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


## COPYRIGHT ##

Copyright (C) 2017-2017 LAND/COPPE/UFRJ

## LICENSE ##

This is free software, licensed under the GNU General Public License v2.
The formal terms of the GPL can be found at http://www.fsf.org/licenses/
