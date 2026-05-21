/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

vi.mock('../../components/Header', () => ({
  Header: () => <header data-testid="header">Header mock</header>,
}));

vi.mock('../../components/Footer', () => ({
  Footer: () => <footer data-testid="footer">Footer mock</footer>,
}));

vi.mock('@tanstack/react-router', () => ({
  HeadContent: () => null,
  Scripts: () => null,
  createRootRoute: (opts: { shellComponent: React.FC<{ children: React.ReactNode }> }) => ({
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
    const RootDocument = Route.options.component;
    const { container } = render(<RootDocument>child content</RootDocument>);
    expect(container.querySelector('[data-testid="header"]')).toBeTruthy();
  });

  it('should render the Footer', async () => {
    const { Route } = await import('../__root');
    const RootDocument = Route.options.component;
    const { container } = render(<RootDocument>child content</RootDocument>);
    expect(container.querySelector('[data-testid="footer"]')).toBeTruthy();
  });

  it('should render child content', async () => {
    const { Route } = await import('../__root');
    const RootDocument = Route.options.component;
    render(<RootDocument>Hello World</RootDocument>);
    expect(screen.getByText('Hello World')).toBeTruthy();
  });

  // Note: <html> and <head> wrapping is stripped by jsdom/testing-library rendering.
  // The RootDocument component is verified through the tests above (Header, Footer, children).
});
