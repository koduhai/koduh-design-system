import { describe, it, expect } from 'vitest';
import { get, setIn, unsetIn } from './path';

describe('path helpers', () => {
  it('gets nested values by dotted path', () => {
    const obj = { a: { b: [{ c: 1 }] } };
    expect(get(obj, 'a.b.0.c')).toBe(1);
    expect(get(obj, 'a.b.0')).toEqual({ c: 1 });
    expect(get(obj, 'a.missing')).toBeUndefined();
    expect(get(obj, 'x.y.z')).toBeUndefined();
  });

  it('sets nested values immutably, creating arrays for numeric segments', () => {
    const obj = { a: { b: 1 } };
    const next = setIn(obj, 'a.c.0', 'x');
    expect(next).toEqual({ a: { b: 1, c: ['x'] } });
    expect(obj).toEqual({ a: { b: 1 } });
  });

  it('sets a top-level key', () => {
    expect(setIn({}, 'name', 'Ada')).toEqual({ name: 'Ada' });
  });

  it('unsets a nested value immutably', () => {
    const obj = { a: { b: 1, c: 2 } };
    const next = unsetIn(obj, 'a.b');
    expect(next).toEqual({ a: { c: 2 } });
    expect(obj).toEqual({ a: { b: 1, c: 2 } });
  });
});
