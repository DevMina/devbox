#!/usr/bin/env python3
"""
Cross-references sitemap.xml against the real page tree. Fails on:
  - A real page with no sitemap entry (invisible to search engines --
    exactly what happened to extension.html, added in one session and
    never added to the sitemap in any session since).
  - A sitemap entry pointing at a page that doesn't exist (a dead
    sitemap entry -- wastes crawl budget and looks broken to Google).

index.html is intentionally represented by the bare root URL
(https://devmina.github.io/devbox/) rather than literally "index.html" --
that's the correct, standard sitemap convention, so it's excluded here
rather than flagged.
"""
import re
import sys
import glob
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE_PREFIX = "https://devmina.github.io/devbox/"


def main():
    with open(os.path.join(ROOT, 'sitemap.xml'), encoding='utf-8') as fh:
        sitemap = fh.read()

    locs = re.findall(r'<loc>([^<]+)</loc>', sitemap)
    sitemap_paths = set()
    for loc in locs:
        if not loc.startswith(SITE_PREFIX):
            continue
        rel = loc[len(SITE_PREFIX):]
        if rel == '':
            sitemap_paths.add('index.html')  # root URL represents index.html
        else:
            sitemap_paths.add(rel)

    actual_pages = set()
    for f in (glob.glob(os.path.join(ROOT, '*.html')) +
              glob.glob(os.path.join(ROOT, 'tools', '*.html')) +
              glob.glob(os.path.join(ROOT, 'cheatsheets', '*.html'))):
        actual_pages.add(os.path.relpath(f, ROOT))

    missing = actual_pages - sitemap_paths
    dangling = sitemap_paths - actual_pages

    print(f"sitemap.xml: {len(sitemap_paths)} URL(s). Actual pages: {len(actual_pages)}.\n")

    problems = []
    if missing:
        problems.append(f"{len(missing)} page(s) exist but aren't in sitemap.xml:")
        for p in sorted(missing):
            problems.append(f"  {p}")
    if dangling:
        problems.append(f"{len(dangling)} sitemap.xml entries point at pages that don't exist:")
        for p in sorted(dangling):
            problems.append(f"  {p}")

    if problems:
        print("FAIL:\n")
        print("\n".join(problems))
        sys.exit(1)
    else:
        print("OK -- sitemap.xml matches the real page tree exactly.")


if __name__ == '__main__':
    main()
