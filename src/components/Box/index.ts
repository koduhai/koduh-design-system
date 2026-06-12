export { Box } from './Box';
// SpaceToken is intentionally not re-exported here: it is byte-identical to the
// SpaceToken several sibling layout components define, and only Stack's wins at
// the package barrel (src/index.ts) to avoid a duplicate-export collision.
// Re-exporting it from Box would be dead for package consumers, so the public
// SpaceToken lives on the Stack path. BoxProps still carries the type structurally.
export type { BoxProps } from './Box';
