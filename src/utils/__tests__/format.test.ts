import { formatCash, formatDuration, formatInt } from '@/utils/format';

describe('formatCash', () => {
  it.each([
    [0, '0'],
    [999, '999'],
    [1000, '1K'],
    [1234, '1.2K'],
    [1299, '1.2K'],
    [999_999, '999.9K'],
    [3_400_000, '3.4M'],
    [5_600_000_000, '5.6B'],
    [12.9, '12'],
  ])('%p -> %p', (value, expected) => {
    expect(formatCash(value)).toBe(expected);
  });
});

describe('formatDuration', () => {
  it.each([
    [45, '45 s'],
    [754, '12 min'],
    [3600, '1 h'],
    [5400, '1 h 30 min'],
  ])('%p s -> %p', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });
});

describe('formatInt', () => {
  it('põe ponto de milhar', () => {
    expect(formatInt(999)).toBe('999');
    expect(formatInt(1150)).toBe('1.150');
    expect(formatInt(1234567)).toBe('1.234.567');
  });
});
