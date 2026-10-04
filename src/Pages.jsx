import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, ChevronRight, Mail } from 'lucide-react';
import data from './content.json';
import './pages.css';
import SplitText from './components/react-bits/SplitText.jsx';
import BlurText from './components/react-bits/BlurText.jsx';
import ScrollReveal from './components/react-bits/ScrollReveal.jsx';

const ABOUT_COPY = {
  ko: [
    '물건을 옮기고 부품을 조립하는 것처럼, 산업 현장에서는 구체적인 일을 수행하는 AI가 필요합니다. 피지컬 AI는 이러한 수요를 바탕으로 발전하고 있습니다. 주어진 목표를 실제 행동으로 옮기고, 변화하는 환경에서도 일을 해내는 능력이 중요해지고 있습니다.',
    '목표를 이루려면 어떤 움직임이 필요하고, 어떤 힘을 어디에 가해야 할까요? 인스파티움은 목표에서 출발해 그것을 실현할 방법을 찾는 역설계에 주목합니다. 우리가 생각하는 피지컬 AI의 핵심은 원하는 결과를 만들어낼 설계와 제어 방법을 스스로 찾는 능력입니다.',
    '문제가 복잡해질수록 답을 찾는 데 많은 계산이 필요합니다. 이전의 계산과 실험에서 얻은 데이터를 학습하면, 새로운 목표에 맞는 답을 더 빠르게 찾을 수 있습니다. 이것이 우리가 데이터 기반 과학의 가능성에 주목하는 이유입니다.',
    '인스파티움은 수학과 물리학을 바탕으로, 이러한 문제를 푸는 AI와 계산 방법을 연구합니다. 복잡한 물리적 조건 속에서도 목표에 맞는 답을 찾는 기술로, 피지컬 AI가 수행할 수 있는 일의 범위를 넓히고자 합니다.',
  ],
  en: [
    'Industry needs AI that performs concrete tasks, from moving objects to assembling components. Physical AI is developing around these needs. Its ability to translate goals into actions and complete tasks as conditions change is becoming increasingly important.',
    'What movement is needed to achieve a goal, and where should force be applied? Inspatium focuses on inverse design: starting with a goal and finding how to realize it. We see the ability to find the designs and control methods that produce a desired outcome as central to physical AI.',
    'More complex problems demand more computation. Learning from previous calculations and experiments can help find solutions for new goals more quickly. This is why we see such potential in data-driven science.',
    'Inspatium researches AI and computational methods for these problems, grounded in mathematics and physics. By finding solutions under complex physical conditions, we aim to expand the range of tasks physical AI can perform.',
  ],
};

const titles = {
  philosophy: ['경영철학', 'Philosophy'], greeting: ['인사말', 'Lead Researcher’s message'],
  about: ['연구 방향', 'Our work'], history: ['연혁', 'History'], research: ['연구', 'Research'],
  publications: ['논문', 'Publications'], team: ['구성원', 'Team'], join: ['연구원 모집', 'Join us'],
  news: ['소식', 'News'], contact: ['문의', 'Contact'],
};

function translate(lang, ko, en) { return lang === 'en' ? en : ko; }
function field(item, key, lang) { return lang === 'en' ? item[`${key}_en`] ?? item[key] : item[key]; }
function path(lang, route = '') { return `/${lang}/${route}`; }
function asset(src) { return src.startsWith('/') || /^https?:\/\//.test(src) ? src : src.startsWith('assets/') ? `/${src}` : `/assets/${src}`; }

function PageHeading({ lang, title, lead, category, parent }) {
  const t = (ko, en) => translate(lang, ko, en);
  return <section className="inner-heading">
    <div className="wrap">
      <nav className="inner-breadcrumb" aria-label={t('현재 위치', 'Breadcrumb')}>
        <Link to={path(lang)}>{t('홈', 'Home')}</Link><ChevronRight size={13} aria-hidden="true" />
        {parent ? <><Link to={path(lang, parent)}>{category}</Link><ChevronRight size={13} aria-hidden="true" /><span>{title}</span></> : <span>{category || title}</span>}
      </nav>
      <div className="inner-heading-content"><span className="eyebrow">INSPATIUM {lang === 'en' ? category || title : titles[parent || category]?.[1] || 'RESEARCH & INVERSE DESIGN'}</span>
        <SplitText tag="h1" text={title} splitType="words" delay={45} />{lead && <BlurText text={lead} direction="bottom" delay={22} />}
      </div>
    </div>
  </section>;
}

function AboutNav({ lang, active }) {
  return <nav className="about-subnav" aria-label={translate(lang, '인스파티움 소개', 'About Inspatium')}>
    <div className="wrap">{['philosophy', 'greeting', 'about', 'history'].map((route) => <Link key={route} to={path(lang, route)} className={active === route ? 'is-active' : ''} aria-current={active === route ? 'page' : undefined}>{titles[route][lang === 'en' ? 1 : 0]}</Link>)}</div>
  </nav>;
}

function TextLink({ to, children, back = false, ...props }) {
  return <Link className="text-link inner-text-link" to={to} {...props}>{back && <ArrowLeft size={17} aria-hidden="true" />}{children}{!back && <ArrowUpRight size={17} aria-hidden="true" />}</Link>;
}

function Portrait({ person, lang }) {
  return person.photo ? <img className="person-portrait" src={asset(person.photo)} alt={field(person, 'name', lang)} /> : <div className="person-portrait portrait-placeholder" aria-label={translate(lang, `${person.name} 사진 준비 중`, `Photo of ${person.name_en} to be added`)}><span>{person.initials}</span><small>{translate(lang, '사진 준비 중', 'Photo to be added')}</small></div>;
}

function HardwarePhoto({ lang }) {
  return <figure className="hardware-figure">
    {data.site.hardware_image ? <img src={asset(data.site.hardware_image)} alt={field(data.site, 'hardware_caption', lang)} /> : <div className="hardware-placeholder"><span className="hardware-placeholder-mark" aria-hidden="true">+</span><span>{translate(lang, '실험 장비 사진 준비 중', 'Experimental hardware photo to be added')}</span></div>}
    <figcaption>{field(data.site, 'hardware_caption', lang)}</figcaption>
  </figure>;
}

function Philosophy({ lang }) {
  const t = (ko, en) => translate(lang, ko, en);
  const identity = data.identity;
  return <>
    <PageHeading lang={lang} title={t('비전과 경영철학', 'Vision and philosophy')} category={t('경영철학', 'Philosophy')} />
    <AboutNav lang={lang} active="philosophy" />
    <section className="section wrap philosophy-content">
      <div className="vision-statement"><span className="eyebrow">{t('비전', 'Vision')}</span><ScrollReveal tag="h2">{field(identity, 'vision', lang)}</ScrollReveal></div>
      <div className="identity-columns">{[['mission', t('미션', 'Mission')], ['philosophy', t('경영철학', 'Philosophy')]].map(([key, label]) => <article className="identity-column" key={key}><span className="eyebrow">{label}</span><h2>{field(identity, key, lang)}</h2><div className="inner-prose">{field(identity, `${key}_body`, lang).map((text, index) => <p key={index}>{text}</p>)}</div></article>)}</div>
    </section>
  </>;
}

function Greeting({ lang }) {
  const t = (ko, en) => translate(lang, ko, en);
  const person = data.people[0];
  return <>
    <PageHeading lang={lang} title={t('인사말', 'Lead Researcher’s message')} />
    <AboutNav lang={lang} active="greeting" />
    <section className="section wrap inner-article-grid greeting-content">
      <aside className="greeting-person"><Portrait person={person} lang={lang} /><h2>{field(person, 'name', lang)}</h2><p>{t('리드 연구자', 'Lead Researcher')}</p></aside>
      <article className="inner-prose"><h2 className="prose-intro">{t('안녕하십니까?', 'Welcome.')}<br />{t('인스파티움의 리드 연구자 최성준입니다.', 'I am SungJun Choi, Lead Researcher at Inspatium.')}</h2>{data[lang === 'en' ? 'greeting_en' : 'greeting'].map((text, index) => <p key={index}>{text}</p>)}<div className="greeting-signature"><span>{t('인스파티움 리드 연구자', 'Lead Researcher, Inspatium')}</span><strong>{field(person, 'name', lang)}</strong></div></article>
    </section>
  </>;
}

function About({ lang }) {
  const t = (ko, en) => translate(lang, ko, en);
  return <>
    <PageHeading lang={lang} title={t('피지컬 AI의 미래는 역설계에서 시작됩니다.', 'The future of physical AI begins with inverse design.')} category={t('연구 방향', 'Our work')} />
    <AboutNav lang={lang} active="about" />
    <section className="section wrap inner-article-grid">
      <aside className="article-aside"><span className="eyebrow">OUR WORK</span><h2>{t('우리가 하는 일', 'What we do')}</h2><p>{t('음향과 광학에서 출발하는 지능적 역설계 연구', 'Intelligent inverse-design research, starting with acoustics and optics')}</p></aside>
      <article className="inner-prose">{ABOUT_COPY[lang].map((text, index) => <ScrollReveal key={index}>{text}</ScrollReveal>)}<Link className="button" to={path(lang, 'research')}>{t('연구 살펴보기', 'Explore research')}<ArrowUpRight size={18} aria-hidden="true" /></Link></article>
    </section>
  </>;
}

function History({ lang }) {
  const t = (ko, en) => translate(lang, ko, en);
  const groups = data.history.reduce((result, item) => {
    const year = field(item, 'year', lang);
    if (!result.has(year)) result.set(year, []);
    result.get(year).push(item);
    return result;
  }, new Map());
  return <>
    <PageHeading lang={lang} title={t('연구로 쌓아온 시간', 'Our research journey')} category={t('연혁', 'History')} lead={t('2025년의 출발, 그리고 다음 도전.', 'Founded in 2025. Working toward the next challenge.')} />
    <AboutNav lang={lang} active="history" />
    <section className="section wrap history-content">
      <div className="inner-timeline">{Array.from(groups, ([year, items]) => <section className="timeline-group" key={year}><h2>{year}</h2><div>{items.map((item, index) => <article className="timeline-entry" key={`${year}-${index}`}><span className="timeline-date">{field(item, 'date', lang)}</span><h3>{field(item, 'title', lang)}</h3><p>{field(item, 'body', lang)}</p><div className="timeline-footer"><span className="status-label">{field(item, 'status', lang)}</span>{item.project && <TextLink to={path(lang, `research/${item.project}`)}>{t('관련 연구', 'Related research')}</TextLink>}</div></article>)}</div></section>)}</div>
      <div className="hardware-section"><h2>{t('실험 기반을 쌓습니다.', 'Building an experimental foundation.')}</h2><HardwarePhoto lang={lang} /></div>
    </section>
  </>;
}

function Research({ lang, id }) {
  const t = (ko, en) => translate(lang, ko, en);
  if (id) {
    const project = data.projects.find((item) => item.id === id);
    if (!project) return <NotFound lang={lang} />;
    const people = data.people.filter((person) => project.people.includes(person.id));
    const paper = data.publications.find((item) => item.id === project.publication);
    const resultLabel = project.publication || project.status === '연구 성과' ? t('연구 성과', 'Results') : project.status === '연구 계획' ? t('연구 계획', 'Research plan') : t('현재 연구', 'Current work');
    return <>
      <PageHeading lang={lang} title={field(project, 'title', lang)} lead={field(project, 'summary', lang)} category={t('연구', 'Research')} parent="research" />
      <section className="section wrap project-detail">
        <div className="project-detail-grid"><article className="inner-prose"><h2>{t('연구 질문', 'Research question')}</h2><p className="prose-question">{field(project, 'question', lang)}</p><h2>{t('연구 방법', 'Approach')}</h2><p>{field(project, 'approach', lang)}</p><h2>{resultLabel}</h2><p>{field(project, 'outcome', lang)}</p>{id === 'holography-hardware' && <HardwarePhoto lang={lang} />}<h2>{t('다음 단계', 'Next steps')}</h2><p>{field(project, 'next', lang)}</p></article>
          <aside className="project-facts"><span className="eyebrow">{t('연구 정보', 'Research details')}</span><dl><div><dt>{t('분야', 'Area')}</dt><dd>{field(project, 'category', lang)}</dd></div><div><dt>{t('진행 상태', 'Status')}</dt><dd><span className="status-label">{field(project, 'status', lang)}</span></dd></div></dl>{people.length > 0 && <><h3>{t('참여 연구진', 'Research team')}</h3><div className="project-people">{people.map((person) => <Link key={person.id} to={`${path(lang, 'team')}#${person.id}`}>{field(person, 'name', lang)}<ArrowUpRight size={14} aria-hidden="true" /></Link>)}</div></>}</aside>
        </div>
        {paper && <section className="related-publication"><h2>{t('관련 논문', 'Related publication')}</h2><PublicationRow paper={paper} lang={lang} /></section>}
        <div className="back-navigation"><TextLink to={path(lang, 'research')} back>{t('전체 연구 보기', 'All research')}</TextLink></div>
      </section>
    </>;
  }
  return <>
    <PageHeading lang={lang} title={t('연구', 'Research')} lead={t('음향과 광학의 물리적 문제에서 출발해, 새로운 계산 방법과 지능적 역설계 기술을 연구합니다.', 'Starting with physical problems in acoustics and optics, we investigate new computational methods and intelligent inverse design.')} />
    <section className="section wrap"><div className="research-list">{data.projects.map((project) => <article className="research-list-item" key={project.id}><span className="research-number">{project.number}</span><div className="research-item-body"><div className="research-item-meta"><span>{field(project, 'category', lang)}</span><span className="status-label">{field(project, 'status', lang)}</span></div><h2><Link to={path(lang, `research/${project.id}`)}>{field(project, 'title', lang)}</Link></h2><p>{field(project, 'summary', lang)}</p><TextLink to={path(lang, `research/${project.id}`)}>{t('연구 자세히 보기', 'Explore research')}</TextLink></div><Link className="research-item-arrow" to={path(lang, `research/${project.id}`)} aria-label={t(`${project.title} 자세히 보기`, `Explore ${project.title_en}`)}><ArrowUpRight size={26} aria-hidden="true" /></Link></article>)}</div></section>
  </>;
}

function PublicationRow({ paper, lang }) {
  const t = (ko, en) => translate(lang, ko, en);
  return <article className="publication-row"><div className="publication-year">{paper.year}</div><div><div className="publication-meta"><span>{paper.venue}</span><span className="status-label">{field(paper, 'status', lang)}</span></div><h2><Link to={path(lang, `publications/${paper.id}`)}>{field(paper, 'title', lang)}</Link></h2>{lang === 'ko' && <p className="publication-original">{paper.original_title}</p>}<p className="publication-author-note">{paper.authors?.length ? paper.authors.map((author) => field(author, 'name', lang)).join(' · ') : field(paper, 'author_note', lang)}</p><TextLink to={path(lang, `publications/${paper.id}`)}>{t('논문 소개', 'Publication details')}</TextLink></div></article>;
}

function Publications({ lang, id }) {
  const t = (ko, en) => translate(lang, ko, en);
  if (id) {
    const paper = data.publications.find((item) => item.id === id);
    if (!paper) return <NotFound lang={lang} />;
    const project = data.projects.find((item) => item.id === paper.project);
    const canRelease = paper.public_release !== false;
    const doiUrl = paper.doi && (paper.doi.startsWith('http') ? paper.doi : `https://doi.org/${paper.doi}`);
    return <>
      <PageHeading lang={lang} title={t('학술논문', 'Journal article')} category={t('논문', 'Publications')} parent="publications" />
      <section className="section wrap publication-detail"><article className="inner-prose"><span className="eyebrow">{paper.year} · {paper.venue}</span><h2 className="publication-detail-title">{field(paper, 'title', lang)}</h2>{lang === 'ko' && <p className="publication-original">{paper.original_title}</p>}<p>{paper.authors?.length ? paper.authors.map((author) => field(author, 'name', lang)).join(' · ') : field(paper, 'author_note', lang)}</p><div className="paper-status"><span className="status-label">{field(paper, 'status', lang)}</span><span>{paper.date}</span></div>{project && <><h2>{t('연구 소개', 'Research overview')}</h2><p>{field(project, 'summary', lang)}</p><p>{field(project, 'outcome', lang)}</p></>}
        <div className="publication-resources"><h3>{t('논문 및 연구 자료', 'Publication and resources')}</h3><ul><li>{paper.url && canRelease ? <a className="text-link inner-text-link" href={paper.url} target="_blank" rel="noopener noreferrer">{t('학술지에서 보기', 'View at publisher')}<ArrowUpRight size={16} aria-hidden="true" /></a> : <span>{t('논문 공개 링크 준비 중', 'Publication link to be added')}</span>}</li><li>{doiUrl && canRelease ? <a className="text-link inner-text-link" href={doiUrl} target="_blank" rel="noopener noreferrer">DOI<ArrowUpRight size={16} aria-hidden="true" /></a> : <span>{t('DOI 등록 예정', 'DOI to be added')}</span>}</li><li>{paper.code_url && canRelease ? <a className="text-link inner-text-link" href={paper.code_url} target="_blank" rel="noopener noreferrer">{t('코드와 데이터', 'Code and data')}<ArrowUpRight size={16} aria-hidden="true" /></a> : <span>{t('코드·데이터 공개 정보 준비 중', 'Code and data information to be added')}</span>}</li></ul></div>
        {project && <div className="project-band"><TextLink to={path(lang, `research/${project.id}`)}>{t('관련 연구 자세히 보기', 'Explore the related research')}</TextLink></div>}
      </article><div className="back-navigation"><TextLink to={path(lang, 'publications')} back>{t('전체 논문 보기', 'All publications')}</TextLink></div></section>
    </>;
  }
  return <><PageHeading lang={lang} title={t('논문', 'Publications')} lead={t('인스파티움의 연구 성과를 학술논문으로 소개합니다.', 'Academic publications from Inspatium’s research.')} /><section className="section wrap">{data.publications.length ? <div className="publications-list">{data.publications.map((paper) => <PublicationRow key={paper.id} paper={paper} lang={lang} />)}</div> : <div className="publications-empty inner-news-empty"><span className="empty-rule" aria-hidden="true" /><h2>{t('현재 공개된 논문이 없습니다.', 'No publications are currently available.')}</h2><p>{t('공개 가능한 논문을 이곳에서 소개하겠습니다.', 'Publications will be shared here when available.')}</p></div>}</section></>;
}

function MemberContact({ person, lang }) {
  const t = (ko, en) => translate(lang, ko, en);
  return <dl className="member-contact">
    {[['email', t('인스파티움', 'Inspatium')], ['academic_email', t('학교', 'Academic')]].map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{person[key] ? <a href={`mailto:${person[key]}`}><span>{person[key]}</span><ArrowUpRight size={14} aria-hidden="true" /></a> : <span className="unfilled">{t('등록 예정', 'To be added')}</span>}</dd></div>)}
    {person.kakao && <div><dt>{t('카카오톡 ID', 'KakaoTalk ID')}</dt><dd>{person.kakao}</dd></div>}
  </dl>;
}

function PersonCard({ person, lang, compact = false }) {
  const t = (ko, en) => translate(lang, ko, en);
  const projects = data.projects.filter((project) => project.people.includes(person.id));
  return <article className={`team-card${compact ? ' team-card-compact' : ''}`} id={person.id}>
    <div className="team-card-heading"><Portrait person={person} lang={lang} /><div><h2>{compact ? <Link to={path(lang, `team/${person.id}`)}>{field(person, 'name', lang)}</Link> : field(person, 'name', lang)}</h2><p className="team-name-secondary">{lang === 'en' ? person.name : person.name_en}</p><p className="team-role">{field(person, 'role', lang)}</p></div></div>
    <p className="team-intro">{field(person, 'intro', lang)}</p>
    {!compact && <><div className="team-card-section"><h3>{t('관심 분야', 'Research interests')}</h3><ul className="interest-list">{field(person, 'interests', lang).map((interest) => <li key={interest}>{interest}</li>)}</ul></div>
      <div className="team-card-section"><h3>{t('참여 연구', 'Research involvement')}</h3>{projects.length ? <ul className="team-project-list">{projects.map((project) => <li key={project.id}><TextLink to={path(lang, `research/${project.id}`)}>{field(project, 'title', lang)}</TextLink></li>)}</ul> : <p className="unfilled">{t('등록 예정', 'To be added')}</p>}</div></>}
    <MemberContact person={person} lang={lang} />
    {compact && <TextLink to={path(lang, `team/${person.id}`)}>{t('구성원 자세히 보기', 'View profile')}</TextLink>}
  </article>;
}

function Team({ lang, id }) {
  const t = (ko, en) => translate(lang, ko, en);
  const people = id ? data.people.filter((person) => person.id === id) : data.people;
  if (!people.length) return <NotFound lang={lang} />;
  return <><PageHeading lang={lang} title={id ? t('구성원 소개', 'Team profile') : t('구성원', 'Our team')} category={t('구성원', 'Team')} parent={id ? 'team' : undefined} lead={id ? undefined : t('기초과학에서 데이터와 실험 장치까지, 각자의 전문성을 함께 연결합니다.', 'Connecting fundamental science with data and experimental engineering.')} /><section className="section wrap"><div className={`team-grid${id ? ' team-single' : ''}`}>{people.map((person) => <PersonCard key={person.id} person={person} lang={lang} compact={!id} />)}</div>{id && <div className="back-navigation"><TextLink to={path(lang, 'team')} back>{t('전체 구성원 보기', 'All team members')}</TextLink></div>}</section></>;
}

function News({ lang, id }) {
  const [filter, setFilter] = useState('all');
  const t = (ko, en) => translate(lang, ko, en);
  const items = data.news.filter((item) => item.visibility === 'public').sort((a, b) => b.date.localeCompare(a.date));
  if (id) {
    const item = items.find((newsItem) => newsItem.id === id);
    if (!item) return <NotFound lang={lang} />;
    return <><PageHeading lang={lang} title={field(item, 'title', lang)} lead={field(item, 'summary', lang)} category={t('소식', 'News')} parent="news" /><section className="section wrap news-detail"><article className="inner-prose"><div className="eyebrow">{item.date} · {field(item, 'category_label', lang)}</div>{(field(item, 'body', lang) || []).map((text, index) => <p key={index}>{text}</p>)}{item.url && <a className="button" href={item.url} target="_blank" rel="noopener noreferrer">{t('원문 보기', 'Read original')}<ArrowUpRight size={18} aria-hidden="true" /></a>}{item.project && <div className="project-band"><TextLink to={path(lang, `research/${item.project}`)}>{t('관련 연구', 'Related research')}</TextLink></div>}</article><div className="back-navigation"><TextLink to={path(lang, 'news')} back>{t('전체 소식 보기', 'All news')}</TextLink></div></section></>;
  }
  const filtered = items.filter((item) => filter === 'all' || item.category === filter);
  return <><PageHeading lang={lang} title={t('소식', 'News')} lead={t('인스파티움의 연구 소식과 언론 보도를 전합니다.', 'Research announcements and media coverage from Inspatium.')} /><section className="section wrap"><div className="news-filters" role="group" aria-label={t('소식 분류', 'News categories')}>{[['all', t('전체', 'All')], ['research', t('연구 소식', 'Research')], ['media', t('언론 보도', 'Media')]].map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} className={filter === value ? 'is-active' : ''} onClick={() => setFilter(value)}>{label}</button>)}</div><div className="news-results" aria-live="polite">{filtered.length ? filtered.map((item) => <article className="news-list-item" key={item.id}><div className="news-item-meta"><time dateTime={item.date}>{item.date}</time><span>{field(item, 'category_label', lang)}</span></div><div><h2><Link to={path(lang, `news/${item.id}`)}>{field(item, 'title', lang)}</Link></h2><p>{field(item, 'summary', lang)}</p><TextLink to={path(lang, `news/${item.id}`)}>{t('소식 보기', 'Read update')}</TextLink></div></article>) : <div className="inner-news-empty"><span className="empty-rule" aria-hidden="true" /><h2>{items.length ? t('해당 분류의 소식이 없습니다.', 'There are no updates in this category.') : t('등록된 소식이 없습니다.', 'No updates have been posted yet.')}</h2><p>{t('새로운 연구 소식과 언론 보도를 이곳에서 전하겠습니다.', 'Research announcements and media coverage will appear here.')}</p></div>}</div></section></>;
}

function Join({ lang }) {
  const t = (ko, en) => translate(lang, ko, en);
  const info = data.recruitment;
  const mailto = `mailto:${data.site.email}?subject=${encodeURIComponent(field(info, 'email_subject', lang))}`;
  return <><PageHeading lang={lang} title={field(info, 'title', lang)} lead={field(info, 'lead', lang)} /><section className="section wrap join-page-grid"><article className="inner-prose"><h2>{field(info, 'heading', lang)}</h2>{field(info, 'body', lang).map((text, index) => <p key={index}>{text}</p>)}<div className="join-reference-links"><TextLink to={path(lang, 'philosophy')}>{t('경영철학 읽기', 'Our philosophy')}</TextLink><TextLink to={path(lang, 'greeting')}>{t('인사말 읽기', 'Lead Researcher’s message')}</TextLink><TextLink to={path(lang, 'research')}>{t('연구 살펴보기', 'Explore research')}</TextLink></div></article><aside className="inner-contact-panel"><Mail size={28} strokeWidth={1.5} aria-hidden="true" /><h2>{field(info, 'contact_title', lang)}</h2><p>{field(info, 'contact_body', lang)}</p><a className="contact-email" href={`mailto:${data.site.email}`}>{data.site.email}</a><a className="button" href={mailto}>{t('참여 문의하기', 'Contact us to join')}<ArrowUpRight size={18} aria-hidden="true" /></a></aside></section></>;
}

function Contact({ lang }) {
  const t = (ko, en) => translate(lang, ko, en);
  const lead = t('연구 참여와 공동 연구, 기술 협력, 언론 문의를 기다립니다.', 'For research participation, collaboration, technology partnerships, and media inquiries.');
  return <>
    <PageHeading lang={lang} title={t('문의', 'Contact')} lead={lead} />
    <section className="section wrap contact-page-grid">
      <article><span className="eyebrow">GET IN TOUCH</span><h2>{t('인스파티움과 이야기하세요.', 'Talk with Inspatium.')}</h2><p className="contact-description">{lead}</p><dl className="contact-page-details"><div><dt>{t('문의 담당', 'Contact')}</dt><dd>{t('최성준 · 리드 연구자', 'SungJun Choi · Lead Researcher')}</dd></div><div><dt>{t('이메일', 'Email')}</dt><dd><a href={`mailto:${data.site.email}`}>{data.site.email}<ArrowUpRight size={17} aria-hidden="true" /></a></dd></div></dl><a className="button" href={`mailto:${data.site.email}`}>{t('이메일로 문의하기', 'Email Inspatium')}<Mail size={17} aria-hidden="true" /></a></article>
      <aside className="inner-contact-panel"><span className="eyebrow">JOIN OUR RESEARCH</span><h2>{t('함께 연구할 동료를 찾습니다.', 'Research with us.')}</h2><p>{field(data.recruitment, 'lead', lang)}</p><Link className="button button-outline" to={path(lang, 'join')}>{t('연구원 모집 안내', 'Join our research')}<ArrowUpRight size={18} aria-hidden="true" /></Link><TextLink to={path(lang, 'team')}>{t('구성원 소개', 'Meet the team')}</TextLink></aside>
      <section className="contact-members" aria-labelledby="contact-members-heading"><h2 id="contact-members-heading">{t('구성원에게 직접 연락하기', 'Contact our team directly')}</h2><div className="contact-member-grid">{data.people.map((person) => <article className="contact-member" key={person.id}><h3><Link to={path(lang, `team/${person.id}`)}>{field(person, 'name', lang)}<ArrowUpRight size={17} aria-hidden="true" /></Link></h3><MemberContact person={person} lang={lang} /></article>)}</div></section>
    </section>
  </>;
}

function NotFound({ lang }) {
  const t = (ko, en) => translate(lang, ko, en);
  return <><PageHeading lang={lang} title={t('페이지를 찾을 수 없습니다.', 'Page not found.')} category="404" /><section className="section wrap not-found-content"><p>{t('주소를 확인하거나 홈페이지에서 원하는 내용을 찾아주세요.', 'Please check the address or explore the website from the homepage.')}</p><Link className="button" to={path(lang)}>{t('홈으로 돌아가기', 'Return home')}<ArrowLeft size={18} aria-hidden="true" /></Link></section></>;
}

export default function PageContent({ lang = 'ko', page, id }) {
  const pages = { philosophy: Philosophy, greeting: Greeting, about: About, history: History, research: Research, publications: Publications, team: Team, news: News, join: Join, contact: Contact };
  const Component = pages[page] || NotFound;
  if (id && !['research', 'publications', 'team', 'news'].includes(page)) return <NotFound lang={lang} />;
  return <Component lang={lang} id={id} />;
}

