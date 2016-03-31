# test-socketio-sync [![npm version](https://badge.fury.io/js/test-socketio-sync.svg)](https://badge.fury.io/js/test-socketio-sync)[![Build Status](https://api.travis-ci.org/Naktibalda/test-socketio-sync.svg)](https://api.travis-ci.org/Naktibalda/test-socketio-sync)

Sychronous testing library for Socket.IO, inspired by socket-tester and Codeception.

## Installation
```
npm install test-socketio-sync
```
## How it works
Firstly add actions to Client object, which is mutable
so methods can be chained or executed in separate statements.<br />
Multiple clients can be used to simulate concurrent users.<br />
Then pass all clients to socketTester.run method.<br />
Run method connects clients to socket.io server and starts the first action.<br />
Further actions are started on successful completion of the previous action with exception of failIfReceivedNonBlocking method.<br />
After completion of the last action, mocha callback method is called.
If any action fails, error is passed to mocha callback.

## Examples

```js
var TestSocketIOSync = require('test-socketio-sync');
var io = require('socket.io-client');
var socketUrl = 'http://localhost:3000';

var options = {
  transports: ['websocket'],
  'force new connection': true
};

var socketTester = new TestSocketIOSync(io, socketUrl, options);
var Client = socketTester.Client;

it('should emit event and wait for response', function(done) {
  var client1 = new Client('client');
  client1.emit('join room', 'Room #5')
    .waitFor('joined room', 'Room#5');
  socketTester.run([client1], done);
});

it('should check that event is not received', function(done) {
  var client1 = new Client('first client');
  client1.emit('join room', 'Room #5')
    .failIfReceived('impossible event', 'Room#5', 10);
  socketTester.run([client1], done);
});

it('should wait for other clients to reach the same point', function(done) {
  var client1 = new Client('first client');
  var client2 = new Client('second client');

  client1.emit('join room', 'Room #5').waitFor('joined room', 'Room#5')
    .waitForOtherClients('to join room', 2).emit('message', 'Hi all');

  client2.emit('join room', 'Room #5').waitFor('joined room', 'Room#5')
    .waitForOtherClients('to join room', 2).waitFor('message', 'Hi all');

  socketTester.run([client1, client2], done);
});
```

More examples can be found in [test directory](https://github.com/Naktibalda/test-socketio-sync/tree/master/test).

## API

### new TestSocketIOSync(io, socketUrl, socketOptions)
```
/**
 * Runs tests
 * @param {array}   io  Array of client objects
 * @param {string} socketUrl   Url of socket.io server
 * @param {Object} socketOptions Options for socket.io-client
 */
```
### run(clients, done)
```
/**
 * Runs tests
 * @param {array}   clients  Array of client objects
 * @param {Function} done    Mocha done function
 */
```
### new Client(label, socketUrl, [socketOptions])
```
/**
 * Runs tests
 * @param {string} label Used to identify client in error messages
 * @param {string} socketUrl Can be different to support namespaces
 * @param {Object} socketOptions customize options per-client
 */
```
### emit(event, [data])
```
/**
 * Emits event (non-blocking)
 * @param {string} event
 * @param data
 */
```
### waitFor(event, data, [timeout])
```
/**
 * Waits for event
 * @param {string} event
 * @param match See Matching
 * @timeout {Number} in milliseconds
 */
```

waitFor, failIfReceived and failIfReceivedNonBlocking methods match any value if match parameter is set to null,
if match is a function, event data is passed to the function and function returns if it matched.

### failIfReceived(event, data, [timeout])
```
/**
 * Fails if event is received
 * @param {string} event
 * @param match See waitFor
 * @timeout {Number} in milliseconds
 */
```
### failIfReceivedNonBlocking(event, data, [timeout])
```
/**
 * Fails if event is received
 * @param {string} event
 * @param match See waitFor
 * @timeout {Number} in milliseconds
 */
```
### waitForOtherClients(label, [timeout])
```
/**
 * Synchronizes clients
 * @param {string} label Label of synchronization point
 * @timeout {Number} in milliseconds
 */
```
### executeFunction(function, [timeout])
```
/**
 * Executes function (e.g. to update database or make HTTP request)
 * @param {Function} function
 * @timeout {Number} in milliseconds
 */
```

Callback is passed to the function and it can be called with exception or nothing to indicate that execution is complete.
```js
client.executeFunction(
    function(callback) {
        mysql.query('UPDATE table SET status = \'Down\' WHERE id = 1', callback);
    }, 500);
```

## Feedback

Please report issues and request features in [Github](https://github.com/Naktibalda/test-socketio-sync/issues)