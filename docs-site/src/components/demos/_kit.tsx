// Shared building blocks for component demo islands. Demos compose these so the
// preview surfaces look consistent and match the docs chrome (.doc-example).
import type { ReactNode, CSSProperties } from 'react';

export const row: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--ku-space-3)',
  alignItems: 'center',
};

export const col: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--ku-space-3)',
};

/** One bordered preview block with an optional caption. */
export function DemoBlock({ caption, children }: { caption?: string; children: ReactNode }) {
  return (
    <div className="doc-example">
      <div className="doc-example-preview">{children}</div>
      {caption ? <p className="doc-example-caption">{caption}</p> : null}
    </div>
  );
}

/** Vertical stack of demo blocks. */
export function Demos({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ku-space-5)' }}>
      {children}
    </div>
  );
}
