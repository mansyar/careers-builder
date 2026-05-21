/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { ReactNode, FC } from 'react';

afterEach(() => {
  cleanup();
});

/** Extract the root component from a route module (handles createRootRoute) */
function getRootComponent(route: {
  options?: { component?: FC<{ children: ReactNode }> };
}): FC<{ children: ReactNode }> {
  return (route.options?.component ??
    (({ children }: { children: ReactNode }) => <>{children}</>)) as FC<{ children: ReactNode }>;
}

vi.mock('../../components/Header', () => ({
  Header: () => <header data-testid="header">Header mock</header>,
}));

vi.mock('../../components/Footer', () => ({
  Footer: () => <footer data-testid="footer">Footer mock</footer>,
}));

vi.mock('@tanstack/react-router', () => ({
  HeadContent: () => null,
  Scripts: () => null,
  createRootRoute: (opts: { shellComponent: FC<{ children: ReactNode }> }) => ({
    options: { component: opts.shellComponent },
  }),
}));

vi.mock('@tanstack/react-router-devtools', () => ({
  TanStackRouterDevtoolsPanel: () => null,
}));

vi.mock('@tanstack/react-devtools', () => ({
  TanStackDevtools: () => null,
}));

describe('RootDocument', () => {
  it('should render the Header', async () => {
    const { Route } = await import('../__root');
    const Component = getRootComponent(Route);
    const { container } = render(<Component>child</Component>);
    expect(container.querySelector('[data-testid="header"]')).toBeTruthy();
  });

  it('should render the Footer', async () => {
    const { Route } = await import('../__root');
    const Component = getRootComponent(Route);
    const { container } = render(<Component>child</Component>);
    expect(container.querySelector('[data-testid="footer"]')).toBeTruthy();
  });

  it('should render child content', async () => {
    const { Route } = await import('../__root');
    const Component = getRootComponent(Route);
    render(<Component>Hello World</Component>);
    expect(screen.getByText('Hello World')).toBeTruthy();
  });
});
