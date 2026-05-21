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

describe('Job Search route', () => {
  it('should render the empty state heading', async () => {
    const { Route } = await import('../_app/job-search');
    const Component = Route.options.component!;
    render(<Component />);
    expect(screen.getByText('Job Search')).toBeTruthy();
  });

  it('should show the empty state message', async () => {
    const { Route } = await import('../_app/job-search');
    const Component = Route.options.component!;
    render(<Component />);
    expect(
      screen.getByText('No job searches yet. Create a CV first to start searching.'),
    ).toBeTruthy();
  });
});
