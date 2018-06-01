
const aedes = require('aedes');

let mqtts = aedes();

mqtts.on('client', function (client, err) {
  console.log('Router connected on MQTT: '+client.id);
});

mqtts.on('clientDisconnect', function (client, err) {
  console.log('Router disconnected on MQTT: '+client.id)
});

mqtts.anlix_message_router_update = function(id) {
	mqtts.publish({
      cmd: 'publish',
      qos: 1,
      retain: true,
      topic: 'flashman/update/' + id,
      payload: '1'
    });
	console.log('MQTT Message router update to '+id);
};

mqtts.anlix_message_router_reset = function(id) {
	mqtts.publish({
      cmd: 'publish',
      qos: 1,
      retain: true,
      topic: 'flashman/update/' + id,
      payload: ''
    });
	console.log('MQTT Message router reset to '+id);
};

module.exports = mqtts;