import { forwardRef, useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from 'react';
import { useControllableState, useId, VisuallyHidden } from '../../primitives';
import { cx } from '../../utils/cx';
import { useOptionalFieldContext } from '../FormField';
import { parseHex, toHex, rgbToHsv, hsvToRgb } from './color';
import type { HSV } from './color';
import styles from './ColorPicker.module.css';

export interface ColorPickerProps {
  /** Controlled hex value (#RGB / #RRGGBB / #RRGGBBAA). */
  value?: string;
  /** Initial value when uncontrolled. Defaults to '#1B5FCC'. */
  defaultValue?: string;
  /** Fires with the new hex string whenever the color changes. */
  onChange?: (hex: string) => void;
  /** Enable the alpha channel + slider, and #RRGGBBAA output. Default false. */
  alpha?: boolean;
  /** Preset swatch row. A small DS palette is used when omitted. */
  swatches?: string[];
  disabled?: boolean;
  /** Visible label; deferred to an enclosing `<FormField>` when present. */
  label?: ReactNode;
  id?: string;
  className?: string;
}

const DEFAULT_SWATCHES = [
  '#1B5FCC',
  '#1B7F3B',
  '#9A6700',
  '#C62828',
  '#7C3AED',
  '#0E7490',
  '#10141F',
  '#FFFFFF',
];

const DEFAULT_VALUE = '#1B5FCC';

/** Serialize HSV(A) to a hex string, including alpha only when enabled and < 1. */
function hsvToHex(hsv: HSV, withAlpha: boolean): string {
  const rgb = hsvToRgb(hsv);
  return toHex({ ...rgb, a: withAlpha ? hsv.a : 1 });
}

export const ColorPicker = /* @__PURE__ */ forwardRef<HTMLDivElement, ColorPickerProps>(
  function ColorPicker(
    {
      value,
      defaultValue = DEFAULT_VALUE,
      onChange,
      alpha = false,
      swatches = DEFAULT_SWATCHES,
      disabled = false,
      label,
      id: idProp,
      className,
    },
    ref,
  ) {
    const reactId = useId('colorpicker');
    const field = useOptionalFieldContext();
    const id = field?.id ?? idProp ?? reactId;
    const hexInputId = `${id}-hex`;
    const ownLabelId = `${id}-label`;
    const showOwnLabel = !field && label != null;
    // The ColorPicker is a composite control, so it can't be targeted by a
    // <label htmlFor>. Associate the visible label (own, or the FormField's)
    // through the group's aria-labelledby instead.
    const labelId = field ? field.labelId : showOwnLabel ? ownLabelId : undefined;
    const describedBy = field ? field.describedById : undefined;

    // Bind to an enclosing <Form> only when not explicitly controlled.
    const bound = value === undefined ? field?.binding : undefined;

    const [internalHex, setInternalHex] = useControllableState<string>({
      value,
      defaultValue,
    });
    // bound.value is typed `unknown` at the Form-binding boundary; narrow it to a
    // string rather than casting, so a non-string form value falls back to the
    // default instead of feeding a bad value to parseHex/the hex input.
    const boundHex = bound && typeof bound.value === 'string' ? bound.value : undefined;
    const currentHex = bound ? (boundHex ?? defaultValue) : internalHex;

    // Keep an HSV working buffer so dragging the SV square / hue stays smooth
    // (parsing back from the rounded hex on every move would jitter the hue at
    // low saturation). Re-derive from the external hex only when it actually
    // changes from outside.
    const [hsv, setHsv] = useState<HSV>(() => {
      const parsed = parseHex(currentHex) ?? parseHex(DEFAULT_VALUE)!;
      return rgbToHsv(parsed);
    });
    const lastHexRef = useRef(currentHex);
    useEffect(() => {
      if (currentHex !== lastHexRef.current) {
        const parsed = parseHex(currentHex);
        if (parsed) {
          lastHexRef.current = currentHex;
          setHsv(rgbToHsv(parsed));
        }
      }
    }, [currentHex]);

    const [hexDraft, setHexDraft] = useState(currentHex);
    const lastDraftSyncRef = useRef(currentHex);
    useEffect(() => {
      if (currentHex !== lastDraftSyncRef.current) {
        lastDraftSyncRef.current = currentHex;
        setHexDraft(currentHex);
      }
    }, [currentHex]);

    const commit = (next: HSV) => {
      setHsv(next);
      const hex = hsvToHex(next, alpha);
      lastHexRef.current = hex;
      lastDraftSyncRef.current = hex;
      setHexDraft(hex);
      if (bound) bound.onChange(hex);
      else setInternalHex(hex);
      onChange?.(hex);
    };

    const commitHex = (hex: string) => {
      lastHexRef.current = hex;
      lastDraftSyncRef.current = hex;
      setHexDraft(hex);
      if (bound) bound.onChange(hex);
      else setInternalHex(hex);
      onChange?.(hex);
    };

    const currentDisplayHex = hsvToHex(hsv, alpha);

    // ---- SV square (saturation = x, value/brightness = 1 - y) ----
    const svRef = useRef<HTMLDivElement>(null);
    const svDraggingRef = useRef(false);

    const setSvFromPointer = (clientX: number, clientY: number) => {
      const rect = svRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) return;
      const s = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const v = Math.min(1, Math.max(0, 1 - (clientY - rect.top) / rect.height));
      commit({ ...hsv, s, v });
    };

    const onSvPointerDown = (e: PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.preventDefault();
      svDraggingRef.current = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* unsupported (jsdom) */
      }
      svRef.current?.focus();
      setSvFromPointer(e.clientX, e.clientY);
    };
    const onSvPointerMove = (e: PointerEvent<HTMLDivElement>) => {
      if (!svDraggingRef.current) return;
      setSvFromPointer(e.clientX, e.clientY);
    };
    const endSvDrag = (e: PointerEvent<HTMLDivElement>) => {
      if (!svDraggingRef.current) return;
      svDraggingRef.current = false;
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        /* unsupported (jsdom) */
      }
    };
    const onSvKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      const stepS = 0.02;
      const stepV = 0.02;
      let { s, v } = hsv;
      switch (e.key) {
        case 'ArrowRight':
          s += stepS;
          break;
        case 'ArrowLeft':
          s -= stepS;
          break;
        case 'ArrowUp':
          v += stepV;
          break;
        case 'ArrowDown':
          v -= stepV;
          break;
        default:
          return;
      }
      e.preventDefault();
      commit({ ...hsv, s: Math.min(1, Math.max(0, s)), v: Math.min(1, Math.max(0, v)) });
    };

    // ---- Hue slider (0..360) ----
    const hueRef = useRef<HTMLDivElement>(null);
    const hueDraggingRef = useRef(false);
    const isRtl = (el: HTMLElement | null) =>
      typeof window !== 'undefined' && el ? getComputedStyle(el).direction === 'rtl' : false;

    const setHueFromPointer = (clientX: number) => {
      const rect = hueRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return;
      const fraction = isRtl(hueRef.current)
        ? (rect.right - clientX) / rect.width
        : (clientX - rect.left) / rect.width;
      const h = Math.min(360, Math.max(0, fraction * 360));
      commit({ ...hsv, h });
    };
    const onHuePointerDown = (e: PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.preventDefault();
      hueDraggingRef.current = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* unsupported (jsdom) */
      }
      setHueFromPointer(e.clientX);
    };
    const onHuePointerMove = (e: PointerEvent<HTMLDivElement>) => {
      if (!hueDraggingRef.current) return;
      setHueFromPointer(e.clientX);
    };
    const endHueDrag = (e: PointerEvent<HTMLDivElement>) => {
      if (!hueDraggingRef.current) return;
      hueDraggingRef.current = false;
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        /* unsupported (jsdom) */
      }
    };
    const onHueKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      const rtl = isRtl(hueRef.current);
      let h = hsv.h;
      switch (e.key) {
        case 'ArrowRight':
          h += rtl ? -1 : 1;
          break;
        case 'ArrowLeft':
          h += rtl ? 1 : -1;
          break;
        case 'ArrowUp':
          h += 1;
          break;
        case 'ArrowDown':
          h -= 1;
          break;
        case 'Home':
          h = 0;
          break;
        case 'End':
          h = 360;
          break;
        default:
          return;
      }
      e.preventDefault();
      commit({ ...hsv, h: Math.min(360, Math.max(0, h)) });
    };

    // ---- Alpha slider (0..1) ----
    const alphaRef = useRef<HTMLDivElement>(null);
    const alphaDraggingRef = useRef(false);
    const setAlphaFromPointer = (clientX: number) => {
      const rect = alphaRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return;
      const fraction = isRtl(alphaRef.current)
        ? (rect.right - clientX) / rect.width
        : (clientX - rect.left) / rect.width;
      commit({ ...hsv, a: Math.min(1, Math.max(0, fraction)) });
    };
    const onAlphaPointerDown = (e: PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.preventDefault();
      alphaDraggingRef.current = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* unsupported (jsdom) */
      }
      setAlphaFromPointer(e.clientX);
    };
    const onAlphaPointerMove = (e: PointerEvent<HTMLDivElement>) => {
      if (!alphaDraggingRef.current) return;
      setAlphaFromPointer(e.clientX);
    };
    const endAlphaDrag = (e: PointerEvent<HTMLDivElement>) => {
      if (!alphaDraggingRef.current) return;
      alphaDraggingRef.current = false;
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        /* unsupported (jsdom) */
      }
    };
    const onAlphaKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      const rtl = isRtl(alphaRef.current);
      const step = 0.01;
      let a = hsv.a;
      switch (e.key) {
        case 'ArrowRight':
          a += rtl ? -step : step;
          break;
        case 'ArrowLeft':
          a += rtl ? step : -step;
          break;
        case 'ArrowUp':
          a += step;
          break;
        case 'ArrowDown':
          a -= step;
          break;
        case 'Home':
          a = 0;
          break;
        case 'End':
          a = 1;
          break;
        default:
          return;
      }
      e.preventDefault();
      commit({ ...hsv, a: Math.min(1, Math.max(0, a)) });
    };

    // The pure-hue color for the SV-square background and slider thumbs.
    const hueHex = toHex(hsvToRgb({ h: hsv.h, s: 1, v: 1, a: 1 }));
    const solidCurrent = toHex({ ...hsvToRgb(hsv), a: 1 });
    const alphaPct = Math.round(hsv.a * 100);
    // The SV square is a 2D control; surface both axes for assistive tech.
    const satPct = Math.round(hsv.s * 100);
    const valPct = Math.round(hsv.v * 100);

    const rootStyle = {
      ['--cp-hue']: hueHex,
      ['--cp-color']: solidCurrent,
      ['--cp-sv-x']: `${hsv.s * 100}%`,
      ['--cp-sv-y']: `${(1 - hsv.v) * 100}%`,
      ['--cp-hue-pos']: `${(hsv.h / 360) * 100}%`,
      ['--cp-alpha-pos']: `${hsv.a * 100}%`,
      ['--cp-alpha']: String(hsv.a),
    } as CSSProperties;

    return (
      <div
        ref={ref}
        id={id}
        className={cx(styles.root, className)}
        role="group"
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        // No aria-invalid / aria-required on role="group" (axe aria-allowed-attr
        // forbids them there). The error/help text is conveyed via aria-describedby
        // and the FormField label carries the required asterisk.
        data-disabled={disabled ? 'true' : undefined}
        style={rootStyle}
      >
        {showOwnLabel ? (
          <span id={ownLabelId} className={styles.label}>
            {label}
          </span>
        ) : null}

        {/* Saturation / brightness square */}
        <div
          ref={svRef}
          className={styles.sv}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-label="Saturation and brightness"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={valPct}
          aria-valuetext={`${satPct}% saturation, ${valPct}% brightness, ${currentDisplayHex}`}
          aria-disabled={disabled || undefined}
          onPointerDown={onSvPointerDown}
          onPointerMove={onSvPointerMove}
          onPointerUp={endSvDrag}
          onPointerCancel={endSvDrag}
          onKeyDown={disabled ? undefined : onSvKeyDown}
        >
          <div className={styles.svHandle} aria-hidden />
        </div>

        {/* Hue slider */}
        <div
          ref={hueRef}
          className={styles.hue}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-label="Hue"
          aria-valuemin={0}
          aria-valuemax={360}
          aria-valuenow={Math.round(hsv.h)}
          aria-valuetext={`${Math.round(hsv.h)} degrees`}
          aria-disabled={disabled || undefined}
          onPointerDown={onHuePointerDown}
          onPointerMove={onHuePointerMove}
          onPointerUp={endHueDrag}
          onPointerCancel={endHueDrag}
          onKeyDown={disabled ? undefined : onHueKeyDown}
        >
          <div className={cx(styles.barHandle, styles.hueHandle)} aria-hidden />
        </div>

        {/* Alpha slider */}
        {alpha ? (
          <div
            ref={alphaRef}
            className={styles.alpha}
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label="Alpha"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={alphaPct}
            aria-valuetext={`${alphaPct}%`}
            aria-disabled={disabled || undefined}
            onPointerDown={onAlphaPointerDown}
            onPointerMove={onAlphaPointerMove}
            onPointerUp={endAlphaDrag}
            onPointerCancel={endAlphaDrag}
            onKeyDown={disabled ? undefined : onAlphaKeyDown}
          >
            <div className={styles.alphaTrack} aria-hidden>
              <div className={styles.barHandle} />
            </div>
          </div>
        ) : null}

        {/* Preview + hex input row */}
        <div className={styles.controls}>
          <span className={styles.preview} aria-hidden style={{ background: currentDisplayHex }} />
          <div className={styles.hexField}>
            <label htmlFor={hexInputId} className={styles.hexLabel}>
              Hex
            </label>
            <input
              id={hexInputId}
              className={styles.hexInput}
              type="text"
              spellCheck={false}
              autoComplete="off"
              disabled={disabled}
              aria-label={label == null ? 'Hex' : undefined}
              value={hexDraft}
              onChange={(e) => setHexDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  (e.target as HTMLInputElement).blur();
                }
              }}
              onBlur={() => {
                const parsed = parseHex(hexDraft);
                if (parsed) {
                  const next = toHex({ ...parsed, a: alpha ? parsed.a : 1 });
                  setHsv(rgbToHsv(parsed));
                  commitHex(next);
                } else {
                  // invalid → revert to current
                  setHexDraft(currentDisplayHex);
                }
              }}
            />
          </div>
          {/*
            Static (non-live) hex readout. Each slider's aria-valuetext already
            announces the value on focus/change, so a polite live region here only
            floods AT with a fresh full-hex announcement on every drag tick. Keep
            the text as on-demand context instead of an aria-live region.
          */}
          <VisuallyHidden>Selected color {currentDisplayHex}</VisuallyHidden>
        </div>

        {/* Swatch row */}
        {swatches.length > 0 ? (
          <div className={styles.swatches} role="group" aria-label="Color presets">
            {swatches.map((sw) => {
              const selected = sw.toUpperCase() === currentDisplayHex.toUpperCase();
              return (
                <button
                  key={sw}
                  type="button"
                  className={styles.swatch}
                  style={{ background: sw }}
                  aria-label={sw}
                  aria-pressed={selected}
                  disabled={disabled}
                  onClick={() => {
                    const parsed = parseHex(sw);
                    if (!parsed) return;
                    const next = toHex({ ...parsed, a: alpha ? parsed.a : 1 });
                    setHsv(rgbToHsv(parsed));
                    commitHex(next);
                  }}
                />
              );
            })}
          </div>
        ) : null}
      </div>
    );
  },
);
