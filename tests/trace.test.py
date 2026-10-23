"""Validate the Python tracing snippet without needing a Pyodide CDN."""
from pathlib import Path
import json,re,contextlib,io
worker=(Path(__file__).resolve().parents[1]/'trace-worker.js').read_text()
match=re.search(r'py\.runPythonAsync\(`\n(.*?)\n`\)',worker,re.S)
assert match,'Tracing Python script not found'
script=match.group(1)
for program in [
    'a = [3, 1, 2]\na.sort()\nprint(a)',
    'def double(x):\n    return x * 2\nfor n in range(3):\n    result = double(n)\nprint(result)',
    'def fibonacci(n):\n    if n < 2: return n\n    return fibonacci(n-1) + fibonacci(n-2)\nprint(fibonacci(6))',
    'x = 1\nraise ValueError("expected")',
]:
    scope={'_pdb_user_source':program}
    with contextlib.redirect_stdout(io.StringIO()):
        exec(script,scope)
    data=json.loads(scope['_pdb_events'] and json.dumps({'events':scope['_pdb_events'],'error':scope['_pdb_error'],'output':scope['_pdb_output'].getvalue()}) or '{}')
    assert data['events'],program
    assert all('line' in event and 'locals' in event and 'stack' in event for event in data['events'])
    assert len(data['events'])<=400
    if 'raise ValueError' in program:assert 'ValueError' in data['error']
    else:assert data['error'] is None
    print('PASS:',len(data['events']),'events',program.splitlines()[0])
