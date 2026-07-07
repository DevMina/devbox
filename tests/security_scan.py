#!/usr/bin/env python3
"""
Scans every tool page for the two bug shapes found during the 2026-07 audit:

  1. `new Function(...)` / `eval(...)` on user-controlled input -- this is
     arbitrary JavaScript execution, not "just" a math/expression bug. Zero
     tolerance: this check FAILS the build if it finds either, anywhere.

  2. A shareable-URL- or tool-chaining-loaded field whose render callback
     sets `.innerHTML` without visibly calling escHtml() in that same
     function -- the shape behind the markdown.html and svgtools.html XSS
     fixes. This is a much fuzzier pattern to detect automatically (plenty
     of legitimate innerHTML usage doesn't need escaping -- e.g. static
     markup, or values that are already safe numbers), so this check is
     ADVISORY ONLY: it prints candidates for a human to look at, and does
     NOT fail the build. Treat the printed list as "check these first if
     you're doing a security pass," not "these are all bugs."
"""
import re
import sys
import glob
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def extract_function_body(content, fname):
    m = re.search(rf'function\s+{re.escape(fname)}\s*\([^)]*\)\s*\{{', content)
    if not m:
        return None
    start = m.end() - 1
    depth = 0
    for i in range(start, len(content)):
        if content[i] == '{':
            depth += 1
        elif content[i] == '}':
            depth -= 1
            if depth == 0:
                return content[start:i + 1]
    return None


def check_code_execution(files):
    hits = []
    func_re = re.compile(r'\bnew\s+Function\s*\(')
    eval_re = re.compile(r'(?<![\w.])eval\s*\(')
    for f in files:
        with open(f, encoding='utf-8') as fh:
            content = fh.read()
        for m in func_re.finditer(content):
            line = content[:m.start()].count('\n') + 1
            hits.append((f, line, 'new Function('))
        for m in eval_re.finditer(content):
            line = content[:m.start()].count('\n') + 1
            hits.append((f, line, 'eval('))
    return hits


def check_unescaped_handoff_innerhtml(files):
    candidates = []
    for f in files:
        with open(f, encoding='utf-8') as fh:
            content = fh.read()
        callbacks = set()
        for m in re.finditer(r'loadFromURL\([^,]+,\s*([A-Za-z_$][\w$]*)\s*\)', content):
            callbacks.add(m.group(1))
        for m in re.finditer(r'receiveHandoff\([^,]+,\s*([A-Za-z_$][\w$]*)\s*\)', content):
            callbacks.add(m.group(1))
        for cb in callbacks:
            body = extract_function_body(content, cb)
            if body is None:
                continue
            if re.search(r'\.innerHTML\s*=', body) and 'escHtml(' not in body:
                candidates.append((f, cb))
    return candidates


def main():
    files = sorted(glob.glob(os.path.join(ROOT, 'tools', '*.html')))

    print(f"Scanning {len(files)} tool pages...\n")

    exec_hits = check_code_execution(files)
    if exec_hits:
        print(f"FAIL -- {len(exec_hits)} use(s) of new Function()/eval() found:\n")
        for f, line, kind in exec_hits:
            print(f"  {os.path.relpath(f, ROOT)}:{line}  {kind}")
        print(
            "\nThese execute arbitrary JavaScript, not just the intended "
            "logic -- see the matheval.html fix (2026-07) for why this "
            "matters and what to use instead (a restricted expression "
            "parser)."
        )
        sys.exit(1)
    else:
        print("OK -- no new Function()/eval() usage found.")

    print()
    review_hits = check_unescaped_handoff_innerhtml(files)
    if review_hits:
        print(
            f"ADVISORY (not a build failure) -- {len(review_hits)} callback(s) "
            f"set innerHTML from a URL/handoff-loaded field without an obvious "
            f"escHtml() call in the same function. Worth a quick manual look, "
            f"same shape as the markdown.html/svgtools.html fixes:\n"
        )
        for f, cb in review_hits:
            print(f"  {os.path.relpath(f, ROOT)}  (callback: {cb})")
    else:
        print("No advisory candidates found.")


if __name__ == '__main__':
    main()
