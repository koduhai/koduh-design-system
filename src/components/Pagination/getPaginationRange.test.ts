import { describe, it, expect } from 'vitest';
import { getPaginationRange } from './getPaginationRange';

describe('getPaginationRange', () => {
  it('returns a single page when count is 1', () => {
    expect(getPaginationRange({ count: 1, page: 1 })).toEqual([1]);
  });

  it('lists every page with no ellipsis when they all fit', () => {
    expect(getPaginationRange({ count: 5, page: 1 })).toEqual([1, 2, 3, 4, 5]);
  });

  it('shows a trailing ellipsis near the start (window pads to 5 leading pages)', () => {
    expect(getPaginationRange({ count: 20, page: 1 })).toEqual([1, 2, 3, 4, 5, 'ellipsis', 20]);
  });

  it('shows a leading ellipsis near the end (window pads to 5 trailing pages)', () => {
    expect(getPaginationRange({ count: 20, page: 20 })).toEqual([
      1,
      'ellipsis',
      16,
      17,
      18,
      19,
      20,
    ]);
  });

  it('shows both ellipses around a middle page', () => {
    expect(getPaginationRange({ count: 20, page: 10 })).toEqual([
      1,
      'ellipsis',
      9,
      10,
      11,
      'ellipsis',
      20,
    ]);
  });

  it('collapses a single-page gap into the page number instead of an ellipsis', () => {
    // page 3 of 7: gap between boundary(1) and sibling-start(2) is one page → show "2", not "…"
    expect(getPaginationRange({ count: 7, page: 4 })).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('honours siblingCount', () => {
    expect(getPaginationRange({ count: 20, page: 10, siblingCount: 2 })).toEqual([
      1,
      'ellipsis',
      8,
      9,
      10,
      11,
      12,
      'ellipsis',
      20,
    ]);
  });
});
