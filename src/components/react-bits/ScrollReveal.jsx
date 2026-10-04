// Adapted from React Bits / David Haz. See LICENSE.md and README.md in this folder.
import { useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import useReducedMotion from '../useReducedMotion.js';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function ScrollReveal({
  children, tag: Tag = 'p', className = '', baseOpacity = 0.35,
  enableBlur = true, blurStrength = 2, wordAnimationEnd = 'clamp(top 65%)',
}) {
  const ref = useRef(null);
  const reducedMotion = useReducedMotion();
  const words = useMemo(() => String(children).split(/(\s+)/).map((word, index) =>
    /^\s+$/.test(word) ? word : <span className="reveal-word" key={index}>{word}</span>
  ), [children]);

  useGSAP(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current.querySelectorAll('.reveal-word'), {
      opacity: reducedMotion ? 0.65 : baseOpacity,
      filter: enableBlur && !reducedMotion ? `blur(${blurStrength}px)` : 'none',
    }, {
      opacity: 1, filter: enableBlur && !reducedMotion ? 'blur(0px)' : 'none', ease: 'none', stagger: 0.05,
      scrollTrigger: {
        trigger: ref.current, start: 'top bottom', end: wordAnimationEnd, scrub: true,
      },
    });
  }, {
    dependencies: [children, reducedMotion, baseOpacity, enableBlur, blurStrength, wordAnimationEnd],
    scope: ref,
    revertOnUpdate: true,
  });

  return <Tag ref={ref} className={`scroll-reveal ${className}`} data-text-animation="scroll">{words}</Tag>;
}
