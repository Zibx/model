/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * *
 */;
// Copyright by Ivan Kubota. 7/22/2015.
// Copyright Quokka inc 2016

module.exports = (function(){
    var sorting = {
        Number: function(a,b){return a-b;}
    };
    var Model = function(cfg, parent, relation){
        this.data = this.mappedData = cfg || {};
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
    var proto = Model.prototype = {
        get: function(name){
            var tokens, key, val;
            name += '';
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
                return this.data[name] || (this.ctx && this.ctx.get(name));
            }
        },
        push: function(val){
            this.set(this.data.length,val);
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
                //console.error(lastKey,node,name,val)
                node[lastKey] = val;
                this.emit('set', name, val, void 0)
            }else{
                if(oldValue !== val){
                    node[lastKey] = val;
                    this.emit('change', name, val, oldValue)
                }
            }
            return this;
        },
        extend: function (data) {
            return new ExtendedModel(data, this);
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
        sync: function(from, name){
            var _self = this, lng;
            if( name ){
                lng = name.length + 1;
                from.on('change', function(what, val, oldVal){
                    if(what.indexOf(name)===0)
                        what = what.substr(lng);
                    _self.set(what,val);
                    _self._sync();
                });
                from.on('set', function(what, val, oldVal){
                    if(what.indexOf(name)===0)
                        what = what.substr(lng);
                    //console.info(what)
                    _self.set(what,val);
                    _self._sync();
                });
            }else{
                from.on('change', function(what, val, oldVal){
                    _self.set(what,val);
                    _self._sync();
                });
                from.on('set', function(what, val, oldVal){
                    //console.info(what)
                    _self.set(what,val);
                    _self._sync();
                });
            }
        },
        _sync: function(){
            var data = this.data.slice();
            this.post.forEach(function(el){
                data = el.type.call(data, el.fn);
            });
            this.mappedData = data;
            
        },
        sort: function(fn){
            this.post.push({fn: fn || sorting.Number, type: Array.prototype.sort});
            
            //this._sync();
            
            return this;
        },
        // observe model events
        observe: function(event, fn){
            var listeners = this._listeners;
            (listeners[event] || (listeners[event] = [])).push(fn);
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
            var listeners = this._pathListeners, i;
            if(typeof path !== 'string')
                for(i = path.length; i;)
                    this.on(path[--i],fn,type);
            else
                (listeners[path] = listeners[path] || []).push({type: type, fn: fn});
        },
        un: function (path, fn, type) {
            var listeners = this._pathListeners, i;
            if(typeof path !== 'string')
                for(i = path.length; i;)
                    this.un(path[--i],fn,type);
            else
                listeners[path] = (listeners[path] || []).filter(function (el) {
                    return el.fn !== fn || el.type !== type;
                });
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
        },
        fire: function (type) { // cmps observer
            var listeners = this._listeners[type], _self = this, args = Array.prototype.slice.call(arguments,1);
            listeners && listeners.forEach(function (fn) { // dirty
                fn.apply(_self, args);
            });
        }
    };
    var ExtendedModel = function (data, parent) {
        Model.call(this, data);
        this._parent = parent;
    };
    ExtendedModel.prototype = Object.create(Model.prototype);
    ExtendedModel.prototype.get = function (name) {
        var my = proto.get.call(this, name);
        return my === false || my === 'false'? my : my || this._parent.get(name);
    };

    ExtendedModel.prototype.on = function (path, fn, type) {
        /* TODO rewrite this */
        this._parent.on(path, fn, type);
        return proto.on.call(this, path, fn, type);
    };
    var Factory = function Factory(cfg, parent, relation){
        return new Model(cfg, parent, relation);
    };
    return Factory;
})();
//console.clear();
/*
var tests = {
    sorted: function(){
        var items = M([5,1,2,3]);
        items.on('change', function(){
            console.log(arguments);
        });
        var sorted = items.link().sort().filter(function(el){return el%2;});
        items.set(1,20)
        items.set(4,21)
        console.log(items.mappedData)
        console.log(sorted.mappedData)
        items.set(1,21)
        console.log(items.mappedData)
        console.log(sorted.mappedData)
    },
    full: function(){  
        var model = M({a:1,b:2, items: [5,1,2,3]});
        model.on('change', function(){
            console.log(arguments);
        });
        var items = model.deep('items');
        var sortedItems = items.link().sort();
        sortedItems.filter(function(el){return el%2})
        sortedItems.map(function(el){ return el*2;})
        sortedItems.filter(function(el){return el<11})
        //sortedItems.on('set',function(){
            //console.log('!')
        //})
        console.log(items,items.get('1'))
        //console.log( model.get('items.1.3.2') );
        //console.log( model.get('items.1') );
        console.log( model.set('items.1',10) );
        //console.log( model.get('items.1') );
        items.set(1,20)
        for(var i = 0; i < 1000; i++)
        items.push(Math.random()*100|0)
        //items.set('c.ga.ga',3);
        //items.set('c.ga.ga',4);
        console.log( model.get('items.1') );
        console.log( model.get('items') );
        model.set('items.4', 21)
        console.log(sortedItems.data)
        console.log(sortedItems.mappedData)

    }
};


for( var i in tests ){
    console.log(i.toUpperCase().split('').join(' ')+'   T E S T');
    var t = +new Date();
    tests[i]()
    console.log('T I M E   T A K E N: '+(+new Date()-t))
}
*/