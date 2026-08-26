// ── DevBox Sidebar Navigation ──
// Detects if we're at root (index.html), inside /tools/, or inside /cheatsheets/
// and sets relative paths accordingly.

const SIDEBAR_ITEMS = [
    { section: 'Format' },
    { href: 'json.html', shortcut: 'J', label: 'JSON Formatter', dot: '--green', tags: ['json','format','pretty','beautify','minify','validate','lint'] },
    { href: 'jsonschema.html', label: 'JSON Schema Generator', dot: '--yellow', tags: ['json','schema','validate','draft'] },
    { href: 'xml.html', label: 'XML Formatter', dot: '--orange', tags: ['xml','format','pretty','beautify','minify'] },
    { href: 'sqlformat.html', label: 'SQL Formatter', dot: '--orange', tags: ['sql','format','query','database','prettier'] },
    { href: 'cssminify.html', label: 'CSS Minifier', dot: '--pink', tags: ['css','minify','compress','beautify','format'] },
    { href: 'htmlbeautify.html', label: 'HTML Beautifier', dot: '--orange', tags: ['html','format','beautify','pretty','indent'] },
    { href: 'envparser.html', label: '.env Parser', dot: '--yellow', tags: ['env','dotenv','environment','variables','config'] },

    { section: 'Inspect' },
    { href: 'diff.html', shortcut: 'D', label: 'Diff Checker', dot: '--teal', tags: ['diff','compare','text','changes','delta'] },
    { href: 'regex.html', shortcut: 'R', label: 'Regex Tester', dot: '--red', tags: ['regex','regexp','pattern','match','test','live'] },
    { href: 'jsonpath.html', label: 'JSON Path', dot: '--green', tags: ['json','jsonpath','query','jq','extract'] },
    { href: 'useragent.html', label: 'User Agent', dot: '--teal', tags: ['useragent','browser','ua','parse','detect'] },
    { href: 'keytester.html', label: 'Key Tester', dot: '--blue', tags: ['key','keyboard','keycode','event','shortcut'] },
    { href: 'urlparser.html', label: 'URL Parser', dot: '--cyan', tags: ['url','parse','query','params','uri'] },
    { href: 'seotools.html', label: 'SEO Tools', dot: '--green', tags: ['seo','meta','title','description','open graph'] },

    { section: 'Encode' },
    { href: 'base64.html', shortcut: 'B', label: 'Base64', dot: '--blue', tags: ['base64','encode','decode','binary','string'] },
    { href: 'filebase64.html', label: 'File → Base64', dot: '--blue', tags: ['file','base64','encode','upload','binary','image'] },
    { href: 'url.html', label: 'URL Encoder', dot: '--cyan', tags: ['url','encode','decode','percent','uri','escape'] },
    { href: 'htmlentity.html', label: 'HTML Entities', dot: '--green', tags: ['html','entities','encode','decode','escape','ampersand'] },
    { href: 'unicode.html', label: 'Unicode Converter', dot: '--purple', tags: ['unicode','utf','character','code point','escape'] },
    { href: 'stringescape.html', label: 'String Escape', dot: '--purple', tags: ['string','escape','unescape','json','backslash'] },
    { href: 'morse.html', label: 'Morse Code', dot: '--yellow', tags: ['morse','code','encode','decode','dots','dashes'] },

    { section: 'Security' },
    { href: 'password.html', label: 'Password', dot: '--pink', tags: ['password','generate','random','secure','strength'] },
    { href: 'textencrypt.html', label: 'Text Encrypt', dot: '--yellow', tags: ['encrypt','decrypt','aes','cipher','crypto','secure'] },
    { href: 'jwt.html', shortcut: 'K', label: 'JWT Decoder', dot: '--purple', tags: ['jwt','token','decode','auth','bearer','claims','payload'] },
    { href: 'jwtencoder.html', label: 'JWT Encoder', dot: '--purple', tags: ['jwt','token','encode','sign','auth','hmac'] },

    { section: 'Generate' },
    { href: 'uuid.html', shortcut: 'U', label: 'UUID', dot: '--orange', tags: ['uuid','guid','generate','random','v4','unique','id'] },
    { href: 'lorem.html', label: 'Lorem Ipsum', dot: '--cyan', tags: ['lorem','ipsum','placeholder','text','dummy','filler'] },
    { href: 'fakedata.html', label: 'Fake Data Generator', dot: '--orange', tags: ['fake','data','mock','generate','name','address','email'] },
    { href: 'qrcode.html', label: 'QR Code', dot: '--green', tags: ['qr','qrcode','generate','scan','barcode','url'] },
    { href: 'favicon.html', label: 'Favicon', dot: '--cyan', tags: ['favicon','icon','png','ico','generate'] },
    { href: 'hash.html', label: 'Hash Generator', dot: '--cyan', tags: ['hash','md5','sha','sha256','checksum','digest'] },

    { section: 'Color' },
    { href: 'color.html', shortcut: 'C', label: 'Color Converter', dot: '--pink', tags: ['color','hex','rgb','hsl','convert','picker'] },
    { href: 'contrast.html', label: 'Contrast Checker', dot: '--green', tags: ['contrast','wcag','accessibility','a11y','color','ratio'] },
    { href: 'colorpalette.html', label: 'Color Palette', dot: '--pink', tags: ['color','palette','swatch','generate','shades'] },
    { href: 'imagepalette.html', label: 'Image Palette', dot: '--orange', tags: ['image','color','palette','extract','dominant'] },
    { href: 'colorblind.html', label: 'Color Blindness Sim', dot: '--pink', tags: ['colorblind','accessibility','simulate','vision','a11y'] },

    { section: 'CSS Builders' },
    { href: 'gradient.html', label: 'CSS Gradient', dot: '--pink', tags: ['css','gradient','linear','radial','background','generate'] },
    { href: 'boxshadow.html', label: 'Box Shadow Builder', dot: '--pink', tags: ['css','box-shadow','shadow','generate','builder'] },
    { href: 'flexbox.html', label: 'Flexbox Generator', dot: '--cyan', tags: ['css','flexbox','flex','layout','generate'] },
    { href: 'cssgrid.html', label: 'CSS Grid Generator', dot: '--green', tags: ['css','grid','layout','generate','columns'] },
    { href: 'breakpoints.html', label: 'Breakpoint Tester', dot: '--cyan', tags: ['css','breakpoints','responsive','viewport','media query'] },

    { section: 'API & Network' },
    { href: 'curlbuilder.html', label: 'curl Builder', dot: '--cyan', tags: ['curl','http','request','command','api'] },
    { href: 'apitester.html', label: 'API Tester', dot: '--teal', tags: ['api','http','rest','request','get','post','fetch','test'] },
    { href: 'graphql.html', label: 'GraphQL Playground', dot: '--pink', tags: ['graphql','api','query','mutation','playground'] },
    { href: 'websocket.html', label: 'WebSocket Client', dot: '--green', tags: ['websocket','ws','real-time','connection','test'] },
    { href: 'openapi.html', label: 'OpenAPI Viewer', dot: '--purple', tags: ['openapi','swagger','spec','api','viewer','docs'] },
    { href: 'nettools.html', label: 'Network Tools', dot: '--blue', tags: ['network','dns','ping','whois','lookup','ip'] },
    { href: 'ipcalc.html', label: 'IP Calculator', dot: '--blue', tags: ['ip','cidr','subnet','mask','network','calculate'] },
    { href: 'httpstatus.html', label: 'HTTP Status', dot: '--red', tags: ['http','status','code','200','404','500','response'] },

    { section: 'Build' },
    { href: 'headerbuilder.html', label: 'Header Builder', dot: '--purple', tags: ['http','header','cors','csp','security','build'] },
    { href: 'tablebuilder.html', label: 'Table Builder', dot: '--orange', tags: ['table','html','csv','markdown','generate','builder'] },
    { href: 'metatags.html', label: 'Meta Tag Generator', dot: '--purple', tags: ['meta','seo','og','open graph','twitter','html'] },
    { href: 'gitignore.html', label: '.gitignore Generator', dot: '--teal', tags: ['gitignore','git','ignore','generate','template'] },
    { href: 'svgtools.html', label: 'SVG Optimizer', dot: '--orange', tags: ['svg','optimize','minify','compress','vector'] },
    { href: 'embed.html', label: 'Embed Generator', dot: '--teal', tags: ['embed','iframe','widget','snippet','blog','share'] },

    { section: 'Convert' },
    { href: 'numbase.html', label: 'Number Base', dot: '--orange', tags: ['number','base','binary','hex','octal','decimal','convert'] },
    { href: 'byteconvert.html', label: 'Byte Converter', dot: '--purple', tags: ['byte','kb','mb','gb','convert','size','units'] },
    { href: 'aspectratio.html', label: 'Aspect Ratio', dot: '--cyan', tags: ['aspect','ratio','16:9','resolution','convert','size'] },
    { href: 'pxrem.html', label: 'px ↔ rem', dot: '--cyan', tags: ['px','rem','em','convert','css','unit','font'] },
    { href: 'jsoncsvconvert.html', label: 'JSON ↔ CSV', dot: '--green', tags: ['json','csv','convert','table','import','export'] },
    { href: 'numberfmt.html', label: 'Number Format', dot: '--red', tags: ['number','format','locale','currency','thousands','separator'] },
    { href: 'matheval.html', label: 'Math Evaluator', dot: '--yellow', tags: ['math','evaluate','expression','calculate','formula'] },
    { href: 'yaml.html', label: 'YAML ↔ JSON', dot: '--yellow', tags: ['yaml','json','convert','config','parse'] },
    { href: 'xmljson.html', label: 'XML ↔ JSON', dot: '--orange', tags: ['xml','json','convert','parse','transform'] },
    { href: 'unitconvert.html', label: 'Unit Converter', dot: '--cyan', tags: ['unit','convert','length','weight','temperature','metric'] },
    { href: 'toml.html', label: 'TOML ↔ JSON', dot: '--red', tags: ['toml','json','convert','config','rust','cargo'] },
    { href: 'timestamp.html', shortcut: 'T', label: 'Date & Time Tools', dot: '--yellow', tags: ['date','time','timestamp','epoch','unix','convert','format'] },
    { href: 'cron.html', label: 'Cron Parser', dot: '--yellow', tags: ['cron','schedule','parse','job','time','expression'] },

    { section: 'Text' },
    { href: 'textstats.html', label: 'Text Stats', dot: '--blue', tags: ['text','words','count','stats','characters','reading time'] },
    { href: 'charcounter.html', label: 'Char Counter', dot: '--teal', tags: ['character','count','limit','twitter','sms','text'] },
    { href: 'caseconvert.html', label: 'Case Converter', dot: '--green', tags: ['case','uppercase','lowercase','camel','snake','title'] },
    { href: 'linesorter.html', label: 'Line Sorter', dot: '--yellow', tags: ['line','sort','deduplicate','unique','alphabetical','text'] },
    { href: 'markdown.html', label: 'Markdown Preview', dot: '--blue', tags: ['markdown','preview','render','md','html'] },
    { href: 'asciiart.html', label: 'ASCII Art', dot: '--purple', tags: ['ascii','art','text','font','figlet','banner'] },
    { href: 'slugify.html', label: 'Slug Generator', dot: '--green', tags: ['slug','url','generate','seo','kebab','convert'] },

    { section: 'Productivity' },
    { href: 'pomodoro.html', label: 'Pomodoro Timer', dot: '--red', tags: ['pomodoro','timer','focus','productivity','25min'] },
    { href: 'countdown.html', label: 'Countdown', dot: '--pink', tags: ['countdown','timer','deadline','date','event'] },
    { href: 'todo.html', label: 'Todo List', dot: '--blue', tags: ['todo','tasks','list','checklist','notes'] },
    { href: 'snippets.html', label: 'Snippet Manager', dot: '--teal', tags: ['snippet','code','save','manager','notes','clipboard'] },

    { section: 'Cheatsheets' },
    { href: 'regex-cheatsheet.html', label: 'Regex Cheatsheet', dot: '--blue', cs: true, tags: ['regex','cheatsheet','reference','pattern'] },
    { href: 'git.html', label: 'Git Cheatsheet', dot: '--orange', cs: true, tags: ['git','cheatsheet','commands','reference'] },
    { href: 'bash.html', label: 'Bash & Linux Cheatsheet', dot: '--green', cs: true, tags: ['bash','linux','shell','cheatsheet','terminal'] },
    { href: 'docker.html', label: 'Docker Cheatsheet', dot: '--cyan', cs: true, tags: ['docker','container','cheatsheet','devops'] },
];

function buildSidebar() {
    const path = window.location.pathname;
    const isInTools = path.includes('/tools/');
    const isInCheatsheets = path.includes('/cheatsheets/');
    const isRoot = !isInTools && !isInCheatsheets;

    // Base path to reach TOOL pages from wherever we currently are
    const base = isRoot ? 'tools/' : (isInTools ? '' : '../tools/');
    // Base path to reach CHEATSHEET pages from wherever we currently are
    const csBase = isRoot ? 'cheatsheets/' : (isInCheatsheets ? '' : '../cheatsheets/');
    const home = isRoot ? 'index.html' : '../index.html';

    const ITEMS = SIDEBAR_ITEMS;

    const currentFile = window.location.pathname.split('/').pop() || 'index.html';
    const chevronSVG = `<svg class="sb-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 6 8 10 12 6"/></svg>`;
    const favFiles = new Set((typeof getFavorites === 'function' ? getFavorites() : []).map(f => f.file));
    const favBtn = (file, label, starred) => `<button class="sb-fav-btn${starred ? ' starred' : ''}" title="${starred ? 'Remove from favourites' : 'Add to favourites'}" aria-label="Toggle favourite" onclick="toggleSidebarFavorite(event,'${file}','${label.replace(/'/g, "\\'")}')">${starred ? '★' : '☆'}</button>`;

    const contactHref = home.replace('index.html', '') + 'contact.html';
    const changelogHref = home.replace('index.html', '') + 'changelog.html';
    const extensionHref = home.replace('index.html', '') + 'extension.html';
    const aboutHref = home.replace('index.html', '') + 'about.html';
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
    const kbdHint = isMac ? '⌘ K' : 'Ctrl K';

    let html = `
    <a class="sidebar-logo" href="${home}">
      <div class="logo-mark">{}</div>
      <div class="logo-text">Dev<span>Box</span></div>
    </a>
    <button class="sb-search-trigger" onclick="window.openCommandPalette && window.openCommandPalette()">
      <span class="cmd-palette-icon">🔍</span>
      <span>Search tools…</span>
      <span class="cmd-palette-hint">${kbdHint}</span>
    </button>
    <div class="sb-top-actions">
      <button class="theme-toggle" onclick="window.toggleTheme()">
        <span class="theme-toggle-icon">☀️</span>
        <span class="theme-toggle-label">Light mode</span>
      </button>
      <a class="sidebar-contact-link" href="${changelogHref}">
        <span class="theme-toggle-icon">✓</span>
        <span>Changelog</span>
      </a>
      <a class="sidebar-contact-link" href="${extensionHref}">
        <span class="theme-toggle-icon">🧩</span>
        <span>Extension</span>
      </a>
      <a class="sidebar-contact-link" href="${contactHref}">
        <span class="theme-toggle-icon">✉️</span>
        <span>Contact</span>
      </a>
      <a class="sidebar-contact-link" href="${aboutHref}">
        <span class="theme-toggle-icon">ℹ️</span>
        <span>About</span>
      </a>
      <a class="sidebar-contact-link" href="https://github.com/devmina/devbox" target="_blank" rel="noopener noreferrer">
        <span class="theme-toggle-icon">⎇</span>
        <span>GitHub</span>
      </a>
      <button type="button" class="sidebar-contact-link sb-install-btn" id="sbInstallBtn" onclick="installPWA()" style="display:none;width:100%;text-align:left;background:none;border:none;cursor:pointer">
        <span class="theme-toggle-icon">⬇</span>
        <span>Install DevBox</span>
      </button>
    </div>
    <div class="sb-nav-controls">
      <button class="sb-expand-all" title="Expand all sections">expand all</button>
      <span class="sb-nav-sep">·</span>
      <button class="sb-collapse-all" title="Collapse all sections">collapse all</button>
    </div>
    <nav class="nav" aria-label="DevBox tools">`;

    // Pinned favourites — sits above the category accordion, but collapses
    // the same way the other sections do.
    if (favFiles.size) {
        const byFile = {};
        ITEMS.forEach(item => { if (item.href) byFile[item.href] = item; });
        const favList = typeof getFavorites === 'function' ? getFavorites() : [];
        const hasActive = favList.some(f => currentFile === f.file);
        const isCollapsed = !hasActive;
        html += `
      <div class="nav-group nav-group-favorites" data-section="Favourites">
        <div class="nav-section-label sb-group-header${isCollapsed ? ' collapsed' : ''}" data-key="Favourites">
          <span>★ Favourites</span>
          ${chevronSVG}
        </div>
        <div class="sb-group-body${isCollapsed ? ' collapsed' : ''}">`;
        favList.forEach(f => {
            const item = byFile[f.file];
            const label = item ? item.label : f.name;
            const dot = item ? item.dot : '--text-dim';
            const itemBase = item && item.cs ? csBase : base;
            const isActive = currentFile === f.file;
            html += `
          <a class="nav-item${isActive ? ' active' : ''}" href="${itemBase + f.file}" title="${label}">
            <div class="nav-dot" style="background:var(${dot})"></div>
            <span>${label}</span>
            ${favBtn(f.file, label, true)}
          </a>`;
        });
        html += `
        </div>
      </div>`;
    }

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
            const fullHref = (item.cs ? csBase : base) + item.href;
            const isActive = currentFile === item.href;
            html += `
          <a class="nav-item${isActive ? ' active' : ''}" href="${fullHref}" title="${item.label}">
            <div class="nav-dot" style="background:var(${item.dot})"></div>
            <span>${item.label}</span>
            ${favBtn(item.href, item.label, favFiles.has(item.href))}
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

    // Accordion: clicking a header opens it and closes all others.
    // sidebar.innerHTML gets replaced on re-renders (e.g. favourites changing),
    // but the #sidebar element itself persists, so this delegated listener is
    // only attached once — otherwise every re-render would stack another one.
    if (!sidebar.dataset.collapseInit) {
        sidebar.dataset.collapseInit = '1';
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
    }

    // Expand-all / collapse-all buttons are recreated on every render, so
    // it's safe (and necessary) to re-attach these each time.
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

// Star toggle on sidebar nav items — lets people favourite/unfavourite a
// tool from anywhere, not just the homepage.
function toggleSidebarFavorite(e, file, label) {
    e.preventDefault();
    e.stopPropagation();
    if (typeof toggleFavorite === 'function') toggleFavorite(file, label);
}

function renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    // Preserve whichever accordion sections are currently open across the rebuild
    const openKeys = new Set();
    sidebar.querySelectorAll('.sb-group-header:not(.collapsed)').forEach(h => openKeys.add(h.dataset.key));

    sidebar.innerHTML = buildSidebar();
    initSidebarCollapse();

    sidebar.querySelectorAll('.sb-group-header').forEach(h => {
        if (openKeys.has(h.dataset.key)) {
            h.classList.remove('collapsed');
            h.nextElementSibling.classList.remove('collapsed');
        }
    });

    if (typeof window.applyTheme === 'function') {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        window.applyTheme(currentTheme);
    }
}

document.addEventListener('DOMContentLoaded', renderSidebar);
document.addEventListener('devbox:favorites-changed', renderSidebar);

// ════════════════════════════════════════════════
// Command palette — a global fuzzy-search launcher for jumping to any tool
// or cheatsheet from anywhere on the site via Cmd/Ctrl+K, instead of only
// being able to search from the homepage.
// ════════════════════════════════════════════════

function getPaletteEntries() {
    const pth = window.location.pathname;
    const isInTools = pth.includes('/tools/');
    const isInCheatsheets = pth.includes('/cheatsheets/');
    const isRoot = !isInTools && !isInCheatsheets;
    const toolsBase = isRoot ? 'tools/' : (isInTools ? '' : '../tools/');
    const csBase = isRoot ? 'cheatsheets/' : (isInCheatsheets ? '' : '../cheatsheets/');
    const home = isRoot ? 'index.html' : '../index.html';
    const rootBase = isRoot ? '' : '../';

    // Actions (no href — executed via action callback)
    const actions = [
        {
            label: 'Toggle Dark / Light Mode', section: 'Actions', icon: '☀️', dot: '--text-dim',
            action: () => { if (typeof window.toggleTheme === 'function') window.toggleTheme(); }
        },
        {
            label: 'Clear Recent History', section: 'Actions', icon: '🕐', dot: '--text-dim',
            action: () => { lsRemove('devbox_recent'); if (typeof showToast === 'function') showToast('Recent history cleared'); }
        },
        {
            label: 'Clear All Favorites', section: 'Actions', icon: '★', dot: '--text-dim',
            action: () => { if (typeof clearFavorites === 'function') clearFavorites(); if (typeof showToast === 'function') showToast('Favorites cleared'); }
        },
        {
            label: 'Open Settings & Data', section: 'Actions', icon: '⚙', dot: '--text-dim',
            action: () => { if (typeof openSettingsPanel === 'function') openSettingsPanel(); }
        },
    ];

    const pages = [
        { label: 'Home', section: 'Pages', href: home, dot: '--text-dim', icon: '⌂' },
        { label: 'About DevBox', section: 'Pages', href: rootBase + 'about.html', dot: '--text-dim', icon: 'ℹ' },
        { label: 'Changelog', section: 'Pages', href: rootBase + 'changelog.html', dot: '--text-dim', icon: '✓' },
        { label: 'Browser Extension', section: 'Pages', href: rootBase + 'extension.html', dot: '--text-dim', icon: '🧩' },
        { label: 'Contact / Suggest a tool', section: 'Pages', href: rootBase + 'contact.html', dot: '--text-dim', icon: '✉' },
        { label: 'GitHub Source', section: 'Pages', href: 'https://github.com/devmina/devbox', dot: '--text-dim', icon: '⎇' },
    ];

    const toolEntries = [];
    let currentSection = '';
    SIDEBAR_ITEMS.forEach(item => {
        if (item.section) { currentSection = item.section; return; }
        toolEntries.push({
            label: item.label,
            section: currentSection,
            href: (item.cs ? csBase : toolsBase) + item.href,
            dot: item.dot,
            icon: null,
            tags: item.tags || [],
            shortcut: item.shortcut || null,
        });
    });
    return [...actions, ...pages, ...toolEntries];
}

let _paletteEntries = null;
let _paletteSelected = 0;
let _paletteFiltered = [];

function buildCommandPaletteDOM() {
    if (document.getElementById('cmdPaletteBackdrop')) return;

    const backdrop = document.createElement('div');
    backdrop.className = 'cmd-palette-backdrop';
    backdrop.id = 'cmdPaletteBackdrop';
    backdrop.innerHTML = `
        <div class="cmd-palette" role="dialog" aria-modal="true" aria-label="Search tools">
            <div class="cmd-palette-input-row">
                <span class="cmd-palette-icon">🔍</span>
                <input type="text" id="cmdPaletteInput" aria-label="Search tools and actions" placeholder="Jump to a tool or cheatsheet…" autocomplete="off" spellcheck="false">
                <span class="cmd-palette-hint">Esc</span>
            </div>
            <div class="cmd-palette-results" id="cmdPaletteResults" role="list" aria-label="Search results"></div>
        </div>`;
    document.body.appendChild(backdrop);

    const input = document.getElementById('cmdPaletteInput');

    backdrop.addEventListener('mousedown', e => {
        if (e.target === backdrop) closeCommandPalette();
    });

    input.addEventListener('input', () => {
        renderPaletteResults(input.value);
    });

    input.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            movePaletteSelection(1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            movePaletteSelection(-1);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const chosen = _paletteFiltered[_paletteSelected];
            if (!chosen) return;
            closeCommandPalette();
            if (typeof chosen.action === 'function') chosen.action();
            else if (chosen.href) window.location.href = chosen.href;
        }
        // Escape is handled centrally in shared.js's initKeyboard, which checks
        // isCommandPaletteOpen() -- kept in one place rather than duplicated.
    });
}

function fuzzyScore(text, query) {
    // Returns a numeric score; higher = better match. -1 = no match.
    text = text.toLowerCase();
    if (text === query) return 100;
    if (text.startsWith(query)) return 80;
    if (text.includes(query)) return 60;
    // All query words present as substrings
    const words = query.split(/\s+/).filter(Boolean);
    if (words.length > 1 && words.every(w => text.includes(w))) return 50;
    // Any single query word present
    if (words.some(w => w.length > 1 && text.includes(w))) return 30;
    // Character-sequence fuzzy: all chars appear in order
    let ti = 0;
    for (let qi = 0; qi < query.length; qi++) {
        ti = text.indexOf(query[qi], ti);
        if (ti === -1) return -1;
        ti++;
    }
    return 10;
}

function renderPaletteResults(query) {
    const q = query.trim().toLowerCase();
    if (!q) {
        _paletteFiltered = _paletteEntries;
    } else {
        const scored = _paletteEntries.map(e => {
            const labelScore = fuzzyScore(e.label, q);
            const sectionScore = fuzzyScore(e.section || '', q);
            const tagScore = (e.tags || []).reduce((best, t) => Math.max(best, fuzzyScore(t, q)), -1);
            const score = Math.max(labelScore, sectionScore * 0.6, tagScore * 0.8);
            return { entry: e, score };
        }).filter(x => x.score > 0);
        scored.sort((a, b) => b.score - a.score);
        _paletteFiltered = scored.map(x => x.entry);
    }
    _paletteSelected = 0;

    const results = document.getElementById('cmdPaletteResults');
    if (!_paletteFiltered.length) {
        results.innerHTML = `<div class="cmd-palette-empty">No matches for "${query.replace(/</g, '&lt;')}"</div>`;
        return;
    }

    // Render with section dividers
    let html = '';
    let lastSection = null;
    let itemIdx = 0;
    const sliced = _paletteFiltered.slice(0, 50);
    sliced.forEach((e) => {
        if (e.section !== lastSection) {
            html += `<div class="cmd-palette-section-label">${e.section || 'Tools'}</div>`;
            lastSection = e.section;
        }
        const isAction = typeof e.action === 'function';
        const tag = isAction ? 'button' : 'a';
        const hrefAttr = isAction ? '' : `href="${e.href}"`;
        html += `<${tag} class="cmd-palette-item${itemIdx === 0 ? ' selected' : ''}" ${hrefAttr} data-idx="${itemIdx}" data-action-idx="${isAction ? _paletteEntries.indexOf(e) : ''}">
            ${e.icon ? `<span class="cmd-palette-item-icon">${e.icon}</span>` : `<div class="nav-dot" style="background:var(${e.dot})"></div>`}
            <span class="cmd-palette-item-label">${e.label}</span>
            ${e.shortcut ? `<kbd class="cmd-palette-shortcut">${e.shortcut}</kbd>` : ''}
            ${e.section && !isAction ? `<span class="cmd-palette-item-section">${e.section}</span>` : ''}
        </${tag}>`;
        itemIdx++;
    });
    results.innerHTML = html;

    results.querySelectorAll('.cmd-palette-item').forEach(el => {
        el.addEventListener('mouseenter', () => {
            _paletteSelected = parseInt(el.dataset.idx, 10);
            updatePaletteSelection();
        });
        // Handle action buttons
        if (el.tagName === 'BUTTON') {
            el.addEventListener('click', () => {
                const entry = _paletteFiltered[parseInt(el.dataset.idx, 10)];
                if (entry && typeof entry.action === 'function') {
                    closeCommandPalette();
                    entry.action();
                }
            });
        }
    });
}

function movePaletteSelection(delta) {
    if (!_paletteFiltered.length) return;
    _paletteSelected = (_paletteSelected + delta + _paletteFiltered.length) % _paletteFiltered.length;
    updatePaletteSelection();
}

function updatePaletteSelection() {
    const results = document.getElementById('cmdPaletteResults');
    results.querySelectorAll('.cmd-palette-item').forEach((el, i) => {
        el.classList.toggle('selected', i === _paletteSelected);
    });
    const selectedEl = results.querySelector('.cmd-palette-item.selected');
    if (selectedEl) selectedEl.scrollIntoView({ block: 'nearest' });
}

function isCommandPaletteOpen() {
    return document.getElementById('cmdPaletteBackdrop')?.classList.contains('open') || false;
}

function openCommandPalette() {
    buildCommandPaletteDOM();
    _paletteEntries = getPaletteEntries();
    const backdrop = document.getElementById('cmdPaletteBackdrop');
    const input = document.getElementById('cmdPaletteInput');
    input.value = '';
    renderPaletteResults('');
    backdrop.classList.add('open');
    // Store the element that triggered the palette so we can return focus on close
    openCommandPalette._trigger = document.activeElement;
    // Focus after the element is actually visible, or some browsers won't focus it
    requestAnimationFrame(() => input.focus());
}

function closeCommandPalette() {
    const backdrop = document.getElementById('cmdPaletteBackdrop');
    if (backdrop) backdrop.classList.remove('open');
    // Return focus to the element that triggered the palette
    const trigger = openCommandPalette._trigger;
    if (trigger && typeof trigger.focus === 'function') {
        requestAnimationFrame(() => trigger.focus());
    }
}

window.openCommandPalette = openCommandPalette;
window.closeCommandPalette = closeCommandPalette;
window.isCommandPaletteOpen = isCommandPaletteOpen;