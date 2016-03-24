var _ = require('lodash');

module.exports.emit = function emit(event, data) {
  this.event = event;
  this.data = data;

  this.execute = function execute(client, callback) {
    client.socketClient.emit(event, data);
    executeNext(client, callback);
  };
};

module.exports.waitFor = function waitFor(event, match, timeout) {
  this.event = event;
  this.match = match;
  this.timeout = timeout;

  this.execute = function execute(client, callback) {

    var eventHandler = function waitForEventHandler(message) {
      if (match == null || (_.isFunction(match) && match(message) ) || _.isEqual(message, match)) {
        clearTimeout(waitForTimeout);
        executeNext(client, callback);
      }
    }
    client.socketClient.on(event, eventHandler);

    var waitForTimeout = setTimeout(function() {
      client.socketClient.off(event, eventHandler);
      var message = '[' + client.label + '] Event "' + event + '" ';
      if (match != null) {
        if (_.isFunction(match)) {
          message += 'with matching data ';
        } else {
          message += 'with data ' + JSON.stringify(match) + ' ';
        }
      }
      message += 'was not received in ' + timeout + ' milliseconds';

      callback(new Error(message), client.label);
    }, timeout);
  };
};

module.exports.failIfReceived = function failIfReceived(event, match, timeout) {
  this.event = event;
  this.match = match;
  this.timeout = timeout;

  this.execute = function execute(client, callback) {

    var eventHandler = function failIfReceivedEventHandler(message) {
      if (match == null || (_.isFunction(match) && match(message) ) || _.isEqual(message, match)) {
        clearTimeout(failIfReceivedTimeout);

        var message = '[' + client.label + '] Event "' + event + '" ';
        if (match != null) {
          if (_.isFunction(match)) {
            message += 'with matching data ';
          } else {
            message += 'with data ' + JSON.stringify(match) + ' ';
          }
        }
        message += 'was received';

        callback(new Error(message), client.label);
      }
    }
    client.socketClient.on(event, eventHandler);

    var failIfReceivedTimeout = setTimeout(function() {
      client.socketClient.off(event, eventHandler);
      executeNext(client, callback);
    }, timeout);
  };
};

module.exports.failIfReceivedNonBlocking = function failIfReceivedNonBlocking(event, match, timeout) {
  this.event = event;
  this.match = match;
  this.timeout = timeout;

  this.execute = function execute(client, callback) {

    var eventHandler = function failIfReceivedNonBlockingEventHandler(message) {
      if (match == null || (_.isFunction(match) && match(message) ) || _.isEqual(message, match)) {
        clearTimeout(failIfReceivedTimeout);

        var message = '[' + client.label + '] Event "' + event + '" ';
        if (match != null) {
          if (_.isFunction(match)) {
            message += 'with matching data ';
          } else {
            message += 'with data ' + JSON.stringify(match) + ' ';
          }
        }
        message += 'was received';

        callback(new Error(message), client.label);
      }
    }
    client.socketClient.on(event, eventHandler);

    var failIfReceivedTimeout = setTimeout(function() {
      client.socketClient.off(event, eventHandler);
    }, timeout);

    executeNext(client, callback);
  };
};

module.exports.executeFunction = function executeFunction(func, timeout) {
  this.func = func;
  this.timeout = timeout;

  this.execute = function execute(client, callback) {

    var funcCallback = function(error) {
      clearTimeout(executeFunctionTimeout);
      if (error) {
        var message = '[' + client.label + '] executeFunction returned error "' + error.message + '"';
        return callback(new Error(message));
      }
      executeNext(client, callback);
    };

    var executeFunctionTimeout = setTimeout(function() {
      var message = '[' + client.label + '] executeFunction timed out';

      callback(new Error(message), client.label);
    }, timeout);

    func(funcCallback);
  };
};

module.exports.waitForOtherClients = function waitForOtherClients(label, timeout, tester) {
  this.label = label;
  this.timeout = timeout;

  this.execute = function execute(client, callback) {

    tester.addWaitForClientsCallback(label, function() {
      executeNext(client, callback);
    });
  };
};

function executeNext(client, callback) {
  if (client.actions.length === 0) {
    return callback(null, client.label);
  }

  var firstAction = client.actions.shift();
  firstAction.execute(client, callback);
}