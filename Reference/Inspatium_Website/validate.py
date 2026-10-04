"""Validate static links and the presence of the requested bilingual content."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json
ROOT=Path(__file__).resolve().parent
OUT=ROOT/'dist'
class Document(HTMLParser):
    def __init__(self):
        super().__init__(); self.links=[];self.ids=set();self.titles=0;self.h1=0;self.lang=None;self.switch=[]
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='html':self.lang=attrs.get('lang')
        if tag=='title':self.titles+=1
        if tag=='h1':self.h1+=1
        if attrs.get('id'):self.ids.add(attrs['id'])
        if 'href' in attrs:self.links.append(attrs['href'])
        if 'src' in attrs:self.links.append(attrs['src'])
        if tag=='a' and attrs.get('class')=='language':self.switch.append(attrs.get('href'))
errors=[];pages=list(OUT.rglob('*.html'))
for file in pages:
    doc=Document();doc.feed(file.read_text())
    if doc.h1!=1:errors.append(f'{file}: {doc.h1} h1 elements')
    if doc.titles!=1:errors.append(f'{file}: missing or multiple titles')
    if doc.lang not in ('ko','en'):errors.append(f'{file}: incorrect language')
    if len(doc.switch)!=1:errors.append(f'{file}: missing language switch')
    for raw in doc.links:
        url=urlsplit(raw)
        if url.scheme or url.netloc:continue
        target=(file.parent/unquote(url.path)).resolve() if url.path else file
        if not target.exists():errors.append(f'{file.relative_to(OUT)} -> {raw}: missing file')
        elif url.fragment and target.suffix=='.html':
            other=Document();other.feed(target.read_text())
            if url.fragment not in other.ids:errors.append(f'{file}: missing anchor {raw}')
data=json.loads((ROOT/'content.json').read_text())
ko=(OUT/'ko/philosophy/index.html').read_text()
import html
for key in ['vision','mission','philosophy']:
    if html.escape(data['identity'][key],quote=True) not in ko:errors.append('Missing identity: '+key)
for key in ['mission_body','philosophy_body']:
    for para in data['identity'][key]:
        if html.escape(para,quote=True) not in ko:errors.append('Changed identity paragraph')
greeting=(OUT/'ko/greeting/index.html').read_text()
for para in data['greeting']:
    if para not in greeting:errors.append('Changed founder greeting')
for person in data['people']:
    for lang in ['ko','en']:
        text=(OUT/lang/'team'/person['id']/'index.html').read_text()
        if 'mailto:None' in text or 'href="#"' in text:errors.append('Invalid contact placeholder')
print(json.dumps({'pages':len(pages),'local_links':'checked','language_switches':'checked','approved_copy':'checked','errors':errors},ensure_ascii=False,indent=2))
raise SystemExit(bool(errors))
