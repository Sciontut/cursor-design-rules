// ============================================================
// css-extractor.js — extracts a frequency-weighted design system
// from a live page. Paste in DevTools console, hit Enter.
// Read-only: walks the DOM + computed styles + CSS custom props.
// Output JSON is the source-of-truth input for designmd-extractor.
// ============================================================

(() => {
  const out = { url: location.href, capturedAt: new Date().toISOString() };
  const els = [...document.querySelectorAll('*')].slice(0, 4000);

  // ———————— helpers ————————
  const tally = (map, key) => { if (!key) return; map[key] = (map[key] || 0) + 1; };
  const sortTally = (map, limit = 40) =>
    Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([value, frequency]) => ({ value, frequency }));

  // normalize rgb(a) -> lowercase hex where opaque, else keep rgba()
  const toHex = (c) => {
    if (!c || c === 'transparent') return null;
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return c.toLowerCase();
    const [r, g, b, a] = m[1].split(',').map(s => parseFloat(s.trim()));
    if (a !== undefined && a < 1) return `rgba(${r}, ${g}, ${b}, ${a})`;
    const h = (n) => n.toString(16).padStart(2, '0');
    return `#${h(r)}${h(g)}${h(b)}`;
  };

  // ———————— 1) Named CSS custom properties (the team's real DS) ————————
  // These names win over rendered output — treat as intentional tokens.
  const cssVars = {};
  for (const sheet of [...document.styleSheets]) {
    let rules;
    try { rules = sheet.cssRules; } catch (e) { continue; } // cross-origin
    if (!rules) continue;
    for (const rule of rules) {
      if (!rule.style) continue;
      for (const prop of rule.style) {
        if (prop.startsWith('--')) {
          const val = rule.style.getPropertyValue(prop).trim();
          if (val && !cssVars[prop]) cssVars[prop] = val;
        }
      }
    }
  }
  // also pull computed custom props off :root
  const rootStyle = getComputedStyle(document.documentElement);
  for (const prop of rootStyle) {
    if (prop.startsWith('--')) {
      const val = rootStyle.getPropertyValue(prop).trim();
      if (val && !cssVars[prop]) cssVars[prop] = val;
    }
  }
  out.cssVariables = cssVars;

  // ———————— 2) Frequency-weighted colors, type, spacing ————————
  const bgColors = {}, textColors = {}, borderColors = {};
  const fontFamilies = {}, fontSizes = {}, fontWeights = {}, lineHeights = {};
  const radii = {}, spacing = {}, shadows = {};

  for (const el of els) {
    const s = getComputedStyle(el);
    tally(bgColors, toHex(s.backgroundColor));
    tally(textColors, toHex(s.color));
    if (s.borderStyle !== 'none' && parseFloat(s.borderWidth) > 0)
      tally(borderColors, toHex(s.borderColor));
    tally(fontFamilies, s.fontFamily);
    tally(fontSizes, s.fontSize);
    tally(fontWeights, s.fontWeight);
    tally(lineHeights, s.lineHeight);
    if (s.borderRadius && s.borderRadius !== '0px') tally(radii, s.borderRadius);
    [s.paddingTop, s.paddingBottom, s.marginTop, s.marginBottom, s.gap]
      .forEach(v => { if (v && v !== '0px' && v !== 'normal') tally(spacing, v); });
    if (s.boxShadow && s.boxShadow !== 'none') tally(shadows, s.boxShadow);
  }

  out.colors = {
    backgrounds: sortTally(bgColors),
    text: sortTally(textColors),
    borders: sortTally(borderColors),
  };
  out.typography = {
    fontFamilies: sortTally(fontFamilies, 12),
    fontSizes: sortTally(fontSizes, 20),
    fontWeights: sortTally(fontWeights, 12),
    lineHeights: sortTally(lineHeights, 16),
  };
  out.shape = { borderRadius: sortTally(radii, 16) };
  out.spacing = sortTally(spacing, 24);
  out.shadows = sortTally(shadows, 12);

  console.log(JSON.stringify(out, null, 2));
  console.log(
    '%cCopy the JSON above and paste it into your DESIGN.md build prompt. ' +
    'Named --css-vars are the source of truth; raw frequencies fill the rest.',
    'color:#d4af37;font-weight:bold;'
  );
})();
