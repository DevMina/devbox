#!/usr/bin/env python3
"""
Crawls every internal href/src across the site and fails if any points at a
file that doesn't actually exist in the repo. Added after the sidebar.js
incident, where an updated file landed at the wrong path and nothing caught
it until a person happened to notice the sidebar looked wrong.

Only checks same-repo relative links -- external (http/https), mailto:,
tel:, javascript:, and pure #fragment links are intentionally skipped.
"""
import re
import sys
import glob
import os
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ATTR_RE = re.compile(r'''(?:href|src|srcset)\s*=\s*["']([^"']+)["']''', re.IGNORECASE)

SKIP_PREFIXES = ('http://', 'https://', 'mailto:', 'tel:', 'javascript:', 'data:', '#')

def resolve(base_file, link):
    link = link.split('#')[0].split('?')[0].strip()
    if not link:
        return None
    if link.startswith(SKIP_PREFIXES):
        return None
    base_dir = os.path.dirname(base_file)
    if link.startswith('/'):
        # site-root-relative -- resolve from repo root
        target = os.path.join(ROOT, link.lstrip('/'))
    else:
        target = os.path.join(base_dir, link)
    return os.path.normpath(target)

def main():
    html_files = sorted(
        glob.glob(os.path.join(ROOT, '*.html')) +
        glob.glob(os.path.join(ROOT, 'tools', '*.html')) +
        glob.glob(os.path.join(ROOT, 'cheatsheets', '*.html'))
    )

    broken = []
    checked = 0
    script_re = re.compile(r'<script\b[^>]*>.*?</script>', re.DOTALL | re.IGNORECASE)

    for f in html_files:
        with open(f, encoding='utf-8') as fh:
            content = fh.read()
        # Strip script blocks -- href/src-shaped strings inside JS (template
        # literals, sample/demo markup used as tool input, regex replacement
        # placeholders like $1/$2) aren't real page links and shouldn't be
        # checked against the filesystem.
        static_content = script_re.sub('', content)
        for m in ATTR_RE.finditer(static_content):
            raw_value = m.group(1)
            if '${' in raw_value or re.match(r'^\$\d', raw_value):
                continue
            candidates = [raw_value] if 'srcset' not in static_content[max(0, m.start()-10):m.start()] else \
                         [c.strip().split(' ')[0] for c in raw_value.split(',')]
            for link in candidates:
                target = resolve(f, link)
                if target is None:
                    continue
                checked += 1
                if not os.path.exists(target):
                    broken.append((os.path.relpath(f, ROOT), link, os.path.relpath(target, ROOT)))

    print(f"Checked {checked} internal link(s) across {len(html_files)} file(s).")
    if broken:
        print(f"\n{len(broken)} BROKEN LINK(S):\n")
        for src, link, target in broken:
            print(f"  {src}  ->  \"{link}\"  (resolved: {target})")
        sys.exit(1)
    else:
        print("No broken internal links found.")

if __name__ == '__main__':
    main()
