// scripts/check-design.mjs
// Fails the commit if UI code bypasses the design system.
// A line can opt out with a trailing comment:  // design-ok: <reason>
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'src';
const SKIP_DIRS = new Set(['node_modules', '.next', 'public', 'screens', 'engine', 'agents']);
const ALLOWED_FILES = new Set([
  join(ROOT, 'app', 'globals.css'),
  join(ROOT, 'lib', 'tokens.ts'),
]);
const EXT = /\.(tsx?|css|mdx?)$/;

const RULES = [
  { name: 'hard-coded hex colour', re: /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/ },
  { name: 'colour function literal', re: /\b(?:rgba?|hsla?|oklch|oklab)\(/ },
  { name: 'arbitrary Tailwind colour', re: /\b(?:bg|text|border|ring|fill|stroke|from|to|via|shadow|outline|decoration)-\[[^\]]+\]/ },
  { name: 'arbitrary font size', re: /\btext-\[\d+(?:\.\d+)?(?:px|rem|em)\]/ },
  { name: 'inline colour style', re: /style=\{\{[^}]*\b(?:color|background|backgroundColor|borderColor|fill|stroke)\b/ },
  { name: 'forbidden UI library import', re: /from ['"](?:@mui\/|@chakra-ui\/|antd|@mantine\/|react-bootstrap|@headlessui\/|framer-motion|motion\/react)/ },
  { name: 'raw <button> (use Button)', re: /<button[\s>]/ },
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (EXT.test(name)) out.push(p);
  }
  return out;
}

let failures = 0;
for (const file of walk(ROOT)) {
  if (ALLOWED_FILES.has(file)) continue;
  // shadcn-generated primitives may contain raw <button>; skip that rule inside components/ui
  const inUi = file.includes(join('components', 'ui'));
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (line.includes('design-ok:')) return;
    for (const r of RULES) {
      if (inUi && r.name.startsWith('raw <button>')) continue;
      if (r.re.test(line)) {
        failures++;
        console.error(`${file}:${i + 1}  ${r.name}\n    ${line.trim()}`);
      }
    }
  });
}
if (failures) {
  console.error(`\n${failures} design-system violation(s). Use tokens/components, or add "// design-ok: reason".`);
  process.exit(1);
}
console.log('design check passed');
