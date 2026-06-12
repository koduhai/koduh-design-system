import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { FileUpload } from './FileUpload';
import { FormField } from '../FormField';

const meta = {
  title: 'Components/FileUpload',
  component: FileUpload,
} satisfies Meta<typeof FileUpload>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onFiles: (files) => console.log('files', files),
  },
};

export const Showcase: Story = {
  args: { onFiles: () => {} },
  render: () => {
    function Demo() {
      const [names, setNames] = useState<string[]>([]);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 480 }}>
          <section>
            <h4 style={{ margin: '0 0 8px' }}>Single file</h4>
            <FileUpload onFiles={(files) => setNames(files.map((f) => f.name))} />
            {names.length > 0 ? <p style={{ marginTop: 8 }}>Selected: {names.join(', ')}</p> : null}
          </section>
          <section>
            <h4 style={{ margin: '0 0 8px' }}>Multiple, with accept</h4>
            <FileUpload multiple accept="image/*,.pdf" onFiles={() => {}} />
          </section>
          <section>
            <h4 style={{ margin: '0 0 8px' }}>Disabled</h4>
            <FileUpload disabled onFiles={() => {}} />
          </section>
          <section>
            <h4 style={{ margin: '0 0 8px' }}>Inside a FormField</h4>
            <FormField label="Attachment" required helperText="PDF or image, up to 10 MB.">
              <FileUpload accept=".pdf,image/*" onFiles={() => {}} />
            </FormField>
          </section>
        </div>
      );
    }
    return <Demo />;
  },
};
