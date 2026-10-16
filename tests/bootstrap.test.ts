import { describe, it, expect } from 'vitest';
import { colors } from '@/lib/tokens';
import * as referenceEngine from '../scripts/reference-engine.mjs';

describe('A0: Bootstrap Environment', () => {
  it('loads design tokens with required Noir palette', () => {
    expect(colors.background).toBe('#0A0908');
    expect(colors.primary).toBe('#D13636');
    expect(colors.thread).toBe('#FF7A70');
    expect(colors.brass).toBe('#C9A45C');
    expect(colors.paper).toBe('#E9E1D3');
  });

  it('imports oracle reference engine', () => {
    expect(typeof referenceEngine.findContradictions).toBe('function');
    expect(typeof referenceEngine.findRehearsed).toBe('function');
    expect(typeof referenceEngine.couldBeAt).toBe('function');
  });
});
