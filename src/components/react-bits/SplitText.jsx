// Adapted from React Bits / David Haz. See LICENSE.md and README.md in this folder.
import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText as GSAPSplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';
import useReducedMotion from '../useReducedMotion.js';

gsap.registerPlugin(ScrollTrigger, GSAPSplitText, useGSAP);

export default function SplitText({
  text, className = '', delay = 24, duration = 0.85, ease = 'power3.out',
  splitType = 'chars', from = { opacity: 0, y: 32 }, to = { opacity: 1, y: 0 },
  threshold = 0.05, tag: Tag = 'span',
}) {
  const ref = useRef(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    let active = true;
    document.fonts.ready.then(() => { if (active) setFontsLoaded(true); });
    return () => { active = false; };
  }, []);

  useGSAP(() => {
    if (!ref.current || !text || !fontsLoaded) return;
    let completed = false;
    const split = new GSAPSplitText(ref.current, {
      type: splitType,
      smartWrap: true,
      autoSplit: splitType.includes('lines'),
      linesClass: 'split-line',
      wordsClass: 'split-word',
      charsClass: 'split-char',
      reduceWhiteSpace: false,
      onSplit: self => {
        const targets = splitType.includes('chars') ? self.chars
          : splitType.includes('words') ? self.words : self.lines;
        if (completed) { gsap.set(targets, to); return; }
        return gsap.fromTo(targets, reducedMotion ? { opacity: 0 } : from, {
          ...to, duration: reducedMotion ? 0.45 : duration, ease,
          stagger: reducedMotion ? 0.015 : delay / 1000,
          scrollTrigger: {
            trigger: ref.current, start: `top ${(1 - threshold) * 100}%`, once: true,
            fastScrollEnd: true,
          },
          onComplete: () => { completed = true; },
        });
      },
    });
    return () => split.revert();
  }, {
    dependencies: [text, delay, duration, ease, splitType, threshold, fontsLoaded,
      reducedMotion, JSON.stringify(from), JSON.stringify(to)],
    scope: ref,
    revertOnUpdate: true,
  });

  return <Tag ref={ref} className={`split-text ${className}`} data-text-animation="split">{text}</Tag>;
}
