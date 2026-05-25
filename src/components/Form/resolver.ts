export type FormValues = Record<string, unknown>;
export type FormErrors = Record<string, string>;

export interface ResolverResult {
  values: FormValues;
  errors: FormErrors;
}

/** Schema-level validation: values in, parsed values + flat errors out. Sync or async. */
export type Resolver = (values: FormValues) => ResolverResult | Promise<ResolverResult>;

/** Minimal slice of the Standard Schema v1 interface we depend on. */
export interface StandardSchemaV1 {
  '~standard': {
    version: 1;
    vendor: string;
    validate: (value: unknown) =>
      | { value: unknown; issues?: undefined }
      | { issues: ReadonlyArray<{ message: string; path?: ReadonlyArray<string | number | { key: string | number }> }> }
      | Promise<
          | { value: unknown; issues?: undefined }
          | { issues: ReadonlyArray<{ message: string; path?: ReadonlyArray<string | number | { key: string | number }> }> }
        >;
  };
}

function pathToKey(path: ReadonlyArray<string | number | { key: string | number }> | undefined): string {
  if (!path || path.length === 0) return '';
  return path
    .map((seg) => (typeof seg === 'object' ? String(seg.key) : String(seg)))
    .join('.');
}

/** Adapt any Standard Schema validator into a Resolver. No hard dependency. */
export function standardSchemaResolver(schema: StandardSchemaV1): Resolver {
  return async (values) => {
    const result = await schema['~standard'].validate(values);
    if (!('issues' in result) || !result.issues) {
      return { values: result.value as FormValues, errors: {} };
    }
    const errors: FormErrors = {};
    for (const issue of result.issues) {
      const key = pathToKey(issue.path);
      if (key && !(key in errors)) errors[key] = issue.message;
    }
    return { values, errors };
  };
}
