import { Component, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { controlsByName } from './controls.generated';
import type { Control } from './controls.generated';
import { seeds } from './seeds';

// Interactive props playground: edit a component's props with live controls,
// watch the preview update, and copy the generated JSX. Controls are derived
// from the component's prop types; seeds supply required/initial values.

class Boundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <span style={{ color: 'var(--ku-color-danger-fg)', fontSize: 'var(--ku-font-size-sm)' }}>
          Preview error: {this.state.error.message}
        </span>
      );
    }
    return this.props.children;
  }
}

const fieldLabel: React.CSSProperties = {
  display: 'block',
  fontSize: 'var(--ku-font-size-xs)',
  color: 'var(--ku-color-text-secondary)',
  marginBottom: 'var(--ku-space-1)',
  fontFamily: 'var(--ku-font-family-mono)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 34,
  padding: '0 var(--ku-space-2)',
  borderRadius: 'var(--ku-radius-md)',
  border: '1px solid var(--ku-color-border-default)',
  background: 'var(--ku-color-bg-default)',
  color: 'var(--ku-color-text-primary)',
  font: 'inherit',
  fontSize: 'var(--ku-font-size-sm)',
};

function effectiveDefault(c: Control): unknown {
  if (c.def !== undefined) return c.def;
  if (c.kind === 'enum') return c.options[0];
  if (c.kind === 'boolean') return false;
  return undefined;
}

function genCode(
  name: string,
  controls: Control[],
  values: Record<string, unknown>,
  seedProps: Record<string, unknown> | undefined,
  childrenVal: string | undefined,
  overlay: boolean,
): string {
  const attrs: string[] = [];
  const seen = new Set<string>();

  // Overlays are driven by managed open state, shown as JSX expressions.
  if (overlay) {
    attrs.push('open={open}', 'onOpenChange={setOpen}');
    seen.add('open');
    seen.add('onOpenChange');
  }

  for (const c of controls) {
    if (seen.has(c.name)) continue;
    seen.add(c.name);
    const v = values[c.name];
    const d = effectiveDefault(c);
    if (v === undefined || v === '') continue;
    if (c.kind === 'boolean') {
      if (v === true && d !== true) attrs.push(c.name);
      else if (v === false && d === true) attrs.push(`${c.name}={false}`);
      else if (c.required) attrs.push(v ? c.name : `${c.name}={false}`);
      continue;
    }
    // Skip props left at their default — unless required, where the snippet must
    // stay copy-paste compilable.
    if (!c.required && String(v) === String(d)) continue;
    if (c.kind === 'number') attrs.push(`${c.name}={${v}}`);
    else attrs.push(`${c.name}=${JSON.stringify(String(v))}`);
  }

  // Required/seeded props that have no live control, so the snippet stays
  // representative. Complex values (data arrays, render fns, elements) are shown
  // as an identifier placeholder rather than stringified.
  for (const [k, val] of Object.entries(seedProps ?? {})) {
    if (seen.has(k) || val === undefined || k === 'children') continue;
    if (typeof val === 'boolean') {
      if (val) attrs.push(k);
    } else if (typeof val === 'number') attrs.push(`${k}={${val}}`);
    else if (typeof val === 'string') attrs.push(`${k}=${JSON.stringify(val)}`);
    else attrs.push(`${k}={${k}}`);
  }

  const oneLine = attrs.length ? ' ' + attrs.join(' ') : '';
  const multi = attrs.length > 0 && oneLine.length > 56;
  const open = multi ? `<${name}\n  ${attrs.join('\n  ')}\n` : `<${name}${oneLine}`;
  const kids = childrenVal ?? '';
  return kids ? `${open}${multi ? '' : ''}>${kids}</${name}>` : `${open}${multi ? '' : ' '}/>`;
}

export default function Playground({ name }: { name: string }) {
  const seed = seeds[name];
  const controls = useMemo(() => controlsByName[name] ?? [], [name]);

  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    for (const c of controls) {
      init[c.name] = seed?.props?.[c.name] ?? effectiveDefault(c) ?? '';
    }
    return init;
  });
  const hasChildren = seed?.children !== undefined;
  const [childrenVal, setChildrenVal] = useState(seed?.children ?? '');
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Overlay components (those with an `open` prop) get a trigger + managed open.
  const overlay = controls.some((c) => c.name === 'open');
  const [open, setOpen] = useState(false);

  if (!seed) return null;

  const set = (k: string, v: unknown) => setValues((prev) => ({ ...prev, [k]: v }));

  // Props passed to the preview: seeded props, overridden by live control values.
  const previewProps: Record<string, unknown> = { ...seed.props };
  for (const [k, v] of Object.entries(values)) {
    if (v !== undefined) previewProps[k] = v;
  }
  // Make the actual control interactive in the preview where it's a controlled input.
  if (controls.some((c) => c.name === 'checked')) {
    previewProps.onChange = (checked: boolean) => set('checked', checked);
  } else if (controls.some((c) => c.name === 'value')) {
    previewProps.onChange = (v: unknown) =>
      set('value', typeof v === 'object' && v && 'target' in v ? (v as any).target.value : v);
  }
  if (overlay) {
    previewProps.open = open;
    previewProps.onOpenChange = setOpen;
  }
  const visibleControls = controls.filter((c) => c.name !== 'open');

  const Comp = seed.Component;
  const code = genCode(
    name,
    controls,
    values,
    seed.props,
    hasChildren ? childrenVal : undefined,
    overlay,
  );

  const copy = () => {
    try {
      navigator.clipboard?.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked; no-op */
    }
  };

  return (
    <div
      style={{
        border: '1px solid var(--ku-color-border-default)',
        borderRadius: 'var(--ku-radius-lg)',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px' }}>
        {/* Live preview */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 160,
            padding: 'var(--ku-space-8)',
            background: 'var(--ku-color-bg-subtle)',
          }}
        >
          {mounted ? (
            <Boundary>
              {overlay ? (
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  style={{
                    height: 36,
                    padding: '0 var(--ku-space-4)',
                    borderRadius: 'var(--ku-radius-md)',
                    border: '1px solid var(--ku-color-border-default)',
                    background: 'var(--ku-color-bg-default)',
                    color: 'var(--ku-color-text-primary)',
                    font: 'inherit',
                    fontSize: 'var(--ku-font-size-sm)',
                    cursor: 'pointer',
                  }}
                >
                  Open {name}
                </button>
              ) : null}
              {hasChildren ? (
                <Comp {...previewProps}>{childrenVal}</Comp>
              ) : (
                <Comp {...previewProps} />
              )}
            </Boundary>
          ) : null}
        </div>

        {/* Controls */}
        <div
          style={{
            borderLeft: '1px solid var(--ku-color-border-default)',
            padding: 'var(--ku-space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--ku-space-3)',
            maxHeight: 360,
            overflowY: 'auto',
          }}
        >
          {hasChildren ? (
            <label>
              <span style={fieldLabel}>children</span>
              <input
                style={inputStyle}
                value={childrenVal}
                onChange={(e) => setChildrenVal(e.target.value)}
              />
            </label>
          ) : null}

          {visibleControls.map((c) => (
            <label key={c.name}>
              <span style={fieldLabel}>{c.name}</span>
              {c.kind === 'enum' ? (
                <select
                  style={inputStyle}
                  value={String(values[c.name] ?? '')}
                  onChange={(e) => set(c.name, e.target.value)}
                >
                  {c.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : c.kind === 'boolean' ? (
                <input
                  type="checkbox"
                  checked={!!values[c.name]}
                  onChange={(e) => set(c.name, e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--ku-brand-500)' }}
                />
              ) : c.kind === 'number' ? (
                <input
                  type="number"
                  style={inputStyle}
                  value={values[c.name] === undefined ? '' : String(values[c.name])}
                  onChange={(e) =>
                    set(c.name, e.target.value === '' ? undefined : Number(e.target.value))
                  }
                />
              ) : (
                <input
                  style={inputStyle}
                  value={String(values[c.name] ?? '')}
                  onChange={(e) => set(c.name, e.target.value)}
                />
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Generated code */}
      <div
        style={{
          borderTop: '1px solid var(--ku-color-border-default)',
          position: 'relative',
        }}
      >
        <button
          type="button"
          onClick={copy}
          style={{
            position: 'absolute',
            top: 'var(--ku-space-2)',
            right: 'var(--ku-space-2)',
            height: 28,
            padding: '0 var(--ku-space-3)',
            borderRadius: 'var(--ku-radius-md)',
            border: '1px solid var(--ku-color-border-default)',
            background: 'var(--ku-color-bg-default)',
            color: 'var(--ku-color-text-primary)',
            font: 'inherit',
            fontSize: 'var(--ku-font-size-xs)',
            cursor: 'pointer',
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
        <pre
          style={{
            margin: 0,
            padding: 'var(--ku-space-4)',
            overflowX: 'auto',
            fontFamily: 'var(--ku-font-family-mono)',
            fontSize: 'var(--ku-font-size-sm)',
            lineHeight: 'var(--ku-line-height-relaxed)',
            color: 'var(--ku-color-text-primary)',
          }}
        >
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
