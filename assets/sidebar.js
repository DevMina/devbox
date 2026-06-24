// ── DevBox Sidebar Navigation ──
// Detects if we're at root (index.html) or inside /tools/ and sets paths accordingly

function buildSidebar() {
    const isRoot = !window.location.pathname.includes('/tools/');
    const base = isRoot ? 'tools/' : '';
    const home = isRoot ? 'index.html' : '../index.html';

    const ITEMS = [
        { section: 'Format' },
        { href: 'json.html', label: 'JSON Formatter', dot: '--green' },
        { href: 'xml.html', label: 'XML Formatter', dot: '--orange' },
        { href: 'sqlformat.html', label: 'SQL Formatter', dot: '--orange' },
        { href: 'cssminify.html', label: 'CSS Minifier', dot: '--pink' },
        { href: 'htmlbeautify.html', label: 'HTML Beautifier', dot: '--orange' },
        { href: 'diff.html', label: 'Diff Checker', dot: '--teal' },
        { section: 'Encode' },
        { href: 'base64.html', label: 'Base64', dot: '--blue' },
        { href: 'filebase64.html', label: 'File → Base64', dot: '--blue' },
        { href: 'url.html', label: 'URL Encoder', dot: '--cyan' },
        { href: 'htmlentity.html', label: 'HTML Entities', dot: '--green' },
        { href: 'unicode.html', label: 'Unicode Converter', dot: '--purple' },
        { href: 'morse.html', label: 'Morse Code', dot: '--yellow' },
        { section: 'Generate' },
        { href: 'uuid.html', label: 'UUID', dot: '--orange' },
        { href: 'hash.html', label: 'Hash', dot: '--cyan' },
        { href: 'password.html', label: 'Password', dot: '--pink' },
        { href: 'lorem.html', label: 'Lorem Ipsum', dot: '--cyan' },
        { href: 'asciiart.html', label: 'ASCII Art', dot: '--purple' },
        { href: 'qrcode.html', label: 'QR Code', dot: '--green' },
        { href: 'favicon.html', label: 'Favicon', dot: '--cyan' },
        { href: 'fakedata.html', label: 'Fake Data Generator', dot: '--orange' },
        { section: 'Color' },
        { href: 'color.html', label: 'Color Converter', dot: '--pink' },
        { href: 'contrast.html', label: 'Contrast Checker', dot: '--green' },
        { href: 'colorpalette.html', label: 'Color Palette', dot: '--pink' },
        { href: 'gradient.html', label: 'CSS Gradient', dot: '--pink' },
        { href: 'imagepalette.html', label: 'Image Palette', dot: '--orange' },
        { section: 'Inspect' },
        { href: 'jwt.html', label: 'JWT Decoder', dot: '--purple' },
        { href: 'timestamp.html', label: 'Timestamp', dot: '--yellow' },
        { href: 'regex.html', label: 'Regex Tester', dot: '--red' },
        { href: 'httpstatus.html', label: 'HTTP Status', dot: '--red' },
        { href: 'useragent.html', label: 'User Agent', dot: '--teal' },
        { href: 'keytester.html', label: 'Key Tester', dot: '--blue' },
        { href: 'jsonpath.html', label: 'JSON Path', dot: '--green' },
        { href: 'urlparser.html', label: 'URL Parser', dot: '--cyan' },
        { section: 'Build' },
        { href: 'jwtencoder.html', label: 'JWT Encoder', dot: '--purple' },
        { href: 'headerbuilder.html', label: 'Header Builder', dot: '--purple' },
        { href: 'tablebuilder.html', label: 'Table Builder', dot: '--orange' },
        { href: 'snippets.html', label: 'Snippet Manager', dot: '--teal' },
        { href: 'breakpoints.html', label: 'Breakpoint Tester', dot: '--cyan' },
        { href: 'metatags.html', label: 'Meta Tag Generator', dot: '--purple' },
        { href: 'boxshadow.html', label: 'Box Shadow Builder', dot: '--pink' },
        { href: 'gitignore.html', label: '.gitignore Generator', dot: '--teal' },
        { href: 'curlbuilder.html', label: 'curl Builder', dot: '--cyan' },
        { section: 'Convert' },
        { href: 'numbase.html', label: 'Number Base', dot: '--orange' },
        { href: 'byteconvert.html', label: 'Byte Converter', dot: '--purple' },
        { href: 'aspectratio.html', label: 'Aspect Ratio', dot: '--cyan' },
        { href: 'jsoncsvconvert.html', label: 'JSON ↔ CSV', dot: '--green' },
        { href: 'numberfmt.html', label: 'Number Format', dot: '--red' },
        { href: 'matheval.html', label: 'Math Evaluator', dot: '--yellow' },
        { href: 'yaml.html', label: 'YAML ↔ JSON', dot: '--yellow' },
        { href: 'xmljson.html', label: 'XML ↔ JSON', dot: '--orange' },
        { href: 'unitconvert.html', label: 'Unit Converter', dot: '--cyan' },
        { href: 'toml.html', label: 'TOML ↔ JSON', dot: '--red' },
        { section: 'Text' },
        { href: 'textstats.html', label: 'Text Stats', dot: '--blue' },
        { href: 'charcounter.html', label: 'Char Counter', dot: '--teal' },
        { href: 'caseconvert.html', label: 'Case Converter', dot: '--green' },
        { href: 'linesorter.html', label: 'Line Sorter', dot: '--yellow' },
        { href: 'markdown.html', label: 'Markdown Preview', dot: '--blue' },
        { href: 'textencrypt.html', label: 'Text Encrypt', dot: '--yellow' },
        { href: 'slugify.html', label: 'Slug Generator', dot: '--green' },
        { section: 'Network' },
        { href: 'ipcalc.html', label: 'IP Calculator', dot: '--blue' },
        { href: 'cron.html', label: 'Cron Parser', dot: '--yellow' },
        { href: 'nettools.html', label: 'Network Tools', dot: '--blue' },
        { href: 'seotools.html', label: 'SEO Tools', dot: '--green' },
        { section: 'Productivity' },
        { href: 'pomodoro.html', label: 'Pomodoro Timer', dot: '--red' },
        { href: 'countdown.html', label: 'Countdown', dot: '--pink' },
        { href: 'todo.html', label: 'Todo List', dot: '--blue' },
    ];

    const currentFile = window.location.pathname.split('/').pop() || 'index.html';
    const chevronSVG = `<svg class="sb-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 6 8 10 12 6"/></svg>`;

    const contactHref = home.replace('index.html', '') + 'contact.html';
    let html = `
    <a class="sidebar-logo" href="${home}">
      <div class="logo-mark">{}</div>
      <div class="logo-text">Dev<span>Box</span></div>
    </a>
    <div class="sb-top-actions">
      <button class="theme-toggle" onclick="window.toggleTheme()">
        <span class="theme-toggle-icon">☀️</span>
        <span class="theme-toggle-label">Light mode</span>
      </button>
      <a class="sidebar-contact-link" href="${contactHref}">
        <span class="theme-toggle-icon">✉️</span>
        <span>Contact</span>
      </a>
    </div>
    <div class="sb-nav-controls">
      <button class="sb-expand-all" title="Expand all sections">expand all</button>
      <span class="sb-nav-sep">·</span>
      <button class="sb-collapse-all" title="Collapse all sections">collapse all</button>
    </div>
    <nav class="nav">`;

    let currentSection = null;
    let bodyItems = [];

    function flushSection() {
        if (!currentSection) return;
        const key = currentSection;

        // Only expand the section that contains the active page; collapse everything else
        const hasActive = bodyItems.some(item => currentFile === item.href);
        const isCollapsed = !hasActive;

        html += `
      <div class="nav-group" data-section="${key}">
        <div class="nav-section-label sb-group-header${isCollapsed ? ' collapsed' : ''}" data-key="${key}">
          <span>${key}</span>
          ${chevronSVG}
        </div>
        <div class="sb-group-body${isCollapsed ? ' collapsed' : ''}">`;

        bodyItems.forEach(item => {
            const fullHref = base + item.href;
            const isActive = currentFile === item.href;
            html += `
          <a class="nav-item${isActive ? ' active' : ''}" href="${fullHref}" title="${item.label}">
            <div class="nav-dot" style="background:var(${item.dot})"></div>
            <span>${item.label}</span>
          </a>`;
        });

        html += `
        </div>
      </div>`;

        bodyItems = [];
        currentSection = null;
    }

    ITEMS.forEach(item => {
        if (item.section) {
            flushSection();
            currentSection = item.section;
        } else {
            bodyItems.push(item);
        }
    });
    flushSection();

    html += `</nav>`;
    return html;
}

function initSidebarCollapse() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    // On load: always open the section containing the active item, collapse all others
    sidebar.querySelectorAll('.sb-group-header').forEach(header => {
        const body = header.nextElementSibling;
        const hasActive = body && body.querySelector('.nav-item.active');
        header.classList.toggle('collapsed', !hasActive);
        if (body) body.classList.toggle('collapsed', !hasActive);
    });

    // Accordion: clicking a header opens it and closes all others
    sidebar.addEventListener('click', e => {
        const header = e.target.closest('.sb-group-header');
        if (!header) return;

        const isNowCollapsed = header.classList.toggle('collapsed');
        header.nextElementSibling.classList.toggle('collapsed', isNowCollapsed);

        if (!isNowCollapsed) {
            sidebar.querySelectorAll('.sb-group-header').forEach(h => {
                if (h === header) return;
                h.classList.add('collapsed');
                h.nextElementSibling.classList.add('collapsed');
            });
        }
    });

    // Expand-all / collapse-all buttons
    const expandBtn = sidebar.querySelector('.sb-expand-all');
    const collapseBtn = sidebar.querySelector('.sb-collapse-all');

    if (expandBtn) {
        expandBtn.addEventListener('click', () => {
            sidebar.querySelectorAll('.sb-group-header').forEach(h => {
                h.classList.remove('collapsed');
                h.nextElementSibling.classList.remove('collapsed');
            });
        });
    }
    if (collapseBtn) {
        collapseBtn.addEventListener('click', () => {
            sidebar.querySelectorAll('.sb-group-header').forEach(h => {
                h.classList.add('collapsed');
                h.nextElementSibling.classList.add('collapsed');
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.innerHTML = buildSidebar();
        initSidebarCollapse();
    }
});