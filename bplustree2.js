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
    this.root.root = true;
};
BPlusTree.prototype = {
    order: 3,
    internal: true,
    get: function (key) {
        var node = this._search(key);
        var data = node.data,i = data.length;
        for(;i;)
            if(data[--i].key == key)
                return data[i].val;
        return false;
    },
    getOne: function (key) {
        var val = this.get(key);
        return val === false ? false : val[0];
    },
    initNodes: function(  ){

        this.LeafNode = function(){LeafNode.call(this);};
        this.InternalNode = function(){InternalNode.call(this)};
        this.low = Math.floor(this.order/2);
        this.LeafNode.prototype = apply({
            order: this.order,
            low: this.low,
            compare: this.compare,
            LeafNode: this.LeafNode,
            InternalNode: this.InternalNode,
            root: false
        }, LeafNode.prototype);

        this.InternalNode.prototype = apply({
            order: this.order,
            low: this.low,
            compare: this.compare,
            LeafNode: this.LeafNode,
            InternalNode: this.InternalNode,
            root: false
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
        var node = this._search(key);
        this.root = node.insert(key, value) || this.root;
        this.check();
    },
    _search: function( key ){
        var node = this.root, found,
            keys,
            i, _i, compare = this.compare, cmp;
        while( node.internal ){
            found = false;
            keys = node.keys;
            for( i = 0, _i = keys.length; i < _i; i++ ){
                cmp = compare(key, keys[i]);
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
        return false;
    },
    check: function () {
        var nodes = [this.root], node;
        while(nodes.length){
            node = nodes.shift();
            if(node.leaf){

            }else{
                if(node.links.filter(function (el) {
                    return el.parentNode !== node;
                }).length)
                    throw new Error('someshit');
                nodes.push.apply(nodes,node.links);
            }
        }
    },
    dump: function (el) {
        var out = {}, stringify;
        if (!(el instanceof this.InternalNode) && !(el instanceof this.LeafNode) ) {
            stringify = el;
            el = this.root;
        }
        out.data = el.keys || el.data.map(function (el) {
            return el.key;
        }).join(', ');
        el.links && (out.links = el.links.map(this.dump.bind(this)));
        return stringify ? JSON.stringify(out, null, 2) : out;
    }
};
var LeafNode = function(){
    this.data = [];
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
    split: function(){
        var tmp = new this.LeafNode(),
            data = this.data,
            median = Math.floor(data.length/2),
            centerNode = data[median+1].key;
        tmp.data = data.splice(0,median+1);
        tmp.nextNode = this;
        tmp.prevNode = this.prevNode;
        if( tmp.prevNode )
            tmp.prevNode.nextNode = tmp;
        this.prevNode = tmp;
        this.root = false;
        return (this.parentNode = tmp.parentNode = this.parentNode || new this.InternalNode()).insert(centerNode, tmp, this);
    },
    remove: function (key) {
        var i, _i, data = this.data, compare = this.compare,
            obj, cmp, found = false,
            low, node, rightKey, firstKey,
            neighborL, neighborR, items;
        for( i = 0, _i = data.length; i < _i; i++ ){
            cmp = compare(data[i].key, key);
            if( cmp === 0 ){
                found = true;
                break;
            }
        }
        if( !found )
            return false;
        data.splice(i,1);

        low = this.low;

        if(data.length>=low) {
            if(i>0)
                return;
            node = this;
            firstKey = this.data[0].key;
            while(node = node.parentNode){
                if ((_i = node.keys.indexOf(key) ) > -1)
                    node.keys[_i] = firstKey;
            }
            return ;
        }
        // less
        if(this.root){
            // collapse root
            return ;
        }
        if( (neighborL = this.prevNode) && (_i = neighborL.data.length) > low){
            // borrow left
            data.unshift.apply(
                data,
                neighborL.data.splice(low+((_i - low)>>1))
            );
            node = this;
            firstKey = this.data[0].key;
            while(node = node.parentNode){
                if ((_i = node.keys.indexOf(key) ) > -1)
                    node.keys[_i] = firstKey;
            }

            return ;
        }

        if( (neighborR = this.nextNode) && (_i = neighborR.data.length) > low){
            // borrow right
            key = neighborR.data[0].key;
            data.push.apply(
                data,
                neighborR.data.splice(0,low-((_i - low)>>1))
            );
            //debugger;
            node = neighborR;
            rightKey = neighborR.data[0].key;
            while(node = node.parentNode){
                if ((_i = node.keys.indexOf(key) ) > -1)
                    node.keys[_i] = rightKey;
            }
            return ;
        }

        // merge
        if(neighborL){
            // left
            key = i === 0 ? key : this.data[0].key;
            node = neighborL.merge(
                this,
                this.parentNode,
                key
            );
        }else{
            // right
            key = neighborR.data[0].key
            node = this.merge(neighborR, this.parentNode, key)
        }
        if(this.parentNode.root && !this.parentNode.keys.length){
            return node;
        }
        //debugger;
        node = this;
        var parent;

        while(node = node.parentNode){
            neighborR = false;
            neighborL = false;
            parent = node.parentNode;

            if( node.keys.length < low ){

                i = Math.max(parent.keys.indexOf(key),0);
                neighborR = i === parent.keys.length ? false : parent.links[i+1];
                if(neighborR!== false && neighborR.keys.length > low){
                    node.keys.push(parent.keys.splice(i,1,node.shift()));
                    node.links.push(neighborR.links.shift());
                    break;
                }
                neighborL = i === 0 ? false :parent.links[i-1];
                if(neighborL!== false && neighborL.keys.length > low){
                    node.unshift(parent.keys.splice(i-1,1,neighborL.keys.pop()));
                    node.links.unshift(neighborL.links.pop());
                    break;
                }
                if(neighborL!== false){
                    key = neighborL.merge(node,parent,i-1);
                    node = neighborL;
                }else if(neighborR!==false){
                    key = node.merge(neighborR,parent,i);
                }
            }
            if(parent && !parent.keys.length && !parent.parentNode){
                return node;
            }


        }
    },
    merge: function (what, parent, key) {
        console.log('merge', key)
        var i, _i, keys = parent.keys;
        this.data = this.data.concat.apply(this.data,what.data);
        if(this.nextNode = what.nextNode)
            what.prevNode = this;
        i = keys.indexOf(key);
        keys.splice(i,1);
        parent.links.splice(i+1,1);
        return this;
    }
};
var InternalNode = function(){
    this.keys = [];
    this.links = [];
};
var push = Array.prototype.push;
InternalNode.prototype = {
    internal: true,
    leaf: false,
    merge: function (node, parent, i) {
        var key = parent.keys[i];
        this.keys.push(key);
        push.apply(this.keys, node.keys);
        push.apply(this.links, node.links);
        parent.keys.splice(i,1);
        parent.links.splice(i+1,1);
        //parent.keys.pop();
        //parent.links.pop();
        return key;
    },
    split: function () {

        var tmp = new this.InternalNode(),
            keys = this.keys,
            median = Math.floor(keys.length/2),
            centerNode = keys[median], i, links;

        tmp.links = this.links.splice(0,median+1);
        tmp.keys = keys.splice(0,median);
        keys.shift();

        // fix links
        links = tmp.links;
        for(i=links.length;i;)
            links[--i].parentNode = tmp;


        return (this.parentNode = tmp.parentNode = this.parentNode || new this.InternalNode()).insert(centerNode, tmp, this);
    },
    insert: function( key, leftNode, rightNode ){
        var keys = this.keys,
            links = this.links,
            order = this.order,
            i, _i,
            compare = this.compare,
            cmp;
        if( keys.length ){

            for( i = 0, _i = keys.length; i < _i; i++ ){
                cmp = compare(keys[i], key);
                if( cmp === 0){
                    keys[i].val.push( leftNode );
                    return;
                }
                if( cmp > 0 ) break;
            }

            if( keys[i] ){
                keys.splice( i, 0, key );
                links.splice( i, 0, leftNode );
            }else{
                links[i] = leftNode;
                links[i+1] = rightNode;
                keys.push( key );
            }

            if( keys.length > order ){
                return this.split();
            }
            return;
        }else{
            this.keys[0] = key;
            this.links = [leftNode, rightNode];
            return this;
        }
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