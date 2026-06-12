import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useForm } from './useForm';

describe('useForm', () => {
  it('seeds values from defaultValues and tracks dirty', () => {
    const { result } = renderHook(() => useForm({ defaultValues: { name: 'Ada' } }));
    expect(result.current.getFieldState('name').value).toBe('Ada');
    expect(result.current.getFieldState('name').dirty).toBe(false);
    act(() => result.current.setValue('name', 'Grace'));
    expect(result.current.getFieldState('name').value).toBe('Grace');
    expect(result.current.getFieldState('name').dirty).toBe(true);
  });

  it('getFieldState returns a stable reference when unchanged', () => {
    const { result } = renderHook(() => useForm({ defaultValues: { a: 1 } }));
    const first = result.current.getFieldState('a');
    expect(result.current.getFieldState('a')).toBe(first);
    act(() => result.current.setValue('a', 2));
    expect(result.current.getFieldState('a')).not.toBe(first);
  });

  it('marks touched on setTouched', () => {
    const { result } = renderHook(() => useForm());
    act(() => result.current.setTouched('email'));
    expect(result.current.getFieldState('email').touched).toBe(true);
  });

  it('reset restores default values and clears errors/touched', () => {
    const { result } = renderHook(() => useForm({ defaultValues: { a: 1 } }));
    act(() => {
      result.current.setValue('a', 9);
      result.current.setError('a', 'bad');
      result.current.setTouched('a');
    });
    act(() => result.current.reset());
    expect(result.current.getFieldState('a').value).toBe(1);
    expect(result.current.getFieldState('a').error).toBeUndefined();
    expect(result.current.getFieldState('a').touched).toBe(false);
  });

  it('reset(values) loads given values and clears stale errors/touched/dirty', () => {
    const { result } = renderHook(() => useForm({ defaultValues: { a: 1, b: 2 } }));
    act(() => {
      result.current.setValue('a', 9);
      result.current.setError('a', 'stale');
      result.current.setTouched('a');
    });
    expect(result.current.getFieldState('a').error).toBe('stale');

    act(() => result.current.reset({ a: 10, b: 20 }));
    // Adopts the passed object as the new defaults: values load, dirty is false.
    expect(result.current.getFieldState('a').value).toBe(10);
    expect(result.current.getFieldState('b').value).toBe(20);
    expect(result.current.getFieldState('a').error).toBeUndefined();
    expect(result.current.getFieldState('a').touched).toBe(false);
    expect(result.current.getFieldState('a').dirty).toBe(false);

    // Calling reset() with no args now restores the loaded values, not the originals.
    act(() => result.current.setValue('a', 99));
    act(() => result.current.reset());
    expect(result.current.getFieldState('a').value).toBe(10);
  });

  it('setValues bulk-patches many fields (load server values) in one pass', () => {
    const { result } = renderHook(() =>
      useForm({ defaultValues: { name: '', email: '', role: 'guest' } }),
    );
    act(() => result.current.setValues({ name: 'Ada', email: 'ada@x.dev' }));
    expect(result.current.getFieldState('name').value).toBe('Ada');
    expect(result.current.getFieldState('email').value).toBe('ada@x.dev');
    // Untouched key keeps its default.
    expect(result.current.getFieldState('role').value).toBe('guest');
    // Patched keys that differ from their default are dirty.
    expect(result.current.getFieldState('name').dirty).toBe(true);
    expect(result.current.getFieldState('email').dirty).toBe(true);
    expect(result.current.getFieldState('role').dirty).toBe(false);
  });

  it('setValues marks a key dirty=false when the patched value equals its default', () => {
    const { result } = renderHook(() => useForm({ defaultValues: { a: 1, b: 2 } }));
    act(() => result.current.setValue('a', 5)); // make a dirty first
    expect(result.current.getFieldState('a').dirty).toBe(true);
    act(() => result.current.setValues({ a: 1 })); // patch back to default
    expect(result.current.getFieldState('a').value).toBe(1);
    expect(result.current.getFieldState('a').dirty).toBe(false);
  });

  it('setValues makes a single synchronous state update and triggers onChange validation', async () => {
    const resolver = vi.fn(async (v: Record<string, unknown>) => ({
      values: v,
      errors: (v.a ? {} : { a: 'required' }) as Record<string, string>,
    }));
    const { result } = renderHook(() => useForm({ mode: 'onChange', resolver }));
    const listener = vi.fn();
    act(() => {
      result.current.subscribe(listener);
    });
    // The bulk patch is one synchronous emit (not one per key), even for two keys.
    act(() => result.current.setValues({ a: '', b: 'x' }));
    expect(listener).toHaveBeenCalledTimes(1);
    // The async validation pass emits separately once it resolves.
    await waitFor(() => expect(result.current.getFieldState('a').error).toBe('required'));
  });

  it('handleSubmit calls onValid with values when valid', async () => {
    const onValid = vi.fn();
    const { result } = renderHook(() => useForm({ defaultValues: { name: 'Ada' } }));
    await act(async () => {
      await result.current.handleSubmit(onValid)({ preventDefault: () => {} });
    });
    expect(onValid).toHaveBeenCalledWith({ name: 'Ada' });
  });

  it('handleSubmit runs resolver, surfaces errors, calls onInvalid, skips onValid', async () => {
    const onValid = vi.fn();
    const onInvalid = vi.fn();
    const resolver = vi.fn(async (values: Record<string, unknown>) => ({
      values,
      errors: (values.name ? {} : { name: 'Required' }) as Record<string, string>,
    }));
    const { result } = renderHook(() => useForm({ resolver }));
    await act(async () => {
      await result.current.handleSubmit(onValid, onInvalid)();
    });
    expect(onValid).not.toHaveBeenCalled();
    expect(onInvalid).toHaveBeenCalledWith({ name: 'Required' });
    expect(result.current.getFieldState('name').error).toBe('Required');
    expect(result.current.getFieldState('name').touched).toBe(true);
  });

  it('field-level required rule produces an error on submit', async () => {
    const { result } = renderHook(() => useForm());
    act(() => result.current.register('email', { required: 'Email please' }));
    await act(async () => {
      await result.current.handleSubmit(vi.fn())();
    });
    expect(result.current.getFieldState('email').error).toBe('Email please');
  });

  it('resolver error wins over a field-level error on the same field', async () => {
    const resolver = vi.fn(async (v: Record<string, unknown>) => ({
      values: v,
      errors: { a: 'from resolver' },
    }));
    const { result } = renderHook(() => useForm({ resolver }));
    act(() => result.current.register('a', { validate: () => 'from field' }));
    await act(async () => {
      await result.current.handleSubmit(vi.fn())();
    });
    expect(result.current.getFieldState('a').error).toBe('from resolver');
  });

  it('mode onChange validates on each setValue', async () => {
    const resolver = vi.fn(async (v: Record<string, unknown>) => ({
      values: v,
      errors: ((v.a as number) > 0 ? {} : { a: 'positive' }) as Record<string, string>,
    }));
    const { result } = renderHook(() => useForm({ mode: 'onChange', resolver }));
    await act(async () => {
      result.current.setValue('a', -1);
    });
    await waitFor(() => expect(result.current.getFieldState('a').error).toBe('positive'));
  });

  it('reset clears the field-state identity cache (no stale reference)', () => {
    const { result } = renderHook(() => useForm({ defaultValues: { a: 1 } }));
    act(() => {
      result.current.setValue('a', 1); // dirty with same-as-default value
      result.current.setError('a', 'oops');
    });
    const before = result.current.getFieldState('a');
    act(() => result.current.reset());
    const after = result.current.getFieldState('a');
    expect(after).not.toBe(before); // fresh object, not stale cache
    expect(after.error).toBeUndefined();
    expect(after.value).toBe(1);
  });

  it('unregister clears the field error/touched/dirty so no stale state remains', () => {
    const { result } = renderHook(() => useForm({ defaultValues: { a: 1 } }));
    act(() => {
      result.current.register('a');
      result.current.setValue('a', 2); // dirty
      result.current.setError('a', 'bad');
      result.current.setTouched('a');
    });
    expect(result.current.getFieldState('a').error).toBe('bad');
    expect(result.current.getFieldState('a').touched).toBe(true);
    expect(result.current.getFieldState('a').dirty).toBe(true);

    act(() => result.current.unregister('a'));
    const after = result.current.getFieldState('a');
    expect(after.error).toBeUndefined();
    expect(after.touched).toBe(false);
    expect(after.dirty).toBe(false);
    // Value is intentionally retained across unregister.
    expect(after.value).toBe(2);
  });

  it('handleSubmit ignores a concurrent submit while already submitting', async () => {
    let resolve!: () => void;
    const onValid = vi.fn(
      () =>
        new Promise<void>((r) => {
          resolve = () => r();
        }),
    );
    const { result } = renderHook(() => useForm({ defaultValues: { a: 1 } }));
    const submit = result.current.handleSubmit(onValid);
    await act(async () => {
      void submit(); // first submit — hangs in onValid
      await Promise.resolve();
      void submit(); // second submit — should be ignored
      await Promise.resolve();
      resolve(); // let the first finish
    });
    expect(onValid).toHaveBeenCalledTimes(1);
  });

  it('handleSubmit passes a stable values snapshot taken before the async onValid', async () => {
    let resolve!: () => void;
    let seenAtResolve: unknown;
    const onValid = vi.fn(
      (values: Record<string, unknown>) =>
        new Promise<void>((r) => {
          resolve = () => {
            // Read the captured argument at the moment the handler completes; it
            // must reflect the pre-await snapshot, not later edits.
            seenAtResolve = values.a;
            r();
          };
        }),
    );
    const { result } = renderHook(() => useForm({ defaultValues: { a: 1 } }));
    await act(async () => {
      void result.current.handleSubmit(onValid)({ preventDefault: () => {} });
      await Promise.resolve();
      // Edit a field while the submit is in flight.
      result.current.setValue('a', 999);
      await Promise.resolve();
      resolve();
    });
    expect(onValid).toHaveBeenCalledWith({ a: 1 });
    expect(seenAtResolve).toBe(1);
  });
});
