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
    var client = new Client('WaitFor Client 1');
    client.emit('join room', 'Room#6')
      .waitFor('joined room', 'Room#6', 500);
    socketTester.run([client], done);
  });

  it('should fail if event was not received', function(done) {
    var client = new Client('WaitFor Client 2');
    client.waitFor('joined room', 'Room#5', 30);

    socketTester.run([client], function(err, label) {
      assert.isDefined(err, 'Exception was not thrown');
      assert.equal(err.message, '[WaitFor Client 2] Event "joined room" with data "Room#5" was not received in 30 milliseconds');
      done();
    });
  });

  it('should pass if match function returned true', function(done) {
    var client = new Client('WaitFor Client 3');
    client.emit('join room', 'Room#7')
      .waitFor('joined room', function(message) { return message.substr(0, 4) === 'Room'; }, 500);
    socketTester.run([client], done);
  });

  it('should fail if match function returned false', function(done) {
    var client = new Client('WaitFor Client 4');
    client.emit('join room', 'Room#7')
      .waitFor('joined room', function(message) { return message.substr(4, 2) === '#3'; }, 500);

    socketTester.run([client], function(err, label) {
      assert.isDefined(err, 'Exception was not thrown');
      assert.equal(err.message, '[WaitFor Client 4] Event "joined room" with matching data was not received in 500 milliseconds');
      done();
    });
  });

  it('should get event emitted on connection', function(done) {
    var client2 = new Client('WaitFor Client 5');
    client2.waitFor('first_message', 1);
    socketTester.run([client2], done);
  });
});