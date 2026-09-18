/* DevBox homepage JavaScript */
function loadContinue() {
            try {
                const recent = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
                if (!recent.length) { document.getElementById('continueSection').style.display = 'none'; return; }
                const last = recent[0];
                const CS_FILES = new Set(['bash.html','docker.html','git.html','regex-cheatsheet.html']);
                const href = CS_FILES.has(last.page) ? `cheatsheets/${last.page}` : `tools/${last.page}`;
                document.getElementById('continueToolName').textContent = last.title;
                const cl = document.getElementById('continueLink');
                cl.href = href;
                cl.setAttribute('aria-label', 'Continue: open ' + last.title);
                document.getElementById('continueSection').style.display = '';
            } catch(e) {}
        }

        function loadRecent() {
            try {
                const recent = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
                const section = document.getElementById('recentSection');
                if (!recent.length) {
                    document.getElementById('continueSection').style.display = 'none';
                    if (section) section.style.display = 'none';
                    return;
                }
                const CS_FILES = new Set(['bash.html','docker.html','git.html','regex-cheatsheet.html']);
                const list = document.getElementById('recentList');
                section.style.display = '';
                list.innerHTML = recent.map(r => {
                    const href = CS_FILES.has(r.page) ? `cheatsheets/${r.page}` : `tools/${r.page}`;
                    return `<a href="${href}" style="display:inline-flex;align-items:center;gap:7px;padding:6px 12px;background:var(--surface);border:1px solid var(--border);border-radius:8px;text-decoration:none;font-size:0.78rem;color:var(--text-dim);font-family:var(--mono);transition:all 0.14s;white-space:nowrap"
                               onmouseover="this.style.color='var(--text)';this.style.borderColor='var(--border2)'"
                               onmouseout="this.style.color='var(--text-dim)';this.style.borderColor='var(--border)'">
                                ${escHtmlIdx(r.title)}
                            </a>`;
                }).join('');
            } catch (e) { }
        }

        function clearRecent() {
            localStorage.removeItem(RECENT_KEY);
            document.getElementById('recentSection').style.display = 'none';
            document.getElementById('continueSection').style.display = 'none';
        }

        // ── Curated Popular (shown to first-time visitors before usage data exists) ──
        const CURATED_POPULAR = [
            { file: 'json.html',       name: 'JSON Formatter',   href: 'tools/json.html' },
            { file: 'jwt.html',        name: 'JWT Decoder',      href: 'tools/jwt.html' },
            { file: 'regex.html',      name: 'Regex Tester',     href: 'tools/regex.html' },
            { file: 'apitester.html',  name: 'API Tester',       href: 'tools/apitester.html' },
            { file: 'base64.html',     name: 'Base64',           href: 'tools/base64.html' },
            { file: 'uuid.html',       name: 'UUID Generator',   href: 'tools/uuid.html' },
            { file: 'color.html',      name: 'Color Converter',  href: 'tools/color.html' },
            { file: 'timestamp.html',  name: 'Date & Time',      href: 'tools/timestamp.html' },
        ];

        // ── Most Used ──
        function loadMostUsed() {
            try {
                let mostUsed = getMostUsed(8);
                const useCurated = !mostUsed.length;
                if (useCurated) {
                    mostUsed = CURATED_POPULAR.map(t => ({ file: t.file, count: 0, _curated: true, _href: t.href, _name: t.name }));
                }
                // Look up names from the DOM tool cards
                const cardMap = {};
                document.querySelectorAll('.tool-card').forEach(card => {
                    const href = card.getAttribute('href') || '';
                    const file = href.split('/').pop();
                    const name = card.querySelector('.tool-name')?.textContent || file;
                    if (file) cardMap[file] = name;
                });
                const section = document.getElementById('mostUsedSection');
                const list = document.getElementById('mostUsedList');
                const rendered = mostUsed
                    .map(({ file, count, _curated, _href, _name }) => {
                        const name = _name || cardMap[file];
                        if (!name) return '';
                        const CS_FILES_MU = new Set(['bash.html','docker.html','git.html','regex-cheatsheet.html']);
                        const href = _href || ((!_curated && CS_FILES_MU.has(file)) ? `cheatsheets/${file}` : `tools/${file}`);
                        const titleAttr = _curated ? 'Popular tool' : `${count} visit${count !== 1 ? 's' : ''}`;
                        return `<a href="${escHtmlIdx(href)}" title="${titleAttr}" style="display:inline-flex;align-items:center;gap:7px;padding:6px 12px;background:var(--surface);border:1px solid var(--border);border-radius:8px;text-decoration:none;font-size:0.78rem;color:var(--text-dim);font-family:var(--mono);transition:all 0.14s;white-space:nowrap"
                               onmouseover="this.style.color='var(--text)';this.style.borderColor='var(--border2)'"
                               onmouseout="this.style.color='var(--text-dim)';this.style.borderColor='var(--border)'">${escHtmlIdx(name)}</a>`;
                    })
                    .filter(Boolean)
                    .join('');
                if (!rendered) return;
                if (useCurated) {
                    const lbl = document.getElementById('mostUsedLabel');
                    if (lbl) lbl.textContent = '⭐ Popular';
                    const clearBtn = document.getElementById('mostUsedClearBtn');
                    if (clearBtn) clearBtn.style.display = 'none';
                }
                list.innerHTML = rendered;
                section.style.display = '';
            } catch (e) { }
        }

        function clearMostUsed() {
            lsRemove(USAGE_KEY);
            // Reset label and clear button visibility, then reload with curated
            const lbl = document.getElementById('mostUsedLabel');
            const clearBtn = document.getElementById('mostUsedClearBtn');
            if (lbl) lbl.textContent = '🔥 Most Used';
            if (clearBtn) clearBtn.style.display = '';
            document.getElementById('mostUsedSection').style.display = 'none';
            loadMostUsed();
        }

        function escHtmlIdx(s) {
            return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }

        // ── What's New toggle ──
        let _whatsNewOpen = true;
        function toggleWhatsNew() {
            _whatsNewOpen = !_whatsNewOpen;
            document.getElementById('whatsNewList').style.display = _whatsNewOpen ? '' : 'none';
            document.getElementById('whatsNewToggle').classList.toggle('open', _whatsNewOpen);
            const hdr = document.getElementById('whatsNewHeader');
            if (hdr) hdr.setAttribute('aria-expanded', String(_whatsNewOpen));
        }

        // Toolkits toggle — persists state in localStorage
        (function initToolkits() {
            const stored = localStorage.getItem('devbox_toolkits_open');
            const open = stored === null ? true : stored === '1';
            if (!open) {
                document.getElementById('toolkitsBody').style.display = 'none';
                document.getElementById('toolkitsToggle').classList.remove('open');
                const hdr = document.getElementById('toolkitsHeader');
                if (hdr) hdr.setAttribute('aria-expanded', 'false');
            }
        })();
        function toggleToolkits() {
            const body    = document.getElementById('toolkitsBody');
            const chevron = document.getElementById('toolkitsToggle');
            const header  = document.getElementById('toolkitsHeader');
            const isOpen  = body.style.display !== 'none';
            body.style.display = isOpen ? 'none' : '';
            chevron.classList.toggle('open', !isOpen);
            if (header) header.setAttribute('aria-expanded', String(!isOpen));
            try { localStorage.setItem('devbox_toolkits_open', isOpen ? '0' : '1'); } catch(e) {}
        }

        // ── Category Filter ──
        let _activeFilter = 'all';
        function setFilter(btn, filter) {
            _activeFilter = filter;
            document.querySelectorAll('.filter-tab').forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
            if (filter !== 'all') {
                document.getElementById('searchInput').value = '';
                document.getElementById('searchClear').classList.remove('show');
            }
            // Reset keyboard navigation state when filter changes
            _searchFocusIdx = -1;
            document.querySelectorAll('.tool-card.search-hover').forEach(c => c.classList.remove('search-hover'));
            filterTools();
        }

        function homepageFuzzyMatch(text, q) {
            if (!q) return true;
            if (text.includes(q)) return true;
            const words = q.split(/\s+/).filter(Boolean);
            if (words.length > 1 && words.every(w => text.includes(w))) return true;
            if (words.some(w => w.length > 1 && text.includes(w))) return true;
            // character-sequence fuzzy
            let ti = 0;
            for (let qi = 0; qi < q.length; qi++) {
                ti = text.indexOf(q[qi], ti);
                if (ti === -1) return false;
                ti++;
            }
            return true;
        }

        function filterTools() {
            const q = document.getElementById('searchInput').value.toLowerCase().trim();
            // If user typed in search, reset category filter to "all"
            if (q && _activeFilter !== 'all') {
                _activeFilter = 'all';
                document.querySelectorAll('.filter-tab').forEach(t => {
                    t.classList.remove('active');
                    t.setAttribute('aria-pressed', 'false');
                });
                const allTab = document.querySelector('.filter-tab[data-filter="all"]');
                if (allTab) { allTab.classList.add('active'); allTab.setAttribute('aria-pressed', 'true'); }
            }
            const sections = document.querySelectorAll('.section');
            let anyVisible = false;
            sections.forEach(section => {
                const sectionName = section.dataset.section || '';
                if (_activeFilter !== 'all' && sectionName !== _activeFilter) {
                    section.style.display = 'none';
                    return;
                }
                const cards = section.querySelectorAll('.tool-card');
                let sectionHasVisible = false;
                cards.forEach(card => {
                    const name = card.querySelector('.tool-name').textContent.toLowerCase();
                    const desc = card.querySelector('.tool-desc').textContent.toLowerCase();
                    const tags = (card.dataset.tags || '').toLowerCase();
                    const combined = `${name} ${desc} ${tags} ${sectionName.toLowerCase()}`;
                    const match = !q || homepageFuzzyMatch(combined, q);
                    card.style.display = match ? '' : 'none';
                    if (match) { sectionHasVisible = true; anyVisible = true; }
                });
                section.style.display = sectionHasVisible ? '' : 'none';
            });
            document.getElementById('noResults').style.display = anyVisible || (!q && _activeFilter === 'all') ? 'none' : 'block';
            // Hide toolkits when a search query is active OR a specific category is filtered
            const toolkits = document.getElementById('toolkitsSection');
            if (toolkits) toolkits.style.display = (q || _activeFilter !== 'all') ? 'none' : '';
        // Dynamic section counts — show visible count (filtered) / total
        document.querySelectorAll('.section').forEach(section => {
            const allCards     = section.querySelectorAll('.tool-card');
            const visibleCards = [...allCards].filter(c => c.style.display !== 'none');
            const badge = section.querySelector('.section-count');
            if (badge) {
                const total   = allCards.length;
                const visible = visibleCards.length;
                badge.textContent = (q || _activeFilter !== 'all') ? `${visible}/${total}` : total;
                badge.setAttribute('aria-label', `${visible} of ${total} tools`);
            }
        });
        }


        // Platform-aware keyboard hint
        const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
        const hint = document.querySelector('.search-hint');
        if (hint) hint.innerHTML = isMac ? '<span class="kbd">⌘K</span> or <span class="kbd">/</span>' : '<span class="kbd">Ctrl+K</span> or <span class="kbd">/</span>';

        function clearSearch() {
            document.getElementById('searchInput').value = '';
            document.getElementById('searchClear').classList.remove('show');
            filterTools();
            document.getElementById('searchInput').focus();
        }

        const _origInput = document.getElementById('searchInput');
        _origInput.addEventListener('input', function () {
            document.getElementById('searchClear').classList.toggle('show', this.value.length > 0);
        });

        function toggleFav(e, file, name) {
            e.preventDefault(); e.stopPropagation();
            toggleFavorite(file, name); // shared.js — dispatches 'devbox:favorites-changed'
        }

        function renderFavBtn(btn, starred) {
            btn.textContent = starred ? '★' : '☆';
            btn.title = starred ? 'Remove from favourites' : 'Add to favourites';
            btn.classList.toggle('starred', starred);
        }

        function loadFavourites() {
            const favs = getFavorites();
            const section = document.getElementById('favSection');
            const list = document.getElementById('favList');
            if (!favs.length) { section.style.display = 'none'; return; }
            const CS_FILES = new Set(['bash.html','docker.html','git.html','regex-cheatsheet.html']);
            section.style.display = 'block';
            list.innerHTML = favs.map(f => {
                const href = CS_FILES.has(f.file) ? `cheatsheets/${escHtmlIdx(f.file)}` : `tools/${escHtmlIdx(f.file)}`;
                return `<a href="${href}" style="display:inline-flex;align-items:center;gap:7px;padding:6px 12px;background:var(--surface);border:1px solid var(--border);border-radius:8px;text-decoration:none;font-size:0.78rem;color:var(--text-dim);font-family:var(--mono);transition:all 0.14s;white-space:nowrap"
                           onmouseover="this.style.color='var(--text)';this.style.borderColor='var(--border2)'"
                           onmouseout="this.style.color='var(--text-dim)';this.style.borderColor='var(--border)'">
                            ★ ${escHtmlIdx(f.name)}
                        </a>`;
            }).join('');
        }

        function clearFavourites() {
            clearFavorites(); // shared.js — dispatches 'devbox:favorites-changed'
        }

        function injectOpenTabBtns() {
            document.querySelectorAll('.tool-card').forEach(card => {
                if (card.querySelector('.open-tab-btn')) return;
                const btn = document.createElement('a');
                btn.className = 'open-tab-btn';
                btn.href = card.getAttribute('href');
                btn.target = '_blank';
                btn.rel = 'noopener noreferrer';
                btn.title = 'Open in new tab';
                btn.setAttribute('aria-label', 'Open ' + (card.querySelector('.tool-name')?.textContent || '') + ' in new tab');
                btn.innerHTML = '&#8599;'; // ↗
                btn.addEventListener('click', e => e.stopPropagation());
                card.appendChild(btn);
            });
        }

        function injectFavBtns() {
            document.querySelectorAll('.tool-card').forEach(card => {
                const file = card.getAttribute('href').split('/').pop();
                const name = card.querySelector('.tool-name')?.textContent || '';
                const starred = isFavorite(file);
                let btn = card.querySelector('.fav-btn');
                if (!btn) {
                    btn = document.createElement('button');
                    btn.className = 'fav-btn';
                    btn.setAttribute('aria-label', 'Toggle favourite');
                    btn.addEventListener('click', e => toggleFav(e, file, name));
                    card.appendChild(btn);
                }
                renderFavBtn(btn, starred);
            });
        }

        document.addEventListener('devbox:favorites-changed', () => {
            injectFavBtns();
            injectOpenTabBtns();
            injectOpenTabBtns();
            loadFavourites();
        });

        document.addEventListener('devbox:recent-changed', () => {
            loadContinue();
            loadRecent();
        });

        let _searchFocusIdx = -1;
        function getVisibleCards() {
            return [...document.querySelectorAll('.tool-card')].filter(c => c.style.display !== 'none');
        }

        document.getElementById('searchInput').addEventListener('keydown', e => {
            const q = document.getElementById('searchInput').value.trim();
            if (!q) return;
            const cards = getVisibleCards();
            if (!cards.length) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                _searchFocusIdx = Math.min(_searchFocusIdx + 1, cards.length - 1);
                cards.forEach((c, i) => c.classList.toggle('search-hover', i === _searchFocusIdx));
                cards[_searchFocusIdx]?.scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                _searchFocusIdx = Math.max(_searchFocusIdx - 1, 0);
                cards.forEach((c, i) => c.classList.toggle('search-hover', i === _searchFocusIdx));
                cards[_searchFocusIdx]?.scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'Enter' && _searchFocusIdx >= 0) {
                e.preventDefault();
                cards[_searchFocusIdx]?.click();
            } else {
                _searchFocusIdx = -1;
            }
        });

        document.getElementById('searchInput').addEventListener('input', () => {
            _searchFocusIdx = -1;
            document.querySelectorAll('.tool-card.search-hover').forEach(c => c.classList.remove('search-hover'));
        });

        document.addEventListener('keydown', e => {
            if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
                e.preventDefault();
                document.getElementById('searchInput').focus();
            }
            if (e.key === 'Escape') {
                document.getElementById('searchInput').value = '';
                document.getElementById('searchClear').classList.remove('show');
                filterTools();
                document.getElementById('searchInput').blur();
                _searchFocusIdx = -1;
                document.querySelectorAll('.tool-card.search-hover').forEach(c => c.classList.remove('search-hover'));
            }
        });

        document.addEventListener('DOMContentLoaded', () => {
            // Single source of truth for tool count — derived from SIDEBAR_ITEMS
            if (typeof SIDEBAR_ITEMS !== 'undefined') {
                const count = SIDEBAR_ITEMS.filter(i => i.href && !i.cs).length;
                document.querySelectorAll('[data-tool-count]').forEach(el => el.textContent = count);
            }
            injectFavBtns();
            injectOpenTabBtns();
            loadFavourites();
            loadContinue();
            loadRecent();
            loadMostUsed();
            filterTools(); // ensure section counts and noResults state are correct on load
            // Auto-focus search if navigated here via #search (e.g. from 404 page)
            if (location.hash === '#search') {
                const si = document.getElementById('searchInput');
                if (si) { si.focus(); si.select(); }
            }
        });


// Mobile sidebar
(function () {
            const btn = document.getElementById('mobileMenuBtn');
            const overlay = document.getElementById('sidebarOverlay');
            const sidebar = document.getElementById('sidebar');
            function openSidebar() { sidebar.classList.add('mobile-open'); overlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
            function closeSidebar() { sidebar.classList.remove('mobile-open'); overlay.classList.remove('active'); document.body.style.overflow = ''; }
            btn.addEventListener('click', openSidebar);
            overlay.addEventListener('click', closeSidebar);
            sidebar.addEventListener('click', function (e) { if (e.target.closest('.nav-item')) closeSidebar(); });
        })();
