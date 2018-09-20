const socketio = require('socket.io');
const sharedsession = require("express-socket.io-session");

let sio = socketio();

sio.anlix_connections = {};
sio.anlix_notifications = {};

sio.anlix_bindsession = function (session) {
  sio.use(sharedsession(session, {
    autoSave:true
  }));
};

sio.on('connection', function(socket) {
  console.log(socket.handshake.session.id + ' connected on Notification Broker');

  socket.on('disconnect', function(reason) {
    //console.log('DISCONNECT ');
    //console.log(socket);
    console.log(socket.handshake.session.id + ' disconnect from Notification Broker: '+ reason);
    //console.log('disconnect');
  });

});

module.exports = sio;