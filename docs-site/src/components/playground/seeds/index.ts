// Merges every category seed file into one map consumed by the Playground.
// Each category file is owned by a separate author to avoid edit conflicts.
import type { Seed } from './types';
import core from './core';
import actions from './actions';
import form from './form';
import data from './data';
import overlays from './overlays';
import navigation from './navigation';
import layout from './layout';

export type { Seed } from './types';

export const seeds: Record<string, Seed> = {
  ...core,
  ...actions,
  ...form,
  ...data,
  ...overlays,
  ...navigation,
  ...layout,
};
