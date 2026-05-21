/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Sidebar } from './Sidebar';

afterEach(() => {
  cleanup();
});

// Mock TanStack Router Link to avoid needing router context in unit tests
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

describe('Sidebar', () => {
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
});
