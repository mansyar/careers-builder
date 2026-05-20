/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ThemeToggle } from './ThemeToggle'

afterEach(() => {
  cleanup()
})

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.removeAttribute('data-theme')

  // jsdom does not implement matchMedia
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
})

describe('ThemeToggle', () => {
  it('should render the toggle button', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    expect(button).toBeTruthy()
  })

  it('should start with auto mode when no theme is stored', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    expect(button.textContent).toBe('Auto')
  })

  it('should cycle through light -> dark -> auto on clicks', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button')

    // First click: auto -> light
    fireEvent.click(button)
    expect(button.textContent).toBe('Light')
    expect(localStorage.getItem('theme')).toBe('light')

    // Second click: light -> dark
    fireEvent.click(button)
    expect(button.textContent).toBe('Dark')
    expect(localStorage.getItem('theme')).toBe('dark')

    // Third click: dark -> auto
    fireEvent.click(button)
    expect(button.textContent).toBe('Auto')
    expect(localStorage.getItem('theme')).toBe('auto')
  })

  it('should restore stored theme from localStorage', () => {
    localStorage.setItem('theme', 'dark')
    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    expect(button.textContent).toBe('Dark')
  })
})
