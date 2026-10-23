/* BETA: isolated Python tracing worker. Terminable; no persistent server storage. */
const PYODIDE_BASE='https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
let pyodidePromise;
function python(){
    if(!pyodidePromise)pyodidePromise=(async()=>{importScripts(PYODIDE_BASE+'pyodide.js');return loadPyodide({indexURL:PYODIDE_BASE});})();
    return pyodidePromise;
}
self.onmessage=async({data})=>{
    if(data?.type!=='trace')return;
    try{
        self.postMessage({type:'loading'});
        const py=await python();
        self.postMessage({type:'tracing'});
        py.globals.set('_pdb_user_source',data.code);
        const result=await py.runPythonAsync(`
import sys, json, traceback, io, contextlib
_pdb_events = []
_pdb_source = _pdb_user_source
_pdb_limit = 400
_pdb_stack = []

def _pdb_repr(value):
    try:
        if isinstance(value, (list, tuple, dict, set, frozenset)) and len(value) > 60:
            return '<collection with %d items>' % len(value)
        result = repr(value)
        return result[:180] + ('…' if len(result) > 180 else '')
    except BaseException:
        return '<unavailable>'

def _pdb_trace(frame, event, arg):
    if frame.f_code.co_filename != 'main.py':
        return None
    if event not in ('call', 'line', 'return'):
        return _pdb_trace
    if len(_pdb_events) >= _pdb_limit:
        raise RuntimeError('Trace limit reached (400 events). Simplify the code or reduce loops.')
    if event == 'call':
        _pdb_stack.append(frame.f_code.co_name)
    names = list(frame.f_locals.items())[:24]
    variables = {str(k):_pdb_repr(v) for k,v in names if not str(k).startswith('__')}
    _pdb_events.append({'line':frame.f_lineno,'event':event,'function':frame.f_code.co_name,'locals':variables,'stack':list(_pdb_stack[-12:])})
    if event == 'return' and _pdb_stack:
        _pdb_stack.pop()
    return _pdb_trace

_pdb_error = None
_pdb_output = io.StringIO()
try:
    _pdb_compiled = compile(_pdb_source, 'main.py', 'exec')
    _pdb_globals = {'__name__':'__main__','__builtins__':__builtins__}
    with contextlib.redirect_stdout(_pdb_output), contextlib.redirect_stderr(_pdb_output):
        sys.settrace(_pdb_trace)
        try:
            exec(_pdb_compiled, _pdb_globals)
        finally:
            sys.settrace(None)
except BaseException as error:
    sys.settrace(None)
    _pdb_error = ''.join(traceback.format_exception_only(type(error),error)).strip()
json.dumps({'events':_pdb_events,'error':_pdb_error,'output':_pdb_output.getvalue()[-4000:]})
`);
        self.postMessage({type:'complete',data:JSON.parse(result)});
    }catch(error){self.postMessage({type:'error',message:String(error?.message||error)});}
};
