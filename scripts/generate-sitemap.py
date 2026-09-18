#!/usr/bin/env python3
"""Generate sitemap.xml from tools.json and known root pages."""
import json, os, datetime

BASE_URL = 'https://devmina.github.io/devbox'
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
TODAY = datetime.date.today().isoformat()

# Load tool registry
tools_data = json.load(open(os.path.join(ROOT_DIR, 'assets', 'tools.json')))
tools = tools_data['tools']

urls = []

# Root pages
for page, priority in [
    ('index.html', '1.0'),
    ('about.html', '0.8'),
    ('changelog.html', '0.7'),
    ('contact.html', '0.6'),
    ('extension.html', '0.6'),
    ('404.html', '0.1'),
]:
    path = os.path.join(ROOT_DIR, page)
    if os.path.exists(path):
        urls.append({'loc': f'{BASE_URL}/{page}', 'priority': priority,
                     'changefreq': 'monthly'})

# Tool pages and cheatsheets from registry
for tool in tools:
    priority = '0.8' if tool['type'] == 'tool' else '0.5'
    urls.append({'loc': tool['url'], 'priority': priority, 'changefreq': 'monthly'})

# Write sitemap.xml
lines = ['<?xml version="1.0" encoding="UTF-8"?>',
         '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for u in urls:
    lines += [
        '  <url>',
        f'    <loc>{u["loc"]}</loc>',
        f'    <lastmod>{TODAY}</lastmod>',
        f'    <changefreq>{u["changefreq"]}</changefreq>',
        f'    <priority>{u["priority"]}</priority>',
        '  </url>',
    ]
lines.append('</urlset>')

out = os.path.join(ROOT_DIR, 'sitemap.xml')
with open(out, 'w') as f:
    f.write('\n'.join(lines) + '\n')

print(f"Generated sitemap.xml: {len(urls)} URLs ({TODAY})")
