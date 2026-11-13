import { readFileSync, writeFileSync } from 'node:fs';
import { buildTokensCss } from './tokensCss';

const source = new URL('../../../design/tokens.json', import.meta.url);
const target = new URL('../src/app/styles/tokens.css', import.meta.url);

writeFileSync(target, buildTokensCss(JSON.parse(readFileSync(source, 'utf8'))));
console.log(`tokens written to ${target.pathname}`);
