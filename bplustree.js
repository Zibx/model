/**
 * Created by Namia on 16.03.15.
 */
var dataMap = function(el){return el.key},
    d = function (n) {
        return n && n.data && n.data.map(dataMap);
    };
var apply = function( o1, o2 ){
    for( var i in o2 )
        o1[i] = o2[i];
    return o1;
};
var BPlusTree = function( cfg ){
    apply( this, cfg );
    this.initNodes();
    this.root = new this.LeafNode();
};
BPlusTree.prototype = {
    order: 3,
    internal: true,
    initNodes: function(  ){

        this.LeafNode = function(){LeafNode.call(this);};
        this.InternalNode = function(){InternalNode.call(this)};

        this.LeafNode.prototype = apply({
            order: this.order,
            compare: this.compare,
            LeafNode: this.LeafNode,
            InternalNode: this.InternalNode
        }, LeafNode.prototype);

        this.InternalNode.prototype = apply({
            order: this.order,
            compare: this.compare,
            LeafNode: this.LeafNode,
            InternalNode: this.InternalNode
        }, InternalNode.prototype);
    },
    getter: function( value ){
        return value;
    },
    compare: function( a, b ){
        return a - b;
    },
    insert: function( value ){
        var key = this.getter(value);
        var node = this._search(value);
        this.root = node.insert(key, value) || this.root;
    },
    _search: function( key ){
        var node = this.root, found,
            data,
            i, _i, compare = this.compare, cmp;
        while( node.internal ){
            found = false;
            data = node.data;
            for( i = 0, _i = data.length; i < _i; i++ ){
                cmp = compare(key, data[i].key);
                if(cmp === 0)
                    return node;
                if( cmp < 0){
                    node = node.links[i];
                    found = true;
                    break;
                }
            }
            if( !found )
                node = node.links[i];
        }
        return node;
    },
    remove: function( val ){
        var key = this.getter(val);
        var node = this._search( key ),
            data = node.data,
            i, _i = data.length,
            subData, subIndex,
            compare = this.compare, res;
        for( i = 0; i < _i; i++ ){
            if( compare(data[i].key, key) === 0 ){
                subData = data[i];
                if( (subIndex = subData.val.indexOf(val)) >= 0 ){
                    subData.val.splice(subIndex, 1);
                    if( !subData.val.length ){ // delete node
                        this.root = (res = node.remove(key)) || this.root;
                        return true;
                    }
                    return true;
                }else{
                    return false;
                }
            }
        }
    },
    dump: function (el) {
        var out = {}, stringify;
        if (!(el instanceof this.InternalNode) && !(el instanceof this.LeafNode) ) {
            stringify = el;
            el = this.root;
        }
        out.data = el.data.map(function (el) {
            return el.key;
        }).join(', ');
        el.links && (out.links = el.links.map(this.dump.bind(this)));
        return stringify ? JSON.stringify(out, null, 2) : out;
    }
};
var LeafNode = function(){
    this.data = [];
};
var splitFn = function(){
    var tmp = new this[this.leaf?'LeafNode':'InternalNode'](),
        data = this.data,
        median = Math.floor(data.length/2),
        centerNode = data[median];
    tmp.data = data.splice(0,median);
    data.splice(0,1);
    tmp.parentNode = this.parentNode;
    tmp.nextNode = this;
    tmp.prevNode = this.prevNode;
    if(tmp.links)
        tmp.links = this.links.splice(0,median+1);
    if( tmp.prevNode )
        tmp.prevNode.nextNode = tmp;
    this.prevNode = tmp;
    return (this.parentNode = tmp.parentNode = this.parentNode || new this.InternalNode()).insert(centerNode, tmp, this);
};
LeafNode.prototype = {
    leaf: true,
    insert: function( key, value ){
        var i, _i, data = this.data, compare = this.compare, obj, cmp;
        for( i = 0, _i = data.length; i < _i; i++ ){
            cmp = compare(data[i].key, key);
            if( cmp === 0 ){
                data[i].val.push(value);
                return;
            }
            if( cmp > 0 )break;
        }
        obj = {key: key, val: [value]};
        if( data[i] )
            data.splice(i,0,obj);
        else
            data.push(obj);

        if( data.length > this.order)
            return this.split();
    },
    split: splitFn,
    balance: function( key ){
        var parent = this.parentNode;
        if(!parent)
            return;
        this.prevNode && (this.prevNode.nextNode = this.nextNode);
        this.nextNode && (this.nextNode.prevNode = this.prevNode);
        var i, _i, data = parent.data,
            compare = this.compare;
        for( i = 0, _i = data.length; i < _i; i++ ){
            if( compare(data[i].key, key) > 0 )break;
        }
        _i--;
        if(i===0){
            var first = this.nextNode.data[0];
            this.nextNode.remove(first.key);
            parent.links.splice(i,1);
            parent.insert(first.key,first.val);
        }else if(i<_i){

        }
    },
    remove: function( key ){ // value!
        var data = this.data, i, _i = data.length;
        for( i = 0; i < _i; i++ ){
            if( data[i].key == key ){
                data.splice(i,1);

                return data.length === 0 && this.balance(key);
            }
        }
    },
    merge: function( right ){
    }
};
var InternalNode = function( order ){
    this.data = [];
    this.links = [];
};
InternalNode.prototype = {
    internal: true,
    leaf: false,
    balance: function(  ){
    },
    split: splitFn,
    insert: function( centerNode, leftNode, rightNode ){
        var data = this.data,
            key = centerNode.key,
            links = this.links,
            order = this.order,
            i, _i,
            compare = this.compare,
            cmp;
        if(arguments.length === 2){
            key = centerNode;
        }
        if( data.length ){

            for( i = 0, _i = data.length; i < _i; i++ ){
                cmp = compare(data[i].key, key);
                if( cmp === 0){
                    data[i].val.push( leftNode );
                    return;
                }
                if( cmp > 0 ) break;
            }

            if( data[i] ){
                data.splice( i, 0, centerNode );
                links.splice( i, 0, leftNode );
            }else{
                links[i] = leftNode;
                links[i+1] = rightNode;
                data.push( centerNode );
            }

            if( data.length > order ){
                return this.split();
            }
            return;
        }else{
            this.data[0] = centerNode;
            this.links = [leftNode, rightNode];
            return this;
        }
    },
    merge: function( right, separator ){
    },
    remove: function( key ){
    },
    tryCollapse: function(){
    }
};
/*
var draw = function(){
    var i = 0, _i = Math.max(this.data.length, this.links?this.links.length:0),
        res = [];
    for(;i < _i;i++){
        if( this.links && this.links[i] ){
            res.push(draw.call(this.links[i]));
        }
        this.data[i] && res.push(this.data[i].key + ': '+ this.data[i].val.map(JSON.stringify).join(', '))
    }
    return res
}

var dm = function(el){return {key:el,val:[el]}};
 b = new BPlusTree({order:5, compare: function(a,b){return a<b?-1:a>b?1:0}});
 b.root = new b.InternalNode();
 b.root.data = ['P'].map(dm);
 b.root.links = [new b.InternalNode(),new b.InternalNode()];
 b.root.links[0].parentNode = b.root;
 b.root.links[0].data = ['C','G','M'].map(dm);
 b.root.links[1].parentNode = b.root;
 b.root.links[1].data = ['T','X'].map(dm);

['AB','DEF','JKL','NO'].forEach(function(el,i){
    b.root.links[0].links[i] = new b.LeafNode()
    b.root.links[0].links[i].data = el.split('').map(dm);
    b.root.links[0].links[i].parentNode = b.root.links[0];
});

['QRS','UV','YZ'].forEach(function(el,i){
    b.root.links[1].links[i] = new b.LeafNode()
    b.root.links[1].links[i].data = el.split('').map(dm);
    b.root.links[1].links[i].parentNode = b.root.links[1];
});
b.root.links[0].links.concat(b.root.links[1].links).forEach(function(el,i,g){
    if(i-1>-1)g[i-1].nextNode = g;
    if(i+1<g.length)
    g[i+1].prevNode = g;
})
b.root.links[0].nextNode = b.root.links[1];
b.root.links[1].prevNode = b.root.links[0];

b.remove('F')
b.remove('M')
b.remove('G')
//b.remove('D')

console.log(JSON.stringify(draw.call(b.root),null,2))
b.root
 */


console.table2 = function(el,el2){
    var title;
    if(typeof el === 'string'){
      title = el;
      el = el2;
    }
    var out = {}, cols = [], colsHash = {};
    el.map(function(el, i){
        for( var j in el ){
            if(!colsHash[j]){
                out[j] = [];
                colsHash[j] = {w:0}
                cols.push(j);
            }
            out[j][i] = el[j];
        }
    });
    var res = [], line;
    var pad = function(text, length, symbol, align){
        return text + new Array(length - text.length + 1).join(symbol || ' ');
    };
    for( var i = 0, _i = cols.map(function(name){return out[name].length}).reduce(function(a,b){return Math.max(a,b)},0); i < _i; i++){
        line = {items: [], h:0};
        for( var j = 0; j < cols.length; j++ ){
            var col = cols[j],
                item = out[col][i],
                splited = item.split('\n');
            line.h = Math.max(line.h, splited.length);
            colsHash[col].w = splited.reduce(function(a, b){
                return Math.max(a, b.length)
            }, colsHash[col].w);
            line.items.push(splited)
        }
        res.push(line)
    }
    var out = [], splitter;

    out.push( cols.map(function(col){
        return pad(col, colsHash[col].w);
    }).join(' | '));
    out.push( splitter = cols.map(function(col){
        return pad('', colsHash[col].w,'-');
    }).join('-|-'));

    for( var i = 0; i < res.length; i++ ){
        var r = res[i];

        for( var j = 0; j < r.h; j++){
            line = [];
            for( var k = 0; k < cols.length; k++ ){
                line.push(pad(r.items[k][j]||'', colsHash[cols[k]].w));
            }
            out.push(line.join(' | '));
        }
        out.push( splitter );
    }
    console.log(out.join('\n'))
}