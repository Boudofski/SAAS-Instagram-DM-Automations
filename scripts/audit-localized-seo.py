#!/usr/bin/env python3
"""Read-only live audit of every FR/ES/DE canonical URL in the public sitemap.

Usage: python3 scripts/audit-localized-seo.py --output /tmp/localized-seo.json
Checks HTTP, canonicals, language, indexability, headings and language links.
This tests live eligibility, not Google's index status.
"""
import argparse
import concurrent.futures
import json
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET

ROOT = 'https://ap3k.com'


def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'AP3K-SEO-Verification/1.0'})
    with urllib.request.urlopen(request, timeout=40) as response:
        return response.status, response.url, response.headers, response.read(4_000_000).decode('utf-8', 'replace')


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.lang = ''
        self.canonicals = []
        self.alternates = {}
        self.robots = []
        self.h1 = []
        self.title = ''
        self.h1_open = False
        self.title_open = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'html': self.lang = a.get('lang', '')
        if tag == 'h1':
            self.h1.append('')
            self.h1_open = True
        if tag == 'title': self.title_open = True
        if tag == 'meta' and a.get('name', '').lower() in ('robots', 'googlebot'):
            self.robots.append(a.get('content', ''))
        if tag == 'link' and a.get('rel') == 'canonical': self.canonicals.append(a.get('href'))
        if tag == 'link' and a.get('rel') == 'alternate' and a.get('hreflang'):
            self.alternates[a['hreflang']] = urljoin(ROOT, a.get('href', ''))

    def handle_endtag(self, tag):
        if tag == 'h1': self.h1_open = False
        if tag == 'title': self.title_open = False

    def handle_data(self, data):
        if self.h1_open: self.h1[-1] += data
        if self.title_open: self.title += data


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    _, _, _, xml = fetch(ROOT + '/sitemap.xml')
    urls = [el.text for el in ET.fromstring(xml).findall('{*}url/{*}loc')]
    known = set(urls)
    targets = [url for url in urls if urlparse(url).path.split('/')[1] in ('fr', 'es', 'de')]
    if len(targets) > 250: raise RuntimeError('Unexpected sitemap expansion; review before crawling more than 250 URLs')

    def audit(url):
        result = {'url': url, 'errors': []}
        try:
            status, final, headers, html = fetch(url)
            page = Page()
            page.feed(html)
            locale = urlparse(url).path.split('/')[1]
            result.update(status=status, final=final, lang=page.lang, canonical=page.canonicals,
                          title=page.title, h1=page.h1, alternates=page.alternates)
            if status != 200 or final != url: result['errors'].append('status or redirect')
            if page.canonicals != [url]: result['errors'].append('non-self or multiple canonical')
            if page.lang != locale: result['errors'].append('wrong HTML language')
            if not page.title or len(page.h1) != 1 or not page.h1[0].strip(): result['errors'].append('missing title or invalid H1')
            if any('noindex' in value.lower() for value in [*page.robots, headers.get('X-Robots-Tag', '')]): result['errors'].append('noindex')
            if page.alternates.get(locale) != url: result['errors'].append('missing self language alternate')
            if any(target not in known for target in page.alternates.values()): result['errors'].append('language alternate missing from sitemap')
        except Exception as error:
            result['errors'].append(str(error))
        return result

    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        for result in pool.map(audit, targets):
            results.append(result)
            with open(args.output, 'w') as file:
                json.dump({'sitemap_urls': len(urls), 'expected': len(targets), 'checked': len(results), 'results': results}, file, ensure_ascii=False, indent=2)
            print(f"{len(results)}/{len(targets)} {result['url']} {result['errors'] or 'OK'}", flush=True)
    failures = [result for result in results if result['errors']]
    print(json.dumps({'checked': len(results), 'failed': len(failures)}))
    raise SystemExit(bool(failures))


if __name__ == '__main__':
    main()
