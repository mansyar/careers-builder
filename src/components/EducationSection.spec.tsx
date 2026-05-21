/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { EducationSection } from './EducationSection';

afterEach(() => {
  cleanup();
});

const defaultEntry = {
  institution: 'MIT',
  degree: 'BS',
  field: 'Computer Science',
  startDate: '2016-09',
  endDate: '2020-06',
  gpa: '3.8',
};

describe('EducationSection', () => {
  it('should render existing education entries', () => {
    render(<EducationSection data={[defaultEntry]} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('MIT')).toBeTruthy();
    expect(screen.getByDisplayValue('BS')).toBeTruthy();
    expect(screen.getByDisplayValue('Computer Science')).toBeTruthy();
  });

  it('should render all fields including dates and gpa', () => {
    const entryWithFullDates = {
      ...defaultEntry,
      startDate: '2016-09-01',
      endDate: '2020-06-15',
    };
    render(<EducationSection data={[entryWithFullDates]} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('2016-09-01')).toBeTruthy();
    expect(screen.getByDisplayValue('2020-06-15')).toBeTruthy();
    expect(screen.getByDisplayValue('3.8')).toBeTruthy();
  });

  it('should add a new empty entry', () => {
    const onChange = vi.fn();
    render(<EducationSection data={[]} onChange={onChange} />);
    fireEvent.click(screen.getByText('+ Add Education'));
    expect(onChange).toHaveBeenCalledWith([
      { institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '' },
    ]);
  });

  it('should remove an entry', () => {
    const onChange = vi.fn();
    render(<EducationSection data={[defaultEntry]} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText(/remove mit/i));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('should show empty state when no entries', () => {
    render(<EducationSection data={[]} onChange={vi.fn()} />);
    expect(screen.getByText(/no education entries/i)).toBeTruthy();
  });

  it('should update field when value changes', () => {
    const onChange = vi.fn();
    render(<EducationSection data={[defaultEntry]} onChange={onChange} />);
    const fieldInput = screen.getByDisplayValue('Computer Science');
    fireEvent.change(fieldInput, { target: { value: 'Physics' } });
    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ field: 'Physics' })]);
  });

  it('should update degree field', () => {
    const onChange = vi.fn();
    render(<EducationSection data={[defaultEntry]} onChange={onChange} />);
    const degreeInput = screen.getByDisplayValue('BS');
    fireEvent.change(degreeInput, { target: { value: 'MS' } });
    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ degree: 'MS' })]);
  });

  it('should update institution field', () => {
    const onChange = vi.fn();
    render(<EducationSection data={[defaultEntry]} onChange={onChange} />);
    const instInput = screen.getByDisplayValue('MIT');
    fireEvent.change(instInput, { target: { value: 'Stanford' } });
    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ institution: 'Stanford' })]);
  });
});
