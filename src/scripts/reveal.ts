import gsap from 'gsap';

/**
 * Apparition des blocs marqués [data-reveal] quand ils entrent à l'écran.
 * Un seul observateur pour toute la page ; l'attribut data-reveal-delay
 * permet d'échelonner une série sans écrire de timeline.
 */
export function initReveal() {
  // Signale au filet de sécurité de Base.astro que le script tourne.
  document.documentElement.dataset.revealReady = 'true';

  const items = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  if (items.length === 0) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.set(items, { opacity: 1 });
    return;
  }

  gsap.set(items, { opacity: 0, y: 26 });

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        observer.unobserve(el);
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'expo.out',
          delay: Number(el.dataset.revealDelay ?? 0),
        });
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );

  for (const item of items) observer.observe(item);
}
