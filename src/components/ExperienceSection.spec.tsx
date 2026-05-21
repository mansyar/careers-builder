/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ExperienceSection } from './ExperienceSection';

afterEach(() => {
  cleanup();
});

const defaultEntry = {
  company: 'Acme Corp',
  role: 'Engineer',
  location: 'NYC',
  startDate: '2020-01-15',
  endDate: '2023-01-20',
  current: false,
  description: [],
};

describe('ExperienceSection', () => {
  it('should render existing experience entries', () => {
    render(<ExperienceSection data={[defaultEntry]} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('Acme Corp')).toBeTruthy();
    expect(screen.getByDisplayValue('Engineer')).toBeTruthy();
  });

  it('should render all fields for each entry', () => {
    render(<ExperienceSection data={[defaultEntry]} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('NYC')).toBeTruthy();
    expect(screen.getByDisplayValue('2020-01-15')).toBeTruthy();
    expect(screen.getByDisplayValue('2023-01-20')).toBeTruthy();
  });

  it('should add a new empty entry', () => {
    const onChange = vi.fn();
    render(<ExperienceSection data={[]} onChange={onChange} />);
    const addButton = screen.getByText('+ Add Experience');
    fireEvent.click(addButton);
    expect(onChange).toHaveBeenCalledWith([
      {
        company: '',
        role: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        description: [],
      },
    ]);
  });

  it('should remove an entry', () => {
    const onChange = vi.fn();
    render(<ExperienceSection data={[defaultEntry]} onChange={onChange} />);
    const removeButton = screen.getByLabelText(/remove acme corp/i);
    fireEvent.click(removeButton);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('should reorder entries up', () => {
    const onChange = vi.fn();
    const entries = [
      { ...defaultEntry, company: 'First' },
      { ...defaultEntry, company: 'Second' },
    ];
    render(<ExperienceSection data={entries} onChange={onChange} />);
    const moveUpButtons = screen.getAllByLabelText('Move up');
    fireEvent.click(moveUpButtons[1]); // Move "Second" up
    expect(onChange).toHaveBeenCalled();
    const result = onChange.mock.calls[0][0];
    expect(result[0].company).toBe('Second');
    expect(result[1].company).toBe('First');
  });

  it('should show empty state when no entries', () => {
    render(<ExperienceSection data={[]} onChange={vi.fn()} />);
    expect(screen.getByText(/no experience entries/i)).toBeTruthy();
  });

  it('should hide endDate when "Currently working here" is checked', () => {
    const entryWithCurrent = { ...defaultEntry, current: true };
    render(<ExperienceSection data={[entryWithCurrent]} onChange={vi.fn()} />);
    const checkbox = screen.getByLabelText(/currently working here/i);
    expect(checkbox).toBeTruthy();
    // End date field should not be rendered
    const endDateInput = screen.queryByDisplayValue('2023-01-20');
    expect(endDateInput).toBeNull();
  });

  it('should toggle current checkbox', () => {
    const onChange = vi.fn();
    render(<ExperienceSection data={[defaultEntry]} onChange={onChange} />);
    const checkbox = screen.getByLabelText(/currently working here/i);
    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ current: true })]);
  });

  it('should disable move up button on first entry', () => {
    render(<ExperienceSection data={[defaultEntry]} onChange={vi.fn()} />);
    const moveUpButtons = screen.getAllByLabelText('Move up');
    expect(moveUpButtons[0].hasAttribute('disabled')).toBe(true);
  });

  it('should update location field', () => {
    const onChange = vi.fn();
    render(<ExperienceSection data={[defaultEntry]} onChange={onChange} />);
    const locInput = screen.getByDisplayValue('NYC');
    fireEvent.change(locInput, { target: { value: 'SF' } });
    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ location: 'SF' })]);
  });

  it('should reorder entries down', () => {
    const onChange = vi.fn();
    const entries = [
      { ...defaultEntry, company: 'First' },
      { ...defaultEntry, company: 'Second' },
    ];
    render(<ExperienceSection data={entries} onChange={onChange} />);
    const moveDownButtons = screen.getAllByLabelText('Move down');
    fireEvent.click(moveDownButtons[0]); // Move "First" down
    const result = onChange.mock.calls[0][0];
    expect(result[0].company).toBe('Second');
    expect(result[1].company).toBe('First');
  });

  it('should disable move down button on last entry', () => {
    const entries = [
      { ...defaultEntry, company: 'First' },
      { ...defaultEntry, company: 'Second' },
    ];
    render(<ExperienceSection data={entries} onChange={vi.fn()} />);
    const moveDownButtons = screen.getAllByLabelText('Move down');
    expect(moveDownButtons[1].hasAttribute('disabled')).toBe(true);
  });

  it('should update role field', () => {
    const onChange = vi.fn();
    render(<ExperienceSection data={[defaultEntry]} onChange={onChange} />);
    const roleInput = screen.getByDisplayValue('Engineer');
    fireEvent.change(roleInput, { target: { value: 'Senior Engineer' } });
    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ role: 'Senior Engineer' })]);
  });

  it('should update company field', () => {
    const onChange = vi.fn();
    render(<ExperienceSection data={[defaultEntry]} onChange={onChange} />);
    const companyInput = screen.getByDisplayValue('Acme Corp');
    fireEvent.change(companyInput, { target: { value: 'Beta Inc' } });
    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ company: 'Beta Inc' })]);
  });
});
