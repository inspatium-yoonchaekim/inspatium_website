import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, useLocation } from 'react-router-dom';
import { ArrowUpRight, Menu, X, ChevronDown } from 'lucide-react';
import Home from './Home.jsx';
import PageContent from './Pages.jsx';
import data from './content.json';

const aboutPages = ['philosophy', 'greeting', 'about', 'history'];
const titles = {
  home: ['데이터 역설계 연구팀', 'Data-driven inverse design'],
  philosophy: ['경영철학', 'Philosophy'], greeting: ['인사말', 'Our message'],
  about: ['연구 방향', 'Our work'], history: ['연혁', 'History'],
  research: ['연구', 'Research'], publications: ['논문', 'Publications'],
  team: ['구성원', 'Team'], join: ['연구원 모집', 'Join us'],
  news: ['소식', 'News'], contact: ['문의', 'Contact'],
};

function Brand({ lang }) {
  return <Link className="brand" to={`/${lang}`} aria-label="Inspatium home">
    <svg viewBox="0 0 24 30" aria-hidden="true"><path d="M2 2h20v6H15v14h7v6H2v-6h7V8H2z" fill="currentColor" /></svg>
    <span>INSPATIUM</span>
  </Link>;
}

function Header({ lang, page }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const details = useRef(null);
  const t = (ko, en) => lang === 'ko' ? ko : en;
  useEffect(() => {
    setOpen(false);
    if (details.current) details.current.open = false;
  }, [location.pathname]);
  useEffect(() => {
    function escape(event) {
      if (event.key === 'Escape') {
        setOpen(false);
        if (details.current) details.current.open = false;
      }
    }
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, []);
  const otherLang = lang === 'ko' ? 'en' : 'ko';
  const targetPath = location.pathname.replace(/^\/(ko|en)(?=\/|$)/, `/${otherLang}`);
  return <>
    <a href="#main" className="skip-link">{t('본문 바로가기', 'Skip to content')}</a>
    <header className="site-header">
      <div className="wrap header-inner">
        <Brand lang={lang} />
        <nav id="main-navigation" className={`main-nav ${open ? 'is-open' : ''}`} aria-label={t('주 메뉴', 'Main navigation')}>
          <details className="about-dropdown" ref={details}>
            <summary className={aboutPages.includes(page) ? 'active' : ''}>{t('소개', 'About')}<ChevronDown size={12} /></summary>
            <div className="dropdown-links">{aboutPages.map(item => <NavLink key={item} to={`/${lang}/${item}`}>{titles[item][lang === 'ko' ? 0 : 1]}</NavLink>)}</div>
          </details>
          {['research', 'publications', 'team', 'news'].map(item => <NavLink key={item} to={`/${lang}/${item}`} className={page === item ? 'active' : ''}>{titles[item][lang === 'ko' ? 0 : 1]}</NavLink>)}
          <NavLink to={`/${lang}/contact`} className={`nav-contact ${page === 'contact' ? 'active' : ''}`}>{t('문의하기', 'Contact')}<ArrowUpRight size={15} /></NavLink>
        </nav>
        <div className="header-tools">
          <Link className="language-switch" to={`${targetPath}${location.search}${location.hash}`} lang={otherLang} aria-label={t('Switch to English', '한국어로 전환')}><span className={lang === 'ko' ? 'current' : ''}>KR</span><span className="language-divider">/</span><span className={lang === 'en' ? 'current' : ''}>EN</span></Link>
          <button className="menu-toggle" type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="main-navigation" aria-label={t(open ? '메뉴 닫기' : '메뉴 열기', open ? 'Close menu' : 'Open menu')}>{open ? <X size={24} /> : <Menu size={24} />}</button>
        </div>
      </div>
    </header>
  </>;
}

function Footer({ lang }) {
  const t = (ko, en) => lang === 'ko' ? ko : en;
  return <footer className="site-footer"><div className="wrap">
    <div className="footer-main"><div><Brand lang={lang} /><p>{t('수학과 물리학에서, 새로운 가능성으로.', 'From mathematics and physics to new possibilities.')}</p></div>
      <div className="footer-contact"><Link className="footer-join" to={`/${lang}/join`}>{t('함께 연구하기', 'Research with us')}<ArrowUpRight size={18} aria-hidden="true" /></Link><a href={`mailto:${data.site.email}`}>{data.site.email}<ArrowUpRight size={19} aria-hidden="true" /></a></div>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} Inspatium.</span><div><Link to={`/${lang}/philosophy`}>{t('경영철학', 'Philosophy')}</Link><span>{t('2025년 출범', 'Founded in 2025')}</span></div></div>
  </div></footer>;
}

export default function App() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  const lang = parts[0] === 'en' ? 'en' : 'ko';
  const page = parts[1] || 'home';
  const id = parts[2];
  const validLocale = parts[0] === 'ko' || parts[0] === 'en';
  useEffect(() => {
    document.documentElement.lang = lang;
    const field = key => lang === 'en' ? `${key}_en` : key;
    const project = page === 'research' && data.projects.find(item => item.id === id);
    const paper = page === 'publications' && data.publications.find(item => item.id === id);
    const person = page === 'team' && data.people.find(item => item.id === id);
    const title = person?.[field('name')] || (project || paper)?.[field('title')] || titles[page]?.[lang === 'ko' ? 0 : 1] || (lang === 'ko' ? '페이지를 찾을 수 없습니다' : 'Page not found');
    document.title = `${title} | INSPATIUM`;
    const description = project?.[field('summary')] || (lang === 'ko' ? '인스파티움은 수학과 물리학을 바탕으로 지능적 역설계 AI와 피지컬 AI 제어 기술을 연구합니다.' : 'Inspatium researches intelligent inverse design and physical AI, grounded in mathematics and physics.');
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', document.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
    if (location.hash) {
      const frame = requestAnimationFrame(() => {
        let fragment = location.hash.slice(1);
        try { fragment = decodeURIComponent(fragment); } catch { /* Keep malformed external fragments harmless. */ }
        const target = document.getElementById(fragment);
        target?.scrollIntoView({ block: 'start' });
      });
      return () => cancelAnimationFrame(frame);
    }
    window.scrollTo(0, 0);
  }, [lang, page, id, location.pathname, location.hash]);

  if (location.pathname === '/' || location.pathname === '/index.html') return <Navigate to="/ko" replace />;
  if (validLocale && parts.at(-1) === 'index.html') return <Navigate to={`${location.pathname.replace(/\/index\.html$/, '')}${location.search}${location.hash}`} replace />;
  const unknown = !validLocale || parts.length > 3 || (id && !['research', 'publications', 'news', 'team'].includes(page));
  return <><Header lang={lang} page={page} /><main id="main" tabIndex={-1}>{page === 'home' && !unknown ? <Home lang={lang} /> : <PageContent lang={lang} page={unknown ? '404' : page} id={id} />}</main><Footer lang={lang} /></>;
}
