/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ProjectsSection } from './ProjectsSection';

afterEach(() => {
  cleanup();
});

const defaultEntry = {
  name: 'My App',
  role: 'Developer',
  description: 'A cool project',
  technologies: ['React', 'Node'],
  url: 'https://github.com/myapp',
};

describe('ProjectsSection', () => {
  it('should render existing project entries', () => {
    render(<ProjectsSection data={[defaultEntry]} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('My App')).toBeTruthy();
    expect(screen.getByDisplayValue('Developer')).toBeTruthy();
    expect(screen.getByDisplayValue('A cool project')).toBeTruthy();
  });

  it('should render technology tags', () => {
    render(<ProjectsSection data={[defaultEntry]} onChange={vi.fn()} />);
    expect(screen.getByText('React')).toBeTruthy();
    expect(screen.getByText('Node')).toBeTruthy();
  });

  it('should render URL field', () => {
    render(<ProjectsSection data={[defaultEntry]} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('https://github.com/myapp')).toBeTruthy();
  });

  it('should add a new empty entry', () => {
    const onChange = vi.fn();
    render(<ProjectsSection data={[]} onChange={onChange} />);
    fireEvent.click(screen.getByText('+ Add Project'));
    expect(onChange).toHaveBeenCalledWith([
      { name: '', role: '', description: '', technologies: [], url: '' },
    ]);
  });

  it('should remove an entry', () => {
    const onChange = vi.fn();
    render(<ProjectsSection data={[defaultEntry]} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText(/remove my app/i));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('should show empty state when no entries', () => {
    render(<ProjectsSection data={[]} onChange={vi.fn()} />);
    expect(screen.getByText(/no projects yet/i)).toBeTruthy();
  });

  it('should reorder entries up', () => {
    const onChange = vi.fn();
    const entries = [
      { ...defaultEntry, name: 'First' },
      { ...defaultEntry, name: 'Second' },
    ];
    render(<ProjectsSection data={entries} onChange={onChange} />);
    const moveUpButtons = screen.getAllByLabelText('Move up');
    fireEvent.click(moveUpButtons[1]);
    const result = onChange.mock.calls[0][0];
    expect(result[0].name).toBe('Second');
    expect(result[1].name).toBe('First');
  });

  it('should update role field', () => {
    const onChange = vi.fn();
    render(<ProjectsSection data={[defaultEntry]} onChange={onChange} />);
    const roleInput = screen.getByDisplayValue('Developer');
    fireEvent.change(roleInput, { target: { value: 'Lead' } });
    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ role: 'Lead' })]);
  });

  it('should reorder entries down', () => {
    const onChange = vi.fn();
    const entries = [
      { ...defaultEntry, name: 'First' },
      { ...defaultEntry, name: 'Second' },
    ];
    render(<ProjectsSection data={entries} onChange={onChange} />);
    const moveDownButtons = screen.getAllByLabelText('Move down');
    fireEvent.click(moveDownButtons[0]);
    const result = onChange.mock.calls[0][0];
    expect(result[0].name).toBe('Second');
    expect(result[1].name).toBe('First');
  });

  it('should update description field', () => {
    const onChange = vi.fn();
    render(<ProjectsSection data={[defaultEntry]} onChange={onChange} />);
    const descInput = screen.getByDisplayValue('A cool project');
    fireEvent.change(descInput, { target: { value: 'Updated description' } });
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ description: 'Updated description' }),
    ]);
  });

  it('should update name field', () => {
    const onChange = vi.fn();
    render(<ProjectsSection data={[defaultEntry]} onChange={onChange} />);
    const nameInput = screen.getByDisplayValue('My App');
    fireEvent.change(nameInput, { target: { value: 'My New App' } });
    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ name: 'My New App' })]);
  });
});
