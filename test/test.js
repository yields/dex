
describe('dex', function(){

  var assert = require('assert')
    , dex = require('dex');

  var DB = window.indexedDB
    || window.webkitIndexedDB
    || window.mozIndexedDB
    || window.msIndexedDB;

  before(function(){
    DB.deleteDatabase('__dex__');
  })

  describe('#CMD', function(){
    it('should add it to queue', function(){
      var d = dex().set('a', 'b');
      assert(1 == d.queue.length);
    })

    it('should empty the queue when a connection is established', function(done){
      var d = dex().set('a', 'b').get('a');
      assert(2 == d.queue.length);
      d.on('connect', function(){
        assert(0 == d.queue.length);
        done();
      })
    })
  })

  describe('#set', function(){
    it('should set `key`, `value`', function(done){
      dex().set('foo', 'baz', function(err, e){
        if (err) return done(err);
        assert('success' == e.e.type);
        assert('success' == e.event.type);
        assert(e.e == e.event);
        assert('foo' == e.item);
        done();
      })
    })

    it('should set multiple', function(done){
      dex()
      .set('foo', 'baz')
      .set('baz', 'foo')
      .set('a', 'b')
      .end(function(err, all){
        if (err) return done(err);
        all = all.map(function(e){ return e.item; });
        assert(~all.indexOf('foo'));
        assert(~all.indexOf('baz'));
        assert(~all.indexOf('a'));
        done();
      })
    })
  })

  describe('#get', function(){
    it('should get `key`', function(done){
      dex().get('foo', function(err, obj){
        if (err) return done(err);
        assert('success' == obj.e.type);
        assert('foo' == obj.item.key);
        assert('baz' == obj.item.value);
        assert(obj.e == obj.event);
        done();
      })
    })

    it('should get multiple', function(done){
      dex()
      .get('foo')
      .get('baz')
      .get('a')
      .end(function(err, all){
        if (err) return done(err);
        all = all.map(function(e){ return e.item.value; });
        assert(~all.indexOf('baz'));
        assert(~all.indexOf('foo'));
        assert(~all.indexOf('b'));
        assert(3 == all.length);
        done();
      })
    })
  })

  describe('#exists', function(){
    it('should check `key`', function(done){
      dex().exists('b', function(err, bool){
        if (err) return done(err);
        assert(false == bool);
        done();
      })
    })

    it('should check multiple', function(done){
      dex()
      .exists('a')
      .exists('foo')
      .exists('b')
      .end(function(err, bools){
        if (err) return done(err);
        assert(3 == bools.length);
        assert(bools.shift());
        assert(bools.shift());
        assert(!bools.shift());
        done();
      })
    })
  })

  describe('#keys', function(){
    it('should get all keys that match pat', function(done){
      dex().keys(/a/, function(err, all){
        if (err) return done(err);
        assert(2 == all.length);
        assert('a' == all.shift());
        assert('baz' == all.shift());
        done();
      })
    })
  })

  describe('#del', function(){
    it('shouild delete `key`', function(done){
      dex().del('a', done);
    })

    it('should delete multiple keys', function(done){
      dex()
      .del('baz')
      .del('foo')
      .end(function(err, all){
        if (err) return done(err);
        assert(2 == all.length);
        assert('success' == all.shift().e.type);
        assert('success' == all.shift().e.type);
        done();
      });
    })
  })

  describe('batch', function(){
    it('should be cleaned up on end', function(done){
      var d = dex()
        .set('a', 'a')
        .set('b', 'b')
        .set('c', 'c')
        .end(function(err, all){
          if (err) return done(err);
          assert(0 == d.batch.fns.length);
          done();
        });
    })
  })

  describe('events', function(){
    describe('connect', function(){
      it('should be emitted when connection is established', function(done){
        dex().on('connect', function(e){
          assert(Event == e.constructor);
          done();
        });
      })
    })

    describe('abort', function(){
      it('should be emitted when a transaction is aborted', function(done){
        var d = dex();
        d.set('a', 'a');
        d.set('b', 'b');
        d.set('c', 'c');
        d.end(function(){});

        d.on('abort', function(e){
          assert(Event == e.constructor);
          done();
        });

        d.batch.on('progress', function(){
          d.transactions.readwrite.abort();
        });
      })
    })

    describe('complete', function(){
      it('should be emitted when a transaction is completed', function(done){
        var d = dex();
        d.set('a', 'a');
        d.set('b', 'b');
        d.set('c', 'c');

        d.on('complete', function(e){
          assert(Event == e.constructor);
          done();
        })

        d.end(function(){})
      })
    })

    describe('progress', function(){
      it('should be emitted on transaction progress', function(done){
        var d = dex();
        var vals = ['a', 'b', 'c'];
        var emitted = 0;
        d.set('a', 'a');
        d.set('b', 'b');
        d.set('c', 'c');

        d.on('progress', function(e){
          assert(vals.shift() == e.value.item);
          ++emitted;
        });

        d.end(function(){
          assert(3 == emitted);
          done();
        });
      })
    })

    describe('set', function(){
      it('should be emitted on each set with `key`, `value`', function(done){
        var d = dex();

        d.on('set', function(key, value){
          assert('a' == key);
          assert('b' == value);
          done();
        });

        d.set('a', 'b').end(function(){});
      })
    })

    describe('del', function(){
      it('should be emitted when a `key` is deleted with `key`', function(done){
        var d = dex();

        d.on('del', function(key){
          assert('a' == key);
          done();
        })

        d.del('a').end(function(){});
      })
    })
  })

});
