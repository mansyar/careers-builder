/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// Mock Outlet to render a predictable element.
// createFileRoute('/_app') returns a function that accepts route options and
// returns a route object with the component accessible via .options.component.
const mockComponent = vi.fn(() => null);
vi.mock('@tanstack/react-router', () => ({
  Outlet: () => <div data-testid="outlet">Outlet content</div>,
  createFileRoute: () => (opts: { component: React.FC }) => {
    mockComponent.mockImplementation(opts.component);
    return { options: { component: opts.component } };
  },
}));

// Mock Sidebar
vi.mock('../../components/Sidebar', () => ({
  Sidebar: () => <nav data-testid="sidebar">Sidebar mock</nav>,
}));

describe('_app layout route', () => {
  it('should render the Sidebar', async () => {
    // Dynamic import so mocks are applied first
    const { Route } = await import('../_app');
    const Component = Route.options.component;
    render(<Component />);
    expect(screen.getByTestId('sidebar')).toBeTruthy();
  });

  it('should render the Outlet for child content', async () => {
    const { Route } = await import('../_app');
    const Component = Route.options.component;
    render(<Component />);
    expect(screen.getByTestId('outlet')).toBeTruthy();
  });

  it('should render sidebar alongside outlet', async () => {
    const { Route } = await import('../_app');
    const Component = Route.options.component;
    const { container } = render(<Component />);
    const sidebar = screen.getByTestId('sidebar');
    const outlet = screen.getByTestId('outlet');
    expect(container.contains(sidebar)).toBe(true);
    expect(container.contains(outlet)).toBe(true);
  });
});
