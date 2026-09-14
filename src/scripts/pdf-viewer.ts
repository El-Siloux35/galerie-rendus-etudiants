import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

/**
 * Lecteur de PDF page à page.
 *
 * Le lecteur intégré des navigateurs impose sa barre d'outils grise, qui
 * jure avec la maquette et change d'un navigateur à l'autre. Ici chaque
 * page est dessinée dans un canvas : l'habillage reste celui du site.
 *
 * Le document n'est téléchargé que lorsque le bloc approche de l'écran,
 * et si quoi que ce soit échoue, le lien de téléchargement reste présent
 * au-dessus du lecteur.
 */

const MAX_SCALE = 2; // au-delà, le gain est invisible et la mémoire grimpe

async function mount(root: HTMLElement) {
  const src = root.dataset.pdfSrc;
  const stage = root.querySelector<HTMLElement>('[data-pdf-stage]');
  const canvas = root.querySelector<HTMLCanvasElement>('canvas');
  const counter = root.querySelector<HTMLElement>('[data-pdf-counter]');
  const prev = root.querySelector<HTMLButtonElement>('[data-pdf-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-pdf-next]');
  const context = canvas?.getContext('2d');
  if (!src || !stage || !canvas || !context || !counter || !prev || !next) return;

  let doc: pdfjs.PDFDocumentProxy;
  try {
    doc = await pdfjs.getDocument({ url: src }).promise;
  } catch (error) {
    console.warn('PDF illisible :', src, error);
    root.dataset.pdfState = 'error';
    return;
  }

  let current = 1;
  let pending = 0;

  const draw = async () => {
    const token = ++pending;
    const page = await doc.getPage(current);
    if (token !== pending) return; // une navigation plus récente a pris la main

    const base = page.getViewport({ scale: 1 });
    stage.style.aspectRatio = `${base.width} / ${base.height}`;

    const width = stage.clientWidth || root.clientWidth;
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_SCALE);
    const viewport = page.getViewport({ scale: (width / base.width) * ratio });

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    try {
      await page.render({ canvasContext: context, viewport }).promise;
    } catch (error) {
      console.warn('Rendu de page impossible :', current, error);
      root.dataset.pdfState = 'error';
      return;
    }

    counter.textContent = `${current} / ${doc.numPages}`;
    prev.disabled = current === 1;
    next.disabled = current === doc.numPages;
    root.dataset.pdfState = 'ready';
  };

  const go = (delta: number) => {
    const target = current + delta;
    if (target < 1 || target > doc.numPages) return;
    current = target;
    void draw();
  };

  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));

  // Les flèches ne pilotent le lecteur que lorsqu'il a le focus : sinon
  // elles empêcheraient de faire défiler la page.
  root.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') go(-1);
    else if (event.key === 'ArrowRight') go(1);
    else return;
    event.preventDefault();
  });

  let resizeTimer: number;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => void draw(), 180);
  });

  await draw();
}

export function initPdfViewers() {
  const roots = Array.from(document.querySelectorAll<HTMLElement>('[data-pdf-src]'));
  if (roots.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        void mount(entry.target as HTMLElement);
      }
    },
    { rootMargin: '400px' },
  );

  for (const root of roots) observer.observe(root);
}
