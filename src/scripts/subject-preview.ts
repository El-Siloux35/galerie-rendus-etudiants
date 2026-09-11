import gsap from 'gsap';
import { Renderer, Program, Mesh, Plane, Texture } from 'ogl';

/**
 * Vignette de prévisualisation qui suit le curseur sur la page d'accueil.
 *
 * Deux couches :
 *  - GSAP place la vignette avec du retard sur le curseur (quickTo) ;
 *  - un plan WebGL (OGL, ~5 ko) cisaille l'image selon la vitesse du
 *    curseur et fait le fondu d'un sujet à l'autre.
 *
 * Tout est facultatif : sans JS, sans WebGL, sur écran tactile ou en
 * mouvement réduit, les lignes restent de simples liens.
 */

const VERTEX = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  precision highp float;

  uniform sampler2D tCurrent;
  uniform sampler2D tNext;
  uniform float uFade;    // fondu du sujet courant vers le suivant
  uniform float uVel;     // vitesse horizontale du curseur, normalisée
  uniform float uOpen;    // 0 vignette fermée, 1 ouverte
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;

    // Cisaillement : l'image se tord dans le sens du déplacement,
    // plus fort au centre qu'aux bords.
    float wave = sin(uv.y * 6.2831853 + uTime * 0.7);
    float falloff = 1.0 - abs(uv.y - 0.5) * 1.2;
    uv.x += uVel * 0.16 * wave * falloff;

    // Léger zoom à l'ouverture, pour que la vignette "arrive".
    uv = (uv - 0.5) * (1.0 + (1.0 - uOpen) * 0.3) + 0.5;

    vec3 mixed = mix(texture2D(tCurrent, uv).rgb, texture2D(tNext, uv).rgb, uFade);

    // Noir et blanc assumé : luminance puis contraste tenu.
    float g = dot(mixed, vec3(0.299, 0.587, 0.114));
    g = clamp((g - 0.5) * 1.16 + 0.5, 0.0, 1.0);

    gl_FragColor = vec4(vec3(g), uOpen);
  }
`;

function loadTexture(gl: WebGLRenderingContext, url: string): Texture {
  const texture = new Texture(gl, { generateMipmaps: false });
  const image = new Image();
  image.decoding = 'async';
  image.src = url;
  image.onload = () => {
    texture.image = image;
  };
  return texture;
}

export function initSubjectPreview() {
  const root = document.querySelector<HTMLElement>('[data-preview-root]');
  const list = document.querySelector<HTMLElement>('[data-subjects]');
  if (!root || !list) return;

  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!fine.matches || calm.matches) return;

  const links = Array.from(list.querySelectorAll<HTMLAnchorElement>('[data-preview-src]'));
  if (links.length === 0) return;

  const renderer = new Renderer({ alpha: true, dpr: Math.min(window.devicePixelRatio, 2) });
  const gl = renderer.gl;
  gl.canvas.classList.add('preview__canvas');
  root.appendChild(gl.canvas);

  const size = () => {
    const rect = root.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height);
  };
  size();
  window.addEventListener('resize', size);

  // Une texture par sujet, chargée une fois.
  const textures = new Map<string, Texture>();
  for (const link of links) {
    const src = link.dataset.previewSrc!;
    if (!textures.has(src)) textures.set(src, loadTexture(gl, src));
  }
  const first = textures.get(links[0].dataset.previewSrc!)!;

  const program = new Program(gl, {
    vertex: VERTEX,
    fragment: FRAGMENT,
    transparent: true,
    uniforms: {
      tCurrent: { value: first },
      tNext: { value: first },
      uFade: { value: 0 },
      uVel: { value: 0 },
      uOpen: { value: 0 },
      uTime: { value: 0 },
    },
  });
  const mesh = new Mesh(gl, { geometry: new Plane(gl, { width: 2, height: 2 }), program });
  const u = program.uniforms;

  // --- Suivi du curseur -------------------------------------------------
  // La vignette est centrée sur le curseur : GSAP compose ce décalage
  // avec les x/y animés ci-dessous, sans transform concurrente en CSS.
  gsap.set(root, { xPercent: -50, yPercent: -50 });

  const moveX = gsap.quickTo(root, 'x', { duration: 0.55, ease: 'power3' });
  const moveY = gsap.quickTo(root, 'y', { duration: 0.55, ease: 'power3' });
  let lastX = 0;
  let velocity = 0;

  const onMove = (event: PointerEvent) => {
    moveX(event.clientX);
    moveY(event.clientY);
    velocity = gsap.utils.clamp(-1, 1, (event.clientX - lastX) / 45);
    lastX = event.clientX;
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  // --- Ouverture / fermeture --------------------------------------------
  let currentSrc = links[0].dataset.previewSrc!;

  const open = () => gsap.to(u.uOpen, { value: 1, duration: 0.5, ease: 'power2.out' });
  const close = () => gsap.to(u.uOpen, { value: 0, duration: 0.35, ease: 'power2.in' });

  const swapTo = (src: string) => {
    if (src === currentSrc) return;
    const next = textures.get(src);
    if (!next) return;
    u.tNext.value = next;
    gsap.fromTo(
      u.uFade,
      { value: 0 },
      {
        value: 1,
        duration: 0.45,
        ease: 'power2.inOut',
        onComplete: () => {
          u.tCurrent.value = next;
          u.uFade.value = 0;
          currentSrc = src;
        },
      },
    );
  };

  for (const link of links) {
    link.addEventListener('pointerenter', () => {
      const src = link.dataset.previewSrc!;
      if (u.uOpen.value < 0.05) {
        u.tCurrent.value = textures.get(src)!;
        u.uFade.value = 0;
        currentSrc = src;
      } else {
        swapTo(src);
      }
      open();
    });
  }
  list.addEventListener('pointerleave', close);

  // --- Boucle ------------------------------------------------------------
  let frame = 0;
  const loop = (time: number) => {
    frame = requestAnimationFrame(loop);
    u.uTime.value = time * 0.001;
    // La vitesse retombe seule : sans mouvement, l'image se remet droite.
    u.uVel.value += (velocity - u.uVel.value) * 0.08;
    velocity *= 0.9;
    renderer.render({ scene: mesh });
  };
  frame = requestAnimationFrame(loop);

  document.addEventListener('astro:before-swap', () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('resize', size);
  });
}
