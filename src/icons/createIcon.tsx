import { forwardRef } from 'react';
import type { ReactNode, SVGProps } from 'react';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  /** Width/height in px (icons are square). Defaults to 24. */
  size?: number | string;
  /** Accessible label. When set, the icon is exposed as an image with this name. */
  title?: string;
}

/** Build a standalone icon component from raw SVG path content. */
export function createIcon(displayName: string, path: ReactNode) {
  const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
    { size = 24, title, ...props },
    ref,
  ) {
    const labelled = title != null;
    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden={labelled ? undefined : true}
        role={labelled ? 'img' : undefined}
        {...props}
      >
        {labelled ? <title>{title}</title> : null}
        {path}
      </svg>
    );
  });
  Icon.displayName = displayName;
  return Icon;
}
