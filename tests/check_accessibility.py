#!/usr/bin/env python3
"""
Runs axe-core (the same engine behind Chrome DevTools' accessibility audit)
against every page on the site and fails the build on any 'serious' or
'critical' violation.

An earlier manual pass fixed WCAG contrast issues, added landmark elements,
etc. -- this exists so that pass doesn't quietly erode as new tools get
added (often in separate sessions that have no visibility into that earlier
work). 'moderate'/'minor' issues are reported but don't fail the build --
those are common enough on real sites, and reserved for a moderate/minor
issues are informational rather than a hard gate to avoid the check being
noisy enough that people start ignoring it.

Setup (one-time):
    npm install axe-core
    pip install playwright --break-system-packages
    playwright install chromium

Usage:
    python3 check_accessibility.py [base_url]
"""
import asyncio
import glob
import os
import sys
import json

from playwright.async_api import async_playwright

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
SITE_ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
AXE_PATH = os.path.join(SITE_ROOT, "node_modules", "axe-core", "axe.min.js")

FAIL_IMPACTS = {"serious", "critical"}


def get_pages():
    pages = ["index.html", "contact.html", "changelog.html", "extension.html"]
    pages += ["tools/" + os.path.basename(f) for f in sorted(glob.glob(os.path.join(SITE_ROOT, "tools", "*.html")))]
    pages += ["cheatsheets/" + os.path.basename(f) for f in sorted(glob.glob(os.path.join(SITE_ROOT, "cheatsheets", "*.html")))]
    return pages


async def check_page(browser, axe_src, rel):
    page = await browser.new_page()
    try:
        await page.goto(f"{BASE_URL}/{rel}", timeout=15000)
        await page.wait_for_timeout(300)
        await page.add_script_tag(content=axe_src)
        result = await page.evaluate("() => axe.run()")
        violations = [
            v for v in result["violations"]
            if v["impact"] in FAIL_IMPACTS
        ]
        minor = [v for v in result["violations"] if v["impact"] not in FAIL_IMPACTS]
        return rel, violations, minor
    except Exception as e:
        return rel, [{"id": "error", "impact": "critical", "description": str(e), "nodes": []}], []
    finally:
        await page.close()


async def main():
    if not os.path.exists(AXE_PATH):
        print(f"axe-core not found at {AXE_PATH} -- run `npm install axe-core` first.")
        sys.exit(1)
    with open(AXE_PATH, encoding="utf-8") as fh:
        axe_src = fh.read()

    pages = get_pages()
    print(f"Running axe-core against {len(pages)} pages ({BASE_URL})...\n")

    all_serious = {}
    all_minor_count = 0

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        # Run with modest concurrency rather than fully serial or fully parallel
        sem = asyncio.Semaphore(6)

        async def bounded(rel):
            async with sem:
                return await check_page(browser, axe_src, rel)

        results = await asyncio.gather(*(bounded(rel) for rel in pages))
        await browser.close()

    for rel, violations, minor in results:
        all_minor_count += len(minor)
        if violations:
            all_serious[rel] = violations

    if all_minor_count:
        print(f"({all_minor_count} moderate/minor issue(s) found across all pages -- not failing the build on these.)\n")

    if all_serious:
        total = sum(len(v) for v in all_serious.values())
        print(f"FAIL -- {total} serious/critical accessibility violation(s) across {len(all_serious)} page(s):\n")
        for rel, violations in all_serious.items():
            print(f"  {rel}:")
            for v in violations:
                node_count = len(v.get("nodes", []))
                print(f"    [{v['impact']}] {v['id']}: {v['description']} ({node_count} element(s))")
        sys.exit(1)
    else:
        print("OK -- no serious or critical accessibility violations found.")


if __name__ == "__main__":
    asyncio.run(main())
