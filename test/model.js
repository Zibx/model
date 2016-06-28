/**
 * Created by zibx on 6/12/16.
 */
var assert = require('chai').assert;
var model = require('../model');
describe('basic model tests', function () {
    it('should creates new', function () {
        var m = model({a: 1, b:2, c: [1,2,3]});
        assert.equal(m.get('a'), 1);
        assert.equal(m.get('c.1'), 2);
        assert.equal(m.get('c.10'), void 0);
        assert.equal(m.get('b'), 2);
        assert.deepEqual(m.get('c'), [1,2,3]);
    });
    it('set should set value and fire events', function () {
        var m = model({a: 1, b:2, c: [1,2,3]});

        var changeCaseNum = 0;
        m.observe('change', function(name, newVal, oldVal){
            if(changeCaseNum===0) {
                assert.equal(name, 'b');
                assert.equal(newVal, 16);
                assert.equal(oldVal, 2);
            }else{
                assert.equal(name, 'c.2');
                assert.equal(newVal, 18);
                assert.equal(oldVal, 3);
            }
            changeCaseNum++;
        });
        var caseNum = 0;
        m.observe('set', function(name, newVal, oldVal){
            if(caseNum === 0) {
                assert.equal(name, 'x');
                assert.equal(newVal, 600);
                assert.equal(oldVal, void 0);
            }else{ // c.3 (new array item)
                assert.equal(name, 'c.3');
                assert.equal(newVal, 8);
                assert.equal(oldVal, void 0);
            }
            caseNum++;
        });
        m.set('b', 16);
        m.set('x', 600);

        m.set('c.3', 8);
        m.set('c.2', 18);
    });

    it("should be extendable",function(){
        var m = model({a: 1, b:2, items: [1,2,3,4]});
        var items = m.deep('items');

        var extendedItems = items.extend();
        console.log(items);
        extendedItems.set(4,8);
        console.log(extendedItems.get("length"));
        console.log(extendedItems);
    });

    it('should get deeper', function () {
        var m = model({a: 1, b:2, items: [1,2,3,4]}),
            items = m.deep('items');
        assert.equal(items.get(0),1);
        assert.equal(items.get(1),2);
        assert.equal(items.get(2),3);

        m.observe('set', function(name, newVal, oldVal){
                assert.equal(name, 'items.3');
                assert.equal(newVal, 6);
                assert.equal(oldVal, void 0)
        });
        items.observe('set', function(name, newVal, oldVal){
            assert.equal(name, '3');
            assert.equal(newVal, 6);
            assert.equal(oldVal, void 0)
        });
        assert.equal(items.set(3, 6).get(3),6);
        assert.equal(m.get('items.3'),6);

        m.observe('change', function(name, newVal, oldVal){
            assert.equal(name, 'items.3');
            assert.equal(newVal, 13);
            assert.equal(oldVal, 6)
        });
        items.observe('change', function(name, newVal, oldVal){
            assert.equal(name, '3');
            assert.equal(newVal, 13);
            assert.equal(oldVal, 6)
        });
        assert.equal(m.set('items.3', 13).get('items.3'),13);
        assert.equal(items.get('3'),13);

    });
});