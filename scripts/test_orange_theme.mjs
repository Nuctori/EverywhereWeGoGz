import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

for (const file of ['Hero', 'Header', 'TourCard', 'TourList']) {
  const source = readFileSync(`src/sections/${file}.tsx`, 'utf8');
  assert.doesNotMatch(source, /teal-|#173e38|#194e43|#103e34|#bc6237/, `${file}: no mixed green branding`);
  assert.match(source, /orange-/, `${file}: orange theme present`);
}
const css = readFileSync('src/index.css', 'utf8');
assert.doesNotMatch(css, /#dce9dd|#eeefe6|#f5f1e7|#e8eee3|#267466|#194e43/);
assert.match(css, /outline: 3px solid #ea580c/);
assert.match(css, /background: linear-gradient\(120deg, #ffffff, #fafafa\)/);
const hero = readFileSync('src/sections/Hero.tsx', 'utf8');
assert.match(hero, /bg-orange-600 text-white/);
console.log('Orange theme contract passed: neutral surfaces, orange accents, no green branding.');
