import { useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import useReducedMotion from './useReducedMotion.js';

gsap.registerPlugin(ScrollTrigger);

const selector = [
  'h1', 'h2', 'h3', 'p', 'ul', 'dl', 'figure', '.eyebrow', '.actions',
  '.research-list-item', '.publication-row', '.team-card', '.timeline-group',
  '.news-list-item', '.inner-contact-panel', '.contact-member', '.identity-column',
  '.project-facts', '.inner-news-empty', '.greeting-signature', '.back-navigation',
].join(',');

export default function usePageEntrance(mainRef, pathname) {
  const reducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const animated = new Map();
    let active = true;
    let refreshFrame;
    const context = gsap.context(() => {}, main);

    const revealContent = () => context.add(() => {
      const candidates = [...main.querySelectorAll(selector)].filter(element =>
        !element.closest('[data-text-animation]')
        && !element.querySelector('[data-text-animation]')
      );
      const candidateSet = new Set(candidates);
      const targets = candidates.filter(element => {
        for (let parent = element.parentElement; parent && parent !== main; parent = parent.parentElement) {
          if (candidateSet.has(parent)) return false;
        }
        return true;
      });
      let visibleIndex = 0;
      for (const element of targets) {
        if (animated.has(element)) continue;
        const bounds = element.getBoundingClientRect();
        const visible = bounds.top < window.innerHeight && bounds.bottom > 0;
        const tween = gsap.fromTo(element, {
          opacity: 0,
          y: reducedMotion ? 0 : 38,
          filter: reducedMotion ? 'none' : 'blur(5px)',
        }, {
          opacity: 1, y: 0, filter: reducedMotion ? 'none' : 'blur(0px)',
          duration: reducedMotion ? 0.45 : 0.95,
          delay: visible ? Math.min(visibleIndex++ * 0.09, 0.45) : 0,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: element, start: 'top 98%',
            toggleActions: 'play none none reverse',
            fastScrollEnd: true,
          },
        });
        animated.set(element, tween);
      }
      for (const [element, tween] of animated) {
        if (!element.isConnected) {
          tween.scrollTrigger?.kill();
          tween.kill();
          animated.delete(element);
        }
      }
      cancelAnimationFrame(refreshFrame);
      refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
    });

    revealContent();
    const observer = new MutationObserver(revealContent);
    observer.observe(main, { childList: true, subtree: true });
    document.fonts.ready.then(() => { if (active) revealContent(); });
    const showFocusedContent = event => {
      for (const [element, tween] of animated) {
        if (element.contains(event.target)) tween.progress(1);
      }
    };
    main.addEventListener('focusin', showFocusedContent);
    return () => {
      active = false;
      observer.disconnect();
      main.removeEventListener('focusin', showFocusedContent);
      cancelAnimationFrame(refreshFrame);
      context.revert();
    };
  }, [mainRef, pathname, reducedMotion]);
}
