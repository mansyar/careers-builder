/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: { component: React.FC }) => ({
    options: { component: opts.component },
  }),
}));

describe('CV Builder route', () => {
  it('should render the empty state heading', async () => {
    const { Route } = await import('../_app/cv-builder');
    const Component = Route.options.component!;
    render(<Component />);
    expect(screen.getByText('CV Builder')).toBeTruthy();
  });

  it('should show the empty state message', async () => {
    const { Route } = await import('../_app/cv-builder');
    const Component = Route.options.component!;
    render(<Component />);
    expect(
      screen.getByText('No CV yet. Start the guided interview to build your CV.'),
    ).toBeTruthy();
  });

  it('should show a disabled coming soon button', async () => {
    const { Route } = await import('../_app/cv-builder');
    const Component = Route.options.component!;
    render(<Component />);
    const button = screen.getByText('Coming Soon');
    expect(button).toBeTruthy();
    expect(button.hasAttribute('disabled')).toBe(true);
  });
});
