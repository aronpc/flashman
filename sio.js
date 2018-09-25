const socketio = require('socket.io');
const sharedsession = require("express-socket.io-session");

let sio = socketio();

sio.anlix_connections = {};
sio.anlix_notifications = [];

sio.anlix_bindsession = function (session) {
  sio.use(sharedsession(session, {
    autoSave:true
  }));
};

sio.on('connection', function(socket) {
  console.log(socket.handshake.address+' ('+socket.handshake.sessionID+') connected on Notification Broker');
  // just save connections of authenticated users
  if(socket.handshake.session.passport) {
    // We keep only one connection for each session
    if(sio.anlix_connections[socket.handshake.sessionID]) {
      oldsock = sio.anlix_connections[socket.handshake.sessionID];
      oldsock.disconnect(true);
      console.log(oldsock.handshake.address+' ('+oldsock.handshake.sessionID+ ') disconnect from Notification Broker: Overwrite');
    }
    sio.anlix_connections[socket.handshake.sessionID]=socket;
  } else {
    socket.disconnect(true);
    console.log(socket.handshake.address+' ('+socket.handshake.sessionID+') BLOCKED: not authenticated!');
  }

  socket.on('disconnect', function(reason) {
    if(sio.anlix_connections[socket.handshake.sessionID])
      delete sio.anlix_connections[socket.handshake.sessionID];
    console.log(socket.handshake.address+' ('+socket.handshake.sessionID+ ') disconnect from Notification Broker: '+ reason);
  });

});

sio.removeOldNotification = function(timer) {
  sio.anlix_notifications = sio.anlix_notifications.filter(item => {
    if(item.timer >= timer)
      console.log('SIO WARNING: Remove notification for '+item.session+': Timeout');
    return item.timer >= timer;
  });
}

const SIO_NOTIFICATION_LIVELOG=0;

sio.anlix_wait_for_livelog_notification = function (session, macaddr, timeout) {
  if(!session){
    console.log('ERROR: SIO: Try to add livelog notification with an invalid session!');
    return false;
  }

  if(!macaddr){
    console.log('ERROR: SIO: Try to add livelog notification with an invalid mac address!');
    return false;
  }

  if(!timeout || timeout==0)
    timeout=5000; // 5s default

  parameters={};
  parameters.type = SIO_NOTIFICATION_LIVELOG;
  parameters.timer = Date.now();
  parameters.session = session;
  parameters.macaddr = macaddr;
  sio.anlix_notifications.push(parameters);

  // set a timer to remove the notification if it takes too long
  // set a 100ms error (to only remove AFTER timeout)
  const timelimit = Date.now()+timeout;
  setTimeout(function(){sio.removeOldNotification(timelimit)}, timeout+100);
  console.log('SIO: Notification added to LIVELOG of '+macaddr+' for '+session);

  return true;
};

sio.anlix_send_livelog_notifications = function (macaddr, logdata) {
  if(!macaddr){
    console.log('ERROR: SIO: Try to send livelog notification to an invalid mac address!');
    return false;
  }

  found=false;

  // get who is waiting for this notification
  sio.anlix_notifications = sio.anlix_notifications.filter(item => {
    if(item.type == SIO_NOTIFICATION_LIVELOG)
      if(item.macaddr == macaddr) {
        if(sio.anlix_connections[item.session]){
          console.log('SIO: Send LIVELOG of '+macaddr+' information for '+item.session);
          sio.anlix_connections[item.session].emit('LIVELOG', macaddr, logdata);
          found=true;
          return false;
        }
      }
    return true;
  });

  if(!found)
    console.log('SIO: NO Session found for '+macaddr+'! Discating message...');

};

module.exports = sio;