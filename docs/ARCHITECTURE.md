# Architecture

PDB Labs Interactive Lab is currently a **static, browser-based application**. The first workspace brings together the Python Playground, Algorithm Lab and Visual Debugger. The code stays at the repository root in V4 to preserve its tested relative paths. As the platform grows, additional independent labs can be added without changing these working paths.

## Modules

| Module | Implementation | Runtime |
|---|---|---|
| Python Playground | `app.js`, `app.css`, `python-worker.js` | Monaco + Pyodide Web Worker |
| Algorithm Lab | `algorithms.js`, `algorithms.css`, `library-data.js`, `library-ui.js` | JavaScript trace frames |
| Visual Debugger | `debugger.js`, `trace-worker.js` | Python `sys.settrace` in a separate Pyodide worker |
| Shell and interaction | `index.html`, `v2.js`, `v2.css`, `v4.css` | Browser DOM / localStorage |

## Principles

- No backend, authentication or cloud persistence in V4.
- Preserve the official PDB Labs logo and consistent brand language.
- Keep algorithm demonstrations separate from tracing arbitrary Python code.
- Add tests for new algorithms and workspace features.
- Keep BETA labeling until real browser execution and accessibility are validated.

## Dependencies

Monaco and Pyodide are loaded from external CDNs. They require network access. The browser is responsible for running user code, so users should not paste secrets or untrusted code.
