import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { FormField } from './FormField';
import { Checkbox } from '../Checkbox';
import { Switch } from '../Switch';
import { TextField } from '../TextField';
import { NumberField } from '../NumberField';
import { Textarea } from '../Textarea';
import { PasswordInput } from '../PasswordInput';
import { TagInput } from '../TagInput';
import { RadioGroup, Radio } from '../Radio';
import { Rating } from '../Rating';
import { Select } from '../Select';
import { Combobox } from '../Combobox';
import { FileUpload } from '../FileUpload';
import { ColorPicker } from '../ColorPicker';
import { PinInput } from '../PinInput';
import { Slider } from '../Slider';
import { TimePicker } from '../TimePicker';
import { DateRangePicker } from '../DateRangePicker';

// The contract every FormField-aware control must keep (audit follow-up #64): a
// control composed inside a <FormField> must associate the field's error text and
// must NOT place aria-required / aria-invalid on a role that does not support them
// (axe aria-allowed-attr, the class of bug that regressed FileUpload). This guards
// the invariant useFieldControlProps() encodes, for every control regardless of
// whether it has adopted the hook yet.

// Roles for which each attribute is a supported state (per WAI-ARIA 1.2 / axe).
const ARIA_REQUIRED_OK = new Set([
  'combobox',
  'gridcell',
  'listbox',
  'radiogroup',
  'spinbutton',
  'textbox',
  'searchbox',
  'tree',
  'columnheader',
  'rowheader',
  'treegrid',
]);
const ARIA_INVALID_OK = new Set([
  ...ARIA_REQUIRED_OK,
  'application',
  'checkbox',
  'switch',
  'slider',
  'radio',
  'grid',
]);

/** Explicit role, else the implicit ARIA role for the common host elements. */
function roleOf(el: Element): string | null {
  const explicit = el.getAttribute('role');
  if (explicit) return explicit;
  const tag = el.tagName.toLowerCase();
  if (tag === 'button') return 'button';
  if (tag === 'a') return el.hasAttribute('href') ? 'link' : null;
  if (tag === 'textarea') return 'textbox';
  if (tag === 'select') return el.hasAttribute('multiple') ? 'listbox' : 'combobox';
  if (tag === 'input') {
    const type = (el.getAttribute('type') || 'text').toLowerCase();
    if (type === 'checkbox') return 'checkbox';
    if (type === 'radio') return 'radio';
    if (type === 'number') return 'spinbutton';
    if (type === 'range') return 'slider';
    if (type === 'search') return 'searchbox';
    return 'textbox';
  }
  return null; // role can't be determined; don't judge it
}

function offendingAria(container: HTMLElement): string[] {
  const offenders: string[] = [];
  for (const el of container.querySelectorAll('[aria-required]')) {
    const role = roleOf(el);
    if (role && !ARIA_REQUIRED_OK.has(role)) {
      offenders.push(`aria-required on role="${role}" <${el.tagName.toLowerCase()}>`);
    }
  }
  for (const el of container.querySelectorAll('[aria-invalid]')) {
    const role = roleOf(el);
    if (role && !ARIA_INVALID_OK.has(role)) {
      offenders.push(`aria-invalid on role="${role}" <${el.tagName.toLowerCase()}>`);
    }
  }
  return offenders;
}

const cases: Array<{ name: string; node: ReactNode }> = [
  { name: 'Checkbox', node: <Checkbox /> },
  { name: 'Switch', node: <Switch /> },
  { name: 'TextField', node: <TextField /> },
  { name: 'NumberField', node: <NumberField /> },
  { name: 'Textarea', node: <Textarea /> },
  { name: 'PasswordInput', node: <PasswordInput /> },
  { name: 'TagInput', node: <TagInput /> },
  {
    name: 'RadioGroup',
    node: (
      <RadioGroup>
        <Radio value="a" label="A" />
        <Radio value="b" label="B" />
      </RadioGroup>
    ),
  },
  { name: 'Rating', node: <Rating /> },
  {
    name: 'Select',
    node: <Select options={[{ value: 'a', label: 'A' }]} onChange={() => {}} />,
  },
  {
    name: 'Combobox',
    node: <Combobox options={[{ value: 'a', label: 'A' }]} onChange={() => {}} />,
  },
  { name: 'FileUpload', node: <FileUpload onFiles={() => {}} /> },
  { name: 'ColorPicker', node: <ColorPicker value="#1B5FCC" onChange={() => {}} /> },
  { name: 'PinInput', node: <PinInput /> },
  { name: 'Slider', node: <Slider defaultValue={1} min={0} max={2} /> },
  { name: 'TimePicker', node: <TimePicker /> },
  { name: 'DateRangePicker', node: <DateRangePicker /> },
];

describe('FormField control contract', () => {
  for (const { name, node } of cases) {
    it(`${name}: uses no ARIA attribute its role disallows`, () => {
      const { container } = render(
        <FormField label="Field label" required error errorText="Required">
          {node}
        </FormField>,
      );
      expect(offendingAria(container)).toEqual([]);
    });

    it(`${name}: associates the field error via aria-describedby`, () => {
      const { container, getByText } = render(
        <FormField label="Field label" required error errorText="Required">
          {node}
        </FormField>,
      );
      const errorId = getByText('Required').id;
      expect(errorId, `${name} renders the error text with an id`).toBeTruthy();
      const described = container.querySelector(`[aria-describedby~="${errorId}"]`);
      expect(described, `${name} references the error via aria-describedby`).not.toBeNull();
    });
  }
});
