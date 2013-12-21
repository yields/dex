[![Build Status](https://travis-ci.org/yields/dex.png?branch=master)](https://travis-ci.org/yields/dex)

# dex

  Lightweight IndexedDB wrapper

```js
var dex = require('dex')();

// set
dex
  .set('foo', 'baz')
  .set('baz', 'foo')
  .end(function(err, all){});

// get
dex
  .get('foo')
  .get('baz')
  .end(function(err, all){
    assert('baz' == all.shift().item.value);
    assert('foo' == all.shift().item.value);
  });

// del
dex
  .del('foo')
  .del('baz')
  .end(function(err, all){});

// exists
dex
  .exists('foo')
  .exists('baz')
  .end(function(err, bools){});
```

## Installation

  Install with [component(1)](http://component.io):

    $ component install yields/dex

## API

### events

  - `("connect", event)`
  - `("abort", event)`, emitted when a transaction is aborted
  - `("complete", event)`, emitted when a transaction is completed
  - `("progress", event)`, emitted on transaction progress
  - `("set", key, value)`, emitted when `key`, `value` are saved.
  - `("del", key)`, emitted when a `key` is deleted.

### dex#command

  `command(name, fn)` is a static method that allows you
  to define new commands easily.

  all `dex()` commands are defined using this method, see examples in [`lib/commands.js`](lib/commands.js)

### dex()

  Create a new `Database` instance.

#### #connect

  The method is called automatically, you don't need to call
  it unless you `quit()`.

#### #quit

  Disconnect

#### #set

  Set `key`, `value` with optional `fn(err, o)`

#### #get

  Get `key`'s `value`.

#### #exists

  Determine if a `key` exists.

#### #del

  Delete `key`

#### #keys

  Get all `keys` that match a `regexp`

```js
dex().keys(/a/, function(err, keys){});
```

#### #abort

  Abort all running transactions.

```js
var d = dex();
var i = 0;
d.set('multi', 1);
d.set(1, 1);
d.set(2, 2);
d.set(3, 3);
d.get(3);
d.set(4, 4);

d.on('progress', function(e){
  if (1 == i++) d.abort();
});

d.end(function(err){
  assert(err);
  d.get('multi', function(err, o){
    if (err) return done(err);
    assert(!o.item);
  });
});
```

#### #end

  Invoke the transaction.

```js
dex()
.set('foo', 'baz')
.set('baz', 'foo')
.set('more', { stuff: [] })
.end(function(err, all){});
```

  under the hood dex will create a single transaction of `readwrite`.

```js
dex()
.get('foo')
.get('baz')
.get('more')
.end(function(err, all){});
```

  in the above snippet `dex()` will create a single `readonly` transaction.

```js
dex()
.set('foo', 'foo')
.get('foo')
.set('baz', 'foo')
.set('some', 'stuff')
.del('foo')
.end(function(err, all){});
```

  two transactions will be created `readwrite` and `readonly`.

## Tests

```bash
$ make test
```

## License

  MIT
