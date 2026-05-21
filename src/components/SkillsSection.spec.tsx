/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SkillsSection } from './SkillsSection';

afterEach(() => {
  cleanup();
});

describe('SkillsSection', () => {
  it('should render existing skills as tags', () => {
    render(<SkillsSection data={['Python', 'React']} onChange={vi.fn()} />);
    expect(screen.getByText('Python')).toBeTruthy();
    expect(screen.getByText('React')).toBeTruthy();
  });

  it('should call onChange when a skill is added', () => {
    const onChange = vi.fn();
    const { container } = render(<SkillsSection data={[]} onChange={onChange} />);
    const input = container.querySelector('input')!;
    fireEvent.change(input, { target: { value: 'TypeScript' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(['TypeScript']);
  });

  it('should call onChange when a skill is removed', () => {
    const onChange = vi.fn();
    render(<SkillsSection data={['Python', 'React']} onChange={onChange} />);
    const removeButtons = screen.getAllByRole('button');
    fireEvent.click(removeButtons[0]);
    expect(onChange).toHaveBeenCalledWith(['React']);
  });
});
