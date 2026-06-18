declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// Plain CSS imported for its side effects only (reset, focus-ring). TS 6 requires
// a declaration for side-effect CSS imports or it errors with TS2882.
declare module '*.css';
