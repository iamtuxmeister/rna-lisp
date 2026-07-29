#!/usr/bin/env node
// Standalone runner: `npm run rna -- path/to/program.rna` or pipe via stdin:
//   npm run rna < program.rna
import { readFileSync } from 'node:fs';
import { run } from '../lib/rna-lisp.ts';

const readSource = (): string => {
  const path = process.argv[2];
  if (path) return readFileSync(path, 'utf8');
  return readFileSync(0, 'utf8'); // stdin
};

try {
  const source = readSource();
  const output = run(source);
  console.log(output || '(no output)');
} catch (e: any) {
  console.error(`Error: ${e.message}`);
  process.exit(1);
}
