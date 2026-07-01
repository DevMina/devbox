// ── DevBox Theme Toggle ──
(function () {
    const KEY = 'devbox_theme';

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        try { localStorage.setItem(KEY, theme); } catch (e) { }
        // Update any toggle buttons on the page
        document.querySelectorAll('.theme-toggle').forEach(btn => {
            const icon = btn.querySelector('.theme-toggle-icon');
            const label = btn.querySelector('.theme-toggle-label');
            if (theme === 'light') {
                if (icon) icon.textContent = '🌙';
                if (label) label.textContent = 'Dark mode';
            } else {
                if (icon) icon.textContent = '☀️';
                if (label) label.textContent = 'Light mode';
            }
        });
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        applyTheme(current === 'dark' ? 'light' : 'dark');
    }

    // Apply saved theme immediately (before paint)
    let saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) { }
    const fallback = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
    applyTheme(saved || fallback);

    // Expose globally
    window.toggleTheme = toggleTheme;
    window.applyTheme = applyTheme;
})();
