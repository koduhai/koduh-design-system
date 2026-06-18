import { useState } from 'react';
import { TagInput } from '@koduhai/design-system';
import { DemoBlock, Demos, col } from './_kit';

function Basic() {
  const [tags, setTags] = useState<string[]>(['react', 'typescript']);
  return (
    <div style={{ ...col, maxWidth: 360 }}>
      <TagInput
        label="Skills"
        value={tags}
        onChange={setTags}
        helperText="Press Enter or comma to add."
      />
      <TagInput label="Topics" placeholder="Type a topic and press Enter" />
    </div>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="Add & remove tags">
        <Basic />
      </DemoBlock>
      <DemoBlock caption="Error state">
        <div style={{ ...col, maxWidth: 360 }}>
          <TagInput
            label="Recipients"
            defaultValue={['a@example.com']}
            error
            errorText="At least one recipient is required."
          />
        </div>
      </DemoBlock>
    </Demos>
  );
}
