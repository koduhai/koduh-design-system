import {
  Stack,
  Inline,
  Grid,
  Container,
  Box,
  Accordion,
  Collapsible,
  ScrollArea,
  Carousel,
  AspectRatio,
} from '@koduhai/design-system';
import type { Seed } from './types';

const box = (label: string) => (
  <div
    style={{
      background: 'var(--ku-brand-500)',
      color: '#fff',
      padding: 'var(--ku-space-3)',
      borderRadius: 'var(--ku-radius-md)',
    }}
  >
    {label}
  </div>
);

const accordionItems = [
  {
    id: 'shipping',
    title: 'Shipping & delivery',
    content: 'Orders ship within 2 business days. Standard delivery takes 3 to 5 days.',
  },
  {
    id: 'returns',
    title: 'Returns & refunds',
    content: 'Return any item within 30 days for a full refund, no questions asked.',
  },
  {
    id: 'warranty',
    title: 'Warranty',
    content: 'All products carry a 2-year limited manufacturer warranty.',
  },
];

const slide = (label: string, bg: string) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      minHeight: 120,
      borderRadius: 'var(--ku-radius-md)',
      background: bg,
      color: '#fff',
      fontSize: 'var(--ku-font-size-lg)',
      fontWeight: 600,
    }}
  >
    {label}
  </div>
);

const carouselItems = [
  { id: 'one', content: slide('Slide one', 'var(--ku-color-primary)') },
  { id: 'two', content: slide('Slide two', 'var(--ku-color-success)') },
  { id: 'three', content: slide('Slide three', 'var(--ku-color-warning)') },
];

const scrollLines = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`);

// Playground seeds for Layout/primitive components. Add: Name: { Component, props?, children? }.
const seeds: Record<string, Seed> = {
  Stack: {
    Component: Stack,
    props: {
      gap: 4,
      style: { width: '100%' },
      children: (
        <>
          {box('One')}
          {box('Two')}
          {box('Three')}
        </>
      ),
    },
  },
  Inline: {
    Component: Inline,
    props: {
      gap: 4,
      align: 'center',
      children: (
        <>
          {box('Alpha')}
          {box('Bravo')}
          {box('Charlie')}
        </>
      ),
    },
  },
  Grid: {
    Component: Grid,
    props: {
      columns: 3,
      gap: 4,
      children: (
        <>
          {box('Cell 1')}
          {box('Cell 2')}
          {box('Cell 3')}
        </>
      ),
    },
  },
  Container: {
    Component: Container,
    props: {
      children: (
        <div
          style={{
            background: 'var(--ku-brand-500)',
            color: '#fff',
            padding: 'var(--ku-space-3)',
            borderRadius: 'var(--ku-radius-md)',
          }}
        >
          Default container: a centered max-width wrapper.
        </div>
      ),
    },
  },
  Box: {
    Component: Box,
    props: {
      padding: 4,
      style: {
        background: 'var(--ku-brand-500)',
        color: '#fff',
        borderRadius: 'var(--ku-radius-md)',
      },
      children: <>padding=4</>,
    },
  },
  Accordion: {
    Component: Accordion,
    props: {
      items: accordionItems,
      defaultValue: 'shipping',
      collapsible: true,
    },
  },
  Collapsible: {
    Component: Collapsible,
    props: {
      trigger: 'Shipping & delivery',
      defaultOpen: true,
      children: (
        <div style={{ maxWidth: 480 }}>
          Orders ship within 2 business days. Standard delivery takes 3 to 5 days.
        </div>
      ),
    },
  },
  ScrollArea: {
    Component: ScrollArea,
    props: {
      maxHeight: 140,
      style: {
        maxWidth: 360,
        border: '1px solid var(--ku-color-border)',
        borderRadius: 'var(--ku-radius-md)',
        padding: 'var(--ku-space-2)',
      },
      children: (
        <ul style={{ margin: 0, paddingInlineStart: 20 }}>
          {scrollLines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      ),
    },
  },
  Carousel: {
    Component: Carousel,
    props: {
      items: carouselItems,
      'aria-label': 'Example carousel',
      style: { maxWidth: 480 },
    },
  },
  AspectRatio: {
    Component: AspectRatio,
    props: {
      ratio: 16 / 9,
      style: { maxWidth: 320 },
      children: (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            background: 'var(--ku-brand-500)',
            color: '#fff',
            borderRadius: 'var(--ku-radius-md)',
            fontWeight: 600,
          }}
        >
          16 / 9
        </div>
      ),
    },
  },
};

export default seeds;
