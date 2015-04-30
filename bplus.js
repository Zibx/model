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
        console.log('insert', value)
        var key = this.getter(value);
        var node = this._search( key );
        console.log('insert node:', d(node))
        var ret = node.insert( key, value );
        if( ret ) this.root = ret;
        this.test()
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
        console.log('remove');
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
                        res = node.remove(key);
                        if(res instanceof this.InternalNode || res instanceof this.LeafNode)
                            this.root = res;
                        this.test()
                        return true;
                    }
                    this.test()
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
    },
    test: function (el) {
        if (!(el instanceof this.InternalNode) && !(el instanceof this.LeafNode) ) {
            el = this.root;
        }
        var el0 = el;
        el.links && (el.links.map(function (el) {
            if( el.parentNode && el.parentNode !== el0 )
                console.log('parent node is not a parent',d(el), '->', d(el0));
            if( el.nextNode && el.nextNode.prevNode !== el )
                console.log('next node is a shit',d(el), '->', d(el.nextNode), '<-', d(el.nextNode.prevNode));
            if( el.prevNode && el.prevNode.nextNode !== el )
                console.log('prevnode is a shit',d(el), '->', d(el.prevNode), '<-', d(el.prevNode.nextNode));
           this.test.call(this,el);
        }.bind(this)));
    }
};
var LeafNode = function(){
    this.data = [];
};
LeafNode.prototype = {
    leaf: true,
    set: function( key, value ){
        this.insert(key,value);
    },
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
        console.log('leaf insert', data.map(dataMap), this);
        if( data.length > this.order)
            return this.split();
    },
    split: function(){
        console.log('leaf split', d(this));
        var tmp = new this.LeafNode(),
            data = this.data,
            median = Math.floor( data.length / 2 ),
            centerNode = data[median];

        tmp.data = data.splice(0,median);
        data.splice(0,1);
        tmp.parentNode = this.parentNode;
        tmp.nextNode = this;
        tmp.prevNode = this.prevNode;
        if( tmp.prevNode )
            tmp.prevNode.nextNode = tmp;
        this.prevNode = tmp;

        if( !this.parentNode ){
            var p = new this.InternalNode();
            this.parentNode = tmp.parentNode = p;
        }

        return this.parentNode.insert( centerNode, tmp, this );
    },
    balance: function(  ){
        console.log('leaf balance', d(this));
        var order = this.order,
            median = Math.floor(order/2 ),
            parent = this.parentNode;
        if( this.data.length < median ){
            debugger;
            if(this.nextNode && this.nextNode.data.length > median){
                this.data.push(parent.data.shift());
                parent.data.unshift(this.nextNode.data.shift());
            }else if(this.prevNode && this.prevNode.data.length > median){
                this.data.unshift(parent.data.pop());
                parent.data.push(this.prevNode.data.pop());
            }else{
                if( this.nextNode && this.nextNode.data.length){
                    console.log('leaf balance kill nextNode', d(this), d(this.nextNode), parent && d(parent));
                    this.data = [parent.data.shift()].concat(this.nextNode.data);
                    parent.links.splice(parent.links.indexOf(this.nextNode),1);
                    if(this.nextNode = this.nextNode.nextNode)
                        this.nextNode.prevNode = this;
                    console.log('leaf balance after kill nextNode', d(this), d(this.nextNode), parent && d(parent));
                    return this.parentNode = parent.balance();
                }else if(this.prevNode && this.prevNode.data.length){
                    console.log('leaf balance kill prevNode', d(this), d(this.prevNode), parent && d(parent));
                    this.data = this.prevNode.data.concat(parent.data.pop());
                    parent.links.splice(parent.links.indexOf(this.prevNode),1);
                    if( this.prevNode = this.prevNode.prevNode)
                        this.prevNode.nextNode = this;
                    console.log('leaf balance after kill prevNode', d(this), d(this.nextNode), parent && d(parent));
                    return parent.balance();
                }
            }
        }
    },
    remove: function( key ){
        var data = this.data, i, _i = data.length;
        for( i = 0; i < _i; i++ ){
            if( data[i].key == key ){
                data.splice(i,1);
                console.log('leaf remove', key, d(this));
                var res = this.balance();

                return res;
            }
        }
    },
    merge: function( right ){
        this.data = this.data.concat(right.data);
        this.nextNode = right.nextNode;
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
        console.log('int balance', d(this));
        var data = this.data,
            order = this.order,
            median = Math.floor(order/2 ),
            parent = this.parentNode,
            i,_i, links;
        //if(!parent)
        //    return this.links[0];
        if(data.length<median){

            if(this.nextNode && this.nextNode.data.length > median){
                this.data.push(parent.data.shift());
                parent.data.unshift(this.nextNode.data.shift());
            }else if(this.prevNode && this.prevNode.data.length > median){
                this.data.unshift(parent.data.pop());
                parent.data.push(this.prevNode.data.pop());
            }else{
                if( this.nextNode ){
                    console.log('int balance nextNode', d(this), d(parent), d(this.nextNode));
                    this.data = [parent.data.shift()].concat(this.nextNode.data);
                    this.links = this.links.concat(this.nextNode.links);
                    links = this.nextNode.links;
                    for( i = 0, _i = links.length; i < _i; i++ )
                        links[i].parentNode = this;
                    parent.links.splice(parent.links.indexOf(this.nextNode),1);
                    this.nextNode = this.nextNode.nextNode;
                    console.log('int balance nextNode', d(this), d(parent), d(this.nextNode));
                    return parent.balance();
                }else if( this.prevNode){
                    console.log('int balance prevNode', d(this), d(parent), d(this.prevNode));
                    this.data = this.prevNode.data.concat(parent.data.pop());
                    this.links = this.prevNode.links.concat(this.links);
                    links = this.prevNode.links;
                    for( i = 0, _i = links.length; i < _i; i++ )
                        links[i].parentNode = this;
                    parent.links.splice(parent.links.indexOf(this.prevNode),1);
                    this.prevNode = this.prevNode.prevNode;
                    console.log('int after balance prevNode', d(this), d(parent), d(this.prevNode));
                    return parent.balance();
                }else if(this.data.length === 0){
                    return this.links[0];
                }
            }
            /*if(parent.parentNode)
                parent.parentNode.links.splice(parent.parentNode.links.indexOf(parent),1,this);
            else
                return this;*/
        }
        parent && parent.balance();

    },
    split: function(  ){
        console.log('int split', d(this));
        var order = this.order;
        var median = Math.floor( this.data.length / 2 );

        var tmp = new this.InternalNode();
        tmp.parentNode = this.parentNode;
        var i, _i, data = this.data,
            links = this.links,
            tmpData = tmp.data,
            tmpLinks = tmp.links,
            node = data[median];

        for( i = 0; i < median; i++ ){
            tmpData[i] = data[i];
            tmpLinks[i] = links[i];
        }
        tmpLinks[i] = links[i];
        i++;
        data.splice(0,i);
        links.splice(0,i);

        for( i = 0, _i = tmpLinks.length; i < _i; i ++ ){
            tmpLinks[i].parentNode = tmp;
        }


        if( !this.parentNode ){
            this.parentNode = tmp.parentNode = new this.InternalNode();
        }
        tmp.nextNode = this;
        if(tmp.prevNode = this.prevNode)
            tmp.prevNode.nextNode = tmp;

        this.prevNode = tmp;
        return this.parentNode.insert( node, tmp, this );
    },
    insert: function( node, node1, node2 ){
        console.log('int insert', node, node1, node2);
        var data = this.data,
            key = node.key,
            links = this.links,
            order = this.order,
            i, _i,
            compare = this.compare,
            cmp;
        if(arguments.length === 2){
            key = node;
        }
        if( data.length ){

            for( i = 0, _i = data.length; i < _i; i++ ){
                cmp = compare(data[i].key, key);
                if( cmp === 0){
                    data[i].val.push( node1 );
                    return;
                }
                if( cmp > 0 ) break;
            }

            if( data[i] ){
                data.splice( i, 0, node );
                links.splice( i, 0, node1 );
            }else{
                links[i] = node1;
                links.push( node2 );
                data.push( node );
            }

            if( data.length > order ){
                return this.split();
            }
            return null;
        }else{
            this.data[0] = node;
            this.links = [node1, node2];
            return this;
        }
    },
    merge: function( right, separator ){
        var el;
        separator && this.data.push(separator);
        while(el = right.data.shift())
            this.data.push(el);
        while(el = right.links.shift())
            this.links.push(el);
    },
    remove: function( key ){
        var data = this.data,
            links = this.links,
            order = this.order,
            median = Math.floor(order / 2 ),
            i, _i, l1, l2,
            compare = this.compare, parent;

        for( i = 0, _i = data.length; i < _i; i++ ){
            if( compare(data[i].key, key) === 0 ){
                l1 = links[i].data.length;
                l2 = links[i+1].data.length;
                if( l1 > median){
                    data[i] = links[i].data.pop();
                }else if(l2 > median){
                    data[i] = links[i+1].data.shift();
                }else{

                    links[i].merge(links[i+1]);
                    data[i] = links[i].data.pop();
                    var r = this.balance();
                    links[i].balance();
                    return r;


                    /*console.log('int remove херота', this);

                    data.splice(i,1);
                    if( l1 + l2 <= order )
                        links[i].merge(links[i+1]);
                    links.splice(i+1,1)

                    //debugger;
                    if(data.length < median){
                        return this.balance();
                    }*/
                }
                //parent = this.parentNode;

                if( data.length === 0 ){
                    //parent.links.splice(parent.links.indexOf(this),1);
                }
                return;
            }
        }
    },
    tryCollapse: function(){
        var order = this.order;
        var median = Math.floor(order / 2 ),
            sum = this.data.length, links = this.links, i, _i, first = links[0],
            tmpData, tmpLinks;
        for( i = 0, _i = links.length; i < _i; i++ )
            sum+=links[i].data.length;
        if( sum <= order ){
            tmpData = []; tmpLinks = [];
            for( i = 0; i < _i; i++ ){
                tmpData = tmpData.concat( links[i].data );
                tmpLinks = tmpLinks.concat( links[i].links );
                tmpData.push(this.data[i]);
            }
            this.data = tmpData;
            this.links = tmpLinks;
            return true;
        }
        return false;
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