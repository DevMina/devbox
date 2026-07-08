#!/usr/bin/env python3
"""
Checks that every page's social-preview and search-result metadata is
actually intact:

  1. og:image -- every page should have one, and it should point at a file
     that actually exists (a typo'd/missing image just silently shows a
     blank or broken preview when a link is shared -- nothing else would
     ever surface that).
  2. JSON-LD -- every tools/ and cheatsheets/ page should have a
     <script type="application/ld+json"> block, and it should be valid,
     parseable JSON (a malformed block is silently ignored by search
     engines -- no visible symptom on the page itself).

These were added by hand across 79+ tool pages and 14 category images;
this exists so a newly-added tool that misses the convention gets caught
here instead of just quietly having a worse social/search presence
forever.
"""
import re
import sys
import glob
import os
import json
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE_PREFIX = "https://devmina.github.io/devbox/"


def check_og_image(path, content):
    m = re.search(r'<meta\s+property="og:image"\s+content="([^"]+)"', content)
    if not m:
        return f"missing <meta property=\"og:image\">"
    url = m.group(1)
    if not url.startswith(SITE_PREFIX):
        return f"og:image doesn't use the expected site URL prefix: {url}"
    rel = url[len(SITE_PREFIX):]
    target = os.path.join(ROOT, rel)
    if not os.path.exists(target):
        return f"og:image points at a file that doesn't exist: {rel}"
    return None


def check_json_ld(path, content):
    matches = re.findall(r'<script type="application/ld\+json">(.*?)</script>', content, re.DOTALL)
    if not matches:
        return "missing <script type=\"application/ld+json\"> block"
    for block in matches:
        try:
            json.loads(block)
        except json.JSONDecodeError as e:
            return f"JSON-LD block is not valid JSON: {e}"
    return None


def main():
    all_pages = (
        glob.glob(os.path.join(ROOT, '*.html')) +
        glob.glob(os.path.join(ROOT, 'tools', '*.html')) +
        glob.glob(os.path.join(ROOT, 'cheatsheets', '*.html'))
    )
    needs_jsonld = set(
        glob.glob(os.path.join(ROOT, 'tools', '*.html')) +
        glob.glob(os.path.join(ROOT, 'cheatsheets', '*.html'))
    )

    script_re = re.compile(r'<script\b[^>]*>.*?</script>', re.DOTALL | re.IGNORECASE)
    head_re = re.compile(r'<head[^>]*>(.*?)</head>', re.DOTALL | re.IGNORECASE)

    problems = []
    for f in sorted(all_pages):
        with open(f, encoding='utf-8') as fh:
            raw_content = fh.read()
        rel_name = os.path.relpath(f, ROOT)

        # JSON-LD blocks live inside <script> tags, so they need the raw
        # content. But og:image (and any tool's own JS that happens to
        # generate meta-tag-shaped strings as output, e.g. metatags.html)
        # should only be checked against the real static <head>, with
        # script content stripped out first.
        head_m = head_re.search(raw_content)
        head_only = head_m.group(1) if head_m else raw_content
        head_static = script_re.sub('', head_only)

        og_problem = check_og_image(f, head_static)
        if og_problem:
            problems.append(f"{rel_name}: {og_problem}")

        if f in needs_jsonld:
            ld_problem = check_json_ld(f, raw_content)
            if ld_problem:
                problems.append(f"{rel_name}: {ld_problem}")

    print(f"Checked {len(all_pages)} pages for og:image, {len(needs_jsonld)} of those for JSON-LD.\n")
    if problems:
        print(f"FAIL -- {len(problems)} issue(s):\n")
        for p in problems:
            print(f"  {p}")
        sys.exit(1)
    else:
        print("OK -- every page has a valid og:image, every tool/cheatsheet has valid JSON-LD.")


if __name__ == '__main__':
    main()
