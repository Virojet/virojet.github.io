from __future__ import annotations
import argparse
import json
import os
import shutil
from html import escape
from pathlib import Path

SOURCE=Path(__file__).resolve().parent
MODS=json.loads((SOURCE/'catalog.json').read_text(encoding='utf-8-sig'))
BY_ID={m['slug']:m for m in MODS}
GROUPS=['Core','Controls','Audio','Themes','Experimental','Other tools']
P=argparse.ArgumentParser()
P.add_argument('--output',default='dist')
P.add_argument('--origin',default='https://virojet.github.io')
ARGS=P.parse_args()
OUT=Path(ARGS.output).resolve()
ORIGIN=ARGS.origin.rstrip('/')
OUT.mkdir(parents=True,exist_ok=True)
E=lambda s:escape(str(s),quote=True)
ICONS={
'crosshair':'<circle cx="12" cy="12" r="7"/><path d="M12 2v5m0 10v5M2 12h5m10 0h5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
'arrow':'<path d="M6 18 18 6M6 6h12v12"/>',
'download':'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
'grid':'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
'chart':'<path d="M4 20h16M6 16V9m6 7V4m6 12v-5"/>',
'sliders':'<path d="M5 3v7m0 4v7M12 3v3m0 4v11M19 3v11m0 4v3M2 10h6m1-4h6m1 8h6"/>',
'wave':'<path d="M3 10v4m4-7v10m5-14v18m5-14v10m4-7v4"/>',
'spark':'<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/>',
'flower':'<path d="M12 11C5 7 10 1 12 6c2-5 7 1 0 5Zm1 1c4-7 10-2 5 0 5 2-1 7-5 0Zm-1 1c7 4 2 10 0 5-2 5-7-1 0-5Zm-1-1c-4 7-10 2-5 0-5-2 1-7 5 0Z"/><circle cx="12" cy="12" r="1.5"/>',
'flask':'<path d="M9 3h6m-5 0v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M7 15h10"/>',
'play':'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3Z"/>',
'search':'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
'info':'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
'github':'<path d="M9 20c-4 1-4-2-6-2m12 4v-4a3 3 0 0 0-.8-2.3c2.7-.3 5.5-1.3 5.5-6A4.7 4.7 0 0 0 18.5 6a4.5 4.5 0 0 0-.1-3s-1-.3-3.4 1a11 11 0 0 0-6 0C6.6 2.7 5.6 3 5.6 3a4.5 4.5 0 0 0-.1 3A4.7 4.7 0 0 0 4.3 9.7c0 4.7 2.8 5.7 5.5 6A3 3 0 0 0 9 18v4"/>',
'menu':'<path d="M4 6h16M4 12h16M4 18h16"/>',
'copy':'<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H4v13h4"/>'}
DEFS='<svg xmlns="http://www.w3.org/2000/svg" class="svg-defs" aria-hidden="true">'+''.join(f'<symbol id="icon-{k}" viewBox="0 0 24 24">{v}</symbol>' for k,v in ICONS.items())+'</svg>'
def icon(name,cls=''):
    return f'<svg class="icon {cls}" aria-hidden="true"><use href="#icon-{name}"/></svg>'
def external(url,label,cls='text-link'):
    return f'<a class="{cls}" href="{E(url)}" target="_blank" rel="noopener noreferrer">{label}{icon("arrow","arrow")}</a>'
def rel(target,page):
    return os.path.relpath(OUT/target,(OUT/page).parent).replace(os.sep,'/')
def mpath(m,install=False):
    return f'mods/{m["slug"]}/'+('install/' if install else '')+'index.html'
def button(m,raw=False):
    href=m['install'] if raw else mpath(m,True)
    return href

def layout(page,title,body,selected=None,section='overview',desc='Browse and install Virojet’s Shell Shockers mods. Tampermonkey installation guides and verified GitHub links.'):
    def link(t):return rel(t,page)
    nav=''
    for group in GROUPS:
        items=''
        for m in MODS:
            if m['category']!=group:continue
            active=' active' if selected==m['slug'] else ''
            current=' aria-current="page"' if active else ''
            lab='<span class="lab" aria-label="Experimental"></span>' if group=='Experimental' else ''
            search=E((m['title']+' '+m['category']+' '+m['repo']).lower())
            items+=f'<a class="nav-item{active}" href="{link(mpath(m))}" data-search="{search}"{current}>{icon(m["mark"])}<span>{E(m["title"])}</span>{lab}</a>'
        nav+=f'<section class="nav-group"><h2>{E(group)}</h2>{items}</section>'
    active_all=' active' if section=='library' else ''
    canonical=ORIGIN+'/'+page.removesuffix('index.html')
    crumb=BY_ID[selected]['title'] if selected else ('All mods' if section=='library' else 'Installation guide')
    tabs=''
    if selected:
        m=BY_ID[selected]
        tabs=f'<nav class="tabs" aria-label="{E(m["title"])} pages"><a class="{"active" if section=="overview" else ""}" href="{link(mpath(m))}"'+(' aria-current="page"' if section=='overview' else '')+f'>Overview</a><a class="{"active" if section=="install" else ""}" href="{link(mpath(m,True))}"'+(' aria-current="page"' if section=='install' else '')+f'>Install</a>{external(m["repository"],"GitHub source","source-tab")}</nav>'
    html=f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#111613"><title>{E(title)} | BetterHUD by Virojet</title><meta name="description" content="{E(desc)}"><meta property="og:title" content="{E(title)} | BetterHUD"><meta property="og:description" content="{E(desc)}"><meta property="og:type" content="website"><meta property="og:url" content="{E(canonical)}"><meta property="og:image" content="{E(ORIGIN)}/assets/background.webp"><link rel="canonical" href="{E(canonical)}"><link rel="icon" href="{link('assets/favicon.svg')}" type="image/svg+xml"><link rel="stylesheet" href="{link('styles.css')}"><script src="{link('app.js')}" defer></script></head>
<body><a href="#main" class="skip">Skip to content</a>{DEFS}
<aside class="sidebar" id="sidebar" aria-label="Mod navigation"><a class="brand" href="{link('index.html')}">{icon('crosshair','brand-mark')}<span>BetterHUD<small>MODS BY VIROJET</small></span></a><div class="search-wrap">{icon('search')}<label class="sr-only" for="nav-search">Search mod navigation</label><input type="search" id="nav-search" placeholder="Find a mod…" autocomplete="off"></div><nav class="nav-scroll" aria-label="Mods"><a class="nav-all{active_all}" href="{link('mods/index.html')}">{icon('grid')}All mods<span>{len(MODS)}</span></a>{nav}<p class="nav-empty" id="nav-empty" role="status" hidden>No matching mods.</p></nav><div class="sidebar-footer"><div class="author-mini"><img src="{link('assets/avatar.webp')}" alt="Virojet avatar" width="31" height="31"><div><strong>Made by Virojet</strong><span>Shell Shockers creator</span></div></div><div class="author-links"><a href="https://www.youtube.com/@subtovirojet" target="_blank" rel="noopener noreferrer">YouTube ↗</a><a href="https://discord.com/invite/yWnDAYKA9n" target="_blank" rel="noopener noreferrer">Discord ↗</a></div></div></aside>
<button type="button" class="nav-veil" aria-label="Close navigation" tabindex="-1"></button>
<div class="workspace"><header class="topbar"><button type="button" class="mobile-toggle" data-menu-toggle aria-label="Open mod navigation" aria-controls="sidebar" aria-expanded="false">{icon('menu')}</button><div class="crumb"><a class="crumb-parent" href="{link('mods/index.html')}">Mod library</a><span class="crumb-parent" aria-hidden="true">/</span><strong>{E(crumb)}</strong></div><nav class="toplinks" aria-label="Resources"><a href="{link('guide/index.html')}">Install guide</a><a href="https://discord.com/invite/yWnDAYKA9n" target="_blank" rel="noopener noreferrer">Community</a><a href="https://github.com/Virojet" target="_blank" rel="noopener noreferrer" aria-label="Virojet on GitHub">{icon('github')}<span class="github-label">GitHub</span></a></nav></header><main id="main" class="content">{tabs}{body}<footer class="page-footer"><span>BetterHUD · Made by <a href="https://github.com/Virojet" target="_blank" rel="noopener noreferrer">Virojet</a></span><div><a href="https://www.youtube.com/@subtovirojet" target="_blank" rel="noopener noreferrer">YouTube ↗</a><a href="https://discord.com/invite/yWnDAYKA9n" target="_blank" rel="noopener noreferrer">Discord ↗</a><a href="https://twitch.tv/virojet" target="_blank" rel="noopener noreferrer">Twitch ↗</a></div></footer></main></div><noscript><style>.sidebar{{position:static;transform:none;width:100%;max-height:460px}}.workspace{{margin-left:0}}.search-wrap,.mobile-toggle,.library-tools{{display:none}}</style></noscript></body></html>'''
    target=OUT/page;target.parent.mkdir(parents=True,exist_ok=True);target.write_text(html,encoding='utf-8')

def note(m):
    experimental=m['category']=='Experimental'
    return f'<aside class="note{" experimental" if experimental else ""}">{icon("info")}<div><strong>{"Experimental build" if experimental else "Good to know"}</strong><p>{E(m["note"])}</p></div></aside>'

def overview(m,page):
    link=lambda p:rel(p,page)
    eyebrow='Experimental build' if m['category']=='Experimental' else (m['category']+' / '+('YouTube' if m['slug']=='hide-youtube-feed' else 'Shell Shockers'))
    feats=''.join(f'<article class="feature"><span class="feature-no">0{i+1} /</span><h3>{E(f[0])}</h3><p>{E(f[1])}</p></article>' for i,f in enumerate(m['features']))
    related=[x for x in MODS if x['slug']!=m['slug'] and x['category']!='Experimental'][:2]
    if m['slug']=='better-hud':related=[BY_ID['mod-menu'],BY_ID['valorant-kill-sounds']]
    cards=''.join(f'<a class="related" href="{link(mpath(r))}">{icon(r["mark"])}<div><strong>{E(r["title"])}</strong><span>{E(r["category"])}</span></div>{icon("arrow","arrow")}</a>' for r in related)
    body=f'''<section class="hero" aria-labelledby="mod-title"><div class="hero-art" aria-hidden="true"></div><div class="hero-grid" aria-hidden="true">{icon(m['mark'])}</div><div class="hero-copy"><div class="eyebrow"><span>{E(eyebrow)}</span><span class="version">v{E(m['version'])}</span></div><h1 id="mod-title">{E(m['title'])}</h1><p>{E(m['description'])}</p><div class="hero-actions"><a class="button" href="{link(mpath(m,True))}">{icon('download')}Install {E(m['title'])}{icon('arrow','arrow')}</a>{external(m['repository'],'View source')}</div></div></section><p class="hero-caption">FREE &amp; OPEN SOURCE · DESKTOP USERSCRIPT</p><div class="section-title"><h2>{E(m['summary'])}</h2></div><div class="feature-grid">{feats}</div>{note(m)}<section class="quickstart"><div><h2>Ready for your next match?</h2><p>Get Tampermonkey, install the script, and reload {'YouTube' if m['slug']=='hide-youtube-feed' else 'Shell Shockers'}.</p></div><a class="button secondary" href="{link(mpath(m,True))}">Installation guide{icon('arrow','arrow')}</a></section><div class="section-title"><h2>More from Virojet</h2><a href="{link('mods/index.html')}">View all mods{icon('arrow','arrow')}</a></div><div class="more-row">{cards}</div>'''
    if m['slug']=='hide-youtube-feed':body=body.replace('Ready for your next match?','A quieter home page, in three steps.')
    layout(page,m['title'],body,m['slug'],'overview',m['description'])

def install(m,page):
    link=lambda p:rel(p,page)
    target='YouTube' if m['slug']=='hide-youtube-feed' else 'Shell Shockers'
    url=E(m['install'])
    auto='Manual updates' if m['slug']=='sidebar-test' else 'Repository updates'
    body=f'''<header class="install-heading"><div class="eyebrow"><span>INSTALLATION</span><span class="version">v{E(m['version'])}</span></div><h1>Install {E(m['title'])}</h1><p>Use Tampermonkey to install the latest script directly from Virojet’s GitHub repository.</p></header>{note(m)}<div class="install-layout"><div class="install-flow"><section class="step"><span class="step-index">1</span><div><h2>Get Tampermonkey</h2><p>Choose your desktop browser and install Tampermonkey from its official extension store.</p><div class="browser-picker"><label class="sr-only" for="browser-select">Your browser</label><select id="browser-select"><option value="chrome">Chrome / Brave</option><option value="edge">Microsoft Edge</option><option value="firefox">Firefox</option><option value="opera">Opera GX</option><option value="other">Other browser</option></select><a class="button secondary" id="manager-link" href="https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo" target="_blank" rel="noopener noreferrer">Get Tampermonkey{icon('arrow','arrow')}</a></div><p class="setup-note" id="chromium-note">In Chrome, Edge, Brave or Opera, open Extensions → Tampermonkey → Details and enable <strong>Allow User Scripts</strong>, if shown. <a class="inline" href="https://github.com/Virojet/Shell-Shockers-Better-Hud-Mod#allow-user-scripts" target="_blank" rel="noopener noreferrer">Browser setup instructions ↗</a></p></div></section><section class="step"><span class="step-index">2</span><div><h2>Install the latest script</h2><p>Open the script below. Tampermonkey opens its installation page; review it and select <strong>Install</strong>.</p>{external(m['install'],'Install latest version','button')}<p>If the link shows code, make sure Tampermonkey is installed and enabled. Then open the link again.</p></div></section><section class="step"><span class="step-index">3</span><div><h2>Reload {target}</h2><p>{E(m['settings'])}</p>{external('https://www.youtube.com/' if target=='YouTube' else 'https://shellshock.io','Open '+target,'button secondary')}</div></section><details class="help"><summary>Still not showing up?</summary><ol><li>Check that Tampermonkey and the selected script are enabled.</li><li>Check Allow User Scripts in the extension's settings where required.</li><li>Reload the game or website after installing.</li><li>Check the compatibility note above.</li></ol><p>Read the <a class="inline" href="{E(m['repository'])}" target="_blank" rel="noopener noreferrer">project documentation</a> or ask in the <a class="inline" href="https://discord.com/invite/yWnDAYKA9n" target="_blank" rel="noopener noreferrer">Discord community</a>.</p></details></div><aside class="install-aside" aria-label="Download details"><div class="aside-art">{icon(m['mark'])}</div><div class="aside-body"><h2>{E(m['title'])}</h2><p class="version-line">Verified version {E(m['version'])}</p>{external(m['install'],'Install in Tampermonkey','button')}<dl class="aside-meta"><div><dt>Platform</dt><dd>Desktop {target}</dd></div><div><dt>Manager</dt><dd>Tampermonkey</dd></div><div><dt>Updates</dt><dd>{auto}</dd></div><div><dt>Version checked</dt><dd>25 Oct 2026</dd></div></dl>{external(m['repository'],'GitHub repository')}<button type="button" class="copy-button" data-copy-install="{url}">{icon('copy')}Copy install link</button><p class="copy-status" id="copy-status" role="status" aria-live="polite"></p><label class="sr-only" for="install-url">Install link</label><input class="copy-input" id="install-url" type="url" readonly hidden></div></aside></div>'''
    layout(page,'Install '+m['title'],body,m['slug'],'install','Install '+m['title']+' with Tampermonkey. Direct GitHub userscript link and browser setup guide.')

def library():
    page='mods/index.html';link=lambda p:rel(p,page)
    cards=''
    for m in MODS:
        search=E((m['title']+' '+m['category']+' '+m['description']).lower())
        cards+=f'<a class="mod-tile" data-mod-card data-group="{E(m["category"])}" data-search="{search}" href="{link(mpath(m))}"><div class="tile-top">{icon(m["mark"])}<span class="tile-meta">v{E(m["version"])}</span></div><div><h2>{E(m["title"])}</h2><p>{E(m["description"])}</p></div><div class="tile-bottom"><span>{E(m["category"])}</span>Explore mod{icon("arrow","arrow")}</div></a>'
    filters=''.join(f'<button type="button" data-filter="{E(g)}" aria-pressed="{"true" if g=="all" else "false"}">{"All" if g=="all" else E(g)}</button>' for g in ['all','Core','Controls','Audio','Themes','Other tools','Experimental'])
    body=f'<header class="library-heading"><div class="eyebrow">THE COLLECTION</div><h1>A better setup starts here.</h1><p>Browse Virojet’s Shell Shockers mods, themes and tools. Every project has its own overview, Tampermonkey guide and direct install link.</p></header><div class="library-tools"><div class="library-search">{icon("search")}<label class="sr-only" for="library-search">Search all mods</label><input id="library-search" type="search" placeholder="Search the collection…" autocomplete="off"></div><div class="filters" role="group" aria-label="Filter mods">{filters}</div></div><p class="result-count" id="result-count" role="status">{len(MODS)} projects</p><div class="library-grid">{cards}</div><p class="empty" id="library-empty" hidden>No matching mods. Try another search or choose All.</p>'
    layout(page,'All mods',body,None,'library')

def guide():
    page='guide/index.html';link=lambda p:rel(p,page)
    body=f'''<header class="install-heading"><div class="eyebrow">GET STARTED</div><h1>From download to in-game.</h1><p>All the mods in this library install through Tampermonkey. Choose a mod, follow its guide, and make your setup your own.</p></header><div class="guide-body"><section class="step"><span class="step-index">1</span><div><h2>Install Tampermonkey for your browser</h2><p>Use the official extension marketplace for your desktop browser.</p><div class="browser-links"><a href="https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo" target="_blank" rel="noopener noreferrer">Chrome / Brave ↗</a><a href="https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd" target="_blank" rel="noopener noreferrer">Edge ↗</a><a href="https://addons.mozilla.org/firefox/addon/tampermonkey/" target="_blank" rel="noopener noreferrer">Firefox ↗</a><a href="https://www.tampermonkey.net/" target="_blank" rel="noopener noreferrer">Opera GX / other ↗</a></div><p>For Chromium browsers, check Extensions → Tampermonkey → Details → <strong>Allow User Scripts</strong>. <a class="inline" href="https://github.com/Virojet/Shell-Shockers-Better-Hud-Mod#allow-user-scripts" target="_blank" rel="noopener noreferrer">Detailed browser setup ↗</a></p></div></section><section class="step"><span class="step-index">2</span><div><h2>Choose a mod and open its install page</h2><p>Use a mod’s Install tab. Its latest-version button opens the actual .user.js file from Virojet’s GitHub repository, so Tampermonkey can display the installation prompt. Select <strong>Install</strong> there.</p><a class="button" href="{link('mods/index.html')}">Browse all mods{icon('arrow','arrow')}</a></div></section><section class="step"><span class="step-index">3</span><div><h2>Reload and open your settings</h2><p>Reload Shell Shockers after installing a game mod. BetterHUD adds MODS and CROSSHAIR tabs to Settings. Other mods show their own instructions on their install pages. The YouTube tool needs a YouTube reload instead.</p></div></section><aside class="note">{icon('info')}<div><strong>Build a setup that works together</strong><p>Use one theme at a time. BetterHUD already includes Match History, so a separate Stats Mod is optional. When using Mod Menu to run a script, disable its separate Tampermonkey copy. Keep experimental BetterHUD builds separate from the stable release.</p></div></aside><details class="help"><summary>What happens when a mod is updated?</summary><p>Install links follow the repository’s main or default branch. Tampermonkey can check the script’s update URL for newer versions. The experimental sidebar build has no automatic update URL. Version labels on this website were verified on 25 October 2026.</p></details><div class="creator-strip"><img src="{link('assets/avatar.webp')}" alt="Virojet avatar" width="45" height="45"><div><h2>Built by Virojet.</h2><p>Shell Shockers gameplay, montages and mods.</p></div>{external('https://www.youtube.com/@subtovirojet','YouTube')}</div></div>'''
    layout(page,'Installation guide',body,None,'guide')

shutil.copyfile(SOURCE/'base.css',OUT/'styles.css')
with (OUT/'styles.css').open('a',encoding='utf-8') as f:f.write('\n.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}\n')
shutil.copyfile(SOURCE/'site.js',OUT/'app.js')
(OUT/'assets').mkdir(exist_ok=True)
for asset in (SOURCE/'assets').iterdir():
    if asset.is_file():shutil.copyfile(asset,OUT/'assets'/asset.name)
for mod in MODS:
    overview(mod,mpath(mod))
    install(mod,mpath(mod,True))
overview(BY_ID['better-hud'],'index.html')
library();guide()
(OUT/'.nojekyll').write_text('',encoding='utf-8')
pages=sorted(p for p in OUT.rglob('index.html'))
(OUT/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<url><loc>'+escape(ORIGIN+'/'+p.relative_to(OUT).as_posix().removesuffix('index.html'))+'</loc></url>' for p in pages)+'</urlset>',encoding='utf-8')
(OUT/'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: '+ORIGIN+'/sitemap.xml\n',encoding='utf-8')
print(json.dumps({'output':str(OUT),'pages':len(pages),'mods':len(MODS),'primary_manager':'Tampermonkey','origin':ORIGIN}))
