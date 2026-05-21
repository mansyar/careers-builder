/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CollapsibleSection } from './CollapsibleSection';

afterEach(() => {
  cleanup();
});

describe('CollapsibleSection', () => {
  it('should render the header with section name', () => {
    render(
      <CollapsibleSection title="Experience">
        <p>Content</p>
      </CollapsibleSection>,
    );
    expect(screen.getByText('Experience')).toBeTruthy();
  });

  it('should show content when expanded by default', () => {
    render(
      <CollapsibleSection title="Skills" defaultOpen>
        <p>Skills content</p>
      </CollapsibleSection>,
    );
    expect(screen.getByText('Skills content')).toBeTruthy();
  });

  it('should hide content when collapsed by default', () => {
    render(
      <CollapsibleSection title="Education" defaultOpen={false}>
        <p>Hidden content</p>
      </CollapsibleSection>,
    );
    expect(screen.queryByText('Hidden content')).toBeNull();
  });

  it('should toggle content visibility on header click', () => {
    render(
      <CollapsibleSection title="Experience">
        <p>Toggle me</p>
      </CollapsibleSection>,
    );

    const header = screen.getByText('Experience');
    expect(screen.queryByText('Toggle me')).toBeNull();

    fireEvent.click(header);
    expect(screen.getByText('Toggle me')).toBeTruthy();

    fireEvent.click(header);
    expect(screen.queryByText('Toggle me')).toBeNull();
  });

  it('should show empty placeholder when children are not provided', () => {
    render(<CollapsibleSection title="Projects" defaultOpen />);
    expect(screen.getByText(/No entries yet/i)).toBeTruthy();
  });

  it('should render custom empty state when provided', () => {
    render(
      <CollapsibleSection title="Projects" emptyText="Nothing here yet" defaultOpen>
        {null}
      </CollapsibleSection>,
    );
    expect(screen.getByText('Nothing here yet')).toBeTruthy();
  });

  it('should show an add button in the empty state', () => {
    render(<CollapsibleSection title="Projects" onAdd={vi.fn()} defaultOpen />);
    const addButton = screen.getByRole('button', { name: /add/i });
    expect(addButton).toBeTruthy();
  });

  it('should call onAdd when add button is clicked', () => {
    const onAdd = vi.fn();
    render(<CollapsibleSection title="Projects" onAdd={onAdd} defaultOpen />);
    const addButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(addButton);
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('should not show add button when onAdd is not provided', () => {
    render(<CollapsibleSection title="Projects" defaultOpen />);
    expect(screen.queryByRole('button', { name: /add/i })).toBeNull();
  });

  it('should toggle aria-expanded attribute on header click', () => {
    render(
      <CollapsibleSection title="Certifications">
        <p>Content</p>
      </CollapsibleSection>,
    );
    const header = screen.getByText('Certifications');
    const button = header.closest('button')!;
    expect(button.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(header);
    expect(button.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(header);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('should work with React.Fragment as children', () => {
    render(
      <CollapsibleSection title="Skills" defaultOpen>
        <>Fragment content</>
      </CollapsibleSection>,
    );
    expect(screen.getByText('Fragment content')).toBeTruthy();
  });

  it('should render default empty text when not provided', () => {
    render(<CollapsibleSection title="Empty" defaultOpen />);
    expect(screen.getByText(/No entries yet/i)).toBeTruthy();
  });
});
