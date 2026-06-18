import { DataTable } from '@koduhai/design-system';
import type { DataColumn } from '@koduhai/design-system';
import { DemoBlock, Demos } from './_kit';

interface Person {
  id: string;
  name: string;
  role: string;
  age: number;
  joined: string;
}

const people: Person[] = Array.from({ length: 23 }, (_, i) => ({
  id: String(i + 1),
  name: ['Ann', 'Bob', 'Cy', 'Dee', 'Eli'][i % 5] + ` ${i + 1}`,
  role: i % 2 ? 'admin' : 'user',
  age: 22 + (i % 20),
  joined: `20${20 + (i % 5)}-0${(i % 9) + 1}-1${i % 9}`,
}));

const columns: DataColumn<Person>[] = [
  { key: 'name', header: 'Name', sortable: true, filter: 'text' },
  { key: 'role', header: 'Role', sortable: true, filter: 'select' },
  {
    key: 'age',
    header: 'Age',
    type: 'number',
    align: 'end',
    sortable: true,
    filter: 'number-range',
  },
  { key: 'joined', header: 'Joined', type: 'date', sortable: true, filter: 'date-range' },
];

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Sort, filter, search, paginate, and select rows">
        <div style={{ width: '100%' }}>
          <DataTable
            columns={columns}
            data={people}
            getRowId={(r) => r.id}
            caption="Team members"
            captionVisible
            defaultSelectedIds={['1', '2', '3']}
            renderExpanded={(r) => (
              <dl
                style={{
                  margin: 0,
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: '0.25rem 1rem',
                }}
              >
                <dt style={{ fontWeight: 600 }}>Name</dt>
                <dd style={{ margin: 0 }}>{r.name}</dd>
                <dt style={{ fontWeight: 600 }}>Role</dt>
                <dd style={{ margin: 0 }}>{r.role}</dd>
                <dt style={{ fontWeight: 600 }}>Joined</dt>
                <dd style={{ margin: 0 }}>{r.joined}</dd>
              </dl>
            )}
          />
        </div>
      </DemoBlock>
    </Demos>
  );
}
