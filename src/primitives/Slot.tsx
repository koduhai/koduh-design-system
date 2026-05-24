import { Children, cloneElement, forwardRef, isValidElement } from 'react';
import type { HTMLAttributes, ReactElement, Ref } from 'react';
import { mergeRefs } from './mergeRefs';
import { composeEventHandlers } from './composeEventHandlers';

export type SlotProps = HTMLAttributes<HTMLElement>;

type AnyProps = Record<string, unknown>;

function mergeProps(slotProps: AnyProps, childProps: AnyProps): AnyProps {
  const merged: AnyProps = { ...slotProps, ...childProps };

  for (const key of Object.keys(slotProps)) {
    const slotValue = slotProps[key];
    const childValue = childProps[key];
    const isHandler = /^on[A-Z]/.test(key);

    if (isHandler && typeof slotValue === 'function') {
      merged[key] = composeEventHandlers(
        childValue as ((event: unknown) => void) | undefined,
        slotValue as (event: unknown) => void,
      );
    } else if (key === 'className') {
      merged[key] = [slotValue, childValue].filter(Boolean).join(' ');
    } else if (key === 'style') {
      merged[key] = { ...(slotValue as object), ...(childValue as object) };
    }
  }

  return merged;
}

/**
 * Renders its single child, merging the slot's props/className/handlers/ref onto it.
 * Enables the `asChild` pattern: a component delegates rendering to a consumer element
 * (e.g. an `<a>` or router `<Link>`) without an `as`/`component` prop.
 */
export const Slot = forwardRef<HTMLElement, SlotProps & { children?: React.ReactNode }>(
  function Slot({ children, ...slotProps }, forwardedRef) {
    if (!isValidElement(children)) {
      return null;
    }
    const child = Children.only(children) as ReactElement<AnyProps> & { ref?: Ref<HTMLElement> };
    // React 19 removed `element.ref`; `ref` is now a regular prop on `child.props`.
    // Prefer the React 19 location, fall back to the legacy React 18 `child.ref`.
    const childRef =
      (child.props as { ref?: Ref<HTMLElement> }).ref ?? (child as { ref?: Ref<HTMLElement> }).ref;

    // mergeProps spreads child.props, which under React 19 carries `ref`. Drop any
    // stray `ref` from the merged props so cloneElement gets a single, merged ref.
    const { ref: _ignoredRef, ...mergedProps } = mergeProps(
      slotProps as AnyProps,
      child.props,
    ) as AnyProps & { ref?: Ref<HTMLElement> };
    void _ignoredRef;

    return cloneElement(child, {
      ...mergedProps,
      ref: forwardedRef ? mergeRefs(forwardedRef, childRef) : childRef,
    } as AnyProps);
  },
);
