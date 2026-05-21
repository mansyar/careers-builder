/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { Sidebar } from './Sidebar';

afterEach(() => {
  cleanup();
});

// Mock TanStack Router Link
vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    activeProps,
    to,
    ...props
  }: {
    children?: React.ReactNode;
    activeProps?: Record<string, string>;
    to?: string;
    [key: string]: unknown;
  }) => (
    <a
      {...props}
      href={to}
      data-activeprops={activeProps ? JSON.stringify(activeProps) : undefined}
    >
      {children}
    </a>
  ),
}));

function setDesktopViewport() {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('767') === false, // >= 768px = desktop
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

function setMobileViewport() {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('767'), // < 768px = mobile
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

describe('Sidebar - desktop viewport', () => {
  beforeEach(() => {
    setDesktopViewport();
  });

  it('should render with three navigation items', () => {
    render(<Sidebar />);
    expect(screen.getByText('Home')).toBeTruthy();
    expect(screen.getByText('CV Builder')).toBeTruthy();
    expect(screen.getByText('Job Search')).toBeTruthy();
  });

  it('should have a link to the home page', () => {
    render(<Sidebar />);
    const homeLink = screen.getByText('Home');
    expect(homeLink.closest('a')?.getAttribute('href')).toBe('/');
  });

  it('should have a link to the CV Builder page', () => {
    render(<Sidebar />);
    const cvLink = screen.getByText('CV Builder');
    expect(cvLink.closest('a')?.getAttribute('href')).toBe('/cv-builder');
  });

  it('should have a link to the Job Search page', () => {
    render(<Sidebar />);
    const jobLink = screen.getByText('Job Search');
    expect(jobLink.closest('a')?.getAttribute('href')).toBe('/job-search');
  });

  it('should apply activeProps to navigation links', () => {
    render(<Sidebar />);
    const navItems = ['Home', 'CV Builder', 'Job Search'];
    for (const item of navItems) {
      const link = screen.getByText(item).closest('a');
      expect(link).not.toBeNull();
      const activeProps = link!.getAttribute('data-activeprops');
      expect(activeProps).not.toBeNull();
      const parsed = JSON.parse(activeProps!);
      expect(parsed).toHaveProperty('className');
      expect(parsed.className).toContain('is-active');
    }
  });

  it('should not render a hamburger button on desktop', () => {
    render(<Sidebar />);
    expect(screen.queryByLabelText('Open navigation menu')).toBeNull();
  });
});

describe('Sidebar - mobile viewport', () => {
  beforeEach(() => {
    setMobileViewport();
  });

  it('should render a hamburger button', () => {
    render(<Sidebar />);
    expect(screen.getByLabelText('Open navigation menu')).toBeTruthy();
  });

  it('should have sidebar hidden by default on mobile', () => {
    const { container } = render(<Sidebar />);
    const aside = container.querySelector('aside');
    expect(aside?.className).toContain('-translate-x-full');
  });

  it('should toggle sidebar visibility when hamburger is clicked', () => {
    const { container } = render(<Sidebar />);
    const button = screen.getByLabelText('Open navigation menu');

    fireEvent.click(button);
    let aside = container.querySelector('aside');
    expect(aside?.className).toContain('translate-x-0');

    fireEvent.click(button);
    aside = container.querySelector('aside');
    expect(aside?.className).toContain('-translate-x-full');
  });

  it('should show a backdrop when sidebar is open', () => {
    render(<Sidebar />);
    const button = screen.getByLabelText('Open navigation menu');
    fireEvent.click(button);

    // Backdrop is a div with aria-hidden="true" and bg-black/30 class
    const backdrop = document.querySelector('[aria-hidden="true"]');
    expect(backdrop).not.toBeNull();
  });

  it('should close sidebar when backdrop is clicked', () => {
    const { container } = render(<Sidebar />);
    const button = screen.getByLabelText('Open navigation menu');
    fireEvent.click(button);

    const backdrop = document.querySelector('[aria-hidden="true"]');
    expect(backdrop).not.toBeNull();

    fireEvent.click(backdrop!);
    const aside = container.querySelector('aside');
    expect(aside?.className).toContain('-translate-x-full');
  });
});
