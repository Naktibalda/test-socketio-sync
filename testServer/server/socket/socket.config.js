/*jslint node: true */
'use strict';

module.exports = function(io){

  io.on('connection', function(socket){

    var timerCounter = 1;

    var timer = setInterval(function() {
      socket.emit('time', timerCounter++);
    }, 100);

    socket.on('disconnect', function() {
      clearInterval(timer);
    });

    socket.on('join room', function(roomname){
      socket.roomname = roomname;
      socket.join(roomname);
      socket.emit('joined room', roomname);
    });

    socket.on('message', function(msg){
      io.to(socket.roomname).emit('message', msg);
    });

  });

};