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
        //client.socketClient.off(event, eventHandler);
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

      returnError(client, callback, message);
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
        client.socketClient.off(event, eventHandler);

        var message = '[' + client.label + '] Event "' + event + '" ';
        if (match != null) {
          if (_.isFunction(match)) {
            message += 'with matching data ';
          } else {
            message += 'with data ' + JSON.stringify(match) + ' ';
          }
        }
        message += 'was received';

        returnError(client, callback, message);
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
    client.nonBlockingActionsRunning++;

    var eventHandler = function failIfReceivedNonBlockingEventHandler(message) {
      if (match == null || (_.isFunction(match) && match(message) ) || _.isEqual(message, match)) {
        clearTimeout(failIfReceivedTimeout);
        client.socketClient.off(event, eventHandler);

        var message = '[' + client.label + '] Event "' + event + '" ';
        if (match != null) {
          if (_.isFunction(match)) {
            message += 'with matching data ';
          } else {
            message += 'with data ' + JSON.stringify(match) + ' ';
          }
        }
        message += 'was received';

        returnError(client, callback, message);
      }
    }
    client.socketClient.on(event, eventHandler);

    var failIfReceivedTimeout = setTimeout(function() {
      client.socketClient.off(event, eventHandler);
      onNonBlockingActionEnd(client);
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
        returnError(client, callback, message);
      }
      executeNext(client, callback);
    };

    var executeFunctionTimeout = setTimeout(function() {
      var message = '[' + client.label + '] executeFunction timed out';

      returnError(client, callback, message);
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

function returnError(client, callback, message) {
  client.failed = true;
  callback(new Error(message), client);
}

function executeNext(client, callback) {
  if (client.failed) {
    return;
  }
  if (client.actions.length === 0) {
    if (client.nonBlockingActionsRunning === 0) {
      return callback(null, client);
    } else {
      client.nonBlockingActionsCallback = callback;
      return;
    }
  }

  var firstAction = client.actions.shift();
  firstAction.execute(client, callback);
}

function onNonBlockingActionEnd(client) {
  client.nonBlockingActionsRunning--;
  if (client.nonBlockingActionsRunning === 0 && client.nonBlockingActionsCallback != null) {
    return client.nonBlockingActionsCallback(null, client);
  }
}