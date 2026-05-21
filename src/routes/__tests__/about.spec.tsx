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

describe('About route', () => {
  it('should render the heading', async () => {
    const { Route } = await import('../about');
    const Component = Route.options.component!;
    render(<Component />);
    expect(screen.getByText(/Careers Builder.*build your CV.*find your role/)).toBeTruthy();
  });

  it('should render the privacy description', async () => {
    const { Route } = await import('../about');
    const Component = Route.options.component!;
    render(<Component />);
    expect(screen.getByText(/All your personal data stays on your machine/)).toBeTruthy();
  });
});
