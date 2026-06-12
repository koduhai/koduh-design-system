import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Carousel } from './Carousel';
import { KoduhI18nProvider } from '../../i18n';

const items = [
  { id: 'a', content: 'Slide A' },
  { id: 'b', content: 'Slide B' },
  { id: 'c', content: 'Slide C' },
];

describe('Carousel', () => {
  it('renders a carousel region and one slide per item', () => {
    render(<Carousel items={items} aria-label="Highlights" />);
    const region = screen.getByRole('group', { name: 'Highlights' });
    expect(region).toHaveAttribute('aria-roledescription', 'carousel');
    // Inactive slides are aria-hidden, so query the DOM directly for all three.
    const slides = region.querySelectorAll('[aria-roledescription="slide"]');
    expect(slides).toHaveLength(3);
    expect(slides[0]).toHaveAttribute('aria-label', '1 of 3');
    expect(slides[2]).toHaveAttribute('aria-label', '3 of 3');
  });

  it('marks the active slide and indicator with aria-current', () => {
    render(<Carousel items={items} defaultIndex={1} aria-label="Highlights" />);
    const current = screen.getByRole('button', { name: 'Go to slide 2' });
    expect(current).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'Go to slide 1' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('navigates with the next and previous buttons (uncontrolled)', async () => {
    render(<Carousel items={items} aria-label="Highlights" />);
    expect(screen.getByRole('button', { name: 'Go to slide 1' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(screen.getByRole('button', { name: 'Go to slide 2' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Previous slide' }));
    expect(screen.getByRole('button', { name: 'Go to slide 1' })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('jumps to a slide via its indicator button', async () => {
    render(<Carousel items={items} aria-label="Highlights" />);
    await userEvent.click(screen.getByRole('button', { name: 'Go to slide 3' }));
    expect(screen.getByRole('button', { name: 'Go to slide 3' })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('navigates with ArrowLeft / ArrowRight', async () => {
    render(<Carousel items={items} aria-label="Highlights" />);
    const region = screen.getByRole('group', { name: 'Highlights' });
    region.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Go to slide 2' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'Go to slide 1' })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('mirrors ArrowLeft / ArrowRight under direction:rtl', async () => {
    const realGCS = window.getComputedStyle.bind(window);
    // Override only `direction`; keep the live declaration (and its prototype
    // methods, which accessible-name queries call) intact.
    const spy = vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element) => {
      const style = realGCS(el);
      return new Proxy(style, {
        get: (target, prop) => (prop === 'direction' ? 'rtl' : Reflect.get(target, prop, target)),
      });
    });
    render(<Carousel items={items} aria-label="Highlights" />);
    const region = screen.getByRole('group', { name: 'Highlights' });
    region.focus();
    // RTL: ArrowLeft advances forward.
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'Go to slide 2' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    // RTL: ArrowRight goes back.
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Go to slide 1' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    spy.mockRestore();
  });

  it('announces the current slide in a polite live region', async () => {
    const { container } = render(<Carousel items={items} aria-label="Highlights" />);
    const status = container.querySelector('[aria-live="polite"]');
    expect(status).not.toBeNull();
    expect(status).toHaveTextContent('Slide 1 of 3');
    await userEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(status).toHaveTextContent('Slide 2 of 3');
  });

  it('disables prev at the start and next at the end without loop', () => {
    render(<Carousel items={items} aria-label="Highlights" />);
    expect(screen.getByRole('button', { name: 'Previous slide' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next slide' })).not.toBeDisabled();
  });

  it('wraps around when loop is set', async () => {
    render(<Carousel items={items} loop aria-label="Highlights" />);
    const prev = screen.getByRole('button', { name: 'Previous slide' });
    expect(prev).not.toBeDisabled();
    await userEvent.click(prev);
    expect(screen.getByRole('button', { name: 'Go to slide 3' })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('supports a controlled index via onIndexChange', async () => {
    const onIndexChange = vi.fn();
    render(<Carousel items={items} index={0} onIndexChange={onIndexChange} aria-label="X" />);
    await userEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(onIndexChange).toHaveBeenCalledWith(1);
    // Controlled: stays on slide 1 until the parent updates `index`.
    expect(screen.getByRole('button', { name: 'Go to slide 1' })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('does not fire onIndexChange for no-op navigations', async () => {
    const onIndexChange = vi.fn();
    render(<Carousel items={items} index={0} onIndexChange={onIndexChange} aria-label="X" />);
    // Clicking the already-active indicator is a no-op.
    await userEvent.click(screen.getByRole('button', { name: 'Go to slide 1' }));
    // Prev is clamped at the start boundary (no loop), also a no-op.
    await userEvent.click(screen.getByRole('button', { name: 'Previous slide' }));
    expect(onIndexChange).not.toHaveBeenCalled();
    // A real move still notifies.
    await userEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(onIndexChange).toHaveBeenCalledTimes(1);
    expect(onIndexChange).toHaveBeenCalledWith(1);
  });

  it('forwards ref and className to the root', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Carousel ref={ref} items={items} className="custom" aria-label="X" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toHaveClass('custom');
  });

  it('clamps an out-of-range index instead of crashing', () => {
    render(<Carousel items={items} index={99} aria-label="X" />);
    expect(screen.getByRole('button', { name: 'Go to slide 3' })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  describe('i18n', () => {
    it('uses the English catalog defaults with no provider', () => {
      const { container } = render(<Carousel items={items} aria-label="Highlights" />);
      // Region role description, prev/next labels, dot labels.
      expect(screen.getByRole('group', { name: 'Highlights' })).toHaveAttribute(
        'aria-roledescription',
        'carousel',
      );
      expect(screen.getByRole('button', { name: 'Previous slide' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Next slide' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to slide 1' })).toBeInTheDocument();
      // Slide list label.
      expect(screen.getByRole('group', { name: 'Slides' })).toBeInTheDocument();
      // Live-region status.
      expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent('Slide 1 of 3');
    });

    it('routes built-in strings through a provider override', () => {
      const { container } = render(
        <KoduhI18nProvider
          messages={{
            carousel: {
              label: 'Diapositives',
              region: 'carrousel',
              previous: 'Précédent',
              next: 'Suivant',
              goToSlide: (slide) => `Aller à la diapositive ${slide}`,
              slideStatus: (index, total) => `Diapositive ${index} sur ${total}`,
            },
          }}
        >
          <Carousel items={items} aria-label="Highlights" />
        </KoduhI18nProvider>,
      );
      expect(screen.getByRole('group', { name: 'Highlights' })).toHaveAttribute(
        'aria-roledescription',
        'carrousel',
      );
      expect(screen.getByRole('button', { name: 'Précédent' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Suivant' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Aller à la diapositive 1' })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: 'Diapositives' })).toBeInTheDocument();
      expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent(
        'Diapositive 1 sur 3',
      );
    });

    it('lets prevLabel / nextLabel props override the provider', () => {
      render(
        <KoduhI18nProvider messages={{ carousel: { previous: 'Précédent', next: 'Suivant' } }}>
          <Carousel items={items} aria-label="Highlights" prevLabel="Back" nextLabel="Forward" />
        </KoduhI18nProvider>,
      );
      // The per-component prop still wins over the catalog.
      expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Forward' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Précédent' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Suivant' })).toBeNull();
    });
  });
});
