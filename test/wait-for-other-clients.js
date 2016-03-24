var assert = require('chai').assert;
var io     = require('socket.io-client');

var app = require('./../testServer/index');

var TestSocketIOSync = require('./../index');

var socketUrl = 'http://localhost:3000';

var options = {
  transports: ['websocket'],
  'force new connection': true
};

var socketTester = new TestSocketIOSync(io, socketUrl, options);
var Client = socketTester.Client;

describe('waitForOtherClients', function() {
  it('should ensure that all clients that all clients are at the same point before continuing', function(done) {
    var client1 = new Client('WaitForOtherClients Client 1');
    var client2 = new Client('WaitForOtherClients Client 2');
    client1.emit('join room', 'Room#6')
      .waitFor('joined room', 'Room#6', 100)
      .waitForOtherClients('joined room')
      .emit('message', 'text 1')
      .waitFor('message', 'text 2');

    client2.emit('join room', 'Room#6')
      .waitFor('joined room', 'Room#6', 100)
      .executeFunction( function(callback) {
        setTimeout(function() {
          callback();
        }, 50)
      }, 100)
      .waitForOtherClients('joined room')
      .emit('message', 'text 2')
      .waitFor('message', 'text 1');

    socketTester.run([client1, client2], done);
  });

  it('should throw exception if client registers the same wait label twice', function() {
    var client1 = new Client('WaitForOtherClients Client 3');

    try {
      client1.waitForOtherClients('joined room').waitForOtherClients('joined room');
      assert.fail(null, null, 'Exception was not thrown');
    } catch (e) {
      if (e.message == 'Exception was not thrown') {
        throw e;
      }
      assert.equal(e.message, '[WaitForOtherClients Client 3] wait label "joined room" can not be registered two times');
    }
  });
});