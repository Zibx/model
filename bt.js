var apply = function( o1, o2 ){
    for( var i in o2 )
        o1[i] = o2[i];
    return o1;
};
var LeafNode = function( order ){
    this.order = order;
    this.parentNode = null;
    this.nextNode = null;
    this.prevNode = null;
    this.data = [];
};

LeafNode.prototype = ({
    isLeafNode: true,
    isInternalNode: false,
    split: function(){
        var tmp = new LeafNode( this.order );
        var m = Math.ceil( this.data.length / 2 ),
            data = this.data;
        var k = data[m - 1].key;

        // Copy & shift data
        for( var i = 0; i < m; i++ ){
            tmp.data[i] = data.shift();
        }
        tmp.parentNode = this.parentNode;
        tmp.nextNode = this;
        tmp.prevNode = this.prevNode;
        if( tmp.prevNode ) tmp.prevNode.nextNode = tmp;
        this.prevNode = tmp;

        if( !this.parentNode ){
            var p = new InternalNode( this.order );
            this.parentNode = tmp.parentNode = p;
        }

        return this.parentNode.insert( k, tmp, this );
    },
    remove: function( key ){
        console.log('leaf remove')
        debugger;
        if( Math.ceil(this.data.length / 2+1)<Math.ceil(this.order/2) ){
            //remove leaf
            for( var i = 0; i< this.data.length; i+=2){
                if(this.data[i].key === key){
                    this.data.splice(i,1);
                    return true;
                }
            }
        }else{
            //reorder


        }
    },
    insert: function( key, value ){
        var pos = 0, data = this.data;
        for( ; pos < data.length; pos++ ){
            if( data[pos].key == key ){
                data[pos].value.push( value );
                return null;
            }
            if( data[pos].key > key ) break;
        }

        if( data[pos] ) data.splice( pos, 0, {"key": key, "value": [value]} );
        else data.push( {"key": key, "value": [value]} );

        // Split
        if( data.length > this.order ) return this.split();
        return null;
    }

});

var InternalNode = function( order ){
    this.order = order;
    this.parentNode = null;
    this.data = [];
};
InternalNode.prototype = ({
    isLeafNode: false,
    isInternalNode: true,
    split: function(){
        var m = null;
        if( this.order % 2 ){
            m = (this.data.length - 1) / 2 - 1;
        }else{
            m = (this.data.length - 1) / 2;
        }

        var tmp = new InternalNode( this.order );
        tmp.parentNode = this.parentNode;
        var i, _i, data = this.data, tmpData = tmp.data;

        for( i = 0; i < m; i++ ){
            tmpData[i] = data.shift();
        }
        _i = tmpData.length;
        for( i = 0; i < _i; i += 2 ){
            tmpData[i].parentNode = tmp;
        }
        var key = this.data.shift();

        if( !this.parentNode ){
            this.parentNode = tmp.parentNode = new InternalNode( this.order );
        }

        return this.parentNode.insert( key, tmp, this );
    },

    insert: function( key, node1, node2 ){
        var data = this.data,
            order = this.order,
            length;
        if( data.length ){
            var pos = 1;
            length = data.length;
            for( ; pos < length; pos += 2 ){
                if( data[pos] > key ) break;
            }

            if( data[pos] ){
                pos--;
                data.splice( pos, 0, node1, key );
            }else{
                data[pos - 1] = node1;
                data.push( key );
                data.push( node2 );
            }

            if( data.length > (order * 2 + 1) ){
                return this.split();
            }
            return null;
        }else{
            data[0] = node1;
            data[1] = key;
            data[2] = node2;
            return this;
        }
    }

});


var BPlusTree = function( options ){
    apply( this, options );
    this.root = new LeafNode( this.order );
};
BPlusTree.prototype = {
    order: 2, // Min 1
    getter: function( value ){
        return value;
    },
    compare: function(a,b){return a-b;},
    insert: function( value ){
        var key = this.getter(value);
        var node = this._search( key );
        var ret = node.insert( key, value );
        if( ret ) this.root = ret;
    },

    find: function( key ){
        var node = this._search( key ),
            _i = node.data.length, data = node.data;
        for( var i = 0; i < _i; i++ ){
            if( data[i].key == key ) return data[i].value;
        }
        return null;
    },

    getNode: function( key ){
        return this._search( key );
    },
    remove: function( val ){ // remove by value
        var key = this.getter(val);
        var node = this._search( key ), _i = node.data.length, data = node.data,
            subData, subIndex,
            order = this.order;
        for( var i = 0; i < _i; i++ ){

            if( data[i].key == key ){
                subData = data[i];
                if( (subIndex = subData.value.indexOf(val)) > -1 ){
                    subData.value.splice(subIndex, 1);
                    if( !subData.value.length ){ // delete node
                        node.remove(key);
                    }
                }else{
                    return null;
                }
            }
        }

    },
    _search: function( key ){
        var current = this.root;
        var found = false,
            compare = this.compare;

        while( current.isInternalNode ){
            found = false;
            var data = current.data,
                len = data.length;
            for( var i = 1; i < len; i += 2 ){
                if( compare(key, data[i]) < 1 ){
                    current = data[i - 1];
                    found = true;
                    break;
                }
            }

            // Follow infinity pointer
            if( !found ){
                current = data[len - 1];
            }
        }

        return current;
    }
};