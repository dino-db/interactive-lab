/* Runs Python in a dedicated worker so long-running code does not freeze the UI. */
const PYODIDE_BASE = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
let pyodidePromise = null;
async function ensurePython() {
    if (!pyodidePromise) {
        pyodidePromise = (async () => {
            importScripts(PYODIDE_BASE + 'pyodide.js');
            const instance = await loadPyodide({indexURL: PYODIDE_BASE});
            instance.setStdout({batched: text => self.postMessage({type: 'stdout', text})});
            instance.setStderr({batched: text => self.postMessage({type: 'stderr', text})});
            return instance;
        })();
    }
    return pyodidePromise;
}
self.onmessage = async event => {
    const {type, code} = event.data || {};
    if (type !== 'run') return;
    try {
        self.postMessage({type: 'loading'});
        const pyodide = await ensurePython();
        self.postMessage({type: 'running'});
        // Running user code in a worker keeps the page responsive. A Reset terminates this worker.
        await pyodide.runPythonAsync(code);
        self.postMessage({type: 'complete'});
    } catch (error) {
        self.postMessage({type: 'error', text: String(error && error.message || error)});
    }
};
