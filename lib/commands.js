
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

  var obj = item(key, value);
  var req = this.store().put(obj);
  fn = callback(fn);
  req.onerror = fn;
  req.onsuccess = fn;
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

  var req = this.store('readonly').get(key);
  fn = callback(fn);
  req.onerror = fn;
  req.onsuccess = fn;
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

  var req = this.store().delete(key);
  fn = callback(fn);
  req.onerror = fn;
  req.onsuccess = fn;
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

  this.get(key, function(err, o){
    if (err) return fn(err);
    fn(null, !! o.item);
  });
};

/**
 * Get all keys matching `pattern`.
 *
 * @param {RegExp} expr
 * @api public
 */

commands.keys = function(expr, fn){
  var i = this.store().index('key');
  var c = i.openKeyCursor();
  var all = [];

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
  this.batch.end(fn);
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
 * Generate a callback for `req`.
 *
 * @param {Function} fn
 * @api private
 */

function callback(fn){
  return function(e){
    switch (e.type) {
      case 'success':
        return fn(null, {
          item: e.target.result,
          event: e,
          e: e
        });
      default:
        fn(e);
    }
  };
}
