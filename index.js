var _ = require('lodash');
var ClientActions = require('./lib/actions.js');

/**
 * Constructor Function
 * @param {obj} io              socket.io-client instance
 * @param {string} socketUrl    socket url to connect to
 * @param {obj} socketOptions   socket.io-client connection options
 */
var TestSocketIOSync = function(io, socketUrl, socketOptions) {
  this.io = io;
  this.socketUrl = socketUrl;
  this.socketOptions = socketOptions;
  this.timeout = 25;

  this.clientsReturned = [];
  this.clients = [];

  //used by waitForOtherClients
  this.waitCounters = {};
  this.waitCallbacks = {};

  this.done = null;

  tester = this;

  this.clientReturns = function clientReturns(err, label) {
    if (err) {
      return tester.done(err);
    }
    tester.clientsReturned.push(label);

    if (tester.clientsReturned.length === tester.clients.length) {
      tester.done();
    }
  };

  this.incrementWaitCounter = function incrementWaitCounter(label) {
    if (typeof tester.waitCounters[label] === 'undefined') {
      tester.waitCounters[label] = 1;
      tester.waitCallbacks[label] = [];
    } else {
      tester.waitCounters[label]++;
    }
  };

  this.addWaitForClientsCallback = function addWaitForClientsCallback(label, callback) {
    tester.waitCallbacks[label].push(callback);

    if (tester.waitCallbacks[label].length === tester.waitCounters[label]) {
      _.forEach(tester.waitCallbacks[label], function(callback) {
        callback();
      });
      delete(tester.waitCallbacks[label]);
      delete(tester.waitCounters[label]);
    }
  };

  this.run = function run(clients, done) {
    if (!_.isArray(clients)) {
      throw new Error('clients must be array');
    }
    if (clients.length === 0) {
      throw new Error('clients must be non-empty array');
    }

    tester.done = done;

    tester.clientsReturned = [];
    tester.clients = [];

    for (var i=0; i<clients.length; i++) {
      tester.clients.push(clients[i].label);
      clients[i].run();
    }
  };

  this.Client = function Client(label, socketOptions) {
    this.label = label || 'Client';
    this.socketOptions = _.clone(tester.socketOptions);
    if (_.isPlainObject(socketOptions)) {
      _.merge(this.socketOptions, socketOptions);
    }

    this.actions = [];
    this.waitLabels = [];

    //used by NonBlocking functions
    this.failed = false;
    this.nonBlockingActionsRunning = 0;
    this.nonBlockingActionsCallback = null;

    this.socketClient = tester.io.connect(tester.socketUrl, this.socketOptions);

    this.emit = function emit(event, data) {
      this.actions.push(new ClientActions.emit(event, data));
      return this;
    };

    this.waitFor = function waitFor(event, data, timeout) {
      var eventTimeout = timeout || tester.timeout;
      this.actions.push(new ClientActions.waitFor(event, data, eventTimeout));
      return this;
    };

    this.failIfReceived = function failIfReceived(event, data, timeout) {
      var eventTimeout = timeout || tester.timeout;
      this.actions.push(new ClientActions.failIfReceived(event, data, eventTimeout));
      return this;
    };

    this.failIfReceivedNonBlocking = function failIfReceivedNonBlocking(event, data, timeout) {
      var eventTimeout = timeout || tester.timeout;
      this.actions.push(new ClientActions.failIfReceivedNonBlocking(event, data, eventTimeout));
      return this;
    };

    this.executeFunction = function executeFunction(func, timeout) {
      var eventTimeout = timeout || tester.timeout;
      this.actions.push(new ClientActions.executeFunction(func, eventTimeout));
      return this;
    };

    this.waitForOtherClients = function waitForOtherClients(label, timeout) {
      var eventTimeout = timeout || tester.timeout;
      if (_.includes(this.waitLabels, label)) {
        throw new Error('[' + this.label + '] wait label "' + label + '" can not be registered two times');
      }
      this.waitLabels.push(label);
      tester.incrementWaitCounter(label);
      this.actions.push(new ClientActions.waitForOtherClients(label, eventTimeout, tester));
      return this;
    };

    this.run = function run() {
      if (this.actions.length === 0) {
        throw new Error('Client ' + this.label + ' has no actions configured');
      }

      var firstAction = this.actions.shift();
      firstAction.execute(this, tester.clientReturns);
    };
  }
};

module.exports = TestSocketIOSync;