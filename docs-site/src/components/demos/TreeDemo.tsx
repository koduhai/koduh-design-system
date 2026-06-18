import { useState } from 'react';
import { Tree } from '@koduhai/design-system';
import type { TreeNode } from '@koduhai/design-system';
import { DemoBlock, Demos } from './_kit';

const nodes: TreeNode[] = [
  {
    id: 'src',
    label: 'src',
    children: [
      {
        id: 'components',
        label: 'components',
        children: [
          { id: 'button', label: 'Button.tsx' },
          { id: 'tree', label: 'Tree.tsx' },
        ],
      },
      { id: 'index', label: 'index.ts' },
    ],
  },
  {
    id: 'docs',
    label: 'docs',
    children: [{ id: 'readme', label: 'README.md' }],
  },
  { id: 'package', label: 'package.json' },
];

function ControlledTree() {
  const [selectedId, setSelectedId] = useState<string>('button');
  return (
    <div>
      <Tree
        nodes={nodes}
        defaultExpanded={['src', 'components']}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <p style={{ marginTop: 'var(--ku-space-2)' }}>Selected: {selectedId}</p>
    </div>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Uncontrolled (default expanded)">
        <div style={{ maxWidth: 360 }}>
          <Tree nodes={nodes} defaultExpanded={['src', 'components']} />
        </div>
      </DemoBlock>
      <DemoBlock caption="Controlled selection">
        <div style={{ maxWidth: 360 }}>
          <ControlledTree />
        </div>
      </DemoBlock>
    </Demos>
  );
}
