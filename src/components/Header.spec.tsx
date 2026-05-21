/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Header } from './Header';

afterEach(() => {
  cleanup();
});

// Mock ThemeToggle since it uses matchMedia
vi.mock('./ThemeToggle', () => ({
  ThemeToggle: () => <button type="button">Theme toggle mock</button>,
}));

// Mock TanStack Router Link to avoid needing router context in unit tests
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
    <a {...props}>{children}</a>
  ),
}));

describe('Header', () => {
  it('should render the brand name', () => {
    render(<Header />);
    expect(screen.getByText('Careers Builder')).toBeTruthy();
  });

  it('should render the theme toggle', () => {
    render(<Header />);
    expect(screen.getByText('Theme toggle mock')).toBeTruthy();
  });

  it('should NOT render inline navigation links', () => {
    render(<Header />);
    expect(screen.queryByText('Home')).toBeNull();
    expect(screen.queryByText('About')).toBeNull();
    expect(screen.queryByText('Features')).toBeNull();
  });
});
