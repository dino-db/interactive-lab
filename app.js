(() => {
    'use strict';
    const STARTER = `# Welcome to PDB Labs Python Playground 🚀\n# Write Python. Explore ideas. Build something new.\n\ndef greet(name):\n    return f"Hello, {name}! 👋"\n\nprint(greet("PDB Labs"))\nprint("Engineering the Future.")\n\nfor number in range(1, 6):\n    print(f"{number} squared = {number ** 2}")`;
    const EXAMPLES = [
        {name:'Hello, Python!',icon:'✦',code:STARTER},
        {name:'Fibonacci sequence',icon:'∞',code:`# Fibonacci sequence\ndef fibonacci(count):\n    a, b = 0, 1\n    result = []\n    for _ in range(count):\n        result.append(a)\n        a, b = b, a + b\n    return result\n\nprint(fibonacci(15))`},
        {name:'Shortest path · Dijkstra',icon:'◇',code:`# Dijkstra: shortest path in a weighted graph\nimport heapq\n\ngraph = {\n    "A": {"B": 4, "C": 2},\n    "B": {"D": 5},\n    "C": {"B": 1, "D": 8},\n    "D": {"E": 2},\n    "E": {}\n}\n\ndef shortest_path(start, end):\n    queue = [(0, start, [start])]\n    visited = set()\n    while queue:\n        distance, node, path = heapq.heappop(queue)\n        if node == end:\n            return distance, path\n        if node in visited:\n            continue\n        visited.add(node)\n        for neighbor, cost in graph[node].items():\n            heapq.heappush(queue, (distance + cost, neighbor, path + [neighbor]))\n    return None\n\ndistance, path = shortest_path("A", "E")\nprint("Shortest route:", " → ".join(path))\nprint("Total cost:", distance)`},
        {name:'Math & statistics',icon:'∑',code:`# Exploring Python's standard library\nimport math\nimport statistics\n\nvalues = [12, 18, 15, 21, 19, 15, 20]\nprint("Mean:", round(statistics.mean(values), 2))\nprint("Median:", statistics.median(values))\nprint("Standard deviation:", round(statistics.stdev(values), 2))\nprint("√144:", math.sqrt(144))\nprint("π:", round(math.pi, 6))`},
        {name:'Monte Carlo π',icon:'◎',code:`# Estimate π using random sampling\nimport random\n\nrandom.seed(42)\nsamples = 20_000\ninside = 0\nfor _ in range(samples):\n    x, y = random.random(), random.random()\n    if x*x + y*y <= 1:\n        inside += 1\n\nestimate = 4 * inside / samples\nprint(f"Estimated π: {estimate:.5f}")\nprint(f"Actual π:    3.14159")`},
        {name:'Lists & dictionaries',icon:'≡',code:`# Working with Python collections\nprojects = [\n    {"name": "Python Playground", "category": "Software"},\n    {"name": "AI Experiments", "category": "Artificial Intelligence"},\n    {"name": "Algorithm Visualizer", "category": "Algorithms"},\n]\n\nfor index, project in enumerate(projects, 1):\n    print(f"{index}. {project['name']} — {project['category']}")\n\nprint("Total projects:", len(projects))`}
    ];
    const $ = id => document.getElementById(id);
    const editorHost = $('editor');
    const fallback = $('fallback-editor');
    const consoleHost = $('console');
    const runBtn = $('run-btn');
    const runLabel = $('run-label');
    const status = $('console-status');
    const runtimeLabel = $('runtime-label');
    const runtimeDot = $('runtime-dot');
    const saveStatus = $('save-status');
    const lineCount = $('line-count');
    let editor = null;
    let worker = null;
    let running = false;
    let watchdog = null;
    let selectedExample = -1;
    let runStartedAt = 0;
    const notify = (type, detail = {}) => window.dispatchEvent(new CustomEvent(`pdb:${type}`, {detail}));
    const STORAGE_CODE = 'pdb-playground-code-v1';
    const STORAGE_THEME = 'pdb-playground-theme-v1';

    function stored(key) { try { return localStorage.getItem(key); } catch { return null; } }
    function store(key, value) { try { localStorage.setItem(key, value); } catch {} }
    function getCode() { return editor ? editor.getValue() : fallback.value; }
    function setCode(code) { if (editor) editor.setValue(code); else fallback.value = code; updateLineCount(); store(STORAGE_CODE, code); }
    function updateLineCount() { const lines = getCode().split('\n').length; lineCount.textContent = `${lines} line${lines === 1 ? '' : 's'}`; }
    function codeChanged() { updateLineCount(); store(STORAGE_CODE, getCode()); saveStatus.textContent = 'Saved locally'; }
    function setRuntime(message, state) { runtimeLabel.textContent = message; runtimeDot.className = 'state-dot' + (state ? ` ${state}` : ''); }
    function appendLine(text, kind = 'out') {
        const welcome = consoleHost.querySelector('.terminal-welcome');
        if (welcome) welcome.remove();
        const node = document.createElement('div');
        node.className = `console-line ${kind}`;
        node.textContent = text;
        consoleHost.appendChild(node);
        consoleHost.scrollTop = consoleHost.scrollHeight;
    }
    function clearOutput() { consoleHost.textContent = ''; status.textContent = 'Output cleared'; }
    function stopWatchdog() { if (watchdog) clearTimeout(watchdog); watchdog = null; }
    function finish(success) { stopWatchdog(); running = false; runBtn.disabled = false; runLabel.textContent = 'Run code'; setRuntime(success ? 'Python ready' : 'Runtime ready', 'ready'); status.textContent = success ? 'Execution completed' : 'Execution stopped'; notify('finish', {success, elapsed: Math.max(0, Date.now() - runStartedAt)}); }
    function terminateWorker() { stopWatchdog(); if (worker) { worker.terminate(); worker = null; } running = false; runBtn.disabled = false; runLabel.textContent = 'Run code'; setRuntime('Python not loaded', ''); notify('stopped'); }
    function createWorker() {
        worker = new Worker('./python-worker.js');
        worker.onmessage = ({data}) => {
            if (data.type === 'loading') { setRuntime('Loading Python…', 'busy'); status.textContent = 'Loading Python runtime'; }
            if (data.type === 'running') { setRuntime('Executing…', 'busy'); status.textContent = 'Executing main.py'; }
            if (data.type === 'stdout') appendLine(data.text, 'out');
            if (data.type === 'stderr') appendLine(data.text, 'err');
            if (data.type === 'complete') { appendLine('✓ Process finished successfully', 'success'); finish(true); }
            if (data.type === 'error') { appendLine(data.text, 'err'); finish(false); }
        };
        worker.onerror = e => { appendLine(`Runtime error: ${e.message || 'Unknown worker error'}`, 'err'); terminateWorker(); status.textContent = 'Runtime error'; };
    }
    function runCode() {
        if (running) return;
        const code = getCode();
        if (!code.trim()) { clearOutput(); appendLine('Write some Python code before running.', 'info'); return; }
        clearOutput();
        appendLine('❯ python main.py', 'prompt');
        running = true;
        runStartedAt = Date.now();
        notify('start');
        runBtn.disabled = true;
        runLabel.textContent = 'Running…';
        setRuntime('Preparing Python…', 'busy');
        status.textContent = 'Starting execution';
        if (!worker) createWorker();
        worker.postMessage({type:'run',code});
        // Infinite loops cannot block the UI; restart the worker if execution takes too long.
        watchdog = setTimeout(() => {
            if (!running) return;
            appendLine('Execution stopped after 30 seconds. Reset the runtime or simplify your code.', 'err');
            terminateWorker();
            status.textContent = 'Time limit reached';
        }, 60000);
    }
    function resetRuntime() { terminateWorker(); clearOutput(); appendLine('Runtime reset. Ready for a fresh run.', 'info'); status.textContent = 'Runtime reset'; }
    function stopExecution() { if (!running) return; terminateWorker(); appendLine('■ Execution stopped by user.', 'info'); status.textContent = 'Execution stopped'; }
    function selectExample(index) {
        const current = EXAMPLES[index];
        if (!current) return;
        if (getCode().trim() !== STARTER.trim() && getCode().trim() !== current.code.trim() && !EXAMPLES.some(x => x.code === getCode())) {
            if (!confirm('Replace your current code with this example? Your saved code will be overwritten.')) return;
        }
        selectedExample = index;
        setCode(current.code);
        notify('example', {index, name: current.name});
        document.querySelectorAll('.example-button').forEach((btn, i) => btn.classList.toggle('selected', i === index));
        clearOutput();
        appendLine(`Loaded example: ${current.name}. Press Run code to execute.`, 'info');
        if (editor) editor.focus(); else fallback.focus();
    }
    function setupExamples() {
        const list = $('examples');
        EXAMPLES.forEach((example, index) => {
            const btn = document.createElement('button');
            btn.className = 'example-button';
            btn.type = 'button';
            const icon = document.createElement('span'); icon.className = 'example-icon'; icon.textContent = example.icon;
            const label = document.createElement('span'); label.textContent = example.name;
            btn.append(icon, label);
            btn.addEventListener('click', () => selectExample(index));
            list.appendChild(btn);
        });
    }
    function setTheme(mode) {
        document.body.classList.toggle('light', mode === 'light');
        notify('theme', {mode});
        store(STORAGE_THEME, mode);
        if (editor && window.monaco) monaco.editor.setTheme(mode === 'light' ? 'vs' : 'pdb-dark');
    }
    function initMonaco() {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/loader.js';
        script.onload = () => {
            try {
                require.config({paths: {vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs'}});
                require(['vs/editor/editor.main'], () => {
                    const code = fallback.value;
                    fallback.remove();
                    monaco.editor.defineTheme('pdb-dark', {base:'vs-dark',inherit:true,rules:[{token:'comment',foreground:'7586A1',fontStyle:'italic'},{token:'keyword',foreground:'B18AFF'},{token:'string',foreground:'7ED6B5'},{token:'number',foreground:'E8BA7A'}],colors:{'editor.background':'#0E1422','editor.foreground':'#DBE5F9','editorLineNumber.foreground':'#465674','editorLineNumber.activeForeground':'#A0B7E5','editorCursor.foreground':'#9D9BFF','editor.selectionBackground':'#304D7855','editor.lineHighlightBackground':'#182137'}});
                    editor = monaco.editor.create(editorHost, {value:code,language:'python',theme:document.body.classList.contains('light')?'vs':'pdb-dark',fontFamily:'JetBrains Mono, monospace',fontSize:12,lineHeight:23,automaticLayout:true,minimap:{enabled:false},scrollBeyondLastLine:false,padding:{top:19,bottom:15},renderLineHighlight:'line',lineNumbersMinChars:3,tabSize:4,insertSpaces:true,wordWrap:'on',overviewRulerLanes:0,hideCursorInOverviewRuler:true,bracketPairColorization:{enabled:true},guides:{indentation:true}});
                    editor.onDidChangeModelContent(codeChanged);
                    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, runCode);
                    $('editor-mode').textContent = 'Monaco Editor';
                    updateLineCount();
                }, () => { $('editor-mode').textContent = 'Basic editor (offline fallback)'; });
            } catch { $('editor-mode').textContent = 'Basic editor (offline fallback)'; }
        };
        script.onerror = () => { $('editor-mode').textContent = 'Basic editor (offline fallback)'; };
        document.head.appendChild(script);
    }
    fallback.value = stored(STORAGE_CODE) ?? STARTER;
    fallback.addEventListener('input', codeChanged);
    fallback.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runCode(); }
        if (e.key === 'Tab') { e.preventDefault(); const start = fallback.selectionStart, end = fallback.selectionEnd; fallback.setRangeText('    ', start, end, 'end'); codeChanged(); }
    });
    $('run-btn').addEventListener('click', runCode);
    $('reset-btn').addEventListener('click', resetRuntime);
    $('clear-btn').addEventListener('click', clearOutput);
    $('theme-btn').addEventListener('click', () => setTheme(document.body.classList.contains('light') ? 'dark' : 'light'));
    $('copy-btn').addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(getCode()); $('copy-btn').textContent = 'Copied ✓'; setTimeout(() => $('copy-btn').textContent = 'Copy', 1600); }
        catch { appendLine('Clipboard permission denied. Select the code and copy manually.', 'err'); }
    });
    $('download-btn').addEventListener('click', () => {
        const blob = new Blob([getCode()], {type:'text/x-python;charset=utf-8'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'main.py'; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    window.PDBPlayground = {
        runCode, resetRuntime, stopExecution, selectExample, setTheme, getCode, setCode, clearOutput,
        focusEditor: () => editor ? editor.focus() : fallback.focus(),
        examples: EXAMPLES.map(({name, icon}) => ({name, icon})),
        isRunning: () => running
    };
    setupExamples();
    setTheme(stored(STORAGE_THEME) === 'light' ? 'light' : 'dark');
    updateLineCount();
    initMonaco();
})();
