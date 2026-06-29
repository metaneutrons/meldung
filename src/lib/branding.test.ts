import { describe, it, expect } from 'vitest';
import { contrastColor } from './branding';

describe('contrastColor', () => {
  it('returns white on dark brand colors', () => {
    expect(contrastColor('#000000')).toBe('#ffffff');
    expect(contrastColor('#38b449')).toBe('#ffffff'); // brand green
    expect(contrastColor('#1d4ed8')).toBe('#ffffff'); // blue
  });

  it('returns near-black on light brand colors', () => {
    expect(contrastColor('#ffffff')).toBe('#1d1d1f');
    expect(contrastColor('#ffd400')).toBe('#1d1d1f'); // yellow
  });

  it('supports 3-digit hex', () => {
    expect(contrastColor('#fff')).toBe('#1d1d1f');
    expect(contrastColor('#000')).toBe('#ffffff');
  });
});
