import { useMemo, useState } from 'react';
import { TextField } from '../TextField';
import { Popover } from '../Popover';
import { Checkbox } from '../Checkbox';
import { useMessages } from '../../i18n';
import { getColumnValue } from './pipeline';
import type { DataColumn, FilterValue } from './types';
import styles from './DataTable.module.css';

interface ColumnFilterProps<Row> {
  column: DataColumn<Row>;
  data: Row[];
  value: FilterValue | undefined;
  onChange: (next: FilterValue) => void;
}

// ─── Sub-components (hooks called unconditionally per component) ──────────────

interface TextFilterProps {
  header: string;
  value: FilterValue | undefined;
  onChange: (next: FilterValue) => void;
}

function TextFilter({ header, value, onChange }: TextFilterProps) {
  return (
    <TextField
      className={styles.filterControl}
      size="sm"
      label={header}
      value={typeof value === 'string' ? value : ''}
      onChange={(v) => onChange(v)}
    />
  );
}

interface NumberRangeFilterProps {
  header: string;
  value: FilterValue | undefined;
  onChange: (next: FilterValue) => void;
}

function NumberRangeFilter({ header, value, onChange }: NumberRangeFilterProps) {
  const range = (
    value && typeof value === 'object' && !Array.isArray(value) && 'min' in value ? value : {}
  ) as { min?: number; max?: number };
  const num = (s: string): number | undefined => (s === '' ? undefined : Number(s));
  return (
    <div className={styles.rangeGroup} role="group" aria-label={header}>
      <TextField
        type="number"
        size="sm"
        label={`${header} min`}
        value={range.min?.toString() ?? ''}
        onChange={(v) => onChange({ ...range, min: num(v) })}
      />
      <TextField
        type="number"
        size="sm"
        label={`${header} max`}
        value={range.max?.toString() ?? ''}
        onChange={(v) => onChange({ ...range, max: num(v) })}
      />
    </div>
  );
}

interface DateRangeFilterProps {
  header: string;
  value: FilterValue | undefined;
  onChange: (next: FilterValue) => void;
}

function DateRangeFilter({ header, value, onChange }: DateRangeFilterProps) {
  const range = (
    value && typeof value === 'object' && !Array.isArray(value) && 'from' in value ? value : {}
  ) as { from?: string; to?: string };
  return (
    <div className={styles.rangeGroup} role="group" aria-label={header}>
      <TextField
        type="date"
        size="sm"
        label={`${header} from`}
        value={range.from ?? ''}
        onChange={(v) => onChange({ ...range, from: v || undefined })}
      />
      <TextField
        type="date"
        size="sm"
        label={`${header} to`}
        value={range.to ?? ''}
        onChange={(v) => onChange({ ...range, to: v || undefined })}
      />
    </div>
  );
}

interface SelectFilterProps<Row> {
  column: DataColumn<Row>;
  header: string;
  data: Row[];
  value: FilterValue | undefined;
  onChange: (next: FilterValue) => void;
}

function SelectFilter<Row>({ column, header, data, value, onChange }: SelectFilterProps<Row>) {
  const messages = useMessages();
  // Popover requires controlled open state (it does not wire onClick on the trigger).
  const [open, setOpen] = useState(false);

  const options = useMemo(() => {
    if (column.filterOptions) return column.filterOptions;
    const seen = new Set<string>();
    for (const row of data) seen.add(String(getColumnValue(column, row)));
    return [...seen].map((v) => ({ value: v, label: v }));
  }, [column.key, column.filterOptions, data]);

  const chosen = Array.isArray(value) ? value : [];
  const toggle = (v: string) =>
    onChange(chosen.includes(v) ? chosen.filter((x) => x !== v) : [...chosen, v]);

  const trigger = (
    <button
      type="button"
      className={styles.filterTrigger}
      aria-expanded={open}
      aria-haspopup="dialog"
      onClick={() => setOpen((o) => !o)}
    >
      {header}
      {chosen.length > 0 ? (
        <span
          className={styles.filterCount}
          aria-label={messages.dataTable.selectedCount(chosen.length)}
        >
          {chosen.length}
        </span>
      ) : null}
    </button>
  );

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      placement="bottom-start"
      role="dialog"
    >
      <div className={styles.filterMenu} role="group" aria-label={header}>
        {options.map((opt) => (
          <Checkbox
            key={opt.value}
            label={opt.label}
            checked={chosen.includes(opt.value)}
            onChange={() => toggle(opt.value)}
          />
        ))}
      </div>
    </Popover>
  );
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export function ColumnFilter<Row>({ column, data, value, onChange }: ColumnFilterProps<Row>) {
  const header = typeof column.header === 'string' ? column.header : column.key;

  if (column.filter === 'text') {
    return <TextFilter header={header} value={value} onChange={onChange} />;
  }

  if (column.filter === 'number-range') {
    return <NumberRangeFilter header={header} value={value} onChange={onChange} />;
  }

  if (column.filter === 'date-range') {
    return <DateRangeFilter header={header} value={value} onChange={onChange} />;
  }

  // select (multi)
  return (
    <SelectFilter column={column} header={header} data={data} value={value} onChange={onChange} />
  );
}
