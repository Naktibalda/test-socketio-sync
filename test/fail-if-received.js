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

describe('failIfReceived', function() {
  it('should pass if event was not received', function(done) {
    var client = new Client('FailIfReceived Client 1');
    client.failIfReceived('joined room', 'Room#5', 100);

    socketTester.run([client], done);
  });

  it('should fail if event was received', function(done) {
    var client = new Client('FailIfReceived Client 2');
    client.emit('join room', 'Room#6')
      .failIfReceived('joined room', 'Room#6', 100);

    socketTester.run([client], function(err, label) {
      assert.isDefined(err, 'Exception was not thrown');
      assert.equal(err.message, '[FailIfReceived Client 2] Event "joined room" with data "Room#6" was received');
      done();
    });
  });

  it('should pass if match function returned false', function(done) {
    var client = new Client('FailIfReceived Client 3');
    client.emit('join room', 'Room#6')
      .failIfReceived('joined room', function(message) { return message.substr(4, 2) === '#3'; }, 100);

    socketTester.run([client], done);
  });

  it('should fail if match function returned true', function(done) {
    var client = new Client('FailIfReceived Client 4');
    client.emit('join room', 'Room#6')
      .failIfReceived('joined room', function(message) { return message.substr(0, 4) === 'Room'; }, 100);

    socketTester.run([client], function(err, label) {
      assert.isDefined(err, 'Exception was not thrown');
      assert.equal(err.message, '[FailIfReceived Client 4] Event "joined room" with matching data was received');
      done();
    });
  });
});