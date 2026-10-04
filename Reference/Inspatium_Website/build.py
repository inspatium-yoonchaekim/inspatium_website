"""Generate a bilingual, portable static HTML website from content.json."""
import json, os, html, shutil
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'dist'
DATA = json.loads((ROOT / 'content.json').read_text())
SITE = DATA['site']
ORIGIN = 'https://inspatium-research.sjchoi764544.chatgpt.site'
LANG = 'ko'
CURRENT = 'index.html'
PAGE = 'home'

def esc(value): return html.escape(str(value), quote=True)
def tr(ko, en): return ko if LANG == 'ko' else en
def field(obj, name): return obj.get(name + '_en', obj.get(name, '')) if LANG == 'en' else obj.get(name, '')
def route(name='home'):
    if name == 'home': return 'index.html'
    return name.rstrip('/') + '/index.html'
def link(name='home', locale=None):
    target = f'{locale or LANG}/{route(name)}'
    return os.path.relpath(target, os.path.dirname(CURRENT) or '.').replace(os.sep, '/')
def asset(name): return os.path.relpath('assets/' + name, os.path.dirname(CURRENT) or '.').replace(os.sep, '/')
def href(name, label, cls=''):
    return f'<a class="{cls}" href="{link(name)}">{label}</a>'
def paragraphs(items): return ''.join(f'<p>{item}</p>' for item in items)
def section(content, cls='', ident=''):
    return f'<section class="section {cls}"{f" id={ident}" if ident else ""}><div class="wrap">{content}</div></section>'
def section_head(label, title, action=None):
    action_html = href(action[0], action[1], 'text-link') if action else ''
    return f'<div class="section-head"><div><div class="eyebrow">{label}</div><h2>{title}</h2></div>{action_html}</div>'
def badge(text): return f'<span class="badge">{esc(text)}</span>'
def portrait(person):
    if person.get('photo'):
        return f'<div class="portrait"><img src="{asset(person["photo"])}" alt="{esc(field(person,"name"))}" width="400" height="460" loading="lazy"></div>'
    return f'<div class="portrait" role="img" aria-label="{esc(field(person,"name"))} {tr("프로필 사진 자리","portrait placeholder")}"><span class="initials" aria-hidden="true">{person["initials"]}</span><span class="photo-label">{tr("프로필 사진","Profile photo")}</span></div>'
def person_card(person):
    interests=''.join(f'<span>{esc(i)}</span>' for i in field(person,'interests'))
    projects=[p for p in DATA['projects'] if person['id'] in p['people']]
    research_links=''.join(href('research/'+p['id'],esc(field(p,'title'))) for p in projects)
    involvement=f'<div class="person-research"><h4>{tr("참여 연구","Research involvement")}</h4>{research_links}</div>' if projects else ''
    return f'''<article class="person-card" id="{person['id']}" aria-labelledby="name-{person['id']}">
      <div class="person-top">{portrait(person)}<div><h3 id="name-{person['id']}">{esc(field(person,'name'))}</h3><p class="role">{esc(field(person,'role'))}</p></div></div>
      <p class="person-intro">{esc(field(person,'intro'))}</p>
      <div class="person-interests"><h4>{tr('관심 분야','Research interests')}</h4><div>{interests}</div></div>
      {involvement}{contact_lines(person)}</article>'''
def people_grid(): return '<div class="team-grid">'+''.join(person_card(p) for p in DATA['people'])+'</div>'
def project_card(project):
    return f'<article class="research-card"><div class="number">{project["number"]}</div><h3>{href("research/"+project["id"],esc(field(project,"title")))}</h3><p>{esc(field(project,"summary"))}</p><div class="card-end">{badge(field(project,"status"))}{href("research/"+project["id"],tr("연구 보기","View research"),"text-link")}</div></article>'
def paper_row(paper):
    original = f'<p class="original">{esc(paper["original_title"])}</p>' if LANG == 'ko' else ''
    return f'<article class="paper-row"><div class="paper-meta">{paper["year"]}</div><div><h3>{href("publications/"+paper["id"],esc(field(paper,"title")))}</h3>{original}<div class="paper-meta">{esc(paper["venue"])} · {tr("학술논문","Journal article")}</div></div><div>{badge(field(paper,"status"))}</div></article>'
def hardware():
    image = SITE.get('hardware_image')
    if image:
        return f'<figure class="hardware"><img src="{asset(image)}" alt="{esc(field(SITE,"hardware_caption"))}" loading="lazy"><figcaption>{esc(field(SITE,"hardware_caption"))}</figcaption></figure>'
    return f'<figure class="hardware"><div class="hardware-slot">{tr("실험 장비 사진","Experimental hardware photo")}<br><small>{tr("사진 등록 예정","Image to be added")}</small></div><figcaption>{tr("홀로그래피 실험 체계","Holography experimental system")}</figcaption></figure>'
def about_nav():
    entries=[('philosophy',tr('경영철학','Philosophy')),('greeting',tr('인사말','Lead Researcher’s message')),('about',tr('연구 방향','Our work')),('history',tr('연혁','History'))]
    return '<div class="section-nav"><div class="wrap">'+''.join(href(a,b,'active' if PAGE==a else '') for a,b in entries)+'</div></div>'
def header():
    about_active = PAGE in ['about','philosophy','greeting','history']
    dropdown=''.join(href(a,b,'active' if PAGE==a else '') for a,b in [('philosophy',tr('경영철학','Philosophy')),('greeting',tr('인사말','Lead Researcher’s message')),('about',tr('연구 방향','Our work')),('history',tr('연혁','History'))])
    nav=''.join(href(a,b,('active ' if PAGE==a or PAGE.startswith(a+'/') else '')+('nav-contact' if a=='contact' else '')) for a,b in [('research',tr('연구','Research')),('publications',tr('논문','Publications')),('team',tr('구성원','Team')),('news',tr('소식','News')),('join',tr('연구원 모집','Join us')),('contact',tr('문의','Contact'))])
    target_locale='en' if LANG=='ko' else 'ko'
    return f'''<a class="skip" href="#main">{tr('본문 바로가기','Skip to content')}</a><header class="header"><div class="wrap header-inner">
    {href('home','INSPATIUM<span>'+tr('인스파티움','Inverse design research')+'</span>','wordmark')}
    <nav class="nav" id="main-navigation" aria-label="{tr('주 메뉴','Main navigation')}"><details><summary class="{'active' if about_active else ''}">{tr('소개','About')}</summary><div class="subnav">{dropdown}</div></details>{nav}</nav>
    <a class="language" lang="{target_locale}" href="{link(PAGE,target_locale)}" aria-label="{tr('Switch to English','한국어로 전환')}">{tr('EN','한국어')}</a>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="main-navigation">{tr('메뉴','Menu')}</button></div></header>'''
def footer():
    return f'''<footer class="footer"><div class="wrap"><div class="footer-top"><div>{href('home','INSPATIUM','wordmark')}<p>{tr('수학과 물리학을 바탕으로, 피지컬 AI를 연구합니다.','Physical AI, grounded in mathematics and physics.')}</p><a class="footer-email" href="mailto:{esc(SITE['email'])}">{esc(SITE['email'])}</a></div><div class="footer-links">{href('philosophy',tr('경영철학','Philosophy'))}{href('greeting',tr('인사말','Lead Researcher’s message'))}{href('join',tr('연구원 모집','Join us'))}{href('contact',tr('문의','Contact'))}</div></div><div class="footer-bottom">© 2026 Inspatium. {tr('인스파티움 · 2025년 출범','Founded in 2025')}</div></div></footer>'''
def page_head(title, lead='', category=None, dark=False):
    crumb = href('home',tr('홈','Home')) + '<span>/</span>' + esc(category or title.replace('<br>',' '))
    return f'<section class="page-head"><div class="wrap"><div class="breadcrumbs">{crumb}</div><h1>{title}</h1>{f"<p>{lead}</p>" if lead else ""}</div></section>'
def contact_lines(person):
    email = person.get('email','')
    kakao = person.get('kakao','')
    email_html=f'<a href="mailto:{esc(email)}">{esc(email)}</a>' if email else f'<span class="unfilled">{tr("등록 예정","To be added")}</span>'
    kakao_html=esc(kakao) if kakao else f'<span class="unfilled">{tr("등록 예정","To be added")}</span>'
    return f'<div class="contact-lines"><div class="contact-line"><span>{tr("이메일","Email")}</span>{email_html}</div><div class="contact-line"><span>{tr("카카오톡 ID","KakaoTalk ID")}</span><span>{kakao_html}</span></div></div>'
def home():
    shortcuts=[('acoustic-optimization',tr('음향 · 실시간 계산','Acoustics & real-time computation')),('few-shot-inverse-design',tr('데이터 역설계','Data-driven inverse design')),('embedded-physical-ai',tr('DPU·SoC 제어','DPU/SoC control')),('holography-hardware',tr('실험 체계','Experimental systems'))]
    quick=''.join(href('research/'+slug,label) for slug,label in shortcuts)
    hero=f'''<section class="hero"><img class="hero-art" src="{asset('wave-hero.webp')}" alt="" width="1672" height="941" fetchpriority="high"><div class="wrap hero-content"><div class="eyebrow">{esc(field(DATA['identity'],'vision'))}</div><h1>{tr('피지컬 AI의 미래는<br><em>역설계</em>에서 시작됩니다.','The future of physical AI<br>begins with <em>inverse design.</em>')}</h1><p class="lead">{esc(field(DATA['identity'],'mission_body')[0])}</p><div class="actions">{href('philosophy',tr('경영철학','Our philosophy'),'button')}{href('greeting',tr('인사말','Lead Researcher’s message'),'button secondary')}</div></div><div class="hero-bottom"><div class="wrap"><span>{tr('연구 분야','Research areas')}</span><nav aria-label="{tr('연구 분야 바로가기','Research areas')}">{quick}</nav></div></div></section>'''
    project=DATA['projects'][0]
    feat=f'''<div class="featured-heading"><div><div class="eyebrow">{tr('주요 연구','Featured research')}</div><h2>{tr('음향 홀로그래피의<br>실시간급 최적화','Real-time optimization<br>for acoustic holography')}</h2><p>{esc(field(project,'summary'))}</p><div class="actions">{href('research/'+project['id'],tr('연구 내용','Research details'),'text-link')}{href('publications',tr('관련 논문','Publications'),'text-link')}</div></div><div class="research-result"><div class="feature-label">{tr('단일 물체 제어 명령 계산','Single-object command computation')}</div><div class="stat">7.86<small>{tr('밀리초','ms')}</small></div><p class="stat-caption">{tr('CPU 기준 · 동일 비교 조건<br>기존 방법 28.96초','On a CPU · Under the same protocol<br>Conventional method: 28.96 s')}</p><span class="result-note">{tr('별도의 물리 모델로 검증한 전산 연구','Computational study, checked with a separate physical model')}</span></div></div>'''
    feat+='<div class="research-continuation">'+''.join(f'<a href="{link("research/"+p["id"])}"><span>{esc(field(p,"status"))}</span><h3>{esc(field(p,"title"))}</h3><p>{esc(field(p,"summary"))}</p></a>' for p in DATA['projects'][1:])+'</div>'
    excerpt=(DATA['greeting'] if LANG=='ko' else DATA['greeting_en'])[0].split('. ',1)[0].rstrip('.')+'.'
    introduction=f'''<div class="introduction-grid"><article><div class="eyebrow">{tr('경영철학','Our philosophy')}</div><h2>{esc(field(DATA['identity'],'philosophy'))}</h2><p>{esc(field(DATA['identity'],'philosophy_body')[0])}</p>{href('philosophy',tr('비전과 경영철학','Vision and philosophy'),'text-link')}</article><article><div class="eyebrow">{tr('인사말','Lead Researcher’s message')}</div><h2>{tr('안녕하십니까?<br>인스파티움의 리드 연구자 최성준입니다.','Welcome.<br>I am SungJun Choi, Lead Researcher at Inspatium.')}</h2><p>{esc(excerpt)}</p>{href('greeting',tr('인사말 전문 보기','Read the lead researcher’s message'),'text-link')}</article></div>'''
    join_band=f'''<div class="join-band-inner"><div><div class="eyebrow">{tr('연구원 모집','Join us')}</div><h2>{esc(field(DATA['recruitment'],'lead'))}</h2></div>{href('join',tr('함께 연구하기','Join our research'),'button')}</div>'''
    news=section_head('',tr('인스파티움 소식','Inspatium news'),('news',tr('전체 소식','All news')))+news_items(limit=3)
    return hero+section(introduction,'introduction-home')+section(feat,'research-home')+section(join_band,'join-band')+section(news,'news-home')

def about():
    paras=tr([
      '물건을 옮기고 부품을 조립하는 것처럼, 산업 현장에서는 구체적인 일을 수행하는 AI가 필요합니다. 피지컬 AI는 이러한 수요를 바탕으로 발전하고 있습니다. 주어진 목표를 실제 행동으로 옮기고, 변화하는 환경에서도 일을 해내는 능력이 중요해지고 있습니다.',
      '목표를 이루려면 어떤 움직임이 필요하고, 어떤 힘을 어디에 가해야 할까요? 인스파티움은 <strong>목표에서 출발해 그것을 실현할 방법을 찾는 역설계</strong>에 주목합니다. 우리가 생각하는 피지컬 AI의 핵심은 원하는 결과를 만들어낼 설계와 제어 방법을 스스로 찾는 능력입니다.',
      '문제가 복잡해질수록 답을 찾는 데 많은 계산이 필요합니다. 이전의 계산과 실험에서 얻은 데이터를 학습하면, 새로운 목표에 맞는 답을 더 빠르게 찾을 수 있습니다. 이것이 우리가 데이터 기반 과학의 가능성에 주목하는 이유입니다.',
      '<strong>인스파티움은 수학과 물리학을 바탕으로, 이러한 문제를 푸는 AI와 계산 방법을 연구합니다.</strong> 복잡한 물리적 조건 속에서도 목표에 맞는 답을 찾는 기술로, 피지컬 AI가 수행할 수 있는 일의 범위를 넓히고자 합니다.'
    ],[
      'Industry needs AI that performs concrete tasks, from moving objects to assembling components. Physical AI is developing around these needs. Its ability to translate goals into actions and complete tasks as conditions change is becoming increasingly important.',
      'What movement is needed to achieve a goal, and where should force be applied? Inspatium focuses on <strong>inverse design: starting with a goal and finding how to realize it.</strong> We see the ability to find the designs and control methods that produce a desired outcome as central to physical AI.',
      'More complex problems demand more computation. Learning from previous calculations and experiments can help find solutions for new goals more quickly. This is why we see such potential in data-driven science.',
      '<strong>Inspatium researches AI and computational methods for these problems, grounded in mathematics and physics.</strong> By finding solutions under complex physical conditions, we aim to expand the range of tasks physical AI can perform.'
    ])
    body=f'<div class="article-grid"><aside><h2>{tr("우리가 하는 일","What we do")}</h2><p>{tr("음향과 광학에서 출발하는<br>지능적 역설계 연구","Intelligent inverse-design research, starting with acoustics and optics")}</p></aside><div class="prose">{paragraphs(paras)}<div class="actions">{href("research",tr("연구 살펴보기","Explore research"),"button")}</div></div></div>'
    return page_head(tr('피지컬 AI의 미래는<br>역설계에서 시작됩니다.','The future of physical AI<br>begins with inverse design.'),category=tr('연구 방향','Our work'),dark=True)+about_nav()+section(body)

def philosophy():
    identity=DATA['identity']
    body=f'''<div class="identity-stack"><section class="identity-vision"><div class="identity-label">{tr('비전','Vision')}</div><h2>{esc(field(identity,'vision'))}</h2></section><div class="identity-columns"><section class="identity-block"><div class="identity-label">{tr('미션','Mission')}</div><h2>{esc(field(identity,'mission'))}</h2><div class="prose">{paragraphs([esc(p) for p in field(identity,'mission_body')])}</div></section><section class="identity-block"><div class="identity-label">{tr('경영철학','Philosophy')}</div><h2>{esc(field(identity,'philosophy'))}</h2><div class="prose">{paragraphs([esc(p) for p in field(identity,'philosophy_body')])}</div></section></div></div>'''
    return page_head(tr('비전과 경영철학','Vision and philosophy'))+about_nav()+section(body)

def greeting():
    p=DATA['people'][0]
    body=f'<div class="article-grid"><aside>{portrait(p)}<div style="margin-top:20px"><strong>{tr("최성준","SungJun Choi")}</strong><br>{tr("리드 연구자","Lead Researcher")}</div></aside><article class="prose"><p class="intro">{tr("안녕하십니까?<br>인스파티움의 리드 연구자 최성준입니다.","Welcome.<br>I am SungJun Choi, Lead Researcher at Inspatium.")}</p>{paragraphs(DATA["greeting"] if LANG=="ko" else DATA["greeting_en"])}<div class="signature">{tr("인스파티움 리드 연구자","Lead Researcher, Inspatium")}<strong>{tr("최성준","SungJun Choi")}</strong></div></article></div>'
    return page_head(tr('인사말','Lead Researcher’s message'))+about_nav()+section(body)

def history():
    groups={}
    for item in DATA['history']: groups.setdefault(field(item,'year'),[]).append(item)
    body='<div class="timeline">'
    for year,items in groups.items():
        body+=f'<div class="timeline-group"><h2 class="timeline-year">{esc(year)}</h2><div class="timeline-items">'
        for item in items:
            action=href('research/'+item['project'],tr('관련 연구','Related research'),'text-link') if item.get('project') else ''
            body+=f'<article class="timeline-item"><div class="timeline-date">{esc(field(item,"date"))}</div><h3>{esc(field(item,"title"))}</h3><p>{esc(field(item,"body"))}</p><div class="card-end">{badge(field(item,"status"))}{action}</div></article>'
        body+='</div></div>'
    body+='</div>'
    body+=f'<div class="article-grid"><aside><h2>{tr("실험 기반을 쌓습니다.","Building an experimental foundation.")}</h2></aside><div>{hardware()}</div></div>'
    return page_head(tr('연구로 쌓아온 시간','Our research journey'),tr('2025년의 출발, 그리고 다음 도전.','Founded in 2025. Working toward the next challenge.'),category=tr('연혁','History'))+about_nav()+section(body)

def research():
    return page_head(tr('연구','Research'),tr('음향과 광학의 물리적 문제에서 출발해, 새로운 계산 방법과 지능적 역설계 기술을 연구합니다.','Starting with physical problems in acoustics and optics, we investigate new computational methods and intelligent inverse design.'))+section('<div class="projects-list">'+''.join(project_card(p) for p in DATA['projects'])+'</div>')

def project_detail(project):
    related=''.join(f'<a class="related-person" href="{link("team")}#{p["id"]}">{esc(field(p,"name"))}</a>' for p in DATA['people'] if p['id'] in project['people'])
    facts=f'<div class="project-facts"><div class="eyebrow">{tr("연구 정보","RESEARCH DETAILS")}</div><div class="fact"><span>{tr("분야","Area")}</span><span>{esc(field(project,"category"))}</span></div><div class="fact"><span>{tr("진행 상태","Status")}</span>{badge(field(project,"status"))}</div>'
    if related: facts+=f'<h3 style="font-size:1rem;margin-top:25px">{tr("참여 연구진","Research team")}</h3><div class="related-people">{related}</div>'
    facts+='</div>'
    result_label=tr('연구 성과','Results') if project['publication'] else tr('연구 계획','Research plan') if project['status']=='연구 계획' else tr('현재 연구','Current work')
    body=f'<div class="project-intro"><article class="prose"><h2>{tr("연구 질문","Research question")}</h2><p class="intro">{esc(field(project,"question"))}</p><h2>{tr("연구 방법","Approach")}</h2><p>{esc(field(project,"approach"))}</p><h2>{result_label}</h2><p>{esc(field(project,"outcome"))}</p>'
    if project['id']=='holography-hardware': body+=hardware()
    body+=f'<h2>{tr("다음 단계","Next steps")}</h2><p>{esc(field(project,"next"))}</p></article><aside>{facts}</aside></div>'
    if project['publication']:
        paper=next(p for p in DATA['publications'] if p['id']==project['publication'])
        body+=f'<div style="margin-top:60px"><h2>{tr("관련 논문","Related publication")}</h2>{paper_row(paper)}</div>'
    return page_head(esc(field(project,'title')),esc(field(project,'summary')),category=tr('연구','Research'),dark=True)+section(body)+section(href('research',tr('전체 연구 보기','All research'),'text-link'),'wash compact')

def publications():
    return page_head(tr('논문','Publications'),tr('인스파티움의 연구 성과를 학술논문으로 소개합니다.','Academic publications from Inspatium’s research.'))+section(''.join(paper_row(p) for p in DATA['publications']))

def publication_detail(paper):
    project=next(p for p in DATA['projects'] if p['id']==paper['project'])
    authors=' · '.join(a.get('name_en',a['name']) if LANG=='en' else a['name'] for a in paper['authors']) if paper['authors'] else field(paper,'author_note')
    links=''
    for k,label in [('url',tr('학술지에서 보기','Publisher')),('code_url',tr('코드와 데이터','Code and data'))]:
        if paper.get(k): links+=f'<a class="button" href="{esc(paper[k])}" target="_blank" rel="noopener">{label}</a>'
    if paper.get('doi'):links+=f'<a class="button" href="https://doi.org/{quote(paper["doi"],safe="/")}" target="_blank" rel="noopener">DOI</a>'
    body=f'<article class="prose"><div class="eyebrow">{paper["year"]} · {esc(paper["venue"])}</div><h2 class="publication-detail-title">{esc(field(paper,"title"))}</h2>'
    if LANG=='ko':body+=f'<p class="paper-meta">{esc(paper["original_title"])}</p>'
    body+=f'<p class="paper-meta">{esc(authors)}</p>{badge(field(paper,"status"))}<h2>{tr("연구 소개","Research overview")}</h2><p>{esc(field(project,"summary"))}</p><p>{esc(field(project,"outcome"))}</p><div class="actions">{links}</div><div class="project-band">{href("research/"+paper["project"],tr("관련 연구 자세히 보기","Explore the related research"),"text-link")}</div></article>'
    return page_head(tr('학술논문','Journal article'),category=tr('논문','Publications'))+section(body)

def team():
    return page_head(tr('구성원','Our team'),tr('기초과학에서 데이터와 실험 장치까지, 각자의 전문성을 함께 연결합니다.','Connecting fundamental science with data and experimental engineering.'),category=tr('구성원','Team'))+section(people_grid())

def profile(person):
    interests=field(person,'interests')
    current_projects=[p for p in DATA['projects'] if person['id'] in p['people']]
    projects=''.join(f'<p>{href("research/"+p["id"],esc(field(p,"title")),"text-link")}</p>' for p in current_projects)
    body=f'<div class="profile">{portrait(person)}<article><h2 class="profile-name">{esc(field(person,"name"))}</h2><p class="title">{esc(field(person,"role"))}</p><p>{esc(field(person,"intro"))}</p>{contact_lines(person)}<h2>{tr("관심 분야","Research interests")}</h2><div class="chips">'+''.join(f'<span class="chip">{esc(i)}</span>' for i in interests)+'</div>'
    if projects:body+=f'<h2>{tr("참여 연구","Research involvement")}</h2>{projects}'
    body+='</article></div>'
    return page_head(tr('구성원 소개','Team profile'),category=tr('구성원','Team'))+section(body)+section(href('team',tr('전체 구성원 보기','All team members'),'text-link'),'compact wash')

def news_items(limit=None):
    items=[n for n in DATA['news'] if n.get('visibility')=='public']
    items.sort(key=lambda n:n['date'],reverse=True)
    if limit:items=items[:limit]
    if not items:return f'<div class="empty-news" data-news-empty role="status"><p>{tr("등록된 소식이 없습니다.","No updates have been posted yet.")}</p><small>{tr("새로운 연구 소식과 언론 보도를 이곳에서 전하겠습니다.","Research announcements and media coverage will appear here.")}</small></div>'
    rendered=''
    for item in items:
        rendered+=f'<article class="news-item" data-category="{esc(item["category"])}"><div class="meta">{esc(item["date"])} · {esc(field(item,"category_label"))}</div><h2>{href("news/"+item["id"],esc(field(item,"title")))}</h2><p>{esc(field(item,"summary"))}</p></article>'
    return '<div class="news-list">'+rendered+'</div>'+f'<div class="empty-news" data-news-empty hidden role="status">{tr("해당 분류의 소식이 없습니다.","There are no updates in this category.")}</div>'

def news():
    filters='<div class="news-tools" role="group" aria-label="'+tr('소식 분류','News categories')+'">'+''.join(f'<button class="filter" data-news-filter="{key}" aria-pressed="{str(key=="all").lower()}">{label}</button>' for key,label in [('all',tr('전체','All')),('research',tr('연구 소식','Research')),('media',tr('언론 보도','Media'))])+'</div>'
    return page_head(tr('소식','News'),tr('인스파티움의 연구 소식과 언론 보도를 전합니다.','Research announcements and media coverage from Inspatium.'))+section(filters+news_items())

def news_detail(item):
    body=f'<article class="prose"><div class="eyebrow">{esc(item["date"])} · {esc(field(item,"category_label"))}</div>{paragraphs([esc(p) for p in field(item,"body")])}'
    if item.get('url'): body+=f'<a class="button" href="{esc(item["url"])}" target="_blank" rel="noopener">{tr("원문 보기","Read original")}</a>'
    if item.get('project'):body+=f'<p>{href("research/"+item["project"],tr("관련 연구","Related research"),"text-link")}</p>'
    return page_head(esc(field(item,'title')),esc(field(item,'summary')),category=tr('소식','News'))+section(body+'</article>')

def join():
    info=DATA['recruitment']
    mailto='mailto:'+SITE['email']+'?subject='+quote(field(info,'email_subject'),safe='')
    body=f'''<div class="join-layout"><article class="prose"><h2>{esc(field(info,'heading'))}</h2>{paragraphs([esc(p) for p in field(info,'body')])}<div class="actions">{href('philosophy',tr('경영철학 읽기','Our philosophy'),'text-link')}{href('greeting',tr('인사말 읽기','Lead Researcher’s message'),'text-link')}{href('research',tr('연구 살펴보기','Explore research'),'text-link')}</div></article><aside class="contact-panel"><h2>{esc(field(info,'contact_title'))}</h2><p>{esc(field(info,'contact_body'))}</p><a class="join-email" href="mailto:{esc(SITE['email'])}">{esc(SITE['email'])}</a><a class="button" href="{esc(mailto)}">{tr('참여 문의하기','Contact us to join')}</a></aside></div>'''
    return page_head(esc(field(info,'title')),esc(field(info,'lead')))+section(body)

def contact():
    lead=tr('연구 참여와 공동 연구, 기술 협력, 언론 문의를 기다립니다.','For research participation, collaboration, technology partnerships, and media inquiries.')
    body=f'''<div class="contact-grid"><div><h2>{tr('인스파티움과 이야기하세요.','Talk with Inspatium.')}</h2><p>{lead}</p><div class="contact-lines"><div class="contact-line"><span>{tr('문의 담당','Contact')}</span><span>{tr('최성준 · 리드 연구자','SungJun Choi · Lead Researcher')}</span></div><div class="contact-line"><span>{tr('이메일','Email')}</span><a href="mailto:{esc(SITE['email'])}">{esc(SITE['email'])}</a></div></div></div><div class="contact-panel"><h3>{tr('함께 연구할 동료를 찾습니다.','Research with us.')}</h3><p>{esc(field(DATA['recruitment'],'lead'))}</p>{href('join',tr('연구원 모집 안내','Join our research'),'button')}<p class="contact-team-link">{href('team',tr('구성원 소개','Meet the team'),'text-link')}</p></div></div>'''
    return page_head(tr('문의','Contact'),lead)+section(body)

def render_page(name,title,body_fn,locale):
    global LANG,CURRENT,PAGE
    LANG=locale;PAGE=name;CURRENT=f'{locale}/{route(name)}'
    body=body_fn()
    desc=tr('인스파티움은 수학과 물리학을 바탕으로 피지컬 AI와 역설계 계산 기술을 연구합니다.','Inspatium researches physical AI and inverse-design computation grounded in mathematics and physics.')
    title_local=title[0] if LANG=='ko' else title[1]
    full_title=title_local+' | '+tr('인스파티움','Inspatium')
    icon='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="4" fill="#087f77"/><path d="M10 7h12v4h-4v10h4v4H10v-4h4V11h-4z" fill="#ffffff"/></svg>'
    contents=f'''<!doctype html><html lang="{locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(full_title)}</title><meta name="description" content="{esc(desc)}"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#f4f8f9"><link rel="icon" type="image/svg+xml" href="data:image/svg+xml,{quote(icon,safe='')}"><link rel="alternate" hreflang="ko" href="{ORIGIN}/ko/{route(name)}"><link rel="alternate" hreflang="en" href="{ORIGIN}/en/{route(name)}"><meta property="og:title" content="{esc(full_title)}"><meta property="og:description" content="{esc(desc)}"><link rel="stylesheet" href="{asset('style.css')}"><script defer src="{asset('app.js')}"></script></head><body>{header()}<main id="main">{body}</main>{footer()}</body></html>'''
    target=OUT/CURRENT;target.parent.mkdir(parents=True,exist_ok=True);target.write_text(contents)
    return contents

PAGES=[('home',('인스파티움','Inspatium'),home),('about',('연구 방향','Our work'),about),('philosophy',('경영철학','Philosophy'),philosophy),('greeting',('인사말','Lead Researcher’s message'),greeting),('history',('연혁','History'),history),('research',('연구','Research'),research),('publications',('논문','Publications'),publications),('team',('구성원','Team'),team),('news',('소식','News'),news),('contact',('문의','Contact'),contact),('join',('연구원 모집','Join us'),join)]
for project in DATA['projects']:PAGES.append(('research/'+project['id'],(project['title'],project['title_en']),lambda p=project:project_detail(p)))
for person in DATA['people']:PAGES.append(('team/'+person['id'],(person['name'],person['name_en']),lambda p=person:profile(p)))
for paper in DATA['publications']:PAGES.append(('publications/'+paper['id'],(paper['title'],paper['title_en']),lambda p=paper:publication_detail(p)))
for item in DATA['news']:
    if item.get('visibility')=='public':PAGES.append(('news/'+item['id'],(item['title'],item['title_en']),lambda n=item:news_detail(n)))
for locale in ('ko','en'):
    folder=OUT/locale
    if folder.exists():shutil.rmtree(folder)
    for name,title,body_fn in PAGES:render_page(name,title,body_fn,locale)
# The root is a real Korean home page, so it also works when opened from a ZIP.
LANG='ko';PAGE='home';CURRENT='index.html'
root_body=home()
source=(OUT/'ko/index.html').read_text()
from_start=source[:source.index('<body>')]
from_start=from_start.replace('href="../assets/', 'href="assets/').replace('src="../assets/', 'src="assets/')
(OUT/'index.html').write_text(from_start+'<body>'+header()+'<main id="main">'+root_body+'</main>'+footer()+'</body></html>')
(OUT/'robots.txt').write_text('User-agent: *\nDisallow: /\n')
print(f'Generated {len(PAGES)*2+1} HTML pages in {OUT}')
