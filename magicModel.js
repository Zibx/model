
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
        this.post = [];
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
        push: function(val){
            this.set(this.data.length,val);
        },
        set: function(name, val){
            //console.warn(name)
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
                        console.log(node)
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
                this.fire('set', lastKey, val, void 0);
            }else{
                if(oldValue !== val){
                    node[lastKey] = val;
                    this.fire('change', name, val, oldValue)
                }
            }
        },
        deep: function(name){
            var link = Factory(this.get(name), this, name);
            link.sync(this, name)
            return link;
        },
        link: function(){
            var link = Factory(this.data.slice());
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
        filter: function(fn){
            this.post.push({fn: fn || filter.true, type: Array.prototype.filter});
            return this;
        },
        map: function(fn){
            this.post.push({fn: fn || filter.true, type: Array.prototype.map});
            return this;
        },
        on: function(event, fn){
            var listeners = this._listeners;
            listeners[event].push(fn);
            
        },
        fire: function(type, what, val, oldVal){
            var listeners = this._listeners[type], i, _i;
            for( i = 0, _i = listeners.length; i < _i; i++ )
                listeners[i].call(this,what,val,oldVal)
            
            if( this.relation )
                this.parent.fire(type, this.relation+what, val, oldVal);
            else if(this.parent)
                this.parent.fire(type, what, val, oldVal);
            //console.warn(arguments)
        }
    };
    var Factory = function Factory(cfg, parent, relation){
        return new Model(cfg, parent, relation);
    };
    return Factory;
})();
//console.clear();

var tests = {
    sorted: function(){
        var items = M([5,1,2,3]);
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
/*

for( var i in tests ){
    console.log(i.toUpperCase().split('').join(' ')+'   T E S T');
    var t = +new Date();
    tests[i]()
    console.log('T I M E   T A K E N: '+(+new Date()-t))
}*/
