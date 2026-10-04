import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

export default function Home({ lang }) {
  const t = (ko, en) => lang === 'ko' ? ko : en;
  const link = route => `/${lang}/${route}`;

  return <>
    <section className={`hero ${lang === 'en' ? 'hero-en' : ''}`}>
      <img className="hero-art" src="/assets/wave-hero.webp" alt="" width="1672" height="941" fetchPriority="high" />
      <div className="wrap hero-inner">
        <div className="hero-topline">
          <span className="eyebrow">PHYSICAL AI / INVERSE DESIGN</span>
          <span className="hero-origin">{t('독립 연구팀 · 2025', 'Independent research team · 2025')}</span>
        </div>
        <div className="hero-copy">
          <h1>{t(<><span>피지컬 AI의 미래,</span><span>역설계에서 시작됩니다.</span></>, <><span>The future of physical AI.</span><span>It begins with inverse design.</span></>)}</h1>
          <p>{t('원하는 결과에서 출발해, 그것을 실현할 방법을 찾습니다. 수학과 물리학을 바탕으로 설계와 제어의 가능성을 넓힙니다.', 'Start with the outcome. Find the way to make it happen. We explore design and control, grounded in mathematics and physics.')}</p>
          <div className="actions">
            <Link className="button" to={link('research')}>{t('연구 살펴보기', 'Explore research')}<ArrowUpRight size={21} aria-hidden="true" /></Link>
            <Link className="text-link" to={link('about')}>{t('인스파티움 소개', 'About Inspatium')}<ArrowRight size={20} aria-hidden="true" /></Link>
          </div>
        </div>
      </div>
    </section>

    <section className="home-directory wrap" aria-label={t('인스파티움 둘러보기', 'Explore Inspatium')}>
      <Link className="directory-link" to={link('research')}>
        <span className="directory-number" aria-hidden="true">01</span>
        <div><h2>{t('목표를 설계로, 연구를 현실로.', 'From goals to designs.')}</h2><p>{t('음향, 역설계 AI, 하드웨어를 잇는 연구', 'Research across acoustics, inverse design, and hardware')}</p></div>
        <ArrowUpRight size={27} strokeWidth={1.4} aria-hidden="true" />
      </Link>
      <Link className="directory-link" to={link('team')}>
        <span className="directory-number" aria-hidden="true">02</span>
        <div><h2>{t('서로의 전문성이 만나는 곳.', 'Where expertise meets.')}</h2><p>{t('인스파티움을 만들어가는 사람들', 'The people behind Inspatium')}</p></div>
        <ArrowUpRight size={27} strokeWidth={1.4} aria-hidden="true" />
      </Link>
    </section>
  </>;
}
