import { useState } from 'react';
import { Chip } from '@koduhai/design-system';
import type { ChipTone } from '@koduhai/design-system';
import { DemoBlock, Demos, row } from './_kit';

const tones: ChipTone[] = ['primary', 'neutral', 'success', 'warning', 'danger', 'info', 'accent'];

function Deletable() {
  const [tags, setTags] = useState(['design', 'system', 'tokens', 'a11y']);
  return (
    <div style={row}>
      {tags.length === 0 ? (
        <Chip tone="neutral" variant="outline" label="All removed" />
      ) : (
        tags.map((tag) => (
          <Chip
            key={tag}
            tone="primary"
            label={tag}
            onDelete={() => setTags((prev) => prev.filter((t) => t !== tag))}
          />
        ))
      )}
    </div>
  );
}

export default function Demo() {
  return (
    <Demos>
      <DemoBlock caption="tone: primary · neutral · success · warning · danger · info · accent">
        <div style={row}>
          {tones.map((t) => (
            <Chip key={t} tone={t} label={t} />
          ))}
        </div>
      </DemoBlock>
      <DemoBlock caption="variant: solid · outline">
        <div style={row}>
          <Chip variant="solid" tone="primary" label="solid" />
          <Chip variant="outline" tone="primary" label="outline" />
        </div>
      </DemoBlock>
      <DemoBlock caption="Deletable: onDelete removes the tag">
        <Deletable />
      </DemoBlock>
    </Demos>
  );
}
