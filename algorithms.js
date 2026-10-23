/* PDB Labs Algorithm Lab — BETA. Deterministic, educational JS visualizations.
   These are NOT execution traces of the Python editor. Python examples use the same data. */
(() => {
    'use strict';
    const $ = id => document.getElementById(id);
    const svgNS = 'http://www.w3.org/2000/svg';
    const api = window.PDBPlayground;
    const edges = [
        ['A','B',4], ['A','C',2], ['B','C',1], ['B','D',5],
        ['C','D',8], ['C','E',10], ['D','E',2], ['D','F',6], ['E','F',3]
    ];
    const positions = {A:[65,156],B:[215,65],C:[215,249],D:[413,65],E:[413,249],F:[565,156]};
    const nodes = Object.keys(positions);
    const adjacency = Object.fromEntries(nodes.map(n => [n, []]));
    for (const [a,b,w] of edges) {adjacency[a].push([b,w]); adjacency[b].push([a,w]);}
    for (const n of nodes) adjacency[n].sort((a,b) => a[0].localeCompare(b[0]));
    const meta = {
        dijkstra: {topic:'GRAPH ALGORITHMS',title:"Dijkstra's shortest path",description:'Find the shortest route through a weighted graph by always exploring the nearest unsettled node.',complexity:'O(V² + E)',pseudo:[
            'distance[start] = 0', 'while unvisited nodes remain:', '    pick smallest distance', '    mark node visited', '    for each adjacent edge:', '        relax distance if shorter', 'reconstruct shortest path'
        ]},
        sorting: {topic:'SORTING ALGORITHMS',title:'Bubble sort',description:'Compare adjacent values, swap out-of-order pairs, and watch the largest elements settle into position.',complexity:'O(n²)',pseudo:[
            'for pass in range(n):', '    for i in range(n-pass-1):', '        compare a[i], a[i+1]', '        if a[i] > a[i+1]:', '            swap(a[i], a[i+1])', '    mark rightmost as sorted', 'return sorted array'
        ]},
        binary: {topic:'SEARCH ALGORITHMS',title:'Binary search',description:'Search a sorted collection by repeatedly cutting the remaining search interval in half.',complexity:'O(log n)',pseudo:[
            'left, right = 0, n - 1', 'while left <= right:', '    mid = (left + right) // 2', '    if a[mid] == target: return mid', '    if a[mid] < target:', '        left = mid + 1', '    else: right = mid - 1', 'return not found'
        ]}
    };
    const library = window.PDBLibrary;
    for (const [id,info] of Object.entries(library.meta)) {
        meta[id] = {...info,topic:info.category.toUpperCase() + ' ALGORITHMS'};
    }
    const binaryValues = [3,7,12,18,24,31,38,45,52];
    let sortingValues = [34,12,49,25,8,42,17,31];
    let algorithm = 'dijkstra';
    let start = 'A', end = 'F', target = 31;
    let frames = [];
    let step = 0;
    let timer = null;
    let playing = false;
    const isLab = () => !$('algorithm-workspace').hidden;

    function frame(title, description, pseudo, state, kind='STEP') {
        return {title,description,pseudo,state,kind};
    }
    function edgeKey(a,b) {return [a,b].sort().join('-');}
    function buildDijkstra() {
        const dist = Object.fromEntries(nodes.map(n => [n, Infinity]));
        const previous = Object.fromEntries(nodes.map(n => [n, null]));
        const visited = new Set();
        dist[start] = 0;
        const result = [];
        const capture = (title,desc,pseudo,active=null,edge=null,path=[],kind='STEP') => {
            result.push(frame(title,desc,pseudo,{dist:{...dist},visited:[...visited],current:active,edge,path,start,end},kind));
        };
        capture('Graph initialized',`Start at ${start}. All other nodes initially have infinite distance.`,0,null,null,[],'READY');
        while (visited.size < nodes.length) {
            const available = nodes.filter(n => !visited.has(n)).sort((a,b) => dist[a]-dist[b] || a.localeCompare(b));
            const current = available[0];
            if (!current || !Number.isFinite(dist[current])) break;
            capture(`Explore node ${current}`,`Node ${current} has the smallest tentative distance: ${dist[current]}.`,2,current);
            visited.add(current);
            capture(`Visit ${current}`,`Mark ${current} as visited. Its shortest distance is now confirmed.`,3,current);
            if (current === end) break;
            for (const [neighbor, weight] of adjacency[current]) {
                if (visited.has(neighbor)) continue;
                const candidate = dist[current] + weight;
                const previousDistance = dist[neighbor];
                if (candidate < previousDistance) {
                    dist[neighbor] = candidate;
                    previous[neighbor] = current;
                    capture(`Update ${neighbor}`,`Via ${current} → ${neighbor} (weight ${weight}), the distance improves from ${Number.isFinite(previousDistance)?previousDistance:'∞'} to ${candidate}.`,5,current,[current,neighbor]);
                } else {
                    capture(`Keep distance to ${neighbor}`,`Route via ${current} would cost ${candidate}; the known distance ${previousDistance} is better.`,4,current,[current,neighbor]);
                }
            }
        }
        const path = [];
        if (Number.isFinite(dist[end])) {
            for (let n=end; n !== null; n=previous[n]) path.unshift(n);
        }
        capture(path.length ? 'Shortest path found' : 'No route found',path.length ? `${path.join(' → ')} · total cost ${dist[end]}.` : `No route connects ${start} to ${end}.`,6,end,null,path,'COMPLETE');
        return result;
    }
    function buildSorting() {
        const a = sortingValues.slice();
        const sorted = new Set();
        const result = [];
        const capture = (title,description,pseudo,pair=[],kind='STEP') => result.push(frame(title,description,pseudo,{values:[...a],pair,sorted:[...sorted]},kind));
        capture('Array initialized','Compare neighboring elements and swap whenever the left value is larger.',0,[],'READY');
        for (let pass=0;pass<a.length-1;pass++) {
            let swapped = false;
            for (let i=0;i<a.length-pass-1;i++) {
                capture(`Compare ${a[i]} and ${a[i+1]}`,`${a[i]} ${a[i]>a[i+1]?'is greater than':'is not greater than'} ${a[i+1]}.`,2,[i,i+1]);
                if (a[i]>a[i+1]) {
                    [a[i],a[i+1]]=[a[i+1],a[i]];
                    swapped=true;
                    capture(`Swap ${a[i+1]} and ${a[i]}`,'Move the smaller value left and the larger value right.',4,[i,i+1]);
                }
            }
            sorted.add(a.length-pass-1);
            capture(`Position ${a.length-pass} confirmed`,'The largest remaining value is now in its final position.',5);
            if (!swapped) break;
        }
        for (let i=0;i<a.length;i++) sorted.add(i);
        capture('Array sorted',`Result: ${a.join(', ')}.`,6,[],'COMPLETE');
        return result;
    }
    function buildBinary() {
        const a = binaryValues;
        let left=0,right=a.length-1;
        const result=[];
        const capture=(title,description,pseudo,mid=null,found=false,kind='STEP') => result.push(frame(title,description,pseudo,{values:[...a],left,right,mid,target,found},kind));
        capture('Sorted array ready',`Find ${target} in a sorted array of ${a.length} values.`,0,null,false,'READY');
        while(left<=right) {
            const mid=Math.floor((left+right)/2);
            capture(`Inspect index ${mid}`,`Middle value: ${a[mid]}. Search interval: [${left}, ${right}].`,2,mid);
            if(a[mid]===target) {
                capture(`Found ${target}!`,`Value ${target} is at index ${mid}.`,3,mid,true,'COMPLETE');
                return result;
            }
            if(a[mid]<target) {
                capture('Search the right half',`${a[mid]} is less than ${target}; discard indices 0 through ${mid}.`,4,mid);
                left=mid+1;
                capture(`Move left to ${left}`,'The remaining search interval is smaller.',5,null);
            } else {
                capture('Search the left half',`${a[mid]} is greater than ${target}; discard indices ${mid} through ${a.length-1}.`,6,mid);
                right=mid-1;
                capture(`Move right to ${right}`,'The remaining search interval is smaller.',6,null);
            }
        }
        capture(`${target} not found`,'The search interval is empty.',7,null,false,'COMPLETE');
        return result;
    }
    function el(tag, cls, text) {
        const e=document.createElement(tag);
        if(cls) e.className=cls;
        if(text!==undefined) e.textContent=String(text);
        return e;
    }
    function svg(tag,attrs={},text) {
        const e=document.createElementNS(svgNS,tag);
        for(const [key,value] of Object.entries(attrs)) e.setAttribute(key,String(value));
        if(text!==undefined) e.textContent=String(text);
        return e;
    }
    function renderGraph(state) {
        const root=svg('svg',{viewBox:'0 0 630 330',role:'img','aria-label':`Weighted graph from ${state.start} to ${state.end}`});
        const pathEdges=new Set();
        for(let i=1;i<state.path.length;i++) pathEdges.add(edgeKey(state.path[i-1],state.path[i]));
        for(const [a,b,w] of edges) {
            const [x1,y1]=positions[a], [x2,y2]=positions[b];
            const key=edgeKey(a,b);
            let klass='edge';
            if(state.edge && edgeKey(...state.edge)===key) klass+=' active';
            if(pathEdges.has(key)) klass+=' path';
            root.append(svg('line',{x1,y1,x2,y2,class:klass}));
            const mx=(x1+x2)/2,my=(y1+y2)/2;
            const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy);
            const shift=key==='B-C'?[-15,0]:[-dy/len*12,dx/len*12];
            root.append(svg('text',{x:mx+shift[0],y:my+shift[1]+4,'text-anchor':'middle',class:'edge-weight'},w));
        }
        for(const node of nodes) {
            const [x,y]=positions[node];
            let klass='graph-node';
            if(state.visited.includes(node)) klass+=' visited';
            if(Number.isFinite(state.dist[node]) && !state.visited.includes(node)) klass+=' frontier';
            if(state.current===node) klass+=' current';
            if(state.path.includes(node)) klass+=' path';
            if(node===state.end) klass+=' target';
            const g=svg('g',{class:klass});
            g.append(svg('circle',{cx:x,cy:y,r:26}));
            g.append(svg('text',{x,y:y+1},node));
            g.append(svg('text',{x,y:y+48,class:'graph-distance'},Number.isFinite(state.dist[node])?state.dist[node]:'∞'));
            root.append(g);
        }
        return root;
    }
    function renderBars(data) {
        const state=data.state;
        const root=el('div','bar-scene');
        const max=Math.max(...state.values);
        state.values.forEach((n,i) => {
            const col=el('div','bar-col');
            if(state.sorted.includes(i)) col.classList.add('sorted');
            if(state.pair.includes(i)) col.classList.add(data.title.startsWith('Swap')?'swap':'compare');
            const rect=el('div','bar-rect');
            rect.style.height=`${Math.max(14,Math.round(n/max*174))}px`;
            const label=el('span','bar-num',n);
            col.append(rect,label);root.append(col);
        });
        root.setAttribute('role','img');
        root.setAttribute('aria-label',`Array: ${state.values.join(', ')}. Compared indices: ${state.pair.join(', ') || 'none'}`);
        return root;
    }
    function renderSearch(state) {
        const root=el('div','search-scene');
        state.values.forEach((n,i) => {
            const cell=el('div','search-cell');
            if(i<state.left || i>state.right) cell.classList.add('outside');
            if(i===state.mid) cell.classList.add(state.found?'found':'mid');
            const marker=el('div','search-marker',i===state.mid?(state.found?'FOUND':'MID'):' ');
            const value=el('div','search-value',n);
            const idx=el('div','search-index',i);
            cell.append(marker,value,idx);root.append(cell);
        });
        root.setAttribute('role','img');
        root.setAttribute('aria-label',`Sorted values ${state.values.join(', ')}. Range ${state.left} to ${state.right}. Target ${state.target}.`);
        return root;
    }
    function renderLegend() {
        const legends=['fibonacci','gcd','sieve','coin','knapsack'].includes(algorithm)?[['legend-active','Current'],['legend-path','Result']]:['dijkstra','bfs','dfs'].includes(algorithm)?[['legend-active','Current'],['legend-visited','Visited'],['legend-path','Shortest path']]:['sorting','insertion','selection','quick','merge'].includes(algorithm)?[['legend-active','Comparing'],['legend-path','Sorted']]:[['legend-active','Middle'],['legend-path','Found']];
        const host=$('lab-legend');host.replaceChildren();
        for(const [klass,name] of legends) {const item=el('span');item.append(el('i',klass),document.createTextNode(name));host.append(item);}
    }
    function renderExtras() {
        const host=$('lab-controls-extra');host.replaceChildren();
        if(['dijkstra','bfs','dfs'].includes(algorithm)) {
            const label=el('label',null,'Start node');const select=el('select');
            for(const n of nodes) {const opt=el('option',null,n);opt.value=n;opt.selected=n===start;select.append(opt);}
            select.addEventListener('change',()=>{start=select.value;rebuild();});label.append(select);host.append(label);
            if(algorithm==='dijkstra') {
                const dest=el('label',null,'Target node');const choose=el('select');
                for(const n of nodes){const opt=el('option',null,n);opt.value=n;opt.selected=n===end;choose.append(opt);}
                choose.addEventListener('change',()=>{end=choose.value;rebuild();});dest.append(choose);host.append(dest);
            }
        } else if(['sorting','insertion','selection','quick','merge'].includes(algorithm)) {
            const btn=el('button',null,'⟳ Shuffle values');btn.type='button';
            btn.addEventListener('click',()=>{sortingValues=Array.from({length:8},()=>8+Math.floor(Math.random()*49));rebuild();});host.append(btn);
        } else if(['binary','linear','jump'].includes(algorithm)) {
            const label=el('label',null,'Find value');const select=el('select');select.setAttribute('aria-label','Value to find');
            for(const n of [...binaryValues,20]){const opt=el('option',null,n===20?'20 (not present)':String(n));opt.value=n;opt.selected=n===target;select.append(opt);}
            select.addEventListener('change',()=>{target=Number(select.value);rebuild();});label.append(select);host.append(label);
        }
    }
    function renderSequence(state) {
        const root=el('div','sequence-scene');root.setAttribute('role','img');root.setAttribute('aria-label',state.items.join(', '));
        state.items.forEach((item,i)=>{
            const cell=el('div','sequence-cell',item);
            if(state.active.includes(i))cell.classList.add('active');
            if(item==='·')cell.classList.add('excluded');
            root.append(cell);
        });
        return root;
    }
    function renderInspector(data) {
        const details=$('lab-pseudocode');details.replaceChildren();
        meta[algorithm].pseudo.forEach((line,i) => {
            const row=el('div',`lab-pseudo-line${i===data.pseudo?' current':''}`);
            row.append(el('span','lab-pseudo-num',String(i+1).padStart(2,'0')),el('span',null,line));details.append(row);
        });
        const values=$('lab-state-values');values.replaceChildren();const state=data.state;
        let pairs=[];
        if(state.mode==='sequence')pairs=[['Items',state.items.length],['Values',state.items.join(', ')],['Highlighted',state.active.join(', ')||'—']];
        else if(['dijkstra','bfs','dfs'].includes(algorithm)) {
            pairs=[['Start',start],['Current node',state.current||'—'],['Visited',state.visited.join(', ')||'—'],['Frontier',state.frontier?.join(', ')||'—']];
            if(algorithm==='dijkstra')pairs.push(['Distances',nodes.map(n=>`${n}:${Number.isFinite(state.dist[n])?state.dist[n]:'∞'}`).join('  ')]);
            if(state.order)pairs.push(['Order',state.order.join(' → ')||'—']);
            if(state.path?.length)pairs.push(['Shortest route',state.path.join(' → ')]);
        } else if(['sorting','insertion','selection','quick','merge'].includes(algorithm)) {
            pairs=[['Elements',state.values.length],['Current array',state.values.join(', ')],['Sorted positions',state.sorted.length],['Highlighted',state.pair.map(i=>state.values[i]).join(' ↔ ')||'—']];
        } else {
            pairs=[['Target',target],['Search interval',`[${state.left}, ${state.right}]`],['Inspected index',state.mid??'—'],['Result',state.found?'Found':data.kind==='COMPLETE'?'Not found':'Searching']];
        }
        for(const [label,value] of pairs){const row=el('div','lab-state-row');row.append(el('span',null,label),el('strong',null,value));values.append(row);}
    }
    function render() {
        const data=frames[step];if(!data)return;
        $('lab-step-counter').textContent=`STEP ${step} / ${frames.length-1}`;
        $('lab-step-kicker').textContent=data.kind==='COMPLETE'?'EXECUTION COMPLETE':data.kind==='READY'?'READY TO EXPLORE':`STEP ${String(step).padStart(2,'0')}`;
        $('lab-step-title').textContent=data.title;
        $('lab-step-description').textContent=data.description;
        const host=$('lab-visual');
        const mode=data.state.mode || (algorithm==='dijkstra'?'graph':algorithm==='sorting'?'bars':'search');
        host.replaceChildren(mode==='graph'?renderGraph(data.state):mode==='bars'?renderBars(data):mode==='sequence'?renderSequence(data.state):renderSearch(data.state));
        $('lab-prev').disabled=step===0;
        $('lab-next').disabled=step>=frames.length-1;
        $('lab-progress').max=frames.length-1;
        $('lab-progress').value=step;
        $('lab-progress-percent').textContent=`${Math.round(step/(frames.length-1)*100)}%`;
        renderInspector(data);
    }
    function pause() {
        if(timer!==null) {clearTimeout(timer);timer=null;}
        playing=false;
        $('lab-play-icon').textContent='▶';$('lab-play-label').textContent=step===frames.length-1?'Replay':'Play';
        $('lab-play').setAttribute('aria-label',step===frames.length-1?'Replay animation':'Play animation');
    }
    function next() {
        if(step<frames.length-1) {step++;render();}
        if(step===frames.length-1) pause();
    }
    function tick() {
        if(!playing)return;
        if(!isLab()) {pause();return;}
        next();
        if(playing) timer=setTimeout(tick,Number($('lab-speed').value));
    }
    function togglePlay() {
        if(playing) {pause();return;}
        if(step===frames.length-1) {step=0;render();}
        playing=true;
        $('lab-play-icon').textContent='Ⅱ';$('lab-play-label').textContent='Pause';
        $('lab-play').setAttribute('aria-label','Pause animation');
        timer=setTimeout(tick,Number($('lab-speed').value));
    }
    function rebuild() {
        pause();step=0;
        frames=algorithm==='dijkstra'?buildDijkstra():algorithm==='sorting'?buildSorting():algorithm==='binary'?buildBinary():library.build(algorithm,{start,target,values:['insertion','selection','quick','merge'].includes(algorithm)?sortingValues:binaryValues});
        const info=meta[algorithm];
        $('lab-topic').textContent=info.topic;
        $('lab-algo-title').textContent=info.title;
        $('lab-algo-description').textContent=info.description;
        $('lab-complexity').textContent=info.complexity;
        document.querySelectorAll('.lab-algo').forEach(b=>{const active=b.dataset.algo===algorithm;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
        window.dispatchEvent(new CustomEvent('pdb:algorithm-selected',{detail:{algorithm}}));
        renderLegend();renderExtras();render();
    }
    function openWorkspace(which) {
        pause();
        const lab=which==='lab';
        $('algorithm-workspace').hidden=!lab;
        $('code-workspace').hidden=lab;
        $('global-footer').hidden=lab;
        $('current-workspace').textContent=lab?'Algorithm Lab':'Python Playground';
        $('nav-code').classList.toggle('active',!lab);
        $('nav-algorithms').classList.toggle('active',lab);
        $('nav-code').setAttribute('aria-current',lab?'false':'page');
        $('nav-algorithms').setAttribute('aria-current',lab?'page':'false');
        if(document.body.classList.contains('mobile-nav-open')) $('mobile-backdrop').click();
        if(!lab) window.dispatchEvent(new Event('resize'));
        if(lab) render();
    }
    function pythonCode() {
        if(library.examples[algorithm]) {
            let code=library.examples[algorithm];
            if(['insertion','selection','quick','merge'].includes(algorithm))code=code.replace('[34,12,49,25,8,42,17,31]',JSON.stringify(sortingValues));
            if(['linear','jump'].includes(algorithm))code=code.replace('target = 31',`target = ${target}`);
            if(['bfs','dfs'].includes(algorithm))code=code.replace(algorithm==='bfs'?'start = "A"':'stack = ["A"]',algorithm==='bfs'?`start = "${start}"`:`stack = ["${start}"]`);
            return '# PDB Labs Algorithm Lab — '+meta[algorithm].title+'\n'+code;
        }
        if(algorithm==='sorting')return `# Bubble sort — PDB Labs Algorithm Lab\nvalues = ${JSON.stringify(sortingValues)}\n\nfor pass_index in range(len(values) - 1):\n    swapped = False\n    for i in range(len(values) - pass_index - 1):\n        if values[i] > values[i + 1]:\n            values[i], values[i + 1] = values[i + 1], values[i]\n            swapped = True\n    if not swapped:\n        break\n\nprint("Sorted:", values)`;
        if(algorithm==='binary')return `# Binary search — PDB Labs Algorithm Lab\nvalues = ${JSON.stringify(binaryValues)}\ntarget = ${target}\n\nleft, right = 0, len(values) - 1\nresult = -1\nwhile left <= right:\n    mid = (left + right) // 2\n    if values[mid] == target:\n        result = mid\n        break\n    if values[mid] < target:\n        left = mid + 1\n    else:\n        right = mid - 1\n\nprint(f"Value {target}: index {result}" if result != -1 else f"Value {target}: not found")`;
        const edgeEntries=edges.map(([a,b,w])=>`    ("${a}", "${b}", ${w}),`).join('\n');
        return `# Dijkstra — PDB Labs Algorithm Lab\n# Undirected graph with non-negative edge weights\nnodes = ${JSON.stringify(nodes)}\nedges = [\n${edgeEntries}\n]\nstart, target = "${start}", "${end}"\n\ngraph = {node: [] for node in nodes}\nfor a, b, weight in edges:\n    graph[a].append((b, weight))\n    graph[b].append((a, weight))\n\ndistance = {node: float("inf") for node in nodes}\nprevious = {node: None for node in nodes}\nvisited = set()\ndistance[start] = 0\n\nwhile len(visited) < len(nodes):\n    remaining = [n for n in nodes if n not in visited]\n    current = min(remaining, key=lambda n: distance[n])\n    if distance[current] == float("inf"):\n        break\n    visited.add(current)\n    if current == target:\n        break\n    for neighbor, weight in graph[current]:\n        if neighbor in visited:\n            continue\n        candidate = distance[current] + weight\n        if candidate < distance[neighbor]:\n            distance[neighbor] = candidate\n            previous[neighbor] = current\n\npath = []\nif distance[target] != float("inf"):\n    node = target\n    while node is not None:\n        path.insert(0, node)\n        node = previous[node]\n\nprint("Shortest path:", " -> ".join(path) if path else "not found")\nprint("Total cost:", distance[target])`;
    }
    $('nav-code').addEventListener('click',()=>openWorkspace('code'));
    $('nav-algorithms').addEventListener('click',()=>openWorkspace('lab'));
    document.querySelectorAll('.lab-algo').forEach(btn=>btn.addEventListener('click',()=>{algorithm=btn.dataset.algo;rebuild();}));
    $('lab-play').addEventListener('click',togglePlay);
    $('lab-next').addEventListener('click',()=>{pause();next();});
    $('lab-prev').addEventListener('click',()=>{pause();step=Math.max(0,step-1);render();});
    $('lab-reset').addEventListener('click',()=>{pause();step=0;render();});
    $('lab-progress').addEventListener('input',e=>{pause();step=Math.min(frames.length-1,Math.max(0,Number(e.target.value)));render();});
    $('lab-speed').addEventListener('change',()=>{if(playing){clearTimeout(timer);timer=setTimeout(tick,Number($('lab-speed').value));}});
    $('lab-open-code').addEventListener('click',()=>{
        const code=pythonCode();
        if(api.getCode().trim()!==code.trim() && !confirm('Open the Python example in the editor? This replaces the current editor content (which is stored locally).'))return;
        api.setCode(code);
        openWorkspace('code');
        api.focusEditor();
    });
    document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
    document.addEventListener('keydown',e=>{
        if(!isLab() || e.ctrlKey || e.metaKey || e.altKey || e.target.closest('input,select,textarea,[contenteditable]'))return;
        if(e.key==='ArrowRight'){e.preventDefault();pause();next();}
        if(e.key==='ArrowLeft'){e.preventDefault();pause();step=Math.max(0,step-1);render();}
    });
    window.PDBAlgorithms={open:()=>openWorkspace('lab'),choose:name=>{if(meta[name]){algorithm=name;rebuild();openWorkspace('lab');}},getState:()=>({algorithm,step,total:frames.length-1,frame:frames[step]}),getCode:pythonCode};
    rebuild();
})();
