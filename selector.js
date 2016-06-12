/**
 * Created by Ivan on 5/18/2015.
 */

var fns = {
    gt: '>',
    lt: '<',
    eq: '==',
    gte: '>=',
    ge: '>=',
    lte: '<=',
    le: '<=',
    ne: '!=',
    'exist': function(val){
        return 'typeof '+val+'!== \'undefined\'';
    },
    'exists': function(val){
        return 'typeof '+val+'!== \'undefined\'';
    },
    'and': function(scope, val, soft){
        return '('+ val.map(function(el){
            return makeFn(el,soft,scope,true);
        }).join(' && ') +')';
    },
    'or': function(scope, val, soft){
        return '('+ val.map(function(el){
            return makeFn(el,soft,scope,true);
        }).join(' || ') +')';
    },
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
                }else if(typeof fn1 === 'function'){
                    rules.push(fn1(scope,val,soft))
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
    return code ? rules : new Function('el',fn);
}

new Array(10)
    .join(' ')
    .split('')
    .map(function(a,i){return {a:i}})
    .filter(makeFn({a:{$eq:5}}))

var fn = makeFn({a:{$gt:2},b:'123', c: {$and:[{$exists: 1},{x: {$gt: 1}}]}})
console.log(fn.toString());
fn({a:10,b:'123'})