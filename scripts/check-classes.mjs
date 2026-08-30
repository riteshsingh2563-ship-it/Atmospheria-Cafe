#!/usr/bin/env node
/* ---------------------------------------------------------------------------
   check-classes.mjs — catches Tailwind classes that don't exist.

   A typo'd utility (`h-4.5` on Tailwind's default scale, `duration-400`,
   `tracking-widest2` before it was defined) is invisible to the build: the class
   is simply never generated and the element silently loses its styling. This
   script compiles the stylesheet and then checks every class string in the JSX
   against it.

   Run:  npm run check:classes
--------------------------------------------------------------------------- */
import { readFileSync, readdirSync, statSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';

const root = process.cwd();
const outDir = mkdtempSync(join(tmpdir(), 'atmospheria-css-'));
const outFile = join(outDir, 'compiled.css');

execFileSync('node_modules/.bin/tailwindcss', ['-c', 'tailwind.config.js', '-i', 'src/index.css', '-o', outFile, '--minify'], {
  cwd: root,
  stdio: 'pipe',
});
const css = readFileSync(outFile, 'utf8');

/* ------------------------------------------------------------ collect files */
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(jsx|js|html)$/.test(name)) files.push(full);
  }
})('src');
files.push('index.html');

/* --------------------------------------------------------- collect classes */
const found = new Map(); // class -> file:line

const addToken = (token, file, line) => {
  if (!token) return;
  if (!/^[a-zA-Z0-9:[\]()./%,#_-]+$/.test(token)) return; // JS interpolation, punctuation
  if (/^\d/.test(token)) return;
  if (!found.has(token)) found.set(token, `${relative(root, file)}:${line}`);
};

for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    const patterns = [
      /className="([^"]*)"/g,
      /className='([^']*)'/g,
      /className=\{`([^`]*)`\}/g,
      /class="([^"]*)"/g,
      /\bclass(?:Name)?=\{(['"])([^'"]*)\1\}/g,
    ];
    for (const re of patterns) {
      for (const m of line.matchAll(re)) {
        const value = m[2] !== undefined ? m[2] : m[1];
        // Split on whitespace and on the ternary/quote boundaries inside template literals.
        value
          // Keep colons so variants like hover:-translate-y-0.5 survive intact;
          // only quotes and backticks become separators.
          .replace(/\$\{[^}]*\}/g, (expr) => ` ${expr.replace(/['"`]/g, ' ')} `)
          .split(/[\s'"]+/)
          .forEach((t) => addToken(t.trim(), file, i + 1));
      }
    }
  });
}

/* ---------------------------------------------------------- check against CSS */
// Tailwind escapes these characters inside a selector.
// Tailwind backslash-escapes special characters in selectors and the exact set
// is easy to get wrong, so compare against a de-escaped copy of the sheet.
// Tailwind escapes punctuation with a backslash and non-ASCII/CSS-special
// characters as `\XX ` hex escapes (a comma becomes `\2c `), so decode both
// before comparing.
const plainCss = css.replace(/\\([0-9a-fA-F]{1,6})\s/g, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/\\/g, '');

const KNOWN_NON_UTILITIES = new Set([
  // component classes authored in src/index.css @layer components
  'shell', 'shell-narrow', 'eyebrow', 'eyebrow--light', 'section-title', 'lede', 'btn', 'btn-primary',
  'btn-forest', 'btn-outline', 'btn-ghost-light', 'btn-sm', 'card', 'field', 'label', 'chip', 'pill',
  'divider-leaf', 'veg-mark', 'reveal', 'is-visible', 'grain-overlay', 'mask-fade-b', 'hover-lift',
  'progress-fill', 'no-scrollbar', 'text-balance', 'font-display', 'font-sans',
  // state/aria hooks and structural names that never produce CSS on their own
  'dark', 'group-hover',
]);

const missing = [...found.entries()].filter(([cls]) => {
  if (KNOWN_NON_UTILITIES.has(cls)) return false;
  if (cls.length < 2) return false;
  // Single-word tokens with no dash are almost always JS identifiers picked up
  // from a ternary (`tone === 'red' ? …`), not utilities.
  if (!cls.includes('-')) return false;
  return !plainCss.includes(`.${cls}`);
});

console.log(`\nScanned ${files.length} files · ${found.size} distinct class tokens · ${css.length / 1024 | 0} KB of CSS\n`);

/* ---------------------------------------------------- opacity modifier check
   Tailwind's opacity scale steps by 5, so `bg-clay-500/12` silently generates
   nothing. Either use a multiple of 5 or the bracket form `/[.12]`.           */
const badOpacity = [];
for (const file of files) {
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      for (const m of line.matchAll(/\b(?:bg|border|text|from|via|to|ring|fill|stroke|divide|shadow|accent|decoration|outline)-[a-z]+(?:-[0-9]+)?\/(\d{1,3})\b/g)) {
        const pct = Number(m[1]);
        if (pct % 5 !== 0 || pct > 100) badOpacity.push(`${m[0].padEnd(28)} ${relative(root, file)}:${i + 1}`);
      }
    });
}
if (badOpacity.length) {
  console.log(`\x1b[31m✗ ${badOpacity.length} opacity modifier${badOpacity.length === 1 ? '' : 's'} Tailwind cannot generate (scale steps by 5):\x1b[0m\n`);
  badOpacity.forEach((b) => console.log(`    ${b}`));
  console.log('\n  Use a multiple of 5, or the arbitrary form: bg-clay-500/[.12]\n');
  process.exit(1);
}

if (missing.length) {
  console.log(`\x1b[31m✗ ${missing.length} class${missing.length === 1 ? '' : 'es'} used in JSX but not generated by Tailwind:\x1b[0m\n`);
  missing
    .sort((a, b) => a[1].localeCompare(b[1]))
    .forEach(([cls, where]) => console.log(`    ${cls.padEnd(34)} ${where}`));
  console.log('\n  Either fix the class name or add it to tailwind.config.js (theme.extend).\n');
  process.exit(1);
}

console.log('\x1b[32m✓ every class used in the JSX is generated by the Tailwind build\x1b[0m\n');
process.exit(0);
