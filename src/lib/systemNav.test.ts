import { describe, it, expect } from 'vitest';
import { bottomOverlap } from './systemNav';

describe('bottomOverlap', () => {
  it('leaves room for the navigation bar when Pi Browser draws the page under it (Android 15, measured)', () => {
    expect(bottomOverlap(935, 421, 862)).toBe(48);
  });

  it('still does with the tallest status bars', () => {
    expect(bottomOverlap(935, 421, 935 - 105)).toBe(48);
  });

  it('adds nothing when the page already ends above a 3-button bar', () => {
    expect(bottomOverlap(935, 421, 862 - 48)).toBe(0);
  });

  it('adds nothing in landscape, where the bar is at the side', () => {
    expect(bottomOverlap(421, 935, 380)).toBe(0);
  });
});
