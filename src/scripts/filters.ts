/**
 * Bascule entre les trois façons de parcourir la galerie : par sujet,
 * par niveau, par année.
 *
 * Les trois listes sont générées à la construction du site et présentes
 * dans la page ; on n'en montre qu'une. Le choix est inscrit dans l'adresse
 * (`/#niveau`), donc il survit à un rechargement et se partage par lien.
 * Sans JavaScript, la liste par sujet reste affichée.
 */

const KEYS = ['sujet', 'niveau', 'annee'] as const;
type Key = (typeof KEYS)[number];

const isKey = (value: string): value is Key => (KEYS as readonly string[]).includes(value);

export function initFilters() {
  const root = document.querySelector<HTMLElement>('[data-lists]');
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-filter]'));
  if (!root || buttons.length === 0) return;

  const show = (key: Key) => {
    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(button.dataset.filter === key));
    }
    for (const list of root.querySelectorAll<HTMLElement>('[data-list]')) {
      list.hidden = list.dataset.list !== key;
    }
  };

  for (const button of buttons) {
    button.addEventListener('click', () => {
      const key = button.dataset.filter;
      if (!key || !isKey(key)) return;
      show(key);
      // replaceState plutôt que location.hash : on ne veut pas empiler une
      // entrée d'historique à chaque clic sur un filtre.
      history.replaceState(null, '', key === 'sujet' ? location.pathname : `#${key}`);
    });
  }

  const fromUrl = location.hash.slice(1);
  if (isKey(fromUrl)) show(fromUrl);
}
