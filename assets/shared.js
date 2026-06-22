// ── DevBox Shared Utilities ──

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
  const k = 1024, sizes = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
}

// ── Recently viewed (localStorage) ──
const RECENT_KEY = 'devbox_recent';
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
  } catch(e) {}
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

  const collapsed = localStorage.getItem('devbox_sidebar_collapsed') === '1';
  if (collapsed) {
    sidebar.classList.add('collapsed');
    toggle.innerHTML = '▶';
  }

  toggle.addEventListener('click', () => {
    const isCollapsed = sidebar.classList.toggle('collapsed');
    toggle.innerHTML = isCollapsed ? '▶' : '◀';
    localStorage.setItem('devbox_sidebar_collapsed', isCollapsed ? '1' : '0');
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
    if (e.key === '/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) {
      const search = document.getElementById('searchInput');
      if (search) { e.preventDefault(); search.focus(); }
    }
    // Escape → blur inputs / clear search
    if (e.key === 'Escape') {
      const search = document.getElementById('searchInput');
      if (search && document.activeElement === search) {
        search.value = '';
        search.blur();
        if (typeof filterTools === 'function') filterTools();
      } else if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        document.activeElement.blur();
      }
    }
  });
}

// ── Init everything on DOM ready ──
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  injectBreadcrumb();
  initKeyboard();
  trackPageView();
});
