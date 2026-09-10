import os, re, glob, http.server, threading, socketserver, shutil
from playwright.sync_api import sync_playwright

import pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = str(ROOT / 'dist')
PREV = '/tmp/prev_dist'
PORT = 8951
if os.path.exists(PREV): shutil.rmtree(PREV)
shutil.copytree(DIST, PREV)
shutil.copytree(str(ROOT / 'tools' / 'fonts'), PREV + '/fonts')
# local fonts instead of Google (blocked from here)
for root, _, files in os.walk(PREV):
    for f in files:
        if f.endswith('.html'):
            p = os.path.join(root, f); s = open(p, encoding='utf-8').read()
            s = re.sub(r'<link href="https://fonts\.googleapis\.com[^"]*" rel="stylesheet">', '<link rel="stylesheet" href="/fonts/fonts.css">', s)
            open(p, 'w', encoding='utf-8').write(s)

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s, *a, **k): super().__init__(*a, directory=PREV, **k)
    def log_message(s, *a): pass
    def translate_path(self, path):
        path = path.split('?')[0].split('#')[0]
        p = super().translate_path(path)
        if os.path.isdir(p) and os.path.exists(os.path.join(p, 'index.html')):
            return os.path.join(p, 'index.html')
        if not os.path.exists(p) and os.path.exists(p + '.html'):
            return p + '.html'
        return p

socketserver.TCPServer.allow_reuse_address = True
srv = socketserver.TCPServer(('127.0.0.1', PORT), H); threading.Thread(target=srv.serve_forever, daemon=True).start()

pages = ['/'] + ['/' + f[:-5] for f in sorted(os.listdir(DIST)) if f.endswith('.html') and f not in ('index.html', '404.html')] + ['/404.html', '/articles'] + ['/articles/' + f[:-5] for f in sorted(os.listdir(DIST + '/articles')) if f.endswith('.html') and f != 'index.html']
issues = []; all_links = set()
with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h in ((1440, 900), (390, 844)):
        ctx = b.new_context(viewport={'width': w, 'height': h}); pg = ctx.new_page()
        errs = []
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        pg.on('requestfailed', lambda r: errs.append('FAIL ' + r.url))
        pg.on('pageerror', lambda e: errs.append('JS ' + str(e)))
        for page in pages:
            errs.clear(); r = pg.goto(f'http://127.0.0.1:{PORT}{page}'); pg.wait_for_timeout(200)
            if r.status != 200: issues.append((page, w, 'status', r.status)); continue
            res = pg.evaluate("""()=>{const se=document.scrollingElement; return {sw:se.scrollWidth, cw:se.clientWidth, h1:document.querySelectorAll('h1').length, broken:[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.getAttribute('src')), links:[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href'))}}""")
            if res['sw'] > res['cw']: issues.append((page, w, 'overflow', res['sw']))
            if res['h1'] != 1: issues.append((page, w, 'h1', res['h1']))
            if res['broken']: issues.append((page, w, 'broken-img', res['broken']))
            if errs: issues.append((page, w, 'console', errs[:3]))
            if w == 1440:
                for l in res['links']:
                    if l.startswith('/'): all_links.add(l.split('#')[0])
        ctx.close()
    # link check
    pg = b.new_page()
    for l in sorted(all_links):
        if not l: continue
        r = pg.goto(f'http://127.0.0.1:{PORT}{l}')
        if r.status != 200: issues.append((l, '-', 'dead-link', r.status))
    b.close()
srv.shutdown()
print('pages', len(pages), 'links', len(all_links), 'issues', len(issues))
for i in issues: print(i)
