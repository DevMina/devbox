// ── DevBox Shared Utilities ──

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
    try {
        const title = document.querySelector('.tool-title')?.textContent || page;
        let recent = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
        recent = recent.filter(r => r.page !== page);
        recent.unshift({ page, title, ts: Date.now() });
        recent = recent.slice(0, 8);
        localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
    } catch (e) { }
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
        // Ctrl/Cmd + K → focus search (on homepage)
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            const search = document.getElementById('searchInput');
            if (search) { e.preventDefault(); search.focus(); search.select(); }
        }
        // / → focus search (homepage only, when not in input)
        if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
            const search = document.getElementById('searchInput');
            if (search) { e.preventDefault(); search.focus(); }
        }
        // Escape → close overlays / blur inputs / clear search
        if (e.key === 'Escape') {
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
        // ? → open shortcuts overlay (when not typing)
        if (e.key === '?' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
            openShortcutsOverlay();
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

    backdrop.innerHTML = `
        <div class="shortcuts-modal" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
            <div class="shortcuts-modal-header">
                <span class="shortcuts-modal-title">Keyboard Shortcuts</span>
                <button class="shortcuts-close" onclick="closeShortcutsOverlay()" aria-label="Close">✕</button>
            </div>
            ${toolSection}
            <div class="shortcuts-section"><div class="shortcuts-section-title">Global</div>${globalRows}</div>
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
    'devbox_sidebar_collapsed',
    'devbox_theme',
    'devbox_ws_urls',
    'devbox_snippets',
    'devbox_api_history',
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
                    <div><div class="settings-label">Export settings</div><div class="settings-sub">Favorites, recents, preferences</div></div>
                    <button class="btn btn-ghost" style="font-size:0.72rem" onclick="exportSettings()">Export JSON</button>
                </div>
                <div class="settings-row">
                    <div><div class="settings-label">Import settings</div><div class="settings-sub">Restore from exported file</div></div>
                    <button class="btn btn-ghost" style="font-size:0.72rem" onclick="document.getElementById('settingsFileInput').click()">Import JSON</button>
                </div>
                <div class="settings-row">
                    <div><div class="settings-label">Reset all data</div><div class="settings-sub">Wipe all DevBox localStorage</div></div>
                    <button class="btn btn-ghost" style="font-size:0.72rem;color:var(--red);border-color:var(--red-dim)" onclick="if(confirm('Reset ALL DevBox data?')){['${SETTINGS_KEYS.join("','")}'].forEach(k=>lsRemove(k));document.dispatchEvent(new CustomEvent('devbox:favorites-changed'));closeSettingsPanel();showToast('All data cleared');}">Reset</button>
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
    // Service worker retired — see sw.js for why it's kept as a kill switch
    // rather than deleted outright. New visitors no longer register one.
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
            regs.forEach(reg => {
                // If an old worker is somehow already controlling this page,
                // point it at the retirement script so it cleans itself up.
                reg.update().catch(() => {});
            });
        }).catch(() => {});
    }

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        _pwaInstallEvent = e;

        // Show banner if not dismissed before
        if (lsGet('devbox_pwa_dismissed')) return;

        const banner = document.createElement('div');
        banner.className = 'pwa-banner';
        banner.id = 'pwaBanner';
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
        if (result.outcome === 'accepted') showToast('✓ DevBox installed!');
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

// ── Init everything on DOM ready ──
document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initMobileSidebar();
    injectBreadcrumb();
    initKeyboard();
    initShortcutsOverlay();
    initPWA();
    initBackToTop();
    trackPageView();

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
