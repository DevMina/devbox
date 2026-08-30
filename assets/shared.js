// ── DevBox Shared Utilities ──

// ── Browser extension bridge ──
// The DevBox browser extension runs cross-origin (it's injecting a new tab
// navigation, not running inside the page), so it can't write to this site's
// sessionStorage before the page loads the way an in-site "Send to" link
// can. Instead it passes data via a URL parameter, which this bridges into
// the exact same handoff format tool chaining already uses -- one prefill
// mechanism, not two to maintain. Runs immediately (this script is `defer`,
// so it always executes before DOMContentLoaded) so it's in place before any
// page's own receiveHandoff() call runs.
(function bridgeExtensionPrefill() {
    try {
        const params = new URLSearchParams(location.search);
        const encoded = params.get('ext_prefill');
        if (!encoded) return;
        const value = decodeURIComponent(atob(encoded));
        sessionStorage.setItem('devbox_handoff', JSON.stringify({
            value, from: 'DevBox Extension', ts: Date.now(),
        }));
        // Strip the param so it doesn't linger in the URL bar or get shared via copy-link
        params.delete('ext_prefill');
        const clean = location.pathname + (params.toString() ? '?' + params.toString() : '');
        history.replaceState(null, '', clean);
    } catch (e) { /* malformed param or storage unavailable -- ignore, page loads normally */ }
})();

// ── Safe localStorage helpers (storage can throw — disabled cookies/storage,
// strict private-browsing modes, enterprise policies — so every call site
// should degrade gracefully instead of breaking the whole page) ──
function lsGet(key, fallback = null) {
    try { const v = localStorage.getItem(key); return v === null ? fallback : v; }
    catch (e) { return fallback; }
}
function lsSet(key, value) {
    try { localStorage.setItem(key, value); return true; }
    catch (e) { return false; }
}
function lsRemove(key) {
    try { localStorage.removeItem(key); } catch (e) { }
}

// ── Clipboard ──
function copy(text) {
    if (!text || text === '—') return;
    navigator.clipboard.writeText(String(text))
        .then(() => showToast('✓ Copied!'))
        .catch(() => {
            // Fallback for older browsers
            const ta = document.createElement('textarea');
            ta.value = String(text);
            ta.style.cssText = 'position:fixed;opacity:0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            showToast('✓ Copied!');
        });
}

// ── Toast ──
let _toastTimer = null;
function showToast(msg, duration = 2000) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => t.classList.remove('show'), duration);
}

// ── HTML escape ──
function escHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ── Debounce ──
function debounce(fn, ms = 200) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ── Input persistence ──
// Saves a textarea/input value to localStorage and restores it on next visit.
// Tools call: persistInput('myTextareaId', 'devbox_persist_toolname')
// Returns the restored value (or '' if none), so the tool can react to it.
// Keys for tools that handle sensitive data — never persisted to localStorage
const PERSIST_BLOCKED_KEYS = new Set([
    'devbox_persist_jwt', 'devbox_persist_jwtenc',
    'devbox_persist_textencrypt', 'devbox_persist_env',
    'devbox_persist_apikey',
]);

function persistInput(elementId, storageKey, onRestore) {
    // Safety: never persist sensitive tool inputs
    if (PERSIST_BLOCKED_KEYS.has(storageKey)) return '';
    const el = document.getElementById(elementId);
    if (!el) return '';
    // Restore saved value (but defer to shareURL/handoff if present)
    const params = new URLSearchParams(location.search);
    const hasURLData = params.toString().length > 0;
    const hasHandoff = (() => { try { return !!sessionStorage.getItem('devbox_handoff'); } catch(e) { return false; } })();
    if (!hasURLData && !hasHandoff) {
        const saved = lsGet(storageKey, '');
        if (saved) {
            el.value = saved;
            if (typeof onRestore === 'function') onRestore();
        }
    }
    // Save on input (debounced 800ms, max 100KB to avoid filling storage quota)
    const MAX_PERSIST_BYTES = 100 * 1024;
    const save = debounce(() => {
        const val = el.value;
        if (val && val.trim() && val.length <= MAX_PERSIST_BYTES) lsSet(storageKey, val);
        else if (!val || !val.trim()) lsRemove(storageKey);
        // silently skip if over size limit
    }, 800);
    el.addEventListener('input', save);
    return el.value;
}

// ── Most Used tracking ──
// Each tool page calls trackToolUse() on load; shared.js does it automatically
// via trackPageView() for tool pages. The homepage reads the counts to build
// the Most Used row.
const USAGE_KEY = 'devbox_usage';
function trackToolUse() {
    const page = location.pathname.split('/').pop();
    if (!page || page === 'index.html' || !page.endsWith('.html')) return;
    const NON_TOOL_PAGES = new Set(['about.html','contact.html','changelog.html','extension.html']);
    if (NON_TOOL_PAGES.has(page)) return;
    try {
        const counts = JSON.parse(lsGet(USAGE_KEY, '{}'));
        counts[page] = (counts[page] || 0) + 1;
        lsSet(USAGE_KEY, JSON.stringify(counts));
    } catch (e) { }
}
function getMostUsed(limit = 8) {
    try {
        const counts = JSON.parse(lsGet(USAGE_KEY, '{}'));
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([file, count]) => ({ file, count }));
    } catch (e) { return []; }
}

// ── Format file size ──
function fmtBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
}

// ── Recently viewed (localStorage) ──
const RECENT_KEY = 'devbox_recent';

// ── Favourites (shared source of truth for sidebar + homepage) ──
const FAVORITES_KEY = 'devbox_favorites';
function getFavorites() {
    let favs;
    try { favs = JSON.parse(lsGet(FAVORITES_KEY, '[]')); } catch (e) { favs = []; }
    // Migrate legacy entries stored as { href, name } → { file, name } so
    // favourites work the same whether they were starred from a root-level
    // page (index.html) or from inside /tools/.
    let migrated = false;
    favs = favs.map(f => {
        if (!f.file && f.href) { migrated = true; return { file: f.href.split('/').pop(), name: f.name }; }
        return f;
    });
    if (migrated) lsSet(FAVORITES_KEY, JSON.stringify(favs));
    return favs;
}
function isFavorite(file) {
    return getFavorites().some(f => f.file === file);
}
function toggleFavorite(file, name) {
    let favs = getFavorites();
    const exists = favs.find(f => f.file === file);
    if (exists) favs = favs.filter(f => f.file !== file);
    else favs.unshift({ file, name });
    lsSet(FAVORITES_KEY, JSON.stringify(favs));
    document.dispatchEvent(new CustomEvent('devbox:favorites-changed'));
    return !exists;
}
function clearFavorites() {
    lsRemove(FAVORITES_KEY);
    document.dispatchEvent(new CustomEvent('devbox:favorites-changed'));
}

function trackPageView() {
    const page = location.pathname.split('/').pop();
    if (!page || page === 'index.html' || !page.endsWith('.html')) return;
    // Exclude root-level non-tool pages (about, contact, changelog, extension)
    const NON_TOOL_PAGES = new Set(['about.html','contact.html','changelog.html','extension.html']);
    if (NON_TOOL_PAGES.has(page)) return;
    try {
        const title = document.querySelector('.tool-title')?.textContent || page;
        let recent = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
        recent = recent.filter(r => r.page !== page);
        recent.unshift({ page, title, ts: Date.now() });
        recent = recent.slice(0, 8);
        localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
    } catch (e) { }
    trackToolUse();
}

// ── Tool chaining ("Send to →") ──
// Lets a tool's output become another tool's input with one click, via a
// short-lived sessionStorage handoff (cleared on read, and ignored if stale,
// so it never leaks into an unrelated future visit to the destination page).
const HANDOFF_KEY = 'devbox_handoff';

function sendToTool(value, destFile, destLabel) {
    if (!value || !value.trim()) {
        if (typeof showToast === 'function') showToast('Nothing to send yet');
        return;
    }
    try {
        sessionStorage.setItem(HANDOFF_KEY, JSON.stringify({
            value,
            from: document.querySelector('.tool-title')?.textContent || '',
            ts: Date.now(),
        }));
    } catch (e) { /* sessionStorage unavailable -- just navigate without the handoff */ }
    window.location.href = destFile;
}

function receiveHandoff(inputId, onFill) {
    let raw;
    try { raw = sessionStorage.getItem(HANDOFF_KEY); } catch (e) { return; }
    if (!raw) return;
    try { sessionStorage.removeItem(HANDOFF_KEY); } catch (e) { }
    let data;
    try { data = JSON.parse(raw); } catch (e) { return; }
    if (!data || !data.value) return;
    if (Date.now() - (data.ts || 0) > 5 * 60 * 1000) return; // ignore stale handoffs

    const el = document.getElementById(inputId);
    if (!el) return;
    el.value = data.value;
    if (typeof onFill === 'function') onFill();
    if (typeof showToast === 'function') {
        showToast(data.from ? `↩ Received from ${data.from}` : '↩ Input received');
    }
}

// getValue is a function (not a plain string) so the button always sends the
// CURRENT output at click time, not whatever it was when last rendered.
function renderSendTo(containerId, getValue, destinations) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';
    const value = getValue();
    if (!value || !value.trim()) return;

    const wrap = document.createElement('div');
    wrap.className = 'send-to-wrap';
    const label = document.createElement('span');
    label.className = 'send-to-label';
    label.textContent = 'Send to';
    wrap.appendChild(label);
    destinations.forEach(d => {
        const btn = document.createElement('button');
        btn.className = 'send-to-btn';
        btn.textContent = d.label + ' →';
        btn.onclick = () => sendToTool(getValue(), d.href, d.label);
        wrap.appendChild(btn);
    });
    el.appendChild(wrap);
}

// ── Sidebar active state + collapse ──
function initSidebar() {
    const page = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-item').forEach(el => {
        const href = el.getAttribute('href') || '';
        el.classList.toggle('active', href.endsWith(page));
    });

    // Inject collapse toggle button
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    const toggle = document.createElement('button');
    toggle.className = 'sidebar-toggle';
    toggle.title = 'Toggle sidebar (Ctrl+B)';
    toggle.innerHTML = '◀';
    toggle.setAttribute('aria-label', 'Toggle sidebar');
    sidebar.appendChild(toggle);

    const collapsed = lsGet('devbox_sidebar_collapsed') === '1';
    if (collapsed) {
        sidebar.classList.add('collapsed');
        toggle.innerHTML = '▶';
    }

    toggle.addEventListener('click', () => {
        const isCollapsed = sidebar.classList.toggle('collapsed');
        toggle.innerHTML = isCollapsed ? '▶' : '◀';
        lsSet('devbox_sidebar_collapsed', isCollapsed ? '1' : '0');
    });
}

// ── Inject breadcrumb on tool pages ──
function injectBreadcrumb() {
    const header = document.querySelector('.tool-header');
    if (!header) return;
    const isInTools = location.pathname.includes('/tools/');
    if (!isInTools) return;

    const bc = document.createElement('a');
    bc.href = '../index.html';
    bc.className = 'breadcrumb';
    bc.textContent = ' DevBox';
    bc.title = 'Back to all tools';
    header.parentNode.insertBefore(bc, header);
}

// ── Global keyboard shortcuts ──
function initKeyboard() {
    document.addEventListener('keydown', e => {
        // Ctrl/Cmd + B → toggle sidebar
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            document.querySelector('.sidebar-toggle')?.click();
        }
        // Ctrl/Cmd + K → open the command palette (works from any page, not just the homepage)
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (typeof window.openCommandPalette === 'function') {
                window.openCommandPalette();
            } else {
                // Fallback for the unlikely case sidebar.js hasn't loaded yet
                const search = document.getElementById('searchInput');
                if (search) { search.focus(); search.select(); }
            }
        }
        // Single-letter shortcuts → open tool directly (only when no input/textarea/palette focused)
        const TOOL_SHORTCUTS = { j:'tools/json.html', r:'tools/regex.html', b:'tools/base64.html',
                                  u:'tools/uuid.html', k:'tools/jwt.html', t:'tools/timestamp.html',
                                  d:'tools/diff.html', c:'tools/color.html' };
        if (!e.ctrlKey && !e.metaKey && !e.altKey &&
            !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName) &&
            !document.activeElement?.isContentEditable &&
            !document.activeElement?.dataset?.capturesKeys &&
            !(typeof window.isCommandPaletteOpen === 'function' && window.isCommandPaletteOpen()) &&
            !document.getElementById('shortcutsBackdrop')?.classList.contains('open') &&
            !document.getElementById('settingsBackdrop')?.classList.contains('open')) {
            const dest = TOOL_SHORTCUTS[e.key.toLowerCase()];
            if (dest) {
                // Don't navigate if we're already on this page
                const currentPage = location.pathname.split('/').pop();
                const destPage = dest.split('/').pop();
                if (currentPage === destPage) return;
                e.preventDefault();
                // Determine correct base path (root vs /tools/ vs /cheatsheets/)
                const isRoot = !location.pathname.includes('/tools/') && !location.pathname.includes('/cheatsheets/');
                window.location.href = isRoot ? dest : '../' + dest;
            }
        }
        // / → focus search (homepage only, when not in input and no overlay open)
        if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) &&
            !(typeof window.isCommandPaletteOpen === 'function' && window.isCommandPaletteOpen()) &&
            !document.getElementById('shortcutsBackdrop')?.classList.contains('open') &&
            !document.getElementById('settingsBackdrop')?.classList.contains('open')) {
            const search = document.getElementById('searchInput');
            if (search) { e.preventDefault(); search.focus(); }
        }
        // Escape → close overlays / blur inputs / clear search
        if (e.key === 'Escape') {
            // Close command palette
            if (typeof window.isCommandPaletteOpen === 'function' && window.isCommandPaletteOpen()) {
                window.closeCommandPalette();
                return;
            }
            // Close shortcuts overlay
            const shortcutsOpen = document.getElementById('shortcutsBackdrop')?.classList.contains('open');
            if (shortcutsOpen) { closeShortcutsOverlay(); return; }
            // Close settings panel
            const settingsOpen = document.getElementById('settingsBackdrop')?.classList.contains('open');
            if (settingsOpen) { closeSettingsPanel(); return; }
            const search = document.getElementById('searchInput');
            if (search && document.activeElement === search) {
                search.value = '';
                search.blur();
                if (typeof filterTools === 'function') filterTools();
            } else if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
                document.activeElement.blur();
            }
        }
        // ? → toggle shortcuts overlay (when not typing and settings not open)
        if (e.key === '?' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) &&
            !document.getElementById('settingsBackdrop')?.classList.contains('open')) {
            const isOpen = document.getElementById('shortcutsBackdrop')?.classList.contains('open');
            isOpen ? closeShortcutsOverlay() : openShortcutsOverlay();
        }
    });
}


// ── Mobile sidebar hamburger (injected dynamically for tool pages) ──
function initMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    // Inject hamburger button if not already present
    if (!document.getElementById('mobileMenuBtn')) {
        const btn = document.createElement('button');
        btn.id = 'mobileMenuBtn';
        btn.className = 'mobile-menu-btn';
        btn.setAttribute('aria-label', 'Open navigation');
        btn.innerHTML = '<span></span><span></span><span></span>';
        document.body.insertBefore(btn, document.body.firstChild);
    }

    // Inject overlay if not already present
    if (!document.getElementById('sidebarOverlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'sidebarOverlay';
        overlay.className = 'sidebar-overlay';
        document.body.insertBefore(overlay, document.body.firstChild);
    }

    const btn = document.getElementById('mobileMenuBtn');
    const overlay = document.getElementById('sidebarOverlay');

    function openSidebar() {
        sidebar.classList.add('mobile-open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function closeSidebar() {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    btn.addEventListener('click', openSidebar);
    overlay.addEventListener('click', closeSidebar);

    sidebar.addEventListener('click', function (e) {
        if (e.target.closest('.nav-item')) closeSidebar();
    });
}

// ════════════════════════════════════════════════
// SHAREABLE URLS
// ════════════════════════════════════════════════

/**
 * Save a map of { paramKey: elementId } to the URL hash.
 * Call after any tool change that should be shareable.
 * @param {Object} fieldMap  e.g. { q: 'jsonInput', mode: 'modeSelect' }
 */
function saveToURL(fieldMap) {
    const params = new URLSearchParams();
    for (const [key, id] of Object.entries(fieldMap)) {
        const el = document.getElementById(id);
        if (!el) continue;
        const val = el.type === 'checkbox' ? (el.checked ? '1' : '0')
                  : el.value;
        if (val) params.set(key, val);
    }
    const str = params.toString();
    history.replaceState(null, '', str ? '?' + str : location.pathname);
}

/**
 * Load URL params back into form fields and trigger a callback.
 * Returns true if any param was found.
 * @param {Object} fieldMap  same shape as saveToURL
 * @param {Function} [onChange]  called after fields are populated
 */
function loadFromURL(fieldMap, onChange) {
    const params = new URLSearchParams(location.search);
    let found = false;
    for (const [key, id] of Object.entries(fieldMap)) {
        const val = params.get(key);
        if (val === null) continue;
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.type === 'checkbox') el.checked = val === '1';
        else el.value = val;
        found = true;
    }
    if (found && typeof onChange === 'function') onChange();
    return found;
}

/**
 * Inject a "Share" button into a .panel-actions bar by panel selector.
 * Copies the current URL after calling saveToURL.
 */
function injectShareButton(panelBarSelector, onShare) {
    const bar = document.querySelector(panelBarSelector);
    if (!bar) return;
    const btn = document.createElement('button');
    btn.className = 'share-btn';
    btn.innerHTML = '⎘ Share';
    btn.title = 'Copy shareable link';
    btn.addEventListener('click', () => {
        if (typeof onShare === 'function') onShare();
        navigator.clipboard.writeText(location.href)
            .then(() => showToast('🔗 Link copied!'));
    });
    const actions = bar.querySelector('.panel-actions');
    if (actions) actions.prepend(btn);
    else bar.appendChild(btn);
}

// ════════════════════════════════════════════════
// KEYBOARD SHORTCUTS OVERLAY
// ════════════════════════════════════════════════

// Registry of tool-specific shortcuts — tools populate this before shared.js runs
window._toolShortcuts = window._toolShortcuts || [];

function initShortcutsOverlay() {
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
    const mod = isMac ? '⌘' : 'Ctrl';

    // Global shortcuts definition
    const globalShortcuts = [
        { desc: 'Toggle sidebar', keys: [mod, 'B'] },
        { desc: 'Search tools', keys: [mod, 'K'] },
        { desc: 'Search tools (alt)', keys: ['/'] },
        { desc: 'Show keyboard shortcuts', keys: ['?'] },
        { desc: 'Close / dismiss', keys: ['Esc'] },
    ];

    // Quick-navigate shortcuts (single key, no modifier, when no input focused)
    const navShortcuts = [
        { desc: 'JSON Formatter', keys: ['J'] },
        { desc: 'Regex Tester',   keys: ['R'] },
        { desc: 'Base64',         keys: ['B'] },
        { desc: 'UUID Generator', keys: ['U'] },
        { desc: 'JWT Decoder',    keys: ['K'] },
        { desc: 'Timestamp',      keys: ['T'] },
        { desc: 'Diff Checker',   keys: ['D'] },
        { desc: 'Color Converter',keys: ['C'] },
    ];

    // Build modal HTML
    const backdrop = document.createElement('div');
    backdrop.className = 'shortcuts-backdrop';
    backdrop.id = 'shortcutsBackdrop';

    let toolSection = '';
    if (window._toolShortcuts.length) {
        const rows = window._toolShortcuts.map(s =>
            `<div class="shortcut-row">
                <span class="shortcut-desc">${s.desc}</span>
                <span class="shortcut-keys">${s.keys.map(k => `<span class="kbd">${k}</span>`).join('<span style="color:var(--text-dim);font-size:0.7rem">+</span>')}</span>
            </div>`
        ).join('');
        toolSection = `<div class="shortcuts-section"><div class="shortcuts-section-title">This tool</div>${rows}</div>`;
    }

    const globalRows = globalShortcuts.map(s =>
        `<div class="shortcut-row">
            <span class="shortcut-desc">${s.desc}</span>
            <span class="shortcut-keys">${s.keys.map(k => `<span class="kbd">${k}</span>`).join('<span style="color:var(--text-dim);font-size:0.7rem">+</span>')}</span>
        </div>`
    ).join('');

    const navRows = navShortcuts.map(s =>
        `<div class="shortcut-row">
            <span class="shortcut-desc">${s.desc}</span>
            <span class="shortcut-keys">${s.keys.map(k => `<span class="kbd">${k}</span>`).join('')}</span>
        </div>`
    ).join('');

    backdrop.innerHTML = `
        <div class="shortcuts-modal" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
            <div class="shortcuts-modal-header">
                <span class="shortcuts-modal-title">Keyboard Shortcuts</span>
                <button class="shortcuts-close" onclick="closeShortcutsOverlay()" aria-label="Close">✕</button>
            </div>
            ${toolSection}
            <div class="shortcuts-section"><div class="shortcuts-section-title">Global</div>${globalRows}</div>
            <div class="shortcuts-section"><div class="shortcuts-section-title">Quick navigate (when no input focused)</div>${navRows}</div>
        </div>`;

    document.body.appendChild(backdrop);
    backdrop.addEventListener('click', e => { if (e.target === backdrop) closeShortcutsOverlay(); });

    // ? key hint button
    const hint = document.createElement('button');
    hint.className = 'shortcuts-hint';
    hint.innerHTML = '<span class="kbd">?</span> Shortcuts';
    hint.onclick = openShortcutsOverlay;
    document.body.appendChild(hint);
}

function openShortcutsOverlay() {
    document.getElementById('shortcutsBackdrop')?.classList.add('open');
}
function closeShortcutsOverlay() {
    document.getElementById('shortcutsBackdrop')?.classList.remove('open');
}

// ════════════════════════════════════════════════
// DRAG AND DROP — universal file drop helper
// ════════════════════════════════════════════════

/**
 * Make a drop zone element handle file drops.
 * @param {HTMLElement|string} zoneEl  element or selector
 * @param {string[]} accept            accepted MIME types or extensions e.g. ['application/json', '.json']
 * @param {Function} onFile            callback(text, filename)
 */
function initDropZone(zoneEl, accept, onFile) {
    const el = typeof zoneEl === 'string' ? document.querySelector(zoneEl) : zoneEl;
    if (!el) return;

    el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('drag-active'); });
    el.addEventListener('dragleave', e => { if (!el.contains(e.relatedTarget)) el.classList.remove('drag-active'); });
    el.addEventListener('drop', e => {
        e.preventDefault();
        el.classList.remove('drag-active');
        const file = e.dataTransfer.files[0];
        if (!file) return;
        // Check acceptance
        const ok = accept.length === 0 || accept.some(a =>
            a.startsWith('.') ? file.name.endsWith(a) : file.type === a || file.type.startsWith(a.replace('*',''))
        );
        if (!ok) { showToast('⚠ File type not supported'); return; }
        const reader = new FileReader();
        reader.onload = ev => onFile(ev.target.result, file.name);
        reader.readAsText(file);
    });

    // Also handle click → file picker if it has data-clickable
    if (el.dataset.clickable !== undefined) {
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => {
            const inp = document.createElement('input');
            inp.type = 'file';
            if (accept.length) inp.accept = accept.join(',');
            // Some browsers (Firefox, Safari) require a file input to be attached
            // to the document before .click() will open the native picker — an
            // input created and clicked without ever being inserted can fail
            // silently there, even though Chrome tolerates it. Attach it
            // off-screen, then remove it once the selection is handled.
            inp.style.position = 'fixed';
            inp.style.top = '-1000px';
            inp.style.left = '-1000px';
            document.body.appendChild(inp);
            inp.onchange = ev => {
                const file = ev.target.files[0];
                inp.remove();
                if (!file) return;
                const reader = new FileReader();
                reader.onload = e2 => onFile(e2.target.result, file.name);
                reader.readAsText(file);
            };
            // If the user cancels the dialog, 'change' never fires, so the input
            // would otherwise sit in the DOM forever. The window reliably regains
            // focus when the native picker closes either way, so use that as the
            // signal to clean up if no file ended up being selected.
            window.addEventListener('focus', function onFocus() {
                window.removeEventListener('focus', onFocus);
                setTimeout(() => { if (inp.isConnected && !inp.files.length) inp.remove(); }, 300);
            });
            inp.click();
        });
    }
}

// ════════════════════════════════════════════════
// EXPORT / IMPORT SETTINGS
// ════════════════════════════════════════════════

const SETTINGS_KEYS = [
    'devbox_recent',
    'devbox_favorites',
    'devbox_usage',
    'devbox_sidebar_collapsed',
    'devbox_theme',
    'devbox_ws_urls',
    'devbox_snippets',
    'devbox_api_history',
    'devbox_toolkits_open',
];

function exportSettings() {
    const data = { version: 1, exported: new Date().toISOString(), settings: {} };
    for (const key of SETTINGS_KEYS) {
        const val = lsGet(key);
        if (val !== null) data.settings[key] = val;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `devbox-settings-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('✓ Settings exported');
}

function importSettings(jsonText) {
    try {
        const data = JSON.parse(jsonText);
        if (!data.settings) throw new Error('Invalid settings file');
        let count = 0;
        for (const [key, val] of Object.entries(data.settings)) {
            if (SETTINGS_KEYS.includes(key) && lsSet(key, val)) count++;
        }
        showToast(`✓ Imported ${count} setting${count !== 1 ? 's' : ''} — reload to apply`);
        closeSettingsPanel();
    } catch (e) {
        showToast('⚠ Invalid settings file');
    }
}

function openSettingsPanel() {
    let backdrop = document.getElementById('settingsBackdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'settings-backdrop';
        backdrop.id = 'settingsBackdrop';

        const favs = JSON.parse(lsGet('devbox_favorites', '[]')).length;
        const recents = JSON.parse(lsGet('devbox_recent', '[]')).length;
        const usageCounts = Object.keys(JSON.parse(lsGet('devbox_usage', '{}'))).length;

        backdrop.innerHTML = `
            <div class="settings-modal" role="dialog" aria-modal="true" aria-label="Settings">
                <div class="shortcuts-modal-header">
                    <span class="shortcuts-modal-title">Settings & Data</span>
                    <button class="shortcuts-close" onclick="closeSettingsPanel()" aria-label="Close">✕</button>
                </div>

                <div class="settings-row">
                    <div><div class="settings-label">Favorites</div><div class="settings-sub">${favs} tool${favs !== 1 ? 's' : ''} pinned</div></div>
                    <button class="btn btn-ghost" style="font-size:0.72rem" onclick="if(confirm('Clear all favorites?')){clearFavorites();closeSettingsPanel();showToast('Favorites cleared');}">Clear</button>
                </div>
                <div class="settings-row">
                    <div><div class="settings-label">Recent history</div><div class="settings-sub">${recents} item${recents !== 1 ? 's' : ''}</div></div>
                    <button class="btn btn-ghost" style="font-size:0.72rem" onclick="if(confirm('Clear recent history?')){lsRemove('devbox_recent');closeSettingsPanel();showToast('History cleared');}">Clear</button>
                </div>
                <div class="settings-row">
                    <div><div class="settings-label">Most Used</div><div class="settings-sub">${usageCounts} tool${usageCounts !== 1 ? 's' : ''} tracked</div></div>
                    <button class="btn btn-ghost" style="font-size:0.72rem" onclick="if(confirm('Clear usage data?')){lsRemove('devbox_usage');closeSettingsPanel();showToast('Usage data cleared');}">Clear</button>
                </div>
                <div class="settings-row">
                    <div><div class="settings-label">Export settings</div><div class="settings-sub">Favorites, recents, preferences</div></div>
                    <button class="btn btn-ghost" style="font-size:0.72rem" onclick="exportSettings()">Export JSON</button>
                </div>
                <div class="settings-row">
                    <div><div class="settings-label">Import settings</div><div class="settings-sub">Restore from exported file</div></div>
                    <button class="btn btn-ghost" style="font-size:0.72rem" onclick="document.getElementById('settingsFileInput').click()">Import JSON</button>
                </div>
                <div class="settings-row">
                    <div><div class="settings-label">Reset all data</div><div class="settings-sub">Wipe all DevBox localStorage</div></div>
                    <button class="btn btn-ghost" style="font-size:0.72rem;color:var(--red);border-color:var(--red-dim)" onclick="if(confirm('Reset ALL DevBox data?')){['${SETTINGS_KEYS.join("','")}'].forEach(k=>lsRemove(k));document.dispatchEvent(new CustomEvent('devbox:favorites-changed'));document.dispatchEvent(new CustomEvent('devbox:recent-changed'));closeSettingsPanel();showToast('All data cleared');}">Reset</button>
                </div>
                <input type="file" id="settingsFileInput" accept=".json" style="display:none"
                    onchange="const r=new FileReader();r.onload=e=>importSettings(e.target.result);r.readAsText(this.files[0])">
            </div>`;

        document.body.appendChild(backdrop);
        backdrop.addEventListener('click', e => { if (e.target === backdrop) closeSettingsPanel(); });
    }
    backdrop.classList.add('open');
}

function closeSettingsPanel() {
    document.getElementById('settingsBackdrop')?.classList.remove('open');
}

// ════════════════════════════════════════════════
// PWA — Install prompt + service worker
// ════════════════════════════════════════════════

let _pwaInstallEvent = null;

function initPWA() {
    // Register the service worker. It's network-first for HTML (so edits
    // always show up on reload) and only cache-first for static assets --
    // see sw.js for details. A registered SW with a fetch handler is also
    // what makes the install prompt below eligible to fire at all.
    if ('serviceWorker' in navigator) {
        // Both /tools/ and /cheatsheets/ are one level deep from the site
        // root, so both need '../sw.js'. This used to only check for
        // /tools/, which meant every cheatsheet page silently tried (and
        // failed, 404) to register a nonexistent /cheatsheets/sw.js --
        // invisible because the .catch(() => {}) below swallows it.
        const isNested = location.pathname.includes('/tools/') || location.pathname.includes('/cheatsheets/');
        const swPath = isNested ? '../sw.js' : './sw.js';
        navigator.serviceWorker.register(swPath, { scope: isNested ? '../' : './' })
            .catch(() => {}); // Fail silently if not served over HTTPS
    }

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        _pwaInstallEvent = e;

        // Always show the persistent sidebar install button
        const sbBtn = document.getElementById('sbInstallBtn');
        if (sbBtn) sbBtn.style.display = '';

        // Show banner if not dismissed before
        if (lsGet('devbox_pwa_dismissed')) return;

        const banner = document.createElement('div');
        banner.className = 'pwa-banner';
        banner.id = 'pwaBanner';
        banner.setAttribute('role', 'alert');
        banner.setAttribute('aria-live', 'assertive');
        banner.innerHTML = `
            <div class="pwa-banner-text">
                <div class="pwa-banner-title">Install DevBox</div>
                <div class="pwa-banner-sub">Add to home screen for offline access</div>
            </div>
            <button class="btn btn-green" style="font-size:0.75rem;padding:5px 12px;flex-shrink:0" onclick="installPWA()">Install</button>
            <button class="pwa-dismiss" onclick="dismissPWABanner()" aria-label="Dismiss">✕</button>`;
        document.body.appendChild(banner);
        setTimeout(() => banner.classList.add('show'), 800);
    });
}

function installPWA() {
    if (!_pwaInstallEvent) return;
    _pwaInstallEvent.prompt();
    _pwaInstallEvent.userChoice.then(result => {
        if (result.outcome === 'accepted') {
            showToast('✓ DevBox installed!');
            const sbBtn = document.getElementById('sbInstallBtn');
            if (sbBtn) sbBtn.style.display = 'none';
        }
        _pwaInstallEvent = null;
        dismissPWABanner();
    });
}

function dismissPWABanner() {
    const banner = document.getElementById('pwaBanner');
    if (banner) banner.classList.remove('show');
    lsSet('devbox_pwa_dismissed', '1');
}

// ════════════════════════════════════════════════
// BACK TO TOP BUTTON
// ════════════════════════════════════════════════

function initBackToTop() {
    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.innerHTML = '↑';
    btn.setAttribute('aria-label', 'Back to top');
    btn.title = 'Back to top';
    document.body.appendChild(btn);

    let ticking = false;
    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            btn.classList.toggle('show', window.scrollY > 300);
            ticking = false;
        });
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ── Embed mode ──
// When a tool page is loaded inside an <iframe> via a snippet from the Embed
// Generator (tools/embed.html), the URL carries ?embed=1. This hides the
// sidebar/footer and adds a small "Powered by DevBox" badge linking back to
// the full page — the embedding site gets a clean widget, DevBox gets a
// visible attribution/discovery link wherever it's embedded.
function initEmbedMode() {
    const params = new URLSearchParams(location.search);
    if (params.get('embed') !== '1') return;

    document.documentElement.classList.add('embed-mode');

    const canonical = location.href.replace(/[?&]embed=1/, '').replace(/\?$/, '');
    const badge = document.createElement('a');
    badge.className = 'embed-badge';
    badge.href = canonical;
    badge.target = '_blank';
    badge.rel = 'noopener noreferrer';
    badge.innerHTML = '⚡ Powered by <strong>DevBox</strong>';
    document.body.appendChild(badge);
}

// ── Init everything on DOM ready ──
document.addEventListener('DOMContentLoaded', () => {
    // Skip navigation link — keyboard accessibility
    const main = document.querySelector('main.content-wrap');
    if (main && !document.getElementById('main-content')) {
        main.id = 'main-content';
        const skip = document.createElement('a');
        skip.href = '#main-content';
        skip.className = 'skip-nav';
        skip.textContent = 'Skip to main content';
        document.body.insertBefore(skip, document.body.firstChild);
    }

    // Semantic headings — tool pages use <div class="tool-title"> instead of <h1>
    // Add role="heading" aria-level="1" so screen readers announce them correctly
    document.querySelectorAll('.tool-title, .contact-hero-title, .about-hero-title, .hero-title, .notfound-title')
        .forEach(el => {
            if (!el.getAttribute('role')) {
                el.setAttribute('role', 'heading');
                el.setAttribute('aria-level', '1');
            }
        });
    // Section-level headings (h2 equivalent)
    document.querySelectorAll('.panel-label, .about-section-title, .section-header, .related-tools-header, .toolkit-name')
        .forEach(el => {
            if (!el.getAttribute('role')) {
                el.setAttribute('role', 'heading');
                el.setAttribute('aria-level', '2');
            }
        });

    initEmbedMode();
    initSidebar();
    initMobileSidebar();
    injectBreadcrumb();
    initKeyboard();
    initShortcutsOverlay();
    initPWA();
    initBackToTop();
    trackPageView();
    injectRelatedTools();

    // Platform-aware keyboard hint (tool pages have no search bar, so safe to try)
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
    const hint = document.querySelector('.search-hint');
    if (hint) hint.innerHTML = isMac
        ? '<span class="kbd">⌘K</span> or <span class="kbd">/</span>'
        : '<span class="kbd">Ctrl+K</span> or <span class="kbd">/</span>';

    // Update sidebar toggle label for platform
    const toggle = document.querySelector('.sidebar-toggle');
    if (toggle) toggle.title = `Toggle sidebar (${isMac ? '⌘B' : 'Ctrl+B'})`;
});

// ════════════════════════════════════════════════
// RELATED TOOLS
// ════════════════════════════════════════════════

const RELATED_TOOLS = {
    'json.html':        ['jsonpath.html','jsonschema.html','jsoncsvconvert.html','yaml.html','diff.html'],
    'jsonschema.html':  ['json.html','jsonpath.html','xmljson.html','diff.html'],
    'jsonpath.html':    ['json.html','jsonschema.html','jsoncsvconvert.html','regex.html'],
    'jsoncsvconvert.html': ['json.html','yaml.html','xmljson.html','tablebuilder.html','diff.html'],
    'yaml.html':        ['json.html','toml.html','xmljson.html','diff.html','envparser.html'],
    'toml.html':        ['yaml.html','json.html','envparser.html','diff.html'],
    'xmljson.html':     ['xml.html','json.html','jsoncsvconvert.html','diff.html'],
    'xml.html':         ['xmljson.html','json.html','htmlbeautify.html','diff.html'],
    'sqlformat.html':   ['diff.html','regex.html','tablebuilder.html'],
    'cssminify.html':   ['htmlbeautify.html','gradient.html','boxshadow.html','pxrem.html'],
    'htmlbeautify.html':['cssminify.html','metatags.html','htmlentity.html','diff.html'],
    'envparser.html':   ['yaml.html','diff.html','stringescape.html'],
    'diff.html':        ['regex.html','textstats.html','linesorter.html','json.html'],
    'regex.html':       ['diff.html','textstats.html','linesorter.html','caseconvert.html'],
    'useragent.html':   ['urlparser.html','nettools.html','httpstatus.html'],
    'keytester.html':   ['regex.html','charcounter.html'],
    'urlparser.html':   ['url.html','curlbuilder.html','apitester.html','nettools.html'],
    'seotools.html':    ['metatags.html','urlparser.html','textstats.html','slugify.html'],
    'base64.html':      ['filebase64.html','url.html','textencrypt.html','stringescape.html'],
    'filebase64.html':  ['base64.html','imagepalette.html','favicon.html'],
    'url.html':         ['urlparser.html','base64.html','htmlentity.html','curlbuilder.html'],
    'htmlentity.html':  ['htmlbeautify.html','url.html','unicode.html','stringescape.html'],
    'unicode.html':     ['htmlentity.html','stringescape.html','charcounter.html'],
    'stringescape.html':['base64.html','unicode.html','json.html','regex.html'],
    'morse.html':       ['base64.html','caseconvert.html','charcounter.html'],
    'password.html':    ['textencrypt.html','hash.html','uuid.html'],
    'textencrypt.html': ['password.html','hash.html','base64.html'],
    'jwt.html':         ['jwtencoder.html','base64.html','apitester.html','hash.html'],
    'jwtencoder.html':  ['jwt.html','hash.html','apitester.html','base64.html'],
    'uuid.html':        ['hash.html','password.html','fakedata.html','lorem.html'],
    'lorem.html':       ['fakedata.html','textstats.html','charcounter.html','markdown.html'],
    'fakedata.html':    ['uuid.html','lorem.html','jsoncsvconvert.html','tablebuilder.html'],
    'qrcode.html':      ['url.html','base64.html','embed.html'],
    'favicon.html':     ['svgtools.html','imagepalette.html','metatags.html','color.html'],
    'hash.html':        ['password.html','textencrypt.html','base64.html','uuid.html'],
    'color.html':       ['contrast.html','colorpalette.html','gradient.html','colorblind.html'],
    'contrast.html':    ['color.html','colorblind.html','colorpalette.html'],
    'colorpalette.html':['color.html','imagepalette.html','gradient.html','contrast.html'],
    'imagepalette.html':['colorpalette.html','color.html','favicon.html','svgtools.html'],
    'colorblind.html':  ['contrast.html','color.html','colorpalette.html'],
    'gradient.html':    ['color.html','boxshadow.html','cssminify.html','cssgrid.html'],
    'boxshadow.html':   ['gradient.html','flexbox.html','cssgrid.html','cssminify.html'],
    'flexbox.html':     ['cssgrid.html','boxshadow.html','breakpoints.html','cssminify.html'],
    'cssgrid.html':     ['flexbox.html','breakpoints.html','boxshadow.html','cssminify.html'],
    'breakpoints.html': ['flexbox.html','cssgrid.html','pxrem.html','cssminify.html'],
    'curlbuilder.html': ['apitester.html','headerbuilder.html','urlparser.html','httpstatus.html'],
    'apitester.html':   ['curlbuilder.html','graphql.html','httpstatus.html','headerbuilder.html'],
    'graphql.html':     ['apitester.html','openapi.html','json.html','curlbuilder.html'],
    'websocket.html':   ['apitester.html','nettools.html','httpstatus.html'],
    'openapi.html':     ['apitester.html','graphql.html','json.html','headerbuilder.html'],
    'nettools.html':    ['ipcalc.html','urlparser.html','apitester.html','httpstatus.html'],
    'ipcalc.html':      ['nettools.html','urlparser.html'],
    'httpstatus.html':  ['apitester.html','curlbuilder.html','headerbuilder.html','nettools.html'],
    'headerbuilder.html':['apitester.html','curlbuilder.html','metatags.html','httpstatus.html'],
    'tablebuilder.html':['jsoncsvconvert.html','json.html','markdown.html','lorem.html'],
    'metatags.html':    ['seotools.html','headerbuilder.html','htmlbeautify.html','slugify.html'],
    'gitignore.html':   ['diff.html','envparser.html','snippets.html'],
    'svgtools.html':    ['favicon.html','cssminify.html','imagepalette.html','color.html'],
    'embed.html':       ['qrcode.html','metatags.html','htmlbeautify.html'],
    'numbase.html':     ['byteconvert.html','matheval.html','unitconvert.html','numberfmt.html'],
    'byteconvert.html': ['numbase.html','unitconvert.html','matheval.html'],
    'aspectratio.html': ['pxrem.html','unitconvert.html','breakpoints.html'],
    'pxrem.html':       ['aspectratio.html','unitconvert.html','breakpoints.html','cssminify.html'],
    'numberfmt.html':   ['numbase.html','matheval.html','byteconvert.html'],
    'matheval.html':    ['numbase.html','numberfmt.html','unitconvert.html'],
    'unitconvert.html': ['byteconvert.html','numbase.html','pxrem.html','aspectratio.html'],
    'timestamp.html':   ['cron.html','countdown.html','matheval.html','numberfmt.html'],
    'cron.html':        ['timestamp.html','regex.html','countdown.html'],
    'textstats.html':   ['charcounter.html','diff.html','linesorter.html','markdown.html'],
    'charcounter.html': ['textstats.html','caseconvert.html','slugify.html'],
    'caseconvert.html': ['slugify.html','linesorter.html','textstats.html','regex.html'],
    'linesorter.html':  ['diff.html','textstats.html','caseconvert.html','regex.html'],
    'markdown.html':    ['textstats.html','htmlbeautify.html','diff.html','tablebuilder.html'],
    'asciiart.html':    ['textstats.html','caseconvert.html','charcounter.html'],
    'slugify.html':     ['caseconvert.html','urlparser.html','seotools.html','charcounter.html'],
    'pomodoro.html':    ['countdown.html','todo.html','snippets.html'],
    'countdown.html':   ['pomodoro.html','timestamp.html','todo.html'],
    'todo.html':        ['snippets.html','pomodoro.html','countdown.html'],
    'snippets.html':    ['todo.html','markdown.html','gitignore.html','diff.html'],
};

// Label map built from SIDEBAR_ITEMS (sidebar.js loads after shared.js,
// so we resolve lazily on first call)
let _relatedLabelMap = null;
function getRelatedLabelMap() {
    if (_relatedLabelMap) return _relatedLabelMap;
    _relatedLabelMap = {};
    if (typeof SIDEBAR_ITEMS !== 'undefined') {
        SIDEBAR_ITEMS.forEach(item => {
            if (item.href) _relatedLabelMap[item.href] = { label: item.label, dot: item.dot || '--text-dim' };
        });
    }
    return _relatedLabelMap;
}

function injectRelatedTools() {
    const page = window.location.pathname.split('/').pop();
    const related = RELATED_TOOLS[page];
    if (!related || !related.length) return;
    // Guard against double injection
    if (document.querySelector('.related-tools-section')) return;

    // Resolve labels (sidebar.js has loaded by now since this is called on DOMContentLoaded)
    const map = getRelatedLabelMap();
    const items = related.map(href => ({
        href,
        label: (map[href] && map[href].label) || href.replace('.html',''),
        dot: (map[href] && map[href].dot) || '--text-dim',
    }));

    const section = document.createElement('div');
    section.className = 'related-tools-section';
    section.innerHTML = `
        <div class="related-tools-header">Related tools</div>
        <div class="related-tools-list">
            ${items.map(t => `
            <a class="related-tool-chip" href="${t.href}">
                <span class="related-dot" style="background:var(${t.dot})"></span>
                ${t.label}
            </a>`).join('')}
        </div>`;

    // Append before the site footer, or at end of content-wrap
    const footer = document.querySelector('.site-footer');
    if (footer) footer.parentNode.insertBefore(section, footer);
    else {
        const wrap = document.querySelector('.content-wrap') || document.querySelector('main');
        if (wrap) wrap.appendChild(section);
    }
}

