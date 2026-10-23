/* PDB Labs Python Playground V2 — progressive workspace enhancements. */
(() => {
    'use strict';
    const $ = id => document.getElementById(id);
    const api = window.PDBPlayground;
    const STORE = 'pdb-playground-layout-v2';
    const readLayout = () => { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; } };
    const layout = readLayout();
    const persist = () => { try { localStorage.setItem(STORE, JSON.stringify(layout)); } catch {} };
    const toast = $('toast');
    let toastTimer;
    const flash = message => {
        toast.textContent = message;
        toast.classList.add('visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('visible'), 2400);
    };

    // Collapsible desktop sidebar and accessible mobile drawer.
    const sidebar = $('sidebar');
    const mobileMenu = $('mobile-menu');
    const backdrop = $('mobile-backdrop');
    const smallScreen = () => window.matchMedia('(max-width: 600px)').matches;
    function closeMobileMenu() {
        document.body.classList.remove('mobile-nav-open');
        mobileMenu.setAttribute('aria-expanded', 'false');
        backdrop.hidden = true;
    }
    $('sidebar-close').addEventListener('click', () => {
        if (smallScreen()) { closeMobileMenu(); return; }
        layout.collapsed = !document.body.classList.contains('sidebar-collapsed');
        document.body.classList.toggle('sidebar-collapsed', layout.collapsed);
        $('sidebar-close').textContent = layout.collapsed ? '›' : '‹';
        $('sidebar-close').setAttribute('aria-label', layout.collapsed ? 'Expand sidebar' : 'Collapse sidebar');
        persist();
    });
    if (layout.collapsed) {
        document.body.classList.add('sidebar-collapsed');
        $('sidebar-close').textContent = '›';
        $('sidebar-close').setAttribute('aria-label', 'Expand sidebar');
    }
    mobileMenu.addEventListener('click', () => {
        const open = !document.body.classList.contains('mobile-nav-open');
        document.body.classList.toggle('mobile-nav-open', open);
        mobileMenu.setAttribute('aria-expanded', String(open));
        backdrop.hidden = !open;
    });
    backdrop.addEventListener('click', closeMobileMenu);
    $('examples').addEventListener('click', e => {
        if (e.target.closest('button')) closeMobileMenu();
    });

    // Focus mode keeps the full-size editor visible and removes surrounding chrome.
    function setFocus(on) {
        document.body.classList.toggle('focus-mode', on);
        $('focus-btn').setAttribute('aria-pressed', String(on));
        $('focus-btn').title = on ? 'Exit focus mode (Ctrl+Shift+F)' : 'Focus mode (Ctrl+Shift+F)';
        layout.focus = on;
        persist();
        window.dispatchEvent(new Event('resize'));
        flash(on ? 'Focus mode enabled' : 'Focus mode disabled');
    }
    $('focus-btn').addEventListener('click', () => setFocus(!document.body.classList.contains('focus-mode')));
    if (layout.focus) {
        document.body.classList.add('focus-mode');
        $('focus-btn').setAttribute('aria-pressed', 'true');
    }

    // Drag-to-resize desktop split. Keyboard left/right arrows work on the separator.
    const ideBody = $('ide-body');
    const handle = $('resize-handle');
    const clamp = n => Math.max(30, Math.min(75, n));
    function setSplit(percent) {
        const p = clamp(percent);
        ideBody.style.setProperty('--editor-share', `${p}%`);
        handle.setAttribute('aria-valuenow', String(Math.round(p)));
        layout.split = p;
        persist();
        window.dispatchEvent(new Event('resize'));
    }
    if (typeof layout.split === 'number') setSplit(layout.split);
    handle.addEventListener('pointerdown', e => {
        if (window.matchMedia('(max-width: 860px)').matches) return;
        e.preventDefault();
        handle.setPointerCapture(e.pointerId);
        document.body.classList.add('resizing');
    });
    handle.addEventListener('pointermove', e => {
        if (!handle.hasPointerCapture(e.pointerId)) return;
        const rect = ideBody.getBoundingClientRect();
        setSplit((e.clientX - rect.left) / rect.width * 100);
    });
    const finishResize = e => {
        if (handle.hasPointerCapture(e.pointerId)) handle.releasePointerCapture(e.pointerId);
        document.body.classList.remove('resizing');
    };
    handle.addEventListener('pointerup', finishResize);
    handle.addEventListener('pointercancel', finishResize);
    handle.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            setSplit((layout.split || 53) + (e.key === 'ArrowRight' ? 3 : -3));
        }
        if (e.key === 'Home') { e.preventDefault(); setSplit(30); }
        if (e.key === 'End') { e.preventDefault(); setSplit(75); }
    });

    // Small-screen editor/output switcher; run automatically opens the output tab.
    function showPanel(which) {
        const output = which === 'output';
        ideBody.classList.toggle('show-output', output);
        $('mobile-code-tab').classList.toggle('selected', !output);
        $('mobile-output-tab').classList.toggle('selected', output);
        $('mobile-code-tab').setAttribute('aria-selected', String(!output));
        $('mobile-output-tab').setAttribute('aria-selected', String(output));
        if (!output) window.dispatchEvent(new Event('resize'));
    }
    $('mobile-code-tab').addEventListener('click', () => showPanel('code'));
    $('mobile-output-tab').addEventListener('click', () => showPanel('output'));
    window.addEventListener('pdb:start', () => {
        $('stop-btn').hidden = false;
        $('ide-frame').classList.add('is-running');
        $('execution-time').textContent = 'Running...';
        if (smallScreen()) showPanel('output');
    });
    window.addEventListener('pdb:finish', e => {
        $('stop-btn').hidden = true;
        $('ide-frame').classList.remove('is-running');
        $('execution-time').textContent = `${(e.detail.elapsed / 1000).toFixed(2)}s · ${e.detail.success ? 'Complete' : 'Error'}`;
    });
    window.addEventListener('pdb:stopped', () => {
        $('stop-btn').hidden = true;
        $('ide-frame').classList.remove('is-running');
        $('execution-time').textContent = 'Stopped';
    });
    $('stop-btn').addEventListener('click', () => { api.stopExecution(); flash('Execution stopped'); });
    window.addEventListener('pdb:example', e => flash(`Loaded ${e.detail.name}`));
    $('copy-btn').addEventListener('click', () => {
        // app.js owns the clipboard write; this just adds visual feedback.
        flash('Copy requested');
    });

    // Searchable command palette. Commands execute only after explicit selection.
    const overlay = $('palette-overlay');
    const input = $('palette-input');
    const list = $('palette-list');
    let matches = [];
    let activeIndex = 0;
    let previousFocus = null;
    const commands = [
        {label:'Open Python Playground', group:'Workspace', icon:'⌘', run:() => $('nav-code').click()},
        {label:'Open Algorithm Lab', group:'Workspace', icon:'◇', run:() => $('nav-algorithms').click()},
        {label:'Trace Python code', group:'Actions', icon:'◇', run:() => {$('nav-code').click();$('trace-btn').click();}},
        ...window.PDBLibrary.catalog.map(item=>({label:item.title,group:'Algorithm Library',icon:'◇',run:()=>window.PDBAlgorithms.choose(item.id)})),
        {label:'Run Python code', group:'Actions', icon:'▶', keys:'Ctrl ↵', run:() => api.runCode()},
        {label:'Stop execution', group:'Actions', icon:'■', run:() => api.stopExecution()},
        {label:'Clear terminal', group:'Actions', icon:'⌫', run:() => {api.clearOutput(); flash('Terminal cleared');}},
        {label:'Reset Python runtime', group:'Actions', icon:'↺', run:() => api.resetRuntime()},
        {label:'Focus editor', group:'Workspace', icon:'⌘', run:() => api.focusEditor()},
        {label:'Toggle focus mode', group:'Workspace', icon:'⛶', keys:'Ctrl Shift F', run:() => setFocus(!document.body.classList.contains('focus-mode'))},
        {label:'Toggle light / dark theme', group:'Workspace', icon:'◐', run:() => api.setTheme(document.body.classList.contains('light') ? 'dark' : 'light')},
        {label:'Copy Python code', group:'Workspace', icon:'⧉', run:() => $('copy-btn').click()},
        {label:'Export main.py', group:'Workspace', icon:'↓', run:() => $('download-btn').click()},
        ...api.examples.map((example, index) => ({label:example.name, group:'Examples', icon:example.icon, run:() => {api.selectExample(index); if (smallScreen()) showPanel('code');}}))
    ];
    function renderPalette() {
        const query = input.value.trim().toLocaleLowerCase();
        matches = commands.filter(c => !query || `${c.label} ${c.group}`.toLocaleLowerCase().includes(query));
        activeIndex = Math.min(activeIndex, Math.max(0, matches.length - 1));
        list.textContent = '';
        if (!matches.length) {
            const empty = document.createElement('div');
            empty.className = 'palette-empty';
            empty.textContent = 'No matching commands';
            list.appendChild(empty);
            return;
        }
        matches.forEach((command, index) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `palette-option${index === activeIndex ? ' active' : ''}`;
            btn.setAttribute('role', 'option');
            btn.setAttribute('aria-selected', String(index === activeIndex));
            const icon = document.createElement('span'); icon.className = 'palette-option-icon'; icon.textContent = command.icon;
            const content = document.createElement('span'); content.className = 'palette-option-name'; content.textContent = command.label;
            const group = document.createElement('span'); group.className = 'palette-option-group'; group.textContent = command.group;
            btn.append(icon, content, group);
            if (command.keys) {const keys = document.createElement('kbd'); keys.textContent = command.keys; btn.append(keys);}
            btn.addEventListener('mouseenter', () => { activeIndex = index; updateActive(); });
            btn.addEventListener('click', () => activate(index));
            list.appendChild(btn);
        });
    }
    function updateActive() {
        list.querySelectorAll('.palette-option').forEach((item, i) => {
            item.classList.toggle('active', i === activeIndex);
            item.setAttribute('aria-selected', String(i === activeIndex));
        });
        list.children[activeIndex]?.scrollIntoView({block:'nearest'});
    }
    function openPalette() {
        if (!overlay.hidden) return;
        previousFocus = document.activeElement;
        overlay.hidden = false;
        input.value = '';
        activeIndex = 0;
        renderPalette();
        input.focus();
    }
    function closePalette() {
        if (overlay.hidden) return;
        overlay.hidden = true;
        previousFocus?.focus?.();
    }
    function activate(index) {
        const cmd = matches[index];
        if (!cmd) return;
        closePalette();
        cmd.run();
    }
    $('command-btn').addEventListener('click', openPalette);
    overlay.addEventListener('click', e => {if (e.target === overlay) closePalette();});
    input.addEventListener('input', () => {activeIndex = 0; renderPalette();});
    input.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') {e.preventDefault(); activeIndex = Math.min(activeIndex + 1, matches.length - 1); updateActive();}
        if (e.key === 'ArrowUp') {e.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); updateActive();}
        if (e.key === 'Enter') {e.preventDefault(); activate(activeIndex);}
        if (e.key === 'Escape') {e.preventDefault(); closePalette();}
        if (e.key === 'Tab') {e.preventDefault();}
    });
    document.addEventListener('keydown', e => {
        const modifier = e.ctrlKey || e.metaKey;
        if (modifier && e.key.toLowerCase() === 'k') {
            e.preventDefault(); e.stopPropagation();
            if (overlay.hidden) openPalette(); else closePalette();
        } else if (modifier && e.shiftKey && e.key.toLowerCase() === 'f') {
            e.preventDefault(); e.stopPropagation();
            setFocus(!document.body.classList.contains('focus-mode'));
        } else if (e.key === 'Escape') {
            if (!overlay.hidden) closePalette();
            else if (document.body.classList.contains('mobile-nav-open')) closeMobileMenu();
            else if (document.body.classList.contains('focus-mode')) setFocus(false);
        }
    }, true);
    // Global shortcut works when the editor itself is not focused (Monaco handles its own).
    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !e.defaultPrevented && !e.target.closest('#editor')) {
            e.preventDefault();
            api.runCode();
        }
    });
})();
