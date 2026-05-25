import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm } from './useForm';
import { Form } from './Form';
import { useFieldArray } from './useFieldArray';
import type { FormApi } from './useForm';

let api!: FormApi;
function List() {
  const arr = useFieldArray('items');
  return (
    <div>
      <span data-testid="count">{arr.fields.length}</span>
      <span data-testid="ids">{arr.fields.map((f) => f.id).join(',')}</span>
      <button onClick={() => arr.append({ title: 'x' })}>append</button>
      <button onClick={() => arr.remove(0)}>remove0</button>
      <button onClick={() => arr.move(0, 1)}>move</button>
    </div>
  );
}
function Wrap({ defaults }: { defaults?: unknown[] }) {
  api = useForm({ defaultValues: { items: defaults ?? [] } });
  return <Form form={api} aria-label="f"><List /></Form>;
}

describe('useFieldArray', () => {
  it('appends items and assigns stable unique ids', () => {
    render(<Wrap />);
    fireEvent.click(screen.getByText('append'));
    fireEvent.click(screen.getByText('append'));
    expect(screen.getByTestId('count')).toHaveTextContent('2');
    const ids = screen.getByTestId('ids').textContent!.split(',');
    expect(ids[0]).not.toBe(ids[1]);
    expect(api.getValues().items).toEqual([{ title: 'x' }, { title: 'x' }]);
  });

  it('removes by index', () => {
    render(<Wrap defaults={[{ title: 'a' }, { title: 'b' }]} />);
    fireEvent.click(screen.getByText('remove0'));
    expect(api.getValues().items).toEqual([{ title: 'b' }]);
  });

  it('moves items', () => {
    render(<Wrap defaults={[{ title: 'a' }, { title: 'b' }]} />);
    fireEvent.click(screen.getByText('move'));
    expect(api.getValues().items).toEqual([{ title: 'b' }, { title: 'a' }]);
  });
});
