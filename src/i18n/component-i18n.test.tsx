import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import type { ReactElement } from 'react';
import { KoduhI18nProvider } from './I18nProvider';
import type { PartialMessages } from './messages';
import { Toaster } from '../components/Toaster';
import { addToast, __resetToasts } from '../components/Toaster/store';

// CommandPalette renders a native <dialog>; jsdom doesn't implement showModal/close.
beforeAll(() => {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function () {
      this.open = true;
    };
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function () {
      this.open = false;
      this.dispatchEvent(new Event('close'));
    };
  }
});

import { FileUpload } from '../components/FileUpload';
import { PasswordInput } from '../components/PasswordInput';
import { ColorPicker } from '../components/ColorPicker';
import { PinInput } from '../components/PinInput';
import { Rating } from '../components/Rating';
import { Stepper } from '../components/Stepper';
import { Banner } from '../components/Banner';
import { Calendar } from '../components/Calendar';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Chip } from '../components/Chip';
import { Sidebar } from '../components/Sidebar';
import type { SidebarItem } from '../components/Sidebar';
import { Carousel } from '../components/Carousel';
import { CommandPalette } from '../components/CommandPalette';
import { DatePicker } from '../components/DatePicker';
import { CodeBlock } from '../components/Code';
import { Chart } from '../components/Chart';
import { DataTable } from '../components/DataTable';
import type { DataColumn } from '../components/DataTable';
import { NumberField } from '../components/NumberField';
import { Table } from '../components/Table';
import type { Column } from '../components/Table';

/** Render a node wrapped in a provider carrying the given overrides. */
function withMessages(node: ReactElement, messages: PartialMessages) {
  return render(<KoduhI18nProvider messages={messages}>{node}</KoduhI18nProvider>);
}

// Each case overrides exactly the catalog key a component now reads, then asserts
// the translated string reaches the DOM — proving the string is routed through the
// catalog and not hardcoded. Default (English) output is already covered by each
// component's own test suite (and stayed byte-identical).
describe('i18n: remaining-component catalog coverage (#79)', () => {
  it('FileUpload instructions', () => {
    withMessages(<FileUpload onFiles={() => {}} multiple />, {
      fileUpload: { multipleFiles: 'Plusieurs fichiers.' },
    });
    expect(screen.getByText('Plusieurs fichiers.')).toBeInTheDocument();
  });

  it('PasswordInput show/hide toggle', () => {
    withMessages(<PasswordInput label="Mot de passe" />, {
      passwordInput: { show: 'Afficher' },
    });
    expect(screen.getByRole('button', { name: 'Afficher' })).toBeInTheDocument();
  });

  it('ColorPicker slider + hex labels', () => {
    withMessages(<ColorPicker />, {
      colorPicker: { saturationBrightness: 'Saturation', hex: 'Hexa' },
    });
    expect(screen.getByRole('slider', { name: 'Saturation' })).toBeInTheDocument();
    expect(screen.getByText('Hexa')).toBeInTheDocument();
  });

  it('PinInput per-cell digit label', () => {
    withMessages(<PinInput length={4} />, {
      pinInput: { digit: (i, l) => `case ${i} sur ${l}` },
    });
    expect(screen.getByLabelText('case 1 sur 4')).toBeInTheDocument();
  });

  it('Rating star label', () => {
    withMessages(<Rating max={3} />, {
      rating: { starLabel: (r) => `note ${r}` },
    });
    expect(screen.getByRole('radio', { name: 'note 1' })).toBeInTheDocument();
  });

  it('Stepper completed marker', () => {
    withMessages(<Stepper activeStep={1} steps={[{ label: 'One' }, { label: 'Two' }]} />, {
      stepper: { completed: '(terminé)' },
    });
    expect(screen.getByText('(terminé)')).toBeInTheDocument();
  });

  it('Banner dismiss label (and closeLabel prop wins)', () => {
    const { unmount } = withMessages(
      <Banner severity="info" dismissable onClose={() => {}}>
        Body
      </Banner>,
      { dismiss: 'Fermer' },
    );
    expect(screen.getByRole('button', { name: 'Fermer' })).toBeInTheDocument();
    unmount();
    withMessages(
      <Banner severity="info" dismissable onClose={() => {}} closeLabel="Ignorer">
        Body
      </Banner>,
      { dismiss: 'Fermer' },
    );
    expect(screen.getByRole('button', { name: 'Ignorer' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Fermer' })).toBeNull();
  });

  it('Calendar month nav', () => {
    withMessages(<Calendar />, {
      calendar: { previousMonth: 'Mois précédent', nextMonth: 'Mois suivant' },
    });
    expect(screen.getByRole('button', { name: 'Mois précédent' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mois suivant' })).toBeInTheDocument();
  });

  it('Breadcrumbs nav label', () => {
    withMessages(
      <Breadcrumbs
        items={[
          { label: 'A', href: '/' },
          { label: 'B', href: '/b' },
        ]}
      />,
      { breadcrumbs: { label: "Fil d'Ariane" } },
    );
    expect(screen.getByRole('navigation', { name: "Fil d'Ariane" })).toBeInTheDocument();
  });

  it('Chip remove label', () => {
    withMessages(<Chip label="Étiquette" onDelete={() => {}} />, {
      chip: { remove: (l) => `Retirer ${l}` },
    });
    expect(screen.getByRole('button', { name: 'Retirer Étiquette' })).toBeInTheDocument();
  });

  it('Sidebar nav label + collapse toggle', () => {
    const items: SidebarItem[] = [{ id: 'home', label: 'Home', href: '/' }];
    withMessages(<Sidebar items={items} />, {
      sidebar: { label: 'Navigation', collapse: 'Réduire' },
    });
    expect(screen.getByRole('navigation', { name: 'Navigation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Réduire' })).toBeInTheDocument();
  });

  it('Carousel slide label', () => {
    withMessages(
      <Carousel
        aria-label="Faits"
        items={[
          { id: 'a', content: 'A' },
          { id: 'b', content: 'B' },
        ]}
      />,
      { carousel: { slide: (i, t) => `${i} / ${t}` } },
    );
    expect(screen.getByRole('group', { name: '1 / 2' })).toBeInTheDocument();
  });

  it('CommandPalette input placeholder/label', () => {
    withMessages(
      <CommandPalette
        open
        onOpenChange={() => {}}
        commands={[{ id: 'a', label: 'Action', onSelect: () => {} }]}
      />,
      { commandPalette: { label: 'Menu de commandes', placeholder: 'Tapez…' } },
    );
    const input = screen.getByRole('combobox', { name: 'Menu de commandes' });
    expect(input).toHaveAttribute('placeholder', 'Tapez…');
  });

  it('DatePicker placeholder', () => {
    withMessages(<DatePicker />, {
      datePicker: { placeholder: 'Choisir une date' },
    });
    expect(screen.getByPlaceholderText('Choisir une date')).toBeInTheDocument();
  });

  it('Code block label', () => {
    const { container } = withMessages(<CodeBlock language="ts">const x = 1;</CodeBlock>, {
      code: { blockLabel: (lang) => `code ${lang}` },
    });
    expect(container.querySelector('pre')).toHaveAttribute('aria-label', 'code ts');
  });

  it('Chart summary + series header', () => {
    withMessages(
      <Chart series={[{ name: 'Revenue', data: [1, 2, 3] }]} categories={['a', 'b', 'c']} />,
      {
        chart: { summary: () => 'graphique linéaire', series: 'Série' },
      },
    );
    expect(screen.getByRole('img', { name: 'graphique linéaire' })).toBeInTheDocument();
    expect(screen.getByText('Série')).toBeInTheDocument();
  });

  it('DataTable search + selection toolbar', () => {
    const columns: DataColumn<{ id: string; name: string }>[] = [{ key: 'name', header: 'Name' }];
    withMessages(
      <DataTable columns={columns} data={[{ id: '1', name: 'Ada' }]} getRowId={(r) => r.id} />,
      { dataTable: { search: 'Rechercher…' } },
    );
    expect(screen.getByPlaceholderText('Rechercher…')).toBeInTheDocument();
  });

  it('NumberField increment/decrement', () => {
    withMessages(<NumberField label="Quantité" />, {
      numberField: { decrement: 'Diminuer', increment: 'Augmenter' },
    });
    expect(screen.getByRole('button', { name: 'Diminuer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Augmenter' })).toBeInTheDocument();
  });

  it('Table select-all + per-row checkboxes', () => {
    const columns: Column<{ id: string; name: string }>[] = [{ key: 'name', header: 'Name' }];
    withMessages(
      <Table
        columns={columns}
        data={[{ id: 'r1', name: 'Ada' }]}
        getRowId={(r) => r.id}
        selectedIds={[]}
        onSelectionChange={() => {}}
      />,
      { table: { selectAll: 'Tout sélectionner', selectRow: (id) => `Ligne ${id}` } },
    );
    expect(screen.getByRole('checkbox', { name: 'Tout sélectionner' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Ligne r1' })).toBeInTheDocument();
  });

  it('Toaster region + toast dismiss label', () => {
    __resetToasts();
    withMessages(<Toaster />, { toaster: { label: 'Notifications système' }, dismiss: 'Fermer' });
    act(() => {
      addToast({ description: 'Enregistré', severity: 'success' });
    });
    expect(screen.getByRole('region', { name: 'Notifications système' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fermer' })).toBeInTheDocument();
    __resetToasts();
  });
});
