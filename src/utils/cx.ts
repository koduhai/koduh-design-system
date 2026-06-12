/** Join class name parts, dropping falsy values. Zero-dependency clsx-lite. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
