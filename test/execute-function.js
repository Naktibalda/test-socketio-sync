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

describe('executeFunction', function() {
  it('should pass if function calls callback in time', function(done) {
    var client = new Client('ExecuteFunction Client 1');
    var testFunction = function(callback) {
      callback();
    };
    client.executeFunction(testFunction, 50);

    socketTester.run([client], done);
  });

  it('should fail if function does not call callback in time', function(done) {
    var client = new Client('ExecuteFunction Client 2');
    var testFunction = function(callback) {
      setTimeout(function() {
        callback();
      }, 100);
    };
    client.executeFunction(testFunction, 50);

    socketTester.run([client], function(err, label) {
      assert.isDefined(err, 'Exception was not thrown');
      assert.equal('[ExecuteFunction Client 2] executeFunction timed out', err.message);
      done();
    });
  });

  it('should fail if function calls callback with error', function(done) {
    var client = new Client('ExecuteFunction Client 3');
    var testFunction = function(callback) {
      setTimeout(function() {
        callback(new Error('failed something'));
      }, 10);
    };
    client.executeFunction(testFunction, 50);

    socketTester.run([client], function(err, label) {
      assert.isDefined(err, 'Exception was not thrown');
      assert.equal('[ExecuteFunction Client 3] executeFunction returned error "failed something"' , err.message);
      done();
    });
  });
});