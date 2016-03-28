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

describe('namespaced client', function() {
  it('should receive events sent to that namespace', function(done) {
    var client = new Client('Namespace Client 1', socketUrl + '/namespace-1');
    client.waitFor('welcome-to', 'namespace-1', 100)
      .waitFor('namespaced-message', 'text', 300);
    socketTester.run([client], done);
  });
});