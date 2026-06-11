import { describe, it, expect, afterEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { announce } from './useAnnouncer';

afterEach(() => {
  // The lazily-created regions persist on <body>; clean them up between tests.
  document.getElementById('ku-announcer-polite')?.remove();
  document.getElementById('ku-announcer-assertive')?.remove();
});

describe('announce / useAnnouncer', () => {
  it('lazily creates one polite live region on <body> and sets the message', async () => {
    announce('3 results');
    const region = document.getElementById('ku-announcer-polite');
    expect(region).not.toBeNull();
    expect(region).toHaveAttribute('role', 'status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    await waitFor(() => expect(region).toHaveTextContent('3 results'));
  });

  it('reuses the same region instead of creating a new one each call', async () => {
    announce('first');
    announce('second');
    expect(document.querySelectorAll('#ku-announcer-polite')).toHaveLength(1);
    await waitFor(() =>
      expect(document.getElementById('ku-announcer-polite')).toHaveTextContent('second'),
    );
  });

  it('creates a separate assertive region with role=alert', async () => {
    announce('error', 'assertive');
    const region = document.getElementById('ku-announcer-assertive');
    expect(region).toHaveAttribute('role', 'alert');
    expect(region).toHaveAttribute('aria-live', 'assertive');
    await waitFor(() => expect(region).toHaveTextContent('error'));
  });

  it('clears before setting so re-announcing the same string still registers', async () => {
    announce('same');
    await waitFor(() =>
      expect(document.getElementById('ku-announcer-polite')).toHaveTextContent('same'),
    );
    announce('same');
    // Immediately after the second call the region is cleared, then re-set.
    expect(document.getElementById('ku-announcer-polite')).toHaveTextContent('');
    await waitFor(() =>
      expect(document.getElementById('ku-announcer-polite')).toHaveTextContent('same'),
    );
  });
});
