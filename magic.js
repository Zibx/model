var M = (function(){
    var sorting = {
        Number: function(a,b){return a-b;}
    };
    var Model = function(cfg, parent, relation){
        this.data = this.mappedData = cfg;
        this.parent = parent;
        this.relation = relation?relation+'.':void 0;
        this._listeners = {
            change: [],
            remove: [],
            insert: [],
            'set': []
        };
        this._pathListeners = {};
        this._links = {};
    };
    Model.prototype = {
        get: function(name){
            var tokens, key, val;
            if( name.indexOf('.') > -1 ){
                tokens = name.split('.');
                val = this.mappedData;
                while( key = tokens.shift() ){
                    if( val.hasOwnProperty(key) ){
                        val = val[key];
                    }else{
                        return void 0;
                    }
                }
                return val;
            }else{
                return this.data[name];
            }
        },
        set: function(name, val){
            var changed,
                oldValue,
                notFound,
                node, lastKey,
                data = this.data;
            var tokens, key, value;
            name += '';
            if( name.indexOf('.') > -1 ){
                tokens = name.split('.');
                node = oldValue = this.data;
                while( key = tokens.shift() ){
                    node = oldValue;
                    lastKey = key;
                    if( oldValue.hasOwnProperty(key) ){
                        oldValue = oldValue[key];
                    }else{
                        notFound = true;
                        //console.log(node)
                        oldValue = node[key] = {};
                    }
                }
            }else{
                node = data;
                lastKey = name;
                if( data.hasOwnProperty(name) )
                    oldValue = data[name];
                else
                    notFound = true;
            }
            if(notFound){
                //console.log(node,name)
                node[lastKey] = val;
                this.emit('set', name, val, void 0)
            }else{
                if(oldValue !== val){
                    node[lastKey] = val;
                    this.emit('change', name, val, oldValue)
                }
            }
        },
        deep: function(name){
            var link = Factory(this.get(name), this, name),
                rel = link.relation;
            (this._links[rel] = this._links[rel] || []).push(link);
            return link;
        },
        link: function(){
            var link = Factory(this.data.slice(), this);
            link.sync(this);
            return link;
        },
        sync: function(from){
            var _self = this;
            from.observe('change', function(what, val, oldVal){
                _self.set(what,val);
            });
        },
        sort: function(fn){
            if(!fn)
                fn = sorting.Number;
            this._sort = fn;
            this.mappedData = this.data.slice().sort(fn);
            return this;
        },
        // observe model events
        observe: function(event, fn){
            var listeners = this._listeners;
            listeners[event].push(fn);
        },
        // fire model events
        emit: function(type, what, val, oldVal, oneWay){
            var listeners = this._listeners[type], i, _i, tokens, name;
            for( i = 0, _i = listeners.length; i < _i; i++ )
                listeners[i].call(this,what,val,oldVal)

            this._fire(what,type,val,oldVal);
            //console.warn(arguments, this.relation)

            // emit links TODO benchmark!
            tokens = what.split('.');
            for( i = 0, _i = tokens.length; i < _i; i++ )
                (name = tokens.slice(0,i).join('.')+'.') in this._links &&
                    this._links[name].forEach(function(link){
                        link !== oneWay &&
                            link.emit(type, tokens.slice(i).join('.'), val, oldVal, true);
                    });

            if( !oneWay && this.parent )
                this.parent.emit(type, this.relation+what, val, oldVal, this);

        },
        // observe property change
        on: function(path, fn, type){
            var listeners = this._pathListeners;
            (listeners[path] = listeners[path] || []).push({type: type, fn: fn});
        },
        // emit property change
        _fire: function(path, type, val, oldVal){

            var listeners = this._pathListeners[path],
                i, _i, listener;
            if(!listeners)
                return null;
            for( i = 0, _i = listeners.length; i < _i; i++ ){
                listener = listeners[i];
                (listener.type === void 0 || listener.type === type) &&
                    listener.fn.call(this, val, type, oldVal);
            }
        }
    };
    var Factory = function Factory(cfg, parent, relation){
        return new Model(cfg, parent, relation);
    };
    return Factory;
})();
console.clear();
var model = M({active: {a:1}});
var active = model.deep('active');

model.on('active.g', function(){
    console.error('2',arguments)
})
model.set('active', 100)
active.set('l',4)
model.set('active', {})
model.set('active.g', 2)
model.set('active.g', 3)
active.set('g', 10)
model.set('active.g', true)

#>>

alert("Start");

// ***************************************************************************************

alert("Test 1.1: " + typeof Array);
alert("Test 1.2: " + typeof Array.prototype);
alert("Test 1.3: " + typeof Array.prototype["push"]);

// ***************************************************************************************

var n = "";
if (n)
{
    alert("Test 2.1: " + 'true');
}
else
{
    alert("Test 2.1: " + 'false');
}
alert("Test 2.2: " + (null == undefined));
alert("Test 2.3: " + (n == !!n));

// ******************************************************************************

alert("Test 3: " + ({}.a != {}.b));

// ****************************************************************************************

function C()
{
}
C.a = 2;

var g = new C();
alert("Test 4: " + g.a);

// ****************************************************************************

var s = {a: 0};
s.prototype = {b: 1};
alert("Test 5: " + (s.a == s.b));

// *******************************************************************************

function A()
{
    this.a = 4;
}

A.prototype = {a: 2};

var x = new A({a: 7});

alert("Test 6.1: " + A.a);
alert("Test 6.2: " + x.a);

// ***********************************************************************************

var a;
function func(arg)
{
    if (arg < 0)
    {
        return 1;
    }
    else if (arg > 0)
    {
        return 2;
    }
    else if (arg == 0)
    {
        return 3;
    }
}
var b =  func(a);
alert("Test 7: " + b);

// *********************************************************************************

try
{
    var tst = 5 / 0;
    if (tst > NAN)
    {
        throw new Error('bigger');
    }
    else if (isFinite(tst))
    {
        throw 'lower';
    }
    throw 0;
}
catch (e)
{
    alert("Test 8: " + (e.toString()));
}

// ******************************************************************************
var x = undefined;
alert("Test 9.1: " + (this['x'] === x));
alert("Test 9.2: " + (this['x'] === undefined));
alert("Test 9.3: " + this.hasOwnProperty('undefined'));

// ******************************************************************************

function B(arg)
{
    this.a = arg;
}

B.prototype = {a: 1};
B.a = 4;

var m = new B(3);
var j = new B();

alert("Test 10: " + m.a + j.a);
;
// ******************************************************************************
#>>
this.parentNode.links.indexOf(this)
#>>
host
#>>
Hosts.findOne(void 0)
#>>
var fns = {
    gt: '>',
    lt: '<',
    eq: '==',
    gte: '>=',
    ge: '>=',
    lte: '<=',
    le: '<=',
    ne: '!=',
    'in': function(){
        
    },
    'nin': function(){
        
    }
};
var makeFn = function(obj, soft, scope, code){
    soft = !!soft;
    scope = scope || 'el';
    var key, rules = [], val, type, subScope, fnName, fn1, res;
    for(key in obj)
        if(obj.hasOwnProperty(key)){
            val = obj[key];
            subScope = scope+'[\''+key+'\']';
            type = typeof val;
            if(key.charAt(0)==='$' && (fnName = key.substr(1)) && fnName in fns){
                fn1 = fns[fnName];
                if(typeof fn1==='string'){
                    rules.push(scope+fn1+val);
                }
            }else if(type==='number'){
                rules.push(subScope+(soft?'==':'===')+val)
            }else if(type==='string'){
                rules.push(subScope+(soft?'==':'===')+JSON.stringify(val))
            }else if(type==='object'){
                res = makeFn(val,soft,subScope,true);
                if(res.length===1)
                    rules.push(res[0]);
            }
        }
    var fn = 'return '+rules.join('&&')+';';
    console.log(fn);
    return code? rules : new Function('el',fn);
}
makeFn({a:{$gt:2},b:'123'})
new Array(10).join(' ').split('').map(function(a,i){return {a:i}}).filter(makeFn({a:{$gt:5}}));
makeFn
#>>
0.1+0.2-0.3
#>>
bind. - привязать контекст
изнутри бинд выглядел бы вот так, если бы был написан на жс:

Function.prototype.myBind = function(ctx){
  var fn = this;
  return function(){
    return fn.call(ctx);
  }
}

var a = {name: 666},
    b = function(){console.log(this.name);}.myBind(a);

b() -> 666
#>>
255..toString(16)
#>>
console.clear()
var b = new BPlusTree({order:2});

var tests = [
  { name: 'insert 1', fn: function(){
      for(var i = 1; i < 7; i++)
        b.insert(i)
    
    b.insert(7)
  }},
  { name: 'remove', fn: function(){
      /*b.remove(1)
      b.remove(2)
      b.remove(3)
      b.remove(4)*/
      b.remove(5)
      b.remove(6)
      
  }}/*,
  { name: 'remove 0', fn: function(){
      b.remove(0);
  }},
  { name: 'remove 2', fn: function(){
      b.remove(2);
  }},
  { name: 'remove 1', fn: function(){
      b.remove(6);
  }}*/
]

console.table2(tests.map(function(el){
  el.fn();
  return {name: el.name, dump: b.dump(true)};
}));
#>>
b.dump(true)
#>>
b
#>>
data
#>>
((low-_i)>>1)
#>>
var a1 = [1,2,3,4],
    a2 = 'a,b,c,d'.split(',');
a2.unshift.apply(a2,a1.splice(2))
a2
#>>
Math.log(10)
#>>
2+2
#>>
(function(){
    'use strict';
    console.log(JSON.parse)
})()
//JSON = {};
//(1,eval)('console.log(JSON.parse)');
#>>
window.constructor.JSON
#>>
(new Date().toJSON).call({})
#>>
({"JSON":"ro cks!"})
#>>
document.JSON

#>>
b.dump(true)
#>>
Meteor.userId()
#>>
Meteor.call('license.billing', Hosts.findOne()._id,function(){console.log(arguments)})
#>>
var possible = {
    r: ['g','b'],
    g: ['r','g','b'],
    b: ['r','g','b'],
    null: ['r','g','b']
};
var sum = function(a,b){return a+b};
var count = 0;
var takeNext = function(amount, current,seq){
    var next = possible[current];
    //console.log(next)
    
    if( amount.r === 0 && amount.g === 0 && amount.b === 0 ){
        //console.log(seq.join(''));
        return 1;
    }
    return next.map(function(el){
        var copy = Object.create(amount);
        if( !copy[el] ){
            return 0;
        }
        copy[el]--;
        var s = seq.slice();
        s.push(el);
        return takeNext(copy, el,s);
    }).reduce(sum);
};
takeNext({r: 5, g: 4, b: 4}, null,[])
