
/**
 * Dependencies
 */

var debug = require('debug')('dex:database');
var command = require('./commands');
var Emitter = require('emitter');
var Batch = require('batch');
var each = require('each');

/**
 * IndexedDB
 */

var DB = window.indexedDB
  || window.webkitIndexedDB
  || window.mozIndexedDB
  || window.msIndexedDB;

/**
 * Export `Database`
 */

module.exports = Database;

/**
 * Initialize `Database`
 *
 * @param {String} name
 * @api public
 */

function Database(){
  if (!(this instanceof Database)) return new Database(name);
  this.onblocked = this.emit.bind(this, 'blocked');
  this.onerror = this.emit.bind(this, 'error');
  this.oncomplete = this.oncomplete.bind(this);
  this.onconnect = this.onconnect.bind(this);
  this.onabort = this.onabort.bind(this);
  this.batch = new Batch;
  this.transactions = {};
  this.queue = [];
  this.connect();
}

/**
 * Mixins
 */

Emitter(Database.prototype);

/**
 * Define a command.
 *
 * @param {String} name
 * @param {Function} fn
 * @return {Database}
 * @api public
 */

Database.command = command;

/**
 * Connect.
 *
 * @return {Database}
 * @api public
 */

Database.prototype.connect = function(){
  var self = this;

  if (this.connected()) return this;
  if (this.connecting) return this;

  this.connecting = true;
  var req = DB.open('__dex__');
  req.onupgradeneeded = this.onupgrade.bind(this);
  req.onblocked = this.onblocked;
  req.onsuccess = this.onconnect;
  req.onerror = this.onerror;

  return this;
};

/**
 * Determine connection state.
 *
 * @return {Boolean}
 * @api public
 */

Database.prototype.connected = function(){
  return !! this.db;
};

/**
 * Call queued commands.
 *
 * @api private
 */

Database.prototype.call = function(){
  var queue = this.queue;

  for (var i = 0; i < queue.length; ++i) {
    var q = queue[i];
    this[q[0]].apply(this, q[1]);
  }

  this.queue = [];
  return this;
};

/**
 * Get a transaction with `mode`.
 *
 * @param {String} mode
 * @return {IDBTransaction}
 * @api private
 */

Database.prototype.transaction = function(mode){
  mode = mode || 'readwrite';
  var t = this.transactions[mode];
  if (t) return t;
  t = this.db.transaction(['__dex__'], mode);
  debug('created %s transaction', mode);
  t.onerror = this.onerror;
  t.oncomplete = this.oncomplete;
  t.onabort = this.onabort;
  this.transactions[mode] = t;
  return t;
};

/**
 * Get the store with `mode`.
 *
 * @param {String} mode
 * @return {IDBObjectStore}
 * @api private
 */

Database.prototype.store = function(mode){
  return this
    .transaction(mode || 'readwrite')
    .objectStore('__dex__');
};

/**
 * on-abort.
 *
 * @param {Event} e
 * @api private
 */

Database.prototype.onabort = function(e){
  debug('transaction %s aborted', e.target.mode);
  this.transactions[e.target.mode] = null;
  this.emit('abort', e);
  return this;
};

/**
 * on-complete
 *
 * @param {Event} e
 * @api private
 */

Database.prototype.oncomplete = function(e){
  debug('transaction %s completed', e.target.mode);
  this.transactions[e.target.mode] = null;
  this.emit('complete', e);
};

/**
 * on-connect.
 *
 * @param {Event} e
 * @api private
 */

Database.prototype.onconnect = function(e){
  this.db = e.target.result;
  this.connecting = null;
  this.call();
  debug('connected to __dex__');
  this.emit('connect');
  return this;
};

/**
 * on-upgrade
 *
 * @param {Event} e
 * @api private
 */

Database.prototype.onupgrade = function(e){
  var db = e.target.result;
  debug('add object store');
  db.createObjectStore('__dex__');
};

/**
 * Add commands
 */

each(command.commands, function(cmd, fn){
  Database.command(cmd, fn);
});
