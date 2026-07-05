# DevBox regression suite

Automated checks for the exact bug classes that have bitten this project before — a catastrophic-backtracking regex freezing the tab, a long line hanging the diff tool, `localStorage` throwing and breaking pages in private browsing, a service worker serving stale HTML forever, and a couple of others. Run this after any change to `assets/`, `tools/`, or `cheatsheets/`.

## Setup (one-time)

```bash
pip install playwright --break-system-packages
playwright install chromium
```

## Usage

Start a local server from the site root, then point the suite at it:

```bash
python3 -m http.server 8000
python3 tests/regression_suite.py http://localhost:8000
```

Exit code is `0` if everything passes, `1` if anything fails — safe to wire up as a CI gate (e.g. a GitHub Actions step that fails the build on regression).

## What it checks

- Every HTML page loads with zero console/page errors
- Pages survive `localStorage` being blocked (private browsing, strict cookie policies)
- The Regex Tester's catastrophic-backtracking guard actually keeps the tab responsive and times out gracefully
- The Diff Checker doesn't hang on a single very long line
- Click-to-upload actually opens a file picker, populates the tool, and cleans up its hidden `<input>` afterward
- If a service worker is registered, editing a page's HTML shows up on the next reload instead of serving a stale cached copy
- No absolute-path (`/...`) references that would break under a subpath deployment (e.g. GitHub Pages project sites)
- The share button's style stays in sync with the site's standard button system

## Adding a new check

Each check is a small `async def check_*()` function that calls `record(name, passed, detail)` for each assertion. Add a new one and call it from `main()`. Keep each check testing one specific, previously-real failure mode rather than general "does this look right" — that's what makes a regression suite catch regressions instead of just restating what the code already does.
