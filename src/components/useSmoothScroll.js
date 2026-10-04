import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import useReducedMotion from './useReducedMotion.js';
import 'lenis/dist/lenis.css';

gsap.registerPlugin(ScrollTrigger);

export default function useSmoothScroll(location) {
  const instance = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const lenis = new Lenis({
      lerp: 0.085,
      smoothWheel: true,
      syncTouch: false,
      anchors: true,
      stopInertiaOnNavigate: true,
      prevent: node => node.classList?.contains('main-nav'),
    });
    instance.current = lenis;
    const tick = time => lenis.raf(time * 1000);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      lenis.off('scroll', ScrollTrigger.update);
      lenis.destroy();
      instance.current = null;
    };
  }, [reducedMotion]);

  useEffect(() => {
    // Stop any remaining wheel inertia before a new route is measured.
    if (!location.hash) {
      if (instance.current) instance.current.scrollTo(0, { immediate: true, force: true });
      else window.scrollTo({ top: 0, behavior: 'instant' });
    }
    const frame = requestAnimationFrame(() => {
      instance.current?.resize();
      if (location.hash) {
        let fragment = location.hash.slice(1);
        try { fragment = decodeURIComponent(fragment); } catch { /* Ignore malformed fragments. */ }
        const target = document.getElementById(fragment);
        if (target) {
          if (instance.current) instance.current.scrollTo(target, { immediate: true, force: true });
          else target.scrollIntoView({ block: 'start', behavior: 'instant' });
        }
      }
      ScrollTrigger.refresh();
    });
    return () => cancelAnimationFrame(frame);
  }, [location.pathname, location.hash]);
}
