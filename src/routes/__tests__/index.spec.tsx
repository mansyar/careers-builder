/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// Mock TanStack Router Link — index.tsx uses Link for navigation
vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    ...props
  }: {
    children?: React.ReactNode;
    to?: string;
    [key: string]: unknown;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  createFileRoute: () => (opts: { component: React.FC }) => ({
    options: { component: opts.component },
  }),
}));

describe('Index (landing) route', () => {
  it('should render the hero heading', async () => {
    const { Route } = await import('../index');
    const Component = Route.options.component!;
    render(<Component />);
    expect(screen.getByText('Build your CV. Find your next role.')).toBeTruthy();
  });

  it('should render a link to build your CV', async () => {
    const { Route } = await import('../index');
    const Component = Route.options.component!;
    render(<Component />);
    const link = screen.getByText('Build Your CV');
    expect(link.closest('a')?.getAttribute('href')).toBe('/cv-builder');
  });

  it('should render a link to search jobs', async () => {
    const { Route } = await import('../index');
    const Component = Route.options.component!;
    render(<Component />);
    const link = screen.getByText('Search Jobs');
    expect(link.closest('a')?.getAttribute('href')).toBe('/job-search');
  });

  it('should render the AI-Powered CV Builder feature card', async () => {
    const { Route } = await import('../index');
    const Component = Route.options.component!;
    render(<Component />);
    expect(screen.getByText('AI-Powered CV Builder')).toBeTruthy();
  });

  it('should render the Smart Job Search feature card', async () => {
    const { Route } = await import('../index');
    const Component = Route.options.component!;
    render(<Component />);
    expect(screen.getByText('Smart Job Search')).toBeTruthy();
  });

  it('should render the Local-First Privacy card', async () => {
    const { Route } = await import('../index');
    const Component = Route.options.component!;
    render(<Component />);
    expect(screen.getByText('Local-First Privacy')).toBeTruthy();
  });
});
