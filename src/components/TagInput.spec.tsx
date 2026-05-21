/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TagInput } from './TagInput';

afterEach(() => {
  cleanup();
});

describe('TagInput', () => {
  it('should render an input field', () => {
    const { container } = render(<TagInput tags={[]} onChange={vi.fn()} />);
    const input = container.querySelector('input');
    expect(input).toBeTruthy();
  });

  it('should render existing tags', () => {
    render(<TagInput tags={['React', 'TypeScript']} onChange={vi.fn()} />);
    expect(screen.getByText('React')).toBeTruthy();
    expect(screen.getByText('TypeScript')).toBeTruthy();
  });

  it('should add a tag on Enter key press', () => {
    const onChange = vi.fn();
    const { container } = render(<TagInput tags={[]} onChange={onChange} />);
    const input = container.querySelector('input')!;
    fireEvent.change(input, { target: { value: 'Python' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(['Python']);
  });

  it('should not add empty or whitespace-only tags', () => {
    const onChange = vi.fn();
    const { container } = render(<TagInput tags={[]} onChange={onChange} />);
    const input = container.querySelector('input')!;
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should not add duplicate tags', () => {
    const onChange = vi.fn();
    const { container } = render(<TagInput tags={['React']} onChange={onChange} />);
    const input = container.querySelector('input')!;
    fireEvent.change(input, { target: { value: 'React' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should remove a tag when X is clicked', () => {
    const onChange = vi.fn();
    render(<TagInput tags={['React', 'TypeScript']} onChange={onChange} />);
    const removeButtons = screen.getAllByRole('button');
    fireEvent.click(removeButtons[0]);
    expect(onChange).toHaveBeenCalledWith(['TypeScript']);
  });

  it('should clear input after adding a tag', () => {
    const onChange = vi.fn();
    const { container } = render(<TagInput tags={[]} onChange={onChange} />);
    const input = container.querySelector('input')!;
    fireEvent.change(input, { target: { value: 'Python' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(input.value).toBe('');
  });

  it('should add trimmed tag when value has surrounding whitespace', () => {
    const onChange = vi.fn();
    const { container } = render(<TagInput tags={[]} onChange={onChange} />);
    const input = container.querySelector('input')!;
    fireEvent.change(input, { target: { value: '  Docker  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(['Docker']);
  });

  it('should show placeholder text in empty state', () => {
    const { container } = render(<TagInput tags={[]} onChange={vi.fn()} />);
    const input = container.querySelector('input')!;
    expect(input.placeholder).toBeTruthy();
  });
});
