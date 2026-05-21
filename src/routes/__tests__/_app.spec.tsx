/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { ReactNode } from 'react';

afterEach(() => {
  cleanup();
});

// Mock Outlet to render a predictable element.
vi.mock('@tanstack/react-router', () => ({
  Outlet: () => <div data-testid="outlet">Outlet content</div>,
  createFileRoute: () => (opts: { component: () => ReactNode }) => ({
    options: { component: opts.component },
  }),
}));

// Mock Sidebar
vi.mock('../../components/Sidebar', () => ({
  Sidebar: () => <nav data-testid="sidebar">Sidebar mock</nav>,
}));

describe('_app layout route', () => {
  it('should render the Sidebar', async () => {
    const { Route } = await import('../_app');
    const Component = Route.options.component as React.FC;
    render(<Component />);
    expect(screen.getByTestId('sidebar')).toBeTruthy();
  });

  it('should render the Outlet for child content', async () => {
    const { Route } = await import('../_app');
    const Component = Route.options.component as React.FC;
    render(<Component />);
    expect(screen.getByTestId('outlet')).toBeTruthy();
  });

  it('should render sidebar alongside outlet', async () => {
    const { Route } = await import('../_app');
    const Component = Route.options.component as React.FC;
    const { container } = render(<Component />);
    const sidebar = screen.getByTestId('sidebar');
    const outlet = screen.getByTestId('outlet');
    expect(container.contains(sidebar)).toBe(true);
    expect(container.contains(outlet)).toBe(true);
  });
});
