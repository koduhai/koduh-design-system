import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tree } from './Tree';
import type { TreeNode } from './Tree';

const meta = {
  title: 'Components/Tree',
  component: Tree,
} satisfies Meta<typeof Tree>;
export default meta;

type Story = StoryObj<typeof meta>;

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

export const Default: Story = {
  args: { nodes, defaultExpanded: ['src'] },
};

export const Showcase: Story = {
  args: { nodes },
  render: () => {
    function Demo() {
      const [selectedId, setSelectedId] = useState<string>('button');
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 360 }}>
          <section>
            <h4 style={{ margin: '0 0 8px' }}>Uncontrolled (default expanded)</h4>
            <Tree nodes={nodes} defaultExpanded={['src', 'components']} />
          </section>
          <section>
            <h4 style={{ margin: '0 0 8px' }}>Controlled selection</h4>
            <Tree
              nodes={nodes}
              defaultExpanded={['src', 'components']}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
            <p style={{ marginTop: 8 }}>Selected: {selectedId}</p>
          </section>
        </div>
      );
    }
    return <Demo />;
  },
};
