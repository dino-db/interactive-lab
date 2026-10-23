"""Standard-library-only structural checks for the BETA playground."""
from pathlib import Path
import re
import subprocess
ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / 'index.html').read_text(encoding='utf-8')
assert 'BETA · V4' in html
assert 'assets/pdb-labs-logo.png' in html
assert (ROOT / 'assets/pdb-labs-logo.png').is_file()
assert 'id="algorithm-workspace"' in html
assert 'id="code-workspace"' in html
assert '<script src="./algorithms.js"></script>' in html
ids = set(re.findall(r'id="([^"]+)"', html))
for script in ['app.js', 'v2.js', 'algorithms.js', 'library-data.js', 'library-ui.js', 'debugger.js', 'trace-worker.js']:
    source = (ROOT / script).read_text(encoding='utf-8')
    subprocess.run(['node', '--check', str(ROOT / script)], check=True)
    for id in re.findall(r"\$\('([\w-]+)'\)", source):
        assert id in ids, f'{script} references missing id: {id}'
print('PASS: BETA label, logo, workspace DOM IDs, JavaScript syntax and DOM bindings.')
