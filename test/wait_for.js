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

describe('waitFor', function() {
  it('should pass if event was received', function(done) {
    var client = new Client('Client 1');
    client.emit('join room', 'Room#6')
      .waitFor('joined room', 'Room#6', 500);
    socketTester.run([client], done);
  });

  it('should fail if event was not received', function(done) {
    var client = new Client('Client 2');
    client.waitFor('joined room', 'Room#5', 30);

    socketTester.run([client], function(err, label) {
      assert.isDefined(err, 'Exception was not thrown');
      assert.equal('[Client 2] Event "joined room" with data "Room#5" was not received in 30 milliseconds', err.message);
      done();
    });
  });
});