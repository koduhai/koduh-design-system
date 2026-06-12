import { describe, it, expect, vi } from 'vitest';
import { composeEventHandlers } from './composeEventHandlers';

describe('composeEventHandlers', () => {
  it('calls the consumer handler then the internal handler', () => {
    const order: string[] = [];
    const theirs = () => order.push('theirs');
    const ours = () => order.push('ours');
    const handler = composeEventHandlers(theirs, ours);

    handler({ defaultPrevented: false } as Event);

    expect(order).toEqual(['theirs', 'ours']);
  });

  it('skips the internal handler when the consumer prevents default', () => {
    const ours = vi.fn();
    const handler = composeEventHandlers(() => {}, ours);

    handler({ defaultPrevented: true } as Event);

    expect(ours).not.toHaveBeenCalled();
  });
});
