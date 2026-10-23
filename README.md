# PDB Labs · Interactive Lab

**Engineering the Future** · **V4 BETA**

An interactive technology laboratory for **coding, algorithm visualization, debugging and hands-on experimentation**. The first release combines a browser-based Python workspace, an algorithm library and a visual execution trace viewer. More experimental labs can follow.

> **BETA:** This is an experimental build, not a fully validated production service. The repository is public; a license has not yet been selected.

## What's inside

| Workspace | What it does | Status |
|---|---|---|
| **Python Playground** | Edit and run Python in the browser, inspect output, save work locally | V4 BETA |
| **Algorithm Lab** | Explore **16 algorithms** with searchable categories, step-by-step animation, pseudocode and code examples | V4 BETA |
| **Visual Debugger** | Record and navigate Python execution with highlighted lines, locals and call stack | V4 BETA |

### Algorithm library

| Category | Algorithms |
|---|---|
| Graphs | Dijkstra, BFS, DFS |
| Sorting | Bubble, Insertion, Selection, Quick, Merge |
| Searching | Binary, Linear, Jump |
| Mathematics | Fibonacci, Euclidean GCD, Sieve of Eratosthenes |
| Dynamic programming | Minimum Coin Change, 0/1 Knapsack |

The Algorithm Lab animates curated JavaScript reference traces. It **does not** automatically animate arbitrary Python code. The Visual Debugger traces user-written Python separately.

## Run locally

Requires a modern browser, Python 3 and an internet connection for Monaco/Pyodide CDN resources. No backend or build step is required.

```bash
git clone https://github.com/dino-db/interactive-lab.git
cd interactive-lab
python -m http.server 8000
```

Open **http://localhost:8000**. Do not open `index.html` directly via `file://` because browser worker policies may block it.

## Tests

Requires Node.js and Python 3.

```bash
node tests/algorithms.test.js
node tests/library.test.js
python tests/static_check.py
python tests/trace.test.py
```

Optional browser smoke test (Playwright and Chromium required):

```bash
python tests/browser_smoke.py
```

The smoke test exercises UI controls with in-memory injected assets; it **does not verify live Pyodide execution**. Real browser runtime, accessibility and cross-browser validation are still pending.

## Repository layout

```text
interactive-lab/
├── index.html                 # Current lab interface
├── app.js / app.css           # Python Playground
├── python-worker.js           # Python execution worker
├── algorithms.js / .css       # Algorithm visualizer
├── library-data.js            # 16 algorithm definitions/traces
├── library-ui.js              # Searchable catalog
├── debugger.js                # Trace viewer
├── trace-worker.js            # Python trace worker
├── v2.js / v2.css / v4.css    # Shared interface features
├── assets/                    # Official PDB Labs logo
├── tests/                     # Automated checks
└── docs/                      # Architecture and roadmap
```

The V4 application files remain together at the root to **preserve their relative URLs and tested behavior**. The broader platform will be modularized as additional labs are introduced. See [Architecture](docs/ARCHITECTURE.md) and [Roadmap](docs/ROADMAP.md).

## Privacy, security and limitations

- Python runs client-side in Web Workers through Pyodide. No accounts or backend storage.
- Editor content is stored in the visitor's browser (`localStorage`).
- Do not paste API keys, personal secrets or untrusted code into the editor.
- The trace viewer records up to 400 events and uses a 20-second worker timeout; it is not a full interactive debugger.
- A public repository does not automatically mean the application is hosted or production-ready.

## Project

**PDB Labs** is an independent technology initiative focused on AI, software engineering, algorithms and experimental projects.

**Engineering the Future.**

© PDB Labs. No open-source license has been granted yet.