#!/usr/bin/env python3
"""
Cross-references the site's actual navigation (SIDEBAR_ITEMS in
assets/sidebar.js -- this drives the sidebar, the Cmd/Ctrl+K command
palette, and is the only real "is this tool reachable" source of truth,
since it's built entirely at runtime from a JS array) against the real
files in tools/ and cheatsheets/.

Fails the build on:
  - A tool/cheatsheet file that exists but has no SIDEBAR_ITEMS entry
    (unreachable except by typing the URL directly or via search).
  - A SIDEBAR_ITEMS entry whose href points at a file that doesn't exist
    (a dead nav link/palette entry).

This exists because assets/sidebar.js has already caused one real incident
in this project (an update landed at the wrong path and silently broke
the sidebar for a period) -- entirely plausible for individual entries in
this list to drift the same way as tools get renamed or added.
"""
import re
import sys
import glob
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    sidebar_path = os.path.join(ROOT, 'assets', 'sidebar.js')
    with open(sidebar_path, encoding='utf-8') as fh:
        content = fh.read()

    m = re.search(r'const SIDEBAR_ITEMS\s*=\s*\[(.*?)\n\];', content, re.DOTALL)
    if not m:
        print("FAIL -- could not find SIDEBAR_ITEMS in assets/sidebar.js (format changed?)")
        sys.exit(1)
    items_src = m.group(1)

    # Split into individual { ... } object literals
    entries = re.findall(r'\{[^{}]*\}', items_src)

    tool_hrefs = set()
    cheatsheet_hrefs = set()
    for e in entries:
        href_m = re.search(r"href:\s*'([\w-]+\.html)'", e)
        if not href_m:
            continue  # a { section: '...' } divider, not a page entry
        href = href_m.group(1)
        if re.search(r'\bcs:\s*true\b', e):
            cheatsheet_hrefs.add(href)
        else:
            tool_hrefs.add(href)

    actual_tools = set(os.path.basename(f) for f in glob.glob(os.path.join(ROOT, 'tools', '*.html')))
    actual_cheatsheets = set(os.path.basename(f) for f in glob.glob(os.path.join(ROOT, 'cheatsheets', '*.html')))

    orphaned_tools = actual_tools - tool_hrefs
    orphaned_cheatsheets = actual_cheatsheets - cheatsheet_hrefs
    dangling_tools = tool_hrefs - actual_tools
    dangling_cheatsheets = cheatsheet_hrefs - actual_cheatsheets

    print(f"SIDEBAR_ITEMS: {len(tool_hrefs)} tool entries, {len(cheatsheet_hrefs)} cheatsheet entries")
    print(f"On disk: {len(actual_tools)} tools, {len(actual_cheatsheets)} cheatsheets\n")

    problems = []
    if orphaned_tools:
        problems.append(f"{len(orphaned_tools)} tool file(s) exist but have no sidebar entry (unreachable via nav/search):")
        for t in sorted(orphaned_tools):
            problems.append(f"  tools/{t}")
    if orphaned_cheatsheets:
        problems.append(f"{len(orphaned_cheatsheets)} cheatsheet file(s) exist but have no sidebar entry:")
        for t in sorted(orphaned_cheatsheets):
            problems.append(f"  cheatsheets/{t}")
    if dangling_tools:
        problems.append(f"{len(dangling_tools)} sidebar entry/entries point at tool files that don't exist:")
        for t in sorted(dangling_tools):
            problems.append(f"  tools/{t}")
    if dangling_cheatsheets:
        problems.append(f"{len(dangling_cheatsheets)} sidebar entry/entries point at cheatsheet files that don't exist:")
        for t in sorted(dangling_cheatsheets):
            problems.append(f"  cheatsheets/{t}")

    if problems:
        print("FAIL:\n")
        print("\n".join(problems))
        sys.exit(1)
    else:
        print("OK -- every tool/cheatsheet file has a sidebar entry, and every sidebar entry points at a real file.")


if __name__ == '__main__':
    main()
