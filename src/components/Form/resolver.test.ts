import { describe, it, expect } from 'vitest';
import { standardSchemaResolver } from './resolver';
import type { StandardSchemaV1 } from './resolver';

function fakeSchema(): StandardSchemaV1 {
  return {
    '~standard': {
      version: 1,
      vendor: 'fake',
      validate(value: unknown) {
        const v = value as { email?: string; age?: number };
        const issues: { message: string; path: (string | number)[] }[] = [];
        if (!v.email) issues.push({ message: 'Email required', path: ['email'] });
        if (v.age != null && v.age < 18)
          issues.push({ message: 'Must be 18+', path: ['age'] });
        return issues.length ? { issues } : { value: v };
      },
    },
  };
}

describe('standardSchemaResolver', () => {
  it('returns flat errors keyed by dotted path on failure', async () => {
    const resolve = standardSchemaResolver(fakeSchema());
    const result = await resolve({ age: 15 });
    expect(result.errors).toEqual({ email: 'Email required', age: 'Must be 18+' });
  });

  it('returns parsed values and no errors on success', async () => {
    const resolve = standardSchemaResolver(fakeSchema());
    const result = await resolve({ email: 'a@b.com', age: 20 });
    expect(result.errors).toEqual({});
    expect(result.values).toEqual({ email: 'a@b.com', age: 20 });
  });

  it('supports async validators', async () => {
    const schema: StandardSchemaV1 = {
      '~standard': {
        version: 1,
        vendor: 'fake-async',
        async validate() {
          return { issues: [{ message: 'nope', path: ['x'] }] };
        },
      },
    };
    const result = await standardSchemaResolver(schema)({});
    expect(result.errors).toEqual({ x: 'nope' });
  });
});
