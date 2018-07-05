
const aedes = require('aedes');
const DeviceModel = require('./models/device');

let mqtts = aedes();

mqtts.on('client', function (client, err) {
  console.log('Router connected on MQTT: '+client.id);
});

mqtts.on('clientDisconnect', function (client, err) {
  console.log('Router disconnected on MQTT: '+client.id)
});

mqtts.on('ack', function (packet, client, err) {
// packet is always undefined... maybe a bug?
  if(client.id)
    console.log('MQTT Message Delivered successfully for '+client.id);
});

mqtts.authenticate = function(client, username, password, cb) {
  var needauth = true;
  if(process.env.FLM_TEMPORARY_MQTT_BROKER_PORT) {
    // Temporary disabled auth for old routers
    if(client.id) {
      if(client.id.startsWith("mosqsub")) {
        console.log('MQTT AUTH on INSECURE SERVER: Device '+client.id);
        cb(null, true);
        needauth = false;
      }
    }
  } 

  if(needauth) {
    var error = new Error('Auth error');
    if(!username) {
      console.log('MQTT AUTH ERROR - Username not specified: Device '+client.id);
      error.returnCode = 2;
      cb(error, null);
    } else {

      DeviceModel.findById(username, function(err, matchedDevice) {
        if (err) {
          console.log('MQTT AUTH ERROR: Device '+username+' internal error: ' + err);
          error.returnCode = 2;
          cb(error, null);
        } else {
          if (matchedDevice == null) {
            console.log('MQTT AUTH ERROR: Device '+username+' not registred!');
            error.returnCode = 2;
            cb(error, null);
          } else {
            if(password == matchedDevice.mqtt_secret) {
              console.log("MQTT AUTH OK: id "+username);
              cb(null, true);
            } else {
              console.log('MQTT AUTH ERROR: Device '+username+' wrong password!');
              error.returnCode = 4;
              cb(error, null);
            }
          }
        }
      });
    }
  }
}

mqtts.anlix_message_router_update = function(id) {
  mqtts.publish({
      cmd: 'publish',
      qos: 2,
      retain: true,
      topic: 'flashman/update/' + id,
      payload: '1'
    });
  console.log('MQTT SEND Message UPDATE to '+id);
};

mqtts.anlix_message_router_reset = function(id) {
  mqtts.publish({
      cmd: 'publish',
      retain: true,
      topic: 'flashman/update/' + id,
      payload: null
    });
  console.log('MQTT Clean Messages for router '+id);
};

mqtts.anlix_message_router_reboot = function(id) {
  mqtts.publish({
      cmd: 'publish',
      qos: 2,
      retain: false,
      topic: 'flashman/update/' + id,
      payload: 'boot'
    });
  console.log('MQTT SEND Message REBOOT to '+id);
};

mqtts.anlix_message_router_resetapp = function(id) {
  mqtts.publish({
      cmd: 'publish',
      qos: 2,
      retain: false,
      topic: 'flashman/update/' + id,
      payload: 'rstapp'
    });
  console.log('MQTT SEND Message RSTAPP to '+id);
};

mqtts.anlix_message_router_resetmqtt = function(id) {
  mqtts.publish({
      cmd: 'publish',
      qos: 2,
      retain: false,
      topic: 'flashman/update/' + id,
      payload: 'rstmqtt'
    });
  console.log('MQTT SEND Message RSTMQTT to '+id);
};

mqtts.anlix_message_router_log = function(id) {
  mqtts.publish({
      cmd: 'publish',
      qos: 2,
      retain: false,
      topic: 'flashman/update/' + id,
      payload: 'log'
    });
  console.log('MQTT SEND Message LOG to '+id);
};

module.exports = mqtts;