/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ExecutiveSummarySection } from './ExecutiveSummarySection';

afterEach(() => {
  cleanup();
});

describe('ExecutiveSummarySection', () => {
  it('should render a textarea', () => {
    render(<ExecutiveSummarySection data="" onChange={vi.fn()} />);
    const textarea = screen.getByPlaceholderText(/briefly describe/i);
    expect(textarea).toBeTruthy();
  });

  it('should show word count', () => {
    render(<ExecutiveSummarySection data="Hello world" onChange={vi.fn()} />);
    expect(screen.getByText(/2\/500 words/)).toBeTruthy();
  });

  it('should call onChange when text is entered', () => {
    const onChange = vi.fn();
    render(<ExecutiveSummarySection data="" onChange={onChange} />);
    const textarea = screen.getByPlaceholderText(/briefly describe/i);
    fireEvent.change(textarea, { target: { value: 'Experienced developer' } });
    expect(onChange).toHaveBeenCalledWith('Experienced developer');
  });

  it('should show warning when over 500 words', () => {
    const longText = Array.from({ length: 501 }, () => 'word').join(' ');
    render(<ExecutiveSummarySection data={longText} onChange={vi.fn()} />);
    const wordDisplay = screen.getByText(/501\/500 words/);
    expect(wordDisplay).toBeTruthy();
    expect(wordDisplay.className).toContain('red');
  });
});
