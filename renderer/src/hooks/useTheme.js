import { useEffect, useState } from 'react';

// Accent palette — applied as data-palette on <html> so every var(--pink)/var(--cyan)
// consumer (tokens.css, components.css) repaints without touching any component.
// Storage key is versioned: v1 stored a "red" pick made while the red palette still
// muted --cyan on functional text, making it read as a low-contrast error state — reset
// everyone to the intended deep violet/cyan default rather than carry that forward.
const STORAGE_KEY = 'tli.palette.v2';

export function useTheme() {
  const [palette, setPaletteState] = useState(() => localStorage.getItem(STORAGE_KEY) || 'pink');

  useEffect(() => {
    if (palette === 'pink') document.documentElement.removeAttribute('data-palette');
    else document.documentElement.setAttribute('data-palette', palette);
  }, [palette]);

  const setPalette = (next) => {
    setPaletteState(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  return { palette, setPalette };
}
