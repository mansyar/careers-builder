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

// Mock client-safe module for provider settings
vi.mock('../../lib/provider-settings-client', () => ({
  loadProviderSettings: () => Promise.resolve({ apiKey: '', baseUrl: '', modelId: '' }),
  persistProviderSettings: () => Promise.resolve({ apiKey: '', baseUrl: '', modelId: '' }),
  checkProviderSettings: () => Promise.resolve({ valid: true }),
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

  it('should render provider wizard modal (isWizardOpen by default)', async () => {
    const { Route } = await import('../__root');
    const Component = getRootComponent(Route);
    render(<Component>child</Component>);
    // The wizard modal should show because isWizardOpen defaults to true
    expect(screen.getByText('AI Provider Configuration')).toBeTruthy();
    // API key input should be visible
    expect(screen.getByPlaceholderText('sk-...')).toBeTruthy();
    // Provider URL input should be visible on step 1
    expect(screen.getByPlaceholderText('https://api.openai.com/v1')).toBeTruthy();
  });
});
