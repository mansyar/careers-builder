/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ContactSection } from './ContactSection';

afterEach(() => {
  cleanup();
});

const defaultData = {
  name: 'John Doe',
  email: 'john@test.com',
  phone: '555-0100',
  location: 'New York',
  linkedin: 'https://linkedin.com/in/john',
  website: 'https://johndoe.com',
};

describe('ContactSection', () => {
  it('should render all contact fields', () => {
    render(<ContactSection data={defaultData} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('John Doe')).toBeTruthy();
    expect(screen.getByDisplayValue('john@test.com')).toBeTruthy();
    expect(screen.getByDisplayValue('555-0100')).toBeTruthy();
    expect(screen.getByDisplayValue('New York')).toBeTruthy();
    expect(screen.getByDisplayValue('https://linkedin.com/in/john')).toBeTruthy();
    expect(screen.getByDisplayValue('https://johndoe.com')).toBeTruthy();
  });

  it('should call onChange when a field is edited', () => {
    const onChange = vi.fn();
    render(<ContactSection data={defaultData} onChange={onChange} />);
    const nameInput = screen.getByDisplayValue('John Doe');
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ name: 'Jane Doe' }));
  });

  it('should render labels for all fields', () => {
    render(<ContactSection data={defaultData} onChange={vi.fn()} />);
    expect(screen.getByText('Full Name')).toBeTruthy();
    expect(screen.getByText('Email')).toBeTruthy();
    expect(screen.getByText('Phone')).toBeTruthy();
    expect(screen.getByText('Location')).toBeTruthy();
    expect(screen.getByText('LinkedIn URL')).toBeTruthy();
    expect(screen.getByText('Website')).toBeTruthy();
  });

  it('should update email field', () => {
    const onChange = vi.fn();
    render(<ContactSection data={defaultData} onChange={onChange} />);
    const emailInput = screen.getByDisplayValue('john@test.com');
    fireEvent.change(emailInput, { target: { value: 'jane@test.com' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ email: 'jane@test.com' }));
  });

  it('should update phone field', () => {
    const onChange = vi.fn();
    render(<ContactSection data={defaultData} onChange={onChange} />);
    const phoneInput = screen.getByDisplayValue('555-0100');
    fireEvent.change(phoneInput, { target: { value: '555-0200' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ phone: '555-0200' }));
  });

  it('should show required asterisk on name field', () => {
    render(<ContactSection data={defaultData} onChange={vi.fn()} />);
    const fullNameLabel = screen.getByText('Full Name');
    expect(fullNameLabel.querySelector('.text-red-500')?.textContent).toBe('*');
  });

  it('should update location field', () => {
    const onChange = vi.fn();
    render(<ContactSection data={defaultData} onChange={onChange} />);
    const locInput = screen.getByDisplayValue('New York');
    fireEvent.change(locInput, { target: { value: 'San Francisco' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ location: 'San Francisco' }));
  });

  it('should update linkedin field', () => {
    const onChange = vi.fn();
    render(<ContactSection data={defaultData} onChange={onChange} />);
    const liInput = screen.getByDisplayValue('https://linkedin.com/in/john');
    fireEvent.change(liInput, { target: { value: 'https://linkedin.com/in/jane' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ linkedin: 'https://linkedin.com/in/jane' }),
    );
  });

  it('should update website field', () => {
    const onChange = vi.fn();
    render(<ContactSection data={defaultData} onChange={onChange} />);
    const webInput = screen.getByDisplayValue('https://johndoe.com');
    fireEvent.change(webInput, { target: { value: 'https://janedoe.com' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ website: 'https://janedoe.com' }),
    );
  });
});
