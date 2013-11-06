
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

  in the above snippet `dex()` will create a transaction
  of `readonly` (to improve) performance.

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
