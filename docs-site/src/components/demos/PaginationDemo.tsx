import { useState } from 'react';
import { Pagination } from '@koduhai/design-system';
import { DemoBlock, Demos, col } from './_kit';

function Controlled({
  count,
  initial = 1,
  label,
}: {
  count: number;
  initial?: number;
  label?: string;
}) {
  const [page, setPage] = useState(initial);
  return <Pagination count={count} page={page} onPageChange={setPage} aria-label={label} />;
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Few and many pages">
        <div style={col}>
          <Controlled count={5} label="Few pages" />
          <Controlled count={20} initial={6} label="Many pages, middle" />
          <Controlled count={20} initial={20} label="Many pages, last" />
        </div>
      </DemoBlock>
      <DemoBlock caption="Disabled">
        <Pagination count={10} page={3} disabled aria-label="Disabled pagination" />
      </DemoBlock>
    </Demos>
  );
}
