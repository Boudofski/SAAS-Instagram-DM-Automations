#!/usr/bin/env python3
"""Notify IndexNow of specific live, changed canonical URLs after deployment.

Usage: python3 scripts/notify-indexnow.py --submit /instagram-automation-guide /fr/instagram-automation-guide
Without --submit this prints the proposed payload. A 200/202 is receipt, not indexing.
"""
import argparse
import json
import pathlib
import sys
import urllib.error
import urllib.request
from urllib.parse import urlparse

HOST = 'ap3k.com'
ROOT = 'https://' + HOST
KEY = json.loads((pathlib.Path(__file__).parent / 'indexnow-key.json').read_text())['key']

def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'AP3K-IndexNow/1.0'})
    with urllib.request.urlopen(request, timeout=25) as response:
        return response.status, response.url, response.read(1_000_000).decode('utf-8', 'replace')

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--submit', action='store_true', help='Notify IndexNow once URLs are live and verified')
    parser.add_argument('paths', nargs='+', help='Canonical paths, including locale prefix, no query or fragment')
    args = parser.parse_args()
    paths = list(dict.fromkeys(args.paths))
    if len(paths) > 100 or any(not path.startswith('/') or path.startswith('//') or '?' in path or '#' in path or '\\' in path or urlparse(path).netloc for path in paths):
        parser.error('Supply 1–100 same-origin canonical paths without query or fragment')
    payload = {'host': HOST, 'key': KEY, 'urlList': [ROOT + path for path in paths]}
    if not args.submit:
        print(json.dumps({'host': HOST, 'keyLocation': ROOT + '/' + KEY + '.txt', 'urlList': payload['urlList']}, indent=2))
        return
    for url in [ROOT + '/' + KEY + '.txt', *payload['urlList']]:
        status, final, body = fetch(url)
        if status != 200 or final.rstrip('/') != url.rstrip('/'):
            raise RuntimeError(f'Expected a live 200 at {url}; got {status} {final}')
        if url.endswith(KEY + '.txt') and body.strip() != KEY:
            raise RuntimeError('IndexNow key file mismatch')
        if url != ROOT + '/' + KEY + '.txt' and ('rel="canonical"' not in body or f'href="{url}"' not in body):
            raise RuntimeError(f'Expected a self-canonical HTML response at {url}')
    request = urllib.request.Request('https://api.indexnow.org/indexnow', data=json.dumps(payload).encode('utf-8'), headers={'Content-Type':'application/json; charset=utf-8', 'User-Agent':'AP3K-IndexNow/1.0'}, method='POST')
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            print(f'IndexNow receipt: HTTP {response.status}, {len(paths)} changed URLs')
    except urllib.error.HTTPError as error:
        print(f'IndexNow declined: HTTP {error.code}: {error.read(500).decode("utf-8", "replace")}', file=sys.stderr)
        raise SystemExit(1)

if __name__ == '__main__':
    main()
