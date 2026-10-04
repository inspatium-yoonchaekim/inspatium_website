# React Bits text animations

These components are adapted from [React Bits](https://github.com/DavidHDev/react-bits),
revision `ca44b3f9ee180676a06d7de8ec6bea84cddff85b` (retrieved 2026-10-05).
The upstream MIT + Commons Clause license is preserved in `LICENSE.md`.

- [SplitText](https://github.com/DavidHDev/react-bits/blob/ca44b3f9ee180676a06d7de8ec6bea84cddff85b/src/content/TextAnimations/SplitText/SplitText.jsx): GSAP SplitText and staggered ScrollTrigger entrance.
- [BlurText](https://github.com/DavidHDev/react-bits/blob/ca44b3f9ee180676a06d7de8ec6bea84cddff85b/src/content/TextAnimations/BlurText/BlurText.jsx): Motion keyframes triggered by IntersectionObserver.
- [ScrollReveal](https://github.com/DavidHDev/react-bits/blob/ca44b3f9ee180676a06d7de8ec6bea84cddff85b/src/content/TextAnimations/ScrollReveal/ScrollReveal.jsx): word opacity and blur synchronized with scroll position.

Site adaptations preserve the existing semantic tags, typography, spaces, and
Korean/English wrapping. Animations honor live `prefers-reduced-motion` changes.
GSAP cleanup is scoped to each component so unmounting one animation does not
remove other page animations. Font readiness and React Strict Mode cleanup are
handled before splitting headings. ScrollReveal finishes within the available
scroll range, including short pages.

`../useSmoothScroll.js` integrates [Lenis](https://github.com/darkroomengineering/lenis)
with the GSAP ticker and ScrollTrigger. Desktop wheel scrolling is smoothed;
touch devices use native scrolling. Route changes stop inertia and reset the
scroll position, while fragment URLs and language switching retain their target.
