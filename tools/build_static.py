#!/usr/bin/env python3
"""Build the Netlify deployment folder (dist/) from the static source in site/.
- absolute, extension-less internal links (/about, /articles/x, /)
- images served from /assets/img (no dependency on the old WordPress server)
- canonical / og / JSON-LD URLs without .html
- articles.html -> articles/index.html
- _redirects, _headers, sitemap.xml, robots.txt
"""
import os, re, shutil, json, datetime, html

import pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = str(ROOT / 'site')
DIST = str(ROOT / 'dist')
SITE = 'https://ri-law.co.il'

IMG_MAP = {
    '/wp-content/uploads/2026/08/conference-room-dark.jpg': ('img/conference-room-dark.jpg', 'conference-room.jpg'),
    '/wp-content/uploads/2026/08/modern-towers.jpg': ('img/modern-towers.jpg', 'modern-towers.jpg'),
    '/wp-content/uploads/2023/09/Depositphotos_654775016_XL-scaled.jpg': ('img/new/flag-sunset.jpg', 'flag-sunset.jpg'),
    '/wp-content/uploads/2025/07/Depositphotos_325838954_XL-scaled.jpg': ('img/new/boardroom-white.jpg', 'boardroom.jpg'),
    '/wp-content/uploads/2026/09/hero-tower.jpg': ('img/hero/final/hero-tower.jpg', 'hero-tower.jpg'),
}
ALT_FIX = {
    'flag-sunset.jpg': 'דגל ישראל בשקיעה',
    'boardroom.jpg': 'חדר ישיבות',
}

ASSET_VER = {}
PAGES = [f[:-5] for f in sorted(os.listdir(SRC)) if f.endswith('.html')]
ARTICLES = [f[:-5] for f in sorted(os.listdir(os.path.join(SRC, 'articles'))) if f.endswith('.html')]


def clean_path(name):
    if name == 'index':
        return '/'
    return '/' + name


def rewrite(doc, depth):
    """depth 0 = root page, 1 = article page"""
    # internal href/src
    def repl_href(m):
        attr, q, url = m.group(1), m.group(2), m.group(3)
        anchor = ''
        if '#' in url:
            url, anchor = url.split('#', 1); anchor = '#' + anchor
        u = url
        sibling = False
        if u.startswith('./'): u = u[2:]
        elif u.startswith('../'): u = u[3:]
        elif u.startswith('/'): u = u[1:]
        elif depth == 1 and re.fullmatch(r'[a-z0-9\-]+\.html', u):
            sibling = True  # bare name inside an article page = another article
        if u in ('', ) and anchor:
            return f'{attr}={q}{anchor}{q}'
        if re.fullmatch(r'(articles/)?[a-z0-9\-]+\.html', u):
            name = u[:-5]
            if sibling and not name.startswith('articles/'):
                name = 'articles/' + name
            new = '/' if name == 'index' else '/' + name
            if name == 'articles/index': new = '/articles/'
            if name == 'articles': new = '/articles/'
            return f'{attr}={q}{new}{anchor}{q}'
        if u in ('css/style.css', 'js/main.js', 'js/accessibility.js', 'favicon.svg'):
            return f'{attr}={q}/{u}{q}'
        if u.startswith('assets/'):
            return f'{attr}={q}/{u}{q}'
        return m.group(0)
    doc = re.sub(r'\b(href|src)=(")([^"]*)"', lambda m: repl_href(m).rstrip('"') + '"' if False else repl_href(m), doc)
    # absolute site URLs (canonical, og:url, JSON-LD)
    doc = re.sub(r'https://ri-law\.co\.il/index\.html', SITE + '/', doc)
    doc = re.sub(r'https://ri-law\.co\.il/(articles/)?([a-z0-9\-]+)\.html', lambda m: f'{SITE}/articles/' if (not m.group(1) and m.group(2) == 'articles') else f'{SITE}/{m.group(1) or ""}{m.group(2)}', doc)
    doc = re.sub(r'https://ri-law\.co\.il/(articles/)?([a-z0-9\-]+)/(?=["\s#])', lambda m: f'{SITE}/articles/' if (not m.group(1) and m.group(2) == 'articles') else f'{SITE}/{m.group(1) or ""}{m.group(2)}', doc)
    # images
    for old, (_, newname) in IMG_MAP.items():
        doc = doc.replace(old, '/assets/img/' + newname)
    for newname, alt in ALT_FIX.items():
        doc = re.sub(r'(src="/assets/img/' + re.escape(newname) + r'" alt=")[^"]*"', lambda m: m.group(1) + alt + '"', doc)
    # og:image / twitter:image after og:site_name
    if 'og:image' not in doc:
        doc = doc.replace('<meta property="og:site_name" content="רישטלר - עורכי דין">',
            '<meta property="og:site_name" content="רישטלר - עורכי דין">\n<meta property="og:image" content="https://ri-law.co.il/assets/og-image.png">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">')
        doc = doc.replace('<meta name="twitter:card" content="summary">', '<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:image" content="https://ri-law.co.il/assets/og-image.png">')
    # favicons like the theme
    doc = doc.replace('<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
        '<link rel="icon" href="/favicon.svg" type="image/svg+xml">\n<link rel="icon" href="/assets/favicon-32.png" type="image/png" sizes="32x32">\n<link rel="apple-touch-icon" href="/assets/favicon-180.png">')
    # cache busting: css/js are cached for a day, so every deploy must change their address
    for path, ver in ASSET_VER.items():
        doc = doc.replace(f'"{path}"', f'"{path}?v={ver}"')
    return doc


LASTMOD = str(ROOT / 'tools' / 'lastmod.json')


def page_dates():
    """Articles: dateModified from their JSON-LD. Other pages: the date their <main> content
    last changed, tracked by hash in tools/lastmod.json (commit that file with the build)."""
    import hashlib
    today = datetime.date.today().isoformat()
    try:
        known = json.load(open(LASTMOD, encoding='utf-8'))
    except FileNotFoundError:
        known = {}
    dates = {}
    for n in ARTICLES:
        doc = open(f'{SRC}/articles/{n}.html', encoding='utf-8').read()
        m = re.search(r'"dateModified": "(\d{4}-\d{2}-\d{2})"', doc)
        dates['articles/' + n] = m.group(1) if m else today
    for n in PAGES:
        doc = open(f'{SRC}/{n}.html', encoding='utf-8').read()
        m = re.search(r'<main\b.*</main>', doc, re.S)
        h = hashlib.sha1((m.group(0) if m else doc).encode('utf-8')).hexdigest()[:12]
        if n in known and known[n]['hash'] == h:
            dates[n] = known[n]['date']
        else:
            dates[n] = today
            known[n] = {'hash': h, 'date': today}
    for n in list(known):
        if n not in PAGES: del known[n]
    open(LASTMOD, 'w', encoding='utf-8').write(json.dumps(dict(sorted(known.items())), ensure_ascii=False, indent=1) + '\n')
    return dates


def main():
    if os.path.exists(DIST): shutil.rmtree(DIST)
    os.makedirs(DIST + '/articles'); os.makedirs(DIST + '/assets/img'); os.makedirs(DIST + '/css'); os.makedirs(DIST + '/js')
    # static assets
    for f in os.listdir(SRC + '/assets'):
        shutil.copy(os.path.join(SRC, 'assets', f), DIST + '/assets/' + f)
    for old, (local, newname) in IMG_MAP.items():
        shutil.copy(os.path.join(SRC, local), DIST + '/assets/img/' + newname)
    shutil.copy(SRC + '/favicon.svg', DIST + '/favicon.svg')
    shutil.copy(SRC + '/css/style.css', DIST + '/css/style.css')
    a11y = open(SRC + '/js/accessibility.js', encoding='utf-8').read()
    a11y = a11y.replace("(location.pathname.indexOf('/articles/')>-1?'../':'')+'accessibility.html'", "'/accessibility'").replace("'/accessibility/'", "'/accessibility'")
    open(DIST + '/js/accessibility.js', 'w', encoding='utf-8').write(a11y)
    shutil.copy(SRC + '/js/main.js', DIST + '/js/main.js')
    import hashlib
    for p in ('/css/style.css', '/js/main.js', '/js/accessibility.js'):
        ASSET_VER[p] = hashlib.md5(open(DIST + p, 'rb').read()).hexdigest()[:8]
    # pages
    for name in PAGES:
        doc = open(f'{SRC}/{name}.html', encoding='utf-8').read()
        doc = rewrite(doc, 0)
        out = f'{DIST}/articles/index.html' if name == 'articles' else f'{DIST}/{name}.html'
        open(out, 'w', encoding='utf-8').write(doc)
    for name in ARTICLES:
        doc = open(f'{SRC}/articles/{name}.html', encoding='utf-8').read()
        doc = rewrite(doc, 1)
        open(f'{DIST}/articles/{name}.html', 'w', encoding='utf-8').write(doc)
    # sitemap: lastmod is the real date of the last content change
    urls = [((SITE + '/articles/') if n == 'articles' else SITE + clean_path(n), n) for n in PAGES if n not in ('404',)] + [(f'{SITE}/articles/{n}', 'articles/' + n) for n in ARTICLES]
    dates = page_dates()
    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u, n in urls:
        pr = '1.0' if u == SITE + '/' else ('0.8' if '/articles/' not in u else '0.6')
        sm.append(f'  <url><loc>{u}</loc><lastmod>{dates[n]}</lastmod><priority>{pr}</priority></url>')
    sm.append('</urlset>')
    open(DIST + '/sitemap.xml', 'w', encoding='utf-8').write('\n'.join(sm) + '\n')
    open(DIST + '/robots.txt', 'w', encoding='utf-8').write(f'User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n')
    # redirects (old WordPress / Elementor addresses -> new paths)
    old = {
        'הצהרת-נגישות': '/accessibility', 'צור-קשר': '/contact', 'הצוות': '/team', 'אודות': '/about', 'מאמרים': '/articles/',
        'דיני-חברות': '/corporate-law', 'מורחב-דיני-חברות': '/corporate-law', 'צוואות-וייפוי-כח-מתמשך': '/wills-poa',
        'מורחב-צוואות': '/wills-poa', 'מורחב-ייפוי-כח': '/articles/enduring-poa', 'לשון-הרע': '/defamation',
        'ייצוג-בבתי-משפט': '/litigation', 'הוצאה-לפועל': '/debt-collection', 'רישוי-קבלנים': '/contractor-licensing',
        'דיני-עבודה': '/labor-law', 'נכי-צהל': '/idf-disabled', 'מורחב-נכי-צהל': '/idf-disabled', 'פוסט-טראומה': '/articles/idf-ptsd',
    }
    from urllib.parse import quote
    lines = ['# old WordPress addresses (Hebrew slugs), percent-encoded']
    for k, v in old.items():
        enc = quote(k)
        lines.append(f'/{enc} {v} 301')
        lines.append(f'/{enc}/ {v} 301')
    lines += ['', '# WordPress leftovers',
              '/wp-sitemap.xml /sitemap.xml 301', '/wp-sitemap-posts-page-1.xml /sitemap.xml 301', '/sitemap_index.xml /sitemap.xml 301',
              '/category/* /articles/ 301', '/author/* /about 301', '/feed /  301', '/feed/* / 301', '/comments/feed / 301',
              '/wp-admin/* / 301', '/wp-login.php / 301', '/wp-json/* / 301', '/xmlrpc.php / 301',
              '/index.html / 301!', '/civil-procedure-guide /articles/civil-procedure-guide 301',
              '/minority-oppression /articles/minority-oppression 301', '/administrative-petition /articles/administrative-petition 301']
    # old WordPress addresses with a trailing slash (the indexed form) -> clean paths
    lines += ['', '# trailing-slash addresses of the WordPress site']
    for n in PAGES:
        if n in ('index', '404', 'articles'): continue
        lines.append(f'/{n}/ /{n} 301')
    for n in ARTICLES:
        lines.append(f'/articles/{n}/ /articles/{n} 301')
    lines += ['', '# .html addresses -> clean addresses (forced: the files exist)']
    for n in PAGES:
        if n in ('index', '404'): continue
        lines.append(f'/{n}.html /{n} 301!' if n != 'articles' else '/articles.html /articles/ 301!')
    for n in ARTICLES:
        lines.append(f'/articles/{n}.html /articles/{n} 301!')
    open(DIST + '/_redirects', 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    # Google Analytics 4 (loaded by js/main.js only after cookie consent)
    ga = {'script': 'https://*.googletagmanager.com',
          'img': 'https://*.google-analytics.com https://*.googletagmanager.com',
          'connect': 'https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com'}
    csp = (f"default-src 'self'; script-src 'self' 'unsafe-inline' {ga['script']}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
           f"font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: {ga['img']}; connect-src 'self' https://api.web3forms.com {ga['connect']}; "
           "frame-ancestors 'self'; base-uri 'self'; form-action 'self' https://wa.me https://api.web3forms.com; object-src 'none'; upgrade-insecure-requests")
    headers = f"""/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Content-Security-Policy: {csp}

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/css/*
  Cache-Control: public, max-age=86400

/js/*
  Cache-Control: public, max-age=86400
"""
    open(DIST + '/_headers', 'w', encoding='utf-8').write(headers)
    print('pages', len(PAGES), 'articles', len(ARTICLES))


if __name__ == '__main__':
    main()
