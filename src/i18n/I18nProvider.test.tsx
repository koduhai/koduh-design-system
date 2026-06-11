import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KoduhI18nProvider, useMessages, useLocale } from './I18nProvider';
import { defaultMessages, mergeMessages } from './messages';

function Probe() {
  const m = useMessages();
  const locale = useLocale();
  return (
    <div>
      <span data-testid="close">{m.close}</span>
      <span data-testid="prev">{m.pagination.previous}</span>
      <span data-testid="page3">{m.pagination.page(3)}</span>
      <span data-testid="locale">{locale ?? 'none'}</span>
    </div>
  );
}

describe('i18n', () => {
  it('returns English defaults when there is no provider', () => {
    render(<Probe />);
    expect(screen.getByTestId('close')).toHaveTextContent('Close');
    expect(screen.getByTestId('prev')).toHaveTextContent('Previous page');
    expect(screen.getByTestId('page3')).toHaveTextContent('Go to page 3');
    expect(screen.getByTestId('locale')).toHaveTextContent('none');
  });

  it('deep-merges overrides over defaults, leaving unset strings intact', () => {
    render(
      <KoduhI18nProvider
        locale="fr-FR"
        messages={{
          close: 'Fermer',
          pagination: { previous: 'Précédent', page: (p) => `Page ${p} / total` },
        }}
      >
        <Probe />
      </KoduhI18nProvider>,
    );
    // Overridden:
    expect(screen.getByTestId('close')).toHaveTextContent('Fermer');
    expect(screen.getByTestId('prev')).toHaveTextContent('Précédent');
    expect(screen.getByTestId('page3')).toHaveTextContent('Page 3 / total');
    // Same namespace, not overridden -> default kept:
    expect(screen.getByTestId('locale')).toHaveTextContent('fr-FR');
  });

  it('mergeMessages replaces top-level leaves and shallow-merges namespaces', () => {
    const merged = mergeMessages(defaultMessages, {
      dismiss: 'Schließen',
      combobox: { noResults: 'Keine Treffer' },
    });
    expect(merged.dismiss).toBe('Schließen');
    expect(merged.combobox.noResults).toBe('Keine Treffer');
    // Untouched within the same namespace and elsewhere:
    expect(merged.combobox.resultCount(2)).toBe('2 results available');
    expect(merged.close).toBe('Close');
    // Does not mutate the defaults.
    expect(defaultMessages.dismiss).toBe('Dismiss');
  });
});
