type AnyRecord = Record<string, unknown>;

function toSegments(path: string): string[] {
  return path.split('.');
}

/** Read a value by dotted path. Returns undefined for any missing segment. */
export function get(obj: unknown, path: string): unknown {
  let cur: unknown = obj;
  for (const seg of toSegments(path)) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as AnyRecord)[seg];
  }
  return cur;
}

function clone(node: unknown, numericNext: boolean): AnyRecord | unknown[] {
  if (Array.isArray(node)) return node.slice();
  if (node != null && typeof node === 'object') return { ...(node as AnyRecord) };
  return numericNext ? [] : {};
}

/** Immutably set a value by dotted path; numeric segments create arrays. */
export function setIn<T>(obj: T, path: string, value: unknown): T {
  const segs = toSegments(path);
  const root = clone(obj, /^\d+$/.test(segs[0]!));
  let cur: AnyRecord | unknown[] = root;
  for (let i = 0; i < segs.length - 1; i++) {
    const seg = segs[i]!;
    const nextNumeric = /^\d+$/.test(segs[i + 1]!);
    const child = clone((cur as AnyRecord)[seg], nextNumeric);
    (cur as AnyRecord)[seg] = child;
    cur = child;
  }
  (cur as AnyRecord)[segs[segs.length - 1]!] = value;
  return root as T;
}

/** Immutably remove a value by dotted path. */
export function unsetIn<T>(obj: T, path: string): T {
  const segs = toSegments(path);
  const root = clone(obj, false);
  let cur: AnyRecord | unknown[] = root;
  for (let i = 0; i < segs.length - 1; i++) {
    const seg = segs[i]!;
    const child = (cur as AnyRecord)[seg];
    if (child == null || typeof child !== 'object') return obj;
    const cloned = clone(child, false);
    (cur as AnyRecord)[seg] = cloned;
    cur = cloned;
  }
  delete (cur as AnyRecord)[segs[segs.length - 1]!];
  return root as T;
}
