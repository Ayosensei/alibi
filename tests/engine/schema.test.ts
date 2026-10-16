import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { CaseSchema } from '@/engine/schema';

describe('CaseSchema', () => {
  const casesDir = join(process.cwd(), 'cases');
  const files = readdirSync(casesDir).filter(
    (f) => f.endsWith('.json') && !f.endsWith('.run.json')
  );

  it('finds case files to test', () => {
    expect(files.length).toBeGreaterThanOrEqual(3);
  });

  for (const file of files) {
    it(`validates ${file} against CaseSchema`, () => {
      const raw = JSON.parse(readFileSync(join(casesDir, file), 'utf8'));
      const parsed = CaseSchema.safeParse(raw);
      if (!parsed.success) {
        console.error(`Validation failed for ${file}:`, parsed.error.format());
      }
      expect(parsed.success).toBe(true);
    });
  }
});
