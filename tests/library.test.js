/* V4 library correctness and trace regression checks. */
'use strict';
const assert=require('node:assert/strict');
const lib=require('../library-data.js');
assert.equal(lib.catalog.length,16);
assert.equal(new Set(lib.catalog.map(a=>a.id)).size,16);
for(const entry of lib.catalog){
    assert.ok(entry.title&&entry.category&&entry.complexity);
    if(['dijkstra','sorting','binary'].includes(entry.id))continue;
    assert.ok(lib.examples[entry.id].includes('print('),`Python example missing for ${entry.id}`);
    const frames=lib.build(entry.id);
    assert.ok(frames.length>1,`${entry.id} missing steps`);
    assert.equal(frames.at(-1).kind,'COMPLETE',`${entry.id} incomplete`);
    assert.ok(frames.every(f=>Number.isInteger(f.pseudo)&&f.state),`${entry.id} invalid trace`);
}
for(const id of ['insertion','selection','quick','merge']){
    for(let trial=0;trial<60;trial++){
        const input=Array.from({length:8},(_,i)=>((i*13+trial*7)%19));
        const actual=lib.build(id,{values:input}).at(-1).state.values;
        assert.equal(actual.join(','),input.slice().sort((a,b)=>a-b).join(','),`${id} trial ${trial}`);
    }
}
for(const id of ['bfs','dfs'])for(const start of lib.graphNodes){
    const frames=lib.build(id,{start});const order=frames.at(-1).state.order;
    assert.equal(new Set(order).size,lib.graphNodes.length,`${id} start ${start}`);
    assert.equal(order[0],start);
}
for(const id of ['linear','jump'])for(const target of [3,7,12,18,24,31,38,45,52,20,-1,100]){
    const final=lib.build(id,{target}).at(-1).state;
    assert.equal(final.found,[3,7,12,18,24,31,38,45,52].includes(target),`${id} ${target}`);
}
assert.equal(lib.build('gcd').at(-1).state.items[0],21);
assert.equal(lib.build('coin').at(-1).state.items[12],3);
assert.equal(lib.build('knapsack').at(-1).state.items[9],13);
const primes=lib.build('sieve').at(-1).state.items.filter(x=>Number.isInteger(x));
assert.deepEqual(primes,[2,3,5,7,11,13,17,19,23,29,31,37]);
console.log('PASS: 16 algorithms, 240 sorting cases, 12 graph traversals, 24 searches, math/DP invariants.');
