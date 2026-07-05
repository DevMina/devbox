#!/usr/bin/env python3
"""
DevBox regression test suite.

Codifies the real bugs found and fixed during development, so they can't
silently come back in a future edit. Run this after any change to assets/,
tools/, or cheatsheets/ — ideally in CI, but works fine run locally too.

Setup (one-time):
    pip install playwright --break-system-packages
    playwright install chromium

Usage:
    python3 regression_suite.py [base_url]

    base_url defaults to http://localhost:8000 — start a local server first:
    python3 -m http.server 8000   (run from the site's root directory)

Exit code is 0 if everything passes, 1 if anything fails — safe to use as a
CI gate.
"""
import asyncio
import glob
import os
import sys
import time

from playwright.async_api import async_playwright

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
SITE_ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))

RESULTS = []  # (name, passed: bool, detail: str)


def record(name, passed, detail=""):
    RESULTS.append((name, passed, detail))
    status = "PASS" if passed else "FAIL"
    print(f"  [{status}] {name}" + (f" — {detail}" if detail and not passed else ""))


async def check_all_pages_load_clean(browser):
    """Every HTML page should load with zero console/page errors.

    This is the cheapest, highest-coverage check there is: it would have
    caught the localStorage-throws-and-breaks-the-page class of bug on any
    page we forgot to fix, immediately, without hand-testing each one.
    """
    print("\n=== All pages load without console/page errors ===")
    html_files = sorted(
        glob.glob(os.path.join(SITE_ROOT, "*.html"))
        + glob.glob(os.path.join(SITE_ROOT, "tools", "*.html"))
        + glob.glob(os.path.join(SITE_ROOT, "cheatsheets", "*.html"))
    )
    for filepath in html_files:
        rel = os.path.relpath(filepath, SITE_ROOT)
        url = f"{BASE_URL}/{rel}"
        page = await browser.new_page()
        errs = []
        page.on("pageerror", lambda exc: errs.append(str(exc)))
        # Ignore known-benign console noise (blocked external fonts/CDN in
        # sandboxed/offline test environments) — only real page errors count.
        try:
            await page.goto(url, timeout=15000)
            await page.wait_for_timeout(400)
        except Exception as e:
            errs.append(f"navigation failed: {e}")
        await page.close()
        record(f"loads clean: {rel}", len(errs) == 0, "; ".join(errs))


async def check_localstorage_blocked(browser):
    """Pages must not break when localStorage throws (private browsing,
    strict cookie policies, enterprise lockdowns). This was a real,
    sitewide bug: an unguarded localStorage call in the inline theme-init
    script on every single page meant a SecurityError there aborted the
    whole script, before the page even rendered.
    """
    print("\n=== Pages survive localStorage being blocked ===")
    sample_pages = ["index.html", "tools/regex.html", "tools/json.html",
                     "tools/diff.html", "tools/snippets.html", "tools/websocket.html",
                     "contact.html", "cheatsheets/git.html"]
    for rel in sample_pages:
        context = await browser.new_context()
        page = await context.new_page()
        await page.add_init_script("""
            Object.defineProperty(window, 'localStorage', {
                get() { throw new DOMException('Access denied', 'SecurityError'); }
            });
        """)
        errs = []
        page.on("pageerror", lambda exc: errs.append(str(exc)))
        await page.goto(f"{BASE_URL}/{rel}", timeout=15000)
        await page.wait_for_timeout(400)
        theme_set = await page.evaluate("!!document.documentElement.getAttribute('data-theme')")
        await context.close()
        record(f"survives blocked storage: {rel}", len(errs) == 0 and theme_set,
               "; ".join(errs) or "theme attribute never got set")


async def check_regex_hang_guard(browser):
    """A catastrophic-backtracking pattern must time out gracefully via the
    Web Worker + timeout guard, instead of freezing the tab. This was the
    original bug this whole audit started from.
    """
    print("\n=== Regex Tester: catastrophic backtracking doesn't hang ===")
    page = await browser.new_page()
    await page.goto(f"{BASE_URL}/tools/regex.html", timeout=15000)
    await page.wait_for_timeout(300)

    await page.fill("#regexPattern", r"(a+)+$")
    t0 = time.time()
    await page.fill("#regexInput", "a" * 35 + "!")

    # The page's main thread should stay responsive throughout — measure via
    # animation frame throughput rather than just waiting an arbitrary time.
    frame_count = await page.evaluate("""
        () => new Promise(resolve => {
            let n = 0;
            const start = performance.now();
            function tick() { n++; if (performance.now() - start < 1500) requestAnimationFrame(tick); else resolve(n); }
            requestAnimationFrame(tick);
        })
    """)
    elapsed = time.time() - t0
    status_text = await page.inner_text("#regexStatus")
    await page.close()

    responsive = frame_count > 30  # ~60fps expected over 1.5s; hung tab would show near 0
    timed_out_gracefully = "slow" in status_text.lower() or "simplify" in status_text.lower()
    record("main thread stays responsive during pathological match", responsive,
           f"only {frame_count} frames rendered in 1.5s")
    record("shows graceful timeout message instead of hanging", timed_out_gracefully,
           f"status was: {status_text!r}")


async def check_diff_long_line_guard(browser):
    """A single very long line (minified code, huge CSV row) must not hang
    the word-level diff. This was a second instance of the same bug class
    as the regex hang, found by testing the diff tool the same way.
    """
    print("\n=== Diff Checker: long single-line input doesn't hang ===")
    page = await browser.new_page()
    await page.goto(f"{BASE_URL}/tools/diff.html", timeout=15000)
    await page.wait_for_timeout(300)

    a_line = " ".join(f"tokA{i}" for i in range(6000))
    b_line = " ".join(f"tokB{i}" for i in range(6000))
    await page.fill("#diffA", a_line)
    t0 = time.time()
    await page.fill("#diffB", b_line)
    elapsed = time.time() - t0
    await page.close()

    record("long-line diff completes quickly", elapsed < 3.0,
           f"took {elapsed:.2f}s (previously ~7s / effectively hung)")


async def check_upload_flow(browser):
    """Click-to-upload must actually open a file picker and populate the
    tool, and must clean up its hidden <input> afterward (both on success
    and on cancel) instead of leaking it into the DOM forever.
    """
    print("\n=== Click-to-upload works and cleans up after itself ===")
    context = await browser.new_context()
    page = await context.new_page()
    await page.goto(f"{BASE_URL}/tools/json.html", timeout=15000)
    await page.wait_for_timeout(300)

    import tempfile
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
        f.write('{"test": true}')
        tmp_path = f.name

    try:
        async with page.expect_file_chooser(timeout=5000) as fc_info:
            await page.click("#jsonDropZone")
        fc = await fc_info.value
        await fc.set_files(tmp_path)
        await page.wait_for_timeout(400)
        val = await page.input_value("#jsonInput")
        leftover = await page.eval_on_selector_all("input[type=file]", "els => els.length")
        record("upload populates the tool", '"test"' in val, f"got: {val!r}")
        record("no leftover file input after upload", leftover == 0, f"found {leftover}")
    except Exception as e:
        record("upload flow works", False, str(e))
    finally:
        os.unlink(tmp_path)
        await context.close()


async def check_no_service_worker_html_staleness(browser):
    """If a service worker is registered, it must not serve stale HTML —
    editing a page and reloading should show the new content immediately,
    not require a cache clear. This was the original SW bug this project
    hit in production.
    """
    print("\n=== Service worker (if present) doesn't cache stale HTML ===")
    context = await browser.new_context()
    page = await context.new_page()
    await page.goto(f"{BASE_URL}/tools/json.html", timeout=15000)
    await page.wait_for_timeout(500)

    has_sw = await page.evaluate("'serviceWorker' in navigator")
    if not has_sw:
        record("service worker HTML strategy", True, "no service worker support in this browser — skipped")
        await context.close()
        return

    await page.reload()
    await page.wait_for_timeout(500)

    path = os.path.join(SITE_ROOT, "tools", "json.html")
    original = open(path, encoding="utf-8").read()
    marker = "<!-- regression-test-marker -->"
    updated = original.replace("</head>", marker + "</head>", 1)
    open(path, "w", encoding="utf-8").write(updated)
    try:
        await page.reload()
        await page.wait_for_timeout(500)
        content = await page.content()
        shows_update = marker in content
        record("edited HTML shows up on next reload (no stale SW cache)", shows_update)
    finally:
        open(path, "w", encoding="utf-8").write(original)
        await context.close()


async def check_no_absolute_paths():
    """Absolute paths (leading '/') break under a subpath deployment (e.g.
    GitHub Pages project sites at user.github.io/repo/). Static string scan,
    no browser needed.

    Only scans actual HTML markup, not <script> block contents — a tool's
    demo/sample content (e.g. a sample HTML snippet inside a JS string, used
    to pre-fill a textarea) can legitimately contain an href="/..." as
    example text without it being a real broken reference.
    """
    print("\n=== No absolute-path references that would break under a subpath deploy ===")
    import re
    suspicious = []
    for filepath in (glob.glob(os.path.join(SITE_ROOT, "*.html"))
                      + glob.glob(os.path.join(SITE_ROOT, "tools", "*.html"))
                      + glob.glob(os.path.join(SITE_ROOT, "cheatsheets", "*.html"))):
        content = open(filepath, encoding="utf-8").read()
        markup_only = re.sub(r'<script\b[^>]*>.*?</script>', '', content, flags=re.DOTALL)
        for m in re.finditer(r'(?:href|src)="(/[^/"][^"]*)"', markup_only):
            suspicious.append((os.path.relpath(filepath, SITE_ROOT), m.group(1)))
    for filepath in glob.glob(os.path.join(SITE_ROOT, "assets", "*.js")):
        content = open(filepath, encoding="utf-8").read()
        for m in re.finditer(r'(?:href|src)\s*=\s*["\'](/[^/"\'][^"\']*)["\']', content):
            suspicious.append((os.path.relpath(filepath, SITE_ROOT), m.group(1)))
    record("no absolute path references found", len(suspicious) == 0,
           "; ".join(f"{f} -> {p}" for f, p in suspicious[:10]))


async def check_share_button_style_consistency(browser):
    """The share button should visually match the site's standard button
    system (font, weight, padding, radius) rather than being a one-off
    custom style, which was a real regression found earlier.
    """
    print("\n=== Share button matches the site's standard button style ===")
    page = await browser.new_page()
    await page.goto(f"{BASE_URL}/tools/json.html", timeout=15000)
    await page.wait_for_timeout(400)
    styles = await page.evaluate("""
        () => {
            const share = document.querySelector('.share-btn');
            const ghost = document.querySelector('.btn.btn-ghost');
            if (!share || !ghost) return null;
            const s = getComputedStyle(share), g = getComputedStyle(ghost);
            return { fontMatch: s.fontFamily === g.fontFamily, weightMatch: s.fontWeight === g.fontWeight,
                     paddingMatch: s.padding === g.padding, radiusMatch: s.borderRadius === g.borderRadius };
        }
    """)
    await page.close()
    if styles is None:
        record("share button style consistency", False, "share button or reference .btn-ghost not found")
        return
    all_match = all(styles.values())
    record("share button style consistency", all_match, str(styles))


async def main():
    print(f"DevBox regression suite — testing {BASE_URL}")
    print(f"Site root: {SITE_ROOT}")

    async with async_playwright() as p:
        browser = await p.chromium.launch()

        await check_all_pages_load_clean(browser)
        await check_localstorage_blocked(browser)
        await check_regex_hang_guard(browser)
        await check_diff_long_line_guard(browser)
        await check_upload_flow(browser)
        await check_no_service_worker_html_staleness(browser)
        await check_no_absolute_paths()
        await check_share_button_style_consistency(browser)

        await browser.close()

    print("\n" + "=" * 60)
    passed = sum(1 for _, ok, _ in RESULTS if ok)
    failed = [name for name, ok, _ in RESULTS if not ok]
    print(f"{passed}/{len(RESULTS)} checks passed")
    if failed:
        print("\nFAILED:")
        for name in failed:
            print(f"  - {name}")
        sys.exit(1)
    else:
        print("All checks passed.")
        sys.exit(0)


if __name__ == "__main__":
    asyncio.run(main())
