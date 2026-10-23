/* PDB Labs Algorithm Library V4 BETA. Pure deterministic trace builders, no network. */
(function(root, factory) {
    const lib = factory();
    if (typeof module === 'object' && module.exports) module.exports = lib;
    if (root) root.PDBLibrary = lib;
})(typeof window !== 'undefined' ? window : null, function() {
    'use strict';
    const values = [34,12,49,25,8,42,17,31];
    const sortedValues = [3,7,12,18,24,31,38,45,52];
    const graphEdges = [['A','B',4],['A','C',2],['B','C',1],['B','D',5],['C','D',8],['C','E',10],['D','E',2],['D','F',6],['E','F',3]];
    const graphNodes = ['A','B','C','D','E','F'];
    const graph = Object.fromEntries(graphNodes.map(n=>[n,[]]));
    for (const [a,b,w] of graphEdges) { graph[a].push([b,w]);graph[b].push([a,w]); }
    for (const n of graphNodes) graph[n].sort((a,b)=>a[0].localeCompare(b[0]));
    const meta = {
        bfs:{category:'Graphs',title:'Breadth-first search',description:'Explore a graph layer by layer using a queue.',complexity:'O(V + E)',pseudo:['queue = [start]','while queue is not empty:','    node = dequeue()','    mark node visited','    enqueue unseen neighbors','return traversal']},
        dfs:{category:'Graphs',title:'Depth-first search',description:'Explore one branch as far as possible before backtracking.',complexity:'O(V + E)',pseudo:['stack = [start]','while stack is not empty:','    node = pop()','    if node not visited:','        mark node visited','        push unseen neighbors']},
        insertion:{category:'Sorting',title:'Insertion sort',description:'Build a sorted prefix by inserting each element into its correct position.',complexity:'O(n²)',pseudo:['for i = 1 .. n-1:','    key = a[i]','    shift larger values right','    insert key at correct position','return sorted array']},
        selection:{category:'Sorting',title:'Selection sort',description:'Repeatedly select the smallest remaining element and place it next.',complexity:'O(n²)',pseudo:['for i = 0 .. n-1:','    minIndex = i','    scan remaining elements','    update minIndex','    swap a[i] with a[minIndex]']},
        quick:{category:'Sorting',title:'Quicksort',description:'Partition values around a pivot and recursively sort both partitions.',complexity:'O(n log n) avg',pseudo:['quicksort(left, right):','    choose pivot','    partition around pivot','    recursively sort left side','    recursively sort right side']},
        merge:{category:'Sorting',title:'Merge sort',description:'Divide the array and merge sorted halves back together.',complexity:'O(n log n)',pseudo:['split array into halves','sort each half recursively','compare next left/right items','write smaller item into result','copy remaining items']},
        linear:{category:'Searching',title:'Linear search',description:'Scan items from left to right until the target is found.',complexity:'O(n)',pseudo:['for i in range(n):','    inspect a[i]','    if a[i] == target:','        return i','return not found']},
        jump:{category:'Searching',title:'Jump search',description:'Jump through a sorted array in blocks, then scan the matching block.',complexity:'O(√n)',pseudo:['step = floor(sqrt(n))','jump while block end < target','set block start/end','scan the selected block','return index or not found']},
        fibonacci:{category:'Mathematics',title:'Fibonacci sequence',description:'Generate Fibonacci numbers using an iterative recurrence.',complexity:'O(n)',pseudo:['a, b = 0, 1','repeat n times:','    append a to sequence','    a, b = b, a + b','return sequence']},
        gcd:{category:'Mathematics',title:'Euclidean algorithm',description:'Find the greatest common divisor through repeated remainders.',complexity:'O(log min(a,b))',pseudo:['while b != 0:','    remainder = a % b','    a = b','    b = remainder','return a']},
        sieve:{category:'Mathematics',title:'Sieve of Eratosthenes',description:'Find prime numbers by crossing out multiples of each prime.',complexity:'O(n log log n)',pseudo:['mark 2..n as prime','for p from 2 to sqrt(n):','    if p is still prime:','        mark multiples as composite','return unmarked numbers']},
        coin:{category:'Dynamic programming',title:'Coin change (minimum)',description:'Find the minimum number of coins required to reach an amount.',complexity:'O(amount × coins)',pseudo:['dp[0] = 0','for amount from 1..target:','    for coin in coins:','        dp[amount] = min(candidate)','return dp[target]']},
        knapsack:{category:'Dynamic programming',title:'0/1 Knapsack',description:'Maximize value under a capacity constraint using dynamic programming.',complexity:'O(items × capacity)',pseudo:['dp = zero-filled table','for each item:','    for capacity:','        choose skip or take','return optimal value']}
    };
    const catalog = [
        {id:'dijkstra',category:'Graphs',title:"Dijkstra's shortest path",complexity:'O(V² + E)',description:'Find a shortest weighted path.'},
        {id:'bfs',...meta.bfs},{id:'dfs',...meta.dfs},
        {id:'sorting',category:'Sorting',title:'Bubble sort',complexity:'O(n²)',description:'Swap adjacent out-of-order values.'},
        ...['insertion','selection','quick','merge'].map(id=>({id,...meta[id]})),
        {id:'binary',category:'Searching',title:'Binary search',complexity:'O(log n)',description:'Halve a sorted search interval.'},
        ...['linear','jump','fibonacci','gcd','sieve','coin','knapsack'].map(id=>({id,...meta[id]}))
    ];
    const make=(title,description,pseudo,state,kind='STEP')=>({title,description,pseudo,state,kind});
    function sortingTrace(id, input=values) {
        const a=input.slice(), frames=[];
        const capture=(title,desc,line,pair=[],sorted=[])=>frames.push(make(title,desc,line,{values:a.slice(),pair:pair.slice(),sorted:sorted.slice(),mode:'bars'}));
        capture('Array ready',`Starting values: ${a.join(', ')}`,0);
        if(id==='insertion') {
            for(let i=1;i<a.length;i++) {
                const key=a[i];let j=i-1;capture(`Insert ${key}`,`Place item ${i} into the sorted prefix.`,1,[i]);
                while(j>=0 && a[j]>key) {a[j+1]=a[j];capture(`Shift ${a[j]} right`,`Move ${a[j]} to index ${j+1}.`,2,[j,j+1]);j--;}
                a[j+1]=key;capture(`Insert at ${j+1}`,`The prefix of length ${i+1} is sorted.`,3,[j+1],Array.from({length:i+1},(_,k)=>k));
            }
        } else if(id==='selection') {
            for(let i=0;i<a.length;i++) {
                let m=i;
                for(let j=i+1;j<a.length;j++) {capture(`Compare ${a[j]} with ${a[m]}`,'Look for the smallest remaining element.',2,[j,m],Array.from({length:i},(_,k)=>k));if(a[j]<a[m])m=j;}
                [a[i],a[m]]=[a[m],a[i]];capture(`Place minimum at ${i}`,'The next smallest item is in its final position.',4,[i,m],Array.from({length:i+1},(_,k)=>k));
            }
        } else if(id==='quick') {
            function sort(l,r) {
                if(l>=r)return;
                const pivot=a[r];let i=l;capture(`Pivot ${pivot}`,`Partition indices ${l}–${r}.`,1,[r]);
                for(let j=l;j<r;j++) {capture(`Compare ${a[j]} with pivot`,'Values ≤ pivot move to the left.',2,[j,r]);if(a[j]<=pivot){[a[i],a[j]]=[a[j],a[i]];capture(`Move ${a[i]} left`,'Update the partition.',2,[i,j]);i++;}}
                [a[i],a[r]]=[a[r],a[i]];capture(`Pivot fixed at ${i}`,'Recursively sort both sides.',3,[i]);sort(l,i-1);sort(i+1,r);
            }
            sort(0,a.length-1);
        } else if(id==='merge') {
            function sort(l,r) {
                if(r-l<=1)return;
                const m=Math.floor((l+r)/2);sort(l,m);sort(m,r);
                const left=a.slice(l,m),right=a.slice(m,r);let i=0,j=0,k=l;
                capture(`Merge [${l}, ${m}) + [${m}, ${r})`,'Merge two sorted halves.',2,[l,r-1]);
                while(i<left.length || j<right.length) {
                    if(j>=right.length || (i<left.length && left[i]<=right[j])) a[k++]=left[i++];else a[k++]=right[j++];
                    capture(`Write position ${k-1}`,'Take the next smallest value.',3,[k-1]);
                }
            }
            sort(0,a.length);
        }
        frames.push(make('Array sorted',`Result: ${a.join(', ')}`,meta[id].pseudo.length-1,{values:a.slice(),pair:[],sorted:a.map((_,i)=>i),mode:'bars'},'COMPLETE'));
        return frames;
    }
    function graphTrace(id, start='A') {
        const visited=new Set(), order=[], frames=[], dist=Object.fromEntries(graphNodes.map(n=>[n,Infinity]));dist[start]=0;
        const frontier=[start],queued=new Set([start]);
        const capture=(title,desc,line,current=null,edge=null,kind='STEP')=>frames.push(make(title,desc,line,{dist:{...dist},visited:[...visited],current,edge,path:[],start,end:'F',mode:'graph',order:order.slice(),frontier:frontier.slice()},kind));
        capture('Traversal ready',`Begin at ${start}.`,0,null,null,'READY');
        while(frontier.length) {
            const current=id==='bfs'?frontier.shift():frontier.pop();
            if(visited.has(current))continue;
            visited.add(current);order.push(current);
            capture(`Visit ${current}`,`Traversal order: ${order.join(' → ')}`,3,current);
            const neighbors=id==='dfs'?graph[current].slice().reverse():graph[current];
            for(const [neighbor] of neighbors) {
                if(!queued.has(neighbor)) {queued.add(neighbor);dist[neighbor]=dist[current]+1;frontier.push(neighbor);capture(`Discover ${neighbor}`,`${neighbor} added to ${id==='bfs'?'queue':'stack'}.`,4,current,[current,neighbor]);}
            }
        }
        capture('Traversal complete',`Visited ${order.length} nodes: ${order.join(' → ')}`,meta[id].pseudo.length-1,null,null,'COMPLETE');
        return frames;
    }
    function searchTrace(id, target=31, input=sortedValues) {
        const a=input.slice(),frames=[],n=a.length;
        const capture=(title,desc,line,mid=null,left=0,right=n-1,found=false,kind='STEP')=>frames.push(make(title,desc,line,{values:a.slice(),mid,left,right,found,target,mode:'search'},kind));
        capture('Search ready',`Find ${target} in ${a.join(', ')}`,0,null,0,n-1,false,'READY');
        if(id==='linear') {
            for(let i=0;i<n;i++){capture(`Inspect index ${i}`,`Value ${a[i]}`,1,i,i,n-1);if(a[i]===target){capture('Target found',`Index ${i}`,3,i,i,n-1,true,'COMPLETE');return frames;}}
        } else if(id==='jump') {
            const jump=Math.max(1,Math.floor(Math.sqrt(n)));let left=0,right=Math.min(n,jump);
            while(left<n && a[right-1]<target) {capture(`Jump to ${right}`,`Target is larger than block end ${a[right-1]}.`,1,right-1,left,right-1);left=right;right=Math.min(n,right+jump);if(left>=n)break;}
            for(let i=left;i<right;i++){capture(`Inspect ${a[i]}`,`Linear scan within selected block.`,3,i,left,right-1);if(a[i]===target){capture('Target found',`Index ${i}`,4,i,left,right-1,true,'COMPLETE');return frames;}}
        }
        capture('Target not found',`${target} is not present.`,meta[id].pseudo.length-1,null,n,n-1,false,'COMPLETE');
        return frames;
    }
    function sequenceTrace(id) {
        const frames=[];
        const push=(title,desc,line,items,active=[],kind='STEP')=>frames.push(make(title,desc,line,{mode:'sequence',items:items.slice(),active:active.slice()},kind));
        if(id==='fibonacci') {
            let a=0,b=1;const seq=[];push('Initialize','Start with a = 0 and b = 1.',0,seq,[],'READY');
            for(let i=0;i<12;i++){seq.push(a);push(`F(${i}) = ${a}`,`Next pair: (${b}, ${a+b})`,2,seq,[i]);[a,b]=[b,a+b];}
            push('Sequence generated',seq.join(', '),4,seq,[],'COMPLETE');
        } else if(id==='gcd') {
            let a=252,b=105;push('Initialize','Compute gcd(252, 105).',0,[a,b],[],'READY');
            while(b!==0){const r=a%b;push(`${a} % ${b} = ${r}`,'Replace (a, b) with (b, remainder).',1,[a,b,r],[2]);[a,b]=[b,r];}
            push(`GCD = ${a}`,`The final non-zero divisor is ${a}.`,4,[a,b],[0],'COMPLETE');
        } else if(id==='sieve') {
            const n=40,prime=Array(n+1).fill(true);prime[0]=prime[1]=false;
            push('Initialize',`Test integers from 2 to ${n}.`,0,Array.from({length:n-1},(_,i)=>i+2),[],'READY');
            for(let p=2;p*p<=n;p++)if(prime[p]){const crossed=[];for(let m=p*p;m<=n;m+=p){prime[m]=false;crossed.push(m);}push(`Cross out multiples of ${p}`,`Composite numbers removed: ${crossed.join(', ')}`,3,Array.from({length:n-1},(_,i)=>prime[i+2]?i+2:'·'),[p-2]);}
            push('Primes found',Array.from({length:n-1},(_,i)=>prime[i+2]?i+2:null).filter(x=>x!==null).join(', '),4,Array.from({length:n-1},(_,i)=>prime[i+2]?i+2:'·'),[],'COMPLETE');
        } else if(id==='coin') {
            const coins=[1,3,4],amount=12,dp=Array(amount+1).fill(Infinity);dp[0]=0;
            push('Initialize',`Coins: ${coins.join(', ')}. Target: ${amount}.`,0,dp.map(v=>Number.isFinite(v)?v:'∞'),[],'READY');
            for(let sum=1;sum<=amount;sum++){
                for(const coin of coins)if(coin<=sum)dp[sum]=Math.min(dp[sum],dp[sum-coin]+1);
                push(`Amount ${sum}: ${dp[sum]} coin(s)`,`Minimum coins to make ${sum}.`,3,dp.map(v=>Number.isFinite(v)?v:'∞'),[sum]);
            }
            push('Optimal result',`${dp[amount]} coins needed for ${amount}.`,4,dp,[],'COMPLETE');
        } else if(id==='knapsack') {
            const items=[[2,3],[3,4],[4,5],[5,8]],cap=9;let dp=Array(cap+1).fill(0);
            push('Initialize','Items (weight,value): (2,3), (3,4), (4,5), (5,8). Capacity 9.',0,dp,[],'READY');
            for(let i=0;i<items.length;i++){
                const [weight,value]=items[i];for(let c=cap;c>=weight;c--)dp[c]=Math.max(dp[c],dp[c-weight]+value);
                push(`Consider item ${i+1}`,`Weight ${weight}, value ${value}.`,3,dp,[cap]);
            }
            push('Optimal value',`Maximum value ${dp[cap]} at capacity ${cap}.`,4,dp,[cap],'COMPLETE');
        }
        return frames;
    }
    function build(id, opts={}) {
        if(['insertion','selection','quick','merge'].includes(id))return sortingTrace(id,opts.values||values);
        if(['bfs','dfs'].includes(id))return graphTrace(id,opts.start||'A');
        if(['linear','jump'].includes(id))return searchTrace(id,opts.target??31,opts.values||sortedValues);
        if(['fibonacci','gcd','sieve','coin','knapsack'].includes(id))return sequenceTrace(id);
        throw Error('Unknown algorithm: '+id);
    }
    const examples = {
        bfs:`from collections import deque\ngraph = {"A": ["B", "C"], "B": ["A", "C", "D"], "C": ["A", "B", "D", "E"], "D": ["B", "C", "E", "F"], "E": ["C", "D", "F"], "F": ["D", "E"]}\nstart = "A"\nqueue = deque([start])\nseen = {start}\norder = []\nwhile queue:\n    node = queue.popleft()\n    order.append(node)\n    for neighbor in graph[node]:\n        if neighbor not in seen:\n            seen.add(neighbor)\n            queue.append(neighbor)\nprint("BFS:", order)`,
        dfs:`graph = {"A": ["B", "C"], "B": ["A", "C", "D"], "C": ["A", "B", "D", "E"], "D": ["B", "C", "E", "F"], "E": ["C", "D", "F"], "F": ["D", "E"]}\nstack = ["A"]\nseen = set()\ndiscovered = {"A"}\norder = []\nwhile stack:\n    node = stack.pop()\n    if node in seen:\n        continue\n    seen.add(node)\n    order.append(node)\n    for neighbor in reversed(graph[node]):\n        if neighbor not in discovered:\n            discovered.add(neighbor)\n            stack.append(neighbor)\nprint("DFS:", order)`,
        insertion:`a = [34,12,49,25,8,42,17,31]\nfor i in range(1, len(a)):\n    key = a[i]\n    j = i-1\n    while j >= 0 and a[j] > key:\n        a[j+1] = a[j]\n        j -= 1\n    a[j+1] = key\nprint("Sorted:", a)`,
        selection:`a = [34,12,49,25,8,42,17,31]\nfor i in range(len(a)):\n    smallest = min(range(i, len(a)), key=lambda j: a[j])\n    a[i], a[smallest] = a[smallest], a[i]\nprint("Sorted:", a)`,
        quick:`def quicksort(a):\n    if len(a) <= 1:\n        return a\n    pivot = a[-1]\n    return quicksort([x for x in a[:-1] if x <= pivot]) + [pivot] + quicksort([x for x in a[:-1] if x > pivot])\nprint("Sorted:", quicksort([34,12,49,25,8,42,17,31]))`,
        merge:`def merge_sort(a):\n    if len(a) <= 1:\n        return a\n    mid = len(a)//2\n    left, right = merge_sort(a[:mid]), merge_sort(a[mid:])\n    result = []\n    while left and right:\n        result.append(left.pop(0) if left[0] <= right[0] else right.pop(0))\n    return result + left + right\nprint("Sorted:", merge_sort([34,12,49,25,8,42,17,31]))`,
        linear:`a = [3,7,12,18,24,31,38,45,52]\ntarget = 31\nresult = next((i for i,v in enumerate(a) if v == target), -1)\nprint("Index:", result)`,
        jump:`import math\na = [3,7,12,18,24,31,38,45,52]\ntarget = 31\nstep = int(math.sqrt(len(a)))\nstart, end = 0, step\nwhile start < len(a) and a[min(end, len(a))-1] < target:\n    start = end\n    end += step\nresult = -1\nfor i in range(start, min(end, len(a))):\n    if a[i] == target:\n        result = i\n        break\nprint("Index:", result)`,
        fibonacci:`a, b = 0, 1\nsequence = []\nfor _ in range(12):\n    sequence.append(a)\n    a, b = b, a+b\nprint("Fibonacci:", sequence)`,
        gcd:`a, b = 252, 105\nwhile b:\n    a, b = b, a % b\nprint("GCD:", a)`,
        sieve:`n = 40\nprime = [True] * (n+1)\nprime[0] = prime[1] = False\nfor p in range(2, int(n**0.5)+1):\n    if prime[p]:\n        for multiple in range(p*p, n+1, p):\n            prime[multiple] = False\nprint("Primes:", [i for i in range(n+1) if prime[i]])`,
        coin:`coins = [1, 3, 4]\namount = 12\ndp = [float("inf")] * (amount+1)\ndp[0] = 0\nfor x in range(1, amount+1):\n    for coin in coins:\n        if coin <= x:\n            dp[x] = min(dp[x], dp[x-coin]+1)\nprint("Min coins:", dp[amount])`,
        knapsack:`items = [(2,3), (3,4), (4,5), (5,8)]\ncapacity = 9\ndp = [0] * (capacity+1)\nfor weight, value in items:\n    for c in range(capacity, weight-1, -1):\n        dp[c] = max(dp[c], dp[c-weight]+value)\nprint("Max value:", dp[capacity])`
    };
    return {meta,catalog,build,examples,graphNodes,graphEdges};
});
