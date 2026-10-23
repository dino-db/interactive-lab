/* BETA regression tests for Algorithm Lab. Run: node tests/algorithms.test.js */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
let source = fs.readFileSync(path.join(__dirname, '..', 'algorithms.js'), 'utf8');
const cut = source.indexOf("    $('nav-code').addEventListener");
assert.ok(cut > 0, 'Algorithm code entry point missing');
source = source.slice(0, cut) + `
    globalThis.__test = {buildDijkstra,buildSorting,buildBinary,pythonCode,edges,nodes,
      setAlgorithm:n=>algorithm=n,setStart:n=>start=n,setEnd:n=>end=n,
      setTarget:n=>target=n,setSortingValues:a=>sortingValues=a};
})();`;
const sandbox = {window: {PDBPlayground:{}, PDBLibrary:require('../library-data.js')}, document: {}, Math, Set, Number, Object, Array, JSON};
vm.runInNewContext(source, sandbox, {filename:'algorithms.js'});
const t = sandbox.__test;
const shortest = (start,end) => {
    const distances=Object.fromEntries(t.nodes.map(n=>[n,Infinity]));
    const visited=new Set();distances[start]=0;
    while(visited.size<t.nodes.length) {
        const u=t.nodes.filter(n=>!visited.has(n)).sort((a,b)=>distances[a]-distances[b])[0];
        if(!u||!Number.isFinite(distances[u]))break;
        visited.add(u);
        for(const [a,b,w] of t.edges) {
            if(a===u)distances[b]=Math.min(distances[b],distances[u]+w);
            if(b===u)distances[a]=Math.min(distances[a],distances[u]+w);
        }
    }
    return distances[end];
};
for(const start of t.nodes)for(const end of t.nodes) {
    t.setStart(start);t.setEnd(end);
    const frames=t.buildDijkstra();
    assert.equal(frames.at(-1).state.dist[end],shortest(start,end),`Dijkstra ${start}->${end}`);
    assert.equal(frames.at(-1).kind,'COMPLETE');
}
for(let trial=0;trial<30;trial++) {
    const a=Array.from({length:8},(_,i)=>(trial*13+i*17)%51+1);
    t.setSortingValues(a);
    const result=t.buildSorting().at(-1).state.values;
    assert.equal(result.join(','),a.sort((x,y)=>x-y).join(','));
}
for(const n of [3,7,12,18,20,24,31,38,45,52,100]) {
    t.setTarget(n);
    const last=t.buildBinary().at(-1);
    assert.equal(last.state.found,[3,7,12,18,24,31,38,45,52].includes(n),`Binary ${n}`);
}
for(const n of ['dijkstra','sorting','binary']) {t.setAlgorithm(n);assert.ok(t.pythonCode().includes('print('));}
console.log('PASS: 36 Dijkstra routes, 30 sorting arrays, 11 binary search cases, 3 Python examples.');
