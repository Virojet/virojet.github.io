from __future__ import annotations
import argparse
import json
import re
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

p=argparse.ArgumentParser();p.add_argument('--output',default='dist');args=p.parse_args()
root=Path(args.output).resolve()
catalog=json.loads((Path(__file__).resolve().parent/'catalog.json').read_text(encoding='utf-8-sig'))
class Page(HTMLParser):
    def __init__(self):
        super().__init__();self.ids=[];self.refs=[];self.anchors=[];self.h1s=0;self.lang=None;self.text=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.append(a['id'])
        if tag=='html':self.lang=a.get('lang')
        if tag=='h1':self.h1s+=1
        if tag=='a' and 'href' in a:self.anchors.append(a)
        if 'src' in a:self.refs.append(a['src'])
        if 'href' in a:self.refs.append(a['href'])
    def handle_data(self,data):self.text.append(data)
errors=[];pages={};local_refs=0
for file in sorted(root.rglob('*.html')):
    page=Page();page.feed(file.read_text(encoding='utf-8-sig'));pages[file]=page
    name=file.relative_to(root).as_posix()
    if page.lang!='en':errors.append(f'{name}: missing language')
    if page.h1s!=1:errors.append(f'{name}: expected one h1, got {page.h1s}')
    duplicate=[x for x,n in Counter(page.ids).items() if n>1]
    if duplicate:errors.append(f'{name}: duplicate IDs {duplicate}')
    for a in page.anchors:
        if a.get('target')=='_blank' and 'noopener' not in a.get('rel',''):errors.append(f'{name}: unsafe new tab link')
    for ref in page.refs:
        u=urlsplit(ref)
        if u.scheme or u.netloc:continue
        target=(file.parent/unquote(u.path)).resolve() if u.path else file
        if not target.is_relative_to(root):errors.append(f'{name}: link leaves output: {ref}');continue
        if target.is_dir():target=target/'index.html'
        if not target.is_file():errors.append(f'{name}: missing target: {ref}');continue
        local_refs+=1
        if u.fragment and target==file and u.fragment not in page.ids:errors.append(f'{name}: missing fragment: {ref}')
    if 'Violentmonkey' in ''.join(page.text):errors.append(f'{name}: Tampermonkey must be the primary manager')
for m in catalog:
    overview=root/f'mods/{m["slug"]}/index.html';install=root/f'mods/{m["slug"]}/install/index.html'
    if overview not in pages or install not in pages:errors.append(f'{m["slug"]}: missing overview/install route');continue
    page=pages[install]
    direct=[a for a in page.anchors if a['href']==m['install']]
    if len(direct)<2:errors.append(f'{m["slug"]}: primary install links missing')
    if not m['install'].startswith('https://raw.githubusercontent.com/Virojet/') or not m['install'].endswith('.user.js'):errors.append(f'{m["slug"]}: invalid install URL')
    text=''.join(page.text)
    if 'Tampermonkey' not in text or m['version'] not in text:errors.append(f'{m["slug"]}: manager/version missing')
    if m['category']=='Experimental' and 'does not auto-update' not in text:errors.append(f'{m["slug"]}: experimental notice missing')
for css in root.glob('*.css'):
    for ref in re.findall(r'url\([\'\"]?([^\)\'\"]+)',css.read_text(encoding='utf-8-sig')):
        if not ref.startswith(('http','data:')) and not (css.parent/ref).is_file():errors.append(f'{css.name}: missing CSS image: {ref}')
if len(pages)!=2*len(catalog)+3:errors.append(f'Unexpected HTML page count: {len(pages)}')
if errors:
    raise SystemExit('\n'.join(errors))
print(json.dumps({'result':'passed','pages':len(pages),'mods':len(catalog),'overview_routes':len(catalog),'install_routes':len(catalog),'local_link_and_asset_checks':local_refs,'primary_manager':'Tampermonkey'}))
