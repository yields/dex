
/**
 * Dependencies
 */

var debug = require('debug')('dex:commands');
var request = require('idb-request');
var Batch = require('batch');

/**
 * Export `command`
 */

module.exports = command;

/**
 * Export `commands
 */

var commands = command.commands = {};

/**
 * Define a command `name`, `fn`.
 *
 * @param {String} name
 * @param {Function} fn
 * @return {Database}
 * @api public
 */

function command(name, fn){
  this.prototype[name] = function(){
    if (!this.connected()) {
      this.queue.push([name, arguments]);
    } else {
      fn.apply(this, arguments);
    }
    return this;
  };
}

/**
 * Quit.
 *
 * @api public
 */

commands.quit = function(fn){
  this.db.close();
  this.emit('quit');
  fn && fn();
};

/**
 * Set `key`, `value`.
 *
 * @param {String} key
 * @param {Mixed} value
 * @param {Function} fn
 * @api public
 */

commands.set = function(key, value, fn){
  var self = this;

  if (2 == arguments.length) {
    this.batch.push(function(done){
      self.set(key, value, done);
    });
    return;
  }

  debug('set %s, %O', key, value);
  var obj = item(key, value);
  var req = this.store().put(obj, key);
  request(req, function(err, e){
    if (err) return fn(err);
    fn(null, response(e));
  });
};

/**
 * Get `key`.
 *
 * @param {String} get
 * @api public
 */

commands.get = function(key, fn){
  var self = this;

  if (1 == arguments.length) {
    return this.batch.push(function(done){
      self.get(key, done);
    });
  }

  debug('get %s', key);
  var req = this.store('readonly').get(key);
  request(req, function(err, e){
    if (err) return fn(err);
    fn(null, response(e));
  });
};

/**
 * Delete `key`.
 *
 * @param {String} key
 * @api public
 */

commands.del = function(key, fn){
  var self = this;

  if (1 == arguments.length) {
    return this.batch.push(function(done){
      self.del(key, done);
    });
  }

  debug('del %s', key);
  var req = this.store().delete(key);
  request(req, function(err, e){
    if (err) return fn(err);
    fn(null, response(e));
  });
};

/**
 * Check `key` existence.
 *
 * @param {String} key
 * @api public
 */

commands.exists = function(key, fn){
  var self = this;

  if (1 == arguments.length) {
    return this.batch.push(function(done){
      self.exists(key, done);
    });
  }

  debug('exists %s', key);
  this.get(key, function(err, res){
    if (err) return fn(err);
    fn(null, !! res.item);
  });
};

/**
 * Get all keys matching `pattern`.
 *
 * @param {RegExp} expr
 * @api public
 */

commands.keys = function(expr, fn){
  var store = this.store();
  var c = store.openCursor();
  var all = [];

  debug('keys %s', expr.toString());
  c.onsuccess = function(e){
    var c = e.target.result;
    if (!c) return fn(null, all);
    if (expr.test(c.key)) all.push(c.key);
    c.continue();
  };
};

/**
 * Call batch.
 *
 * @param {Function} fn
 * @api public
 */

commands.end = function(fn){
  var self = this;
  this.batch.end(function(){
    self.batch = new Batch;
    self.delegate();
    fn.apply(null, arguments);
  });
};

/**
 * Create an item with `key`, `value`.
 *
 * @param {String} key
 * @param {Mixed} value
 * @return {Object}
 * @api private
 */

function item(key, value){
  return value && 'dex' != value.type
    ? { type: 'dex', key: key, value: value }
    : value;
}

/**
 * Create a response from `e`.
 *
 * @param {Event} e
 * @return {Object}
 * @api private
 */

function response(e){
  return {
    item: e.target.result,
    event: e,
    e: e
  };
}
