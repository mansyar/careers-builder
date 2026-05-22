/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import type { CvProfilerLoaderData } from '../_app/cv-builder';

// Mock scrollIntoView (not implemented in JSDOM)
window.HTMLElement.prototype.scrollIntoView = vi.fn();

const mockLoaderData: CvProfilerLoaderData = {
  profileId: 1,
  activeVersionId: 1,
  full_cv_json: {
    contact: {
      name: 'John',
      email: 'john@test.com',
      phone: '555-0100',
      location: 'NYC',
      linkedin: '',
      website: '',
    },
    summary: 'Experienced developer',
    experience: [
      {
        company: 'Acme',
        role: 'Engineer',
        location: 'NYC',
        startDate: '2020-01',
        endDate: '2023-01',
        current: false,
        description: [],
      },
    ],
    education: [
      {
        institution: 'MIT',
        degree: 'BS',
        field: 'CS',
        startDate: '2016',
        endDate: '2020',
        gpa: '3.8',
      },
    ],
    skills: ['Python', 'TypeScript'],
    projects: [
      { name: 'My App', role: 'Dev', description: 'Cool app', technologies: ['React'], url: '' },
    ],
  },
};

// Mock the server function module
vi.mock('../../lib/server/cv-loader-server', () => ({
  getCvProfileData: vi.fn().mockResolvedValue({
    profileId: 1,
    activeVersionId: 1,
    full_cv_json: {},
  }),
}));

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', { value: true, configurable: true, writable: true });

// Mock TanStack Router hooks used by the component
vi.mock('@tanstack/react-router', () => ({
  createFileRoute:
    () =>
    (opts: {
      component?: React.FC;
      loader?: () => unknown;
      staleTime?: number;
      pendingComponent?: React.FC;
    }) => ({
      options: {
        component: opts.component,
        loader: opts.loader,
        staleTime: opts.staleTime,
        pendingComponent: opts.pendingComponent,
      },
    }),
  useLoaderData: () => mockLoaderData,
}));

// Mock @ai-sdk/react useChat hook (used by ChatPanel when integrated into cv-builder)
const mockUseChat = vi.fn();
vi.mock('@ai-sdk/react', () => ({
  useChat: (...args: unknown[]) => mockUseChat(...args),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

beforeEach(() => {
  localStorage.clear();
  mockFetch.mockReset();
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true, writable: true });
  // Set default useChat mock return value so ChatPanel renders without errors
  mockUseChat.mockReturnValue({
    messages: [],
    sendMessage: vi.fn(),
    status: 'ready',
    error: undefined,
    clearError: vi.fn(),
  });
});

describe('CV Builder route', () => {
  it('should render the heading', async () => {
    const { Route } = await import('../_app/cv-builder');
    const Component = Route.options.component!;
    render(<Component />);
    expect(screen.getByText('CV Builder')).toBeTruthy();
  });

  it('should have a loader function defined', async () => {
    const { Route } = await import('../_app/cv-builder');
    expect(typeof Route.options.loader).toBe('function');
  });

  it('should have a pendingComponent for loading state', async () => {
    const { Route } = await import('../_app/cv-builder');
    expect(Route.options.pendingComponent).toBeDefined();
  });

  it('should store profileId in localStorage after rendering', async () => {
    const { Route } = await import('../_app/cv-builder');
    const Component = Route.options.component!;
    render(<Component />);
    expect(localStorage.getItem('cvProfileId')).toBe('1');
    expect(localStorage.getItem('cvActiveVersionId')).toBe('1');
  });

  it('should render skeleton shimmer when loader is pending', async () => {
    const { Route } = await import('../_app/cv-builder');
    const PendingComponent = Route.options.pendingComponent!;
    render(<PendingComponent />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should have staleTime configured for caching', async () => {
    const { Route } = await import('../_app/cv-builder');
    expect(Route.options.staleTime).toBe(30_000);
  });

  // --- Section Panel Tests ---

  it('should render Contact section with data', async () => {
    const { Route } = await import('../_app/cv-builder');
    const Component = Route.options.component!;
    render(<Component />);
    expect(screen.getByDisplayValue('John')).toBeTruthy();
    expect(screen.getByDisplayValue('john@test.com')).toBeTruthy();
  });

  it('should render Executive Summary section with data', async () => {
    const { Route } = await import('../_app/cv-builder');
    const Component = Route.options.component!;
    render(<Component />);
    expect(screen.getByDisplayValue('Experienced developer')).toBeTruthy();
  });

  it('should render Experience section with data', async () => {
    const { Route } = await import('../_app/cv-builder');
    const Component = Route.options.component!;
    render(<Component />);
    expect(screen.getByDisplayValue('Acme')).toBeTruthy();
    expect(screen.getByDisplayValue('Engineer')).toBeTruthy();
  });

  it('should render Education section with data', async () => {
    const { Route } = await import('../_app/cv-builder');
    const Component = Route.options.component!;
    render(<Component />);
    expect(screen.getByDisplayValue('MIT')).toBeTruthy();
  });

  it('should render Skills section with data', async () => {
    const { Route } = await import('../_app/cv-builder');
    const Component = Route.options.component!;
    render(<Component />);
    // Tags are rendered in spans; use getAllByText with exact match
    const pythonTags = screen.getAllByText((content) => content === 'Python');
    expect(pythonTags.length).toBeGreaterThan(0);
    const tsTags = screen.getAllByText((content) => content === 'TypeScript');
    expect(tsTags.length).toBeGreaterThan(0);
  });

  it('should render Projects section with data', async () => {
    const { Route } = await import('../_app/cv-builder');
    const Component = Route.options.component!;
    render(<Component />);
    expect(screen.getByDisplayValue('My App')).toBeTruthy();
  });

  // --- Save Button Tests ---

  it('should render the Save Changes button', async () => {
    const { Route } = await import('../_app/cv-builder');
    const Component = Route.options.component!;
    render(<Component />);
    expect(screen.getByText('Save Changes')).toBeTruthy();
  });

  it('should show Saving... text while save is in progress', async () => {
    mockFetch.mockImplementationOnce(() => new Promise(() => {})); // Never resolves
    const { Route } = await import('../_app/cv-builder');
    const Component = Route.options.component!;
    render(<Component />);
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);
    expect(screen.getByText('Saving...')).toBeTruthy();
  });

  it('should call PUT endpoint with correct payload on save', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 2, versionNumber: 2, full_cv_json: {} }),
    });
    const { Route } = await import('../_app/cv-builder');
    const Component = Route.options.component!;
    render(<Component />);
    const saveButton = screen.getByText('Save Changes');
    await act(async () => {
      fireEvent.click(saveButton);
    });
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/cv/1/version/1',
      expect.objectContaining({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String),
      }),
    );
    // Verify the body contains form data
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.patch).toBeDefined();
    expect(body.patch.skills).toEqual(['Python', 'TypeScript']);
  });

  it('should show Saved! badge after successful save', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 2, versionNumber: 2, full_cv_json: {} }),
    });
    const { Route } = await import('../_app/cv-builder');
    const Component = Route.options.component!;
    render(<Component />);
    const saveButton = screen.getByText('Save Changes');
    await act(async () => {
      fireEvent.click(saveButton);
    });
    expect(screen.getByText('Saved!')).toBeTruthy();
  });

  it('should show error banner on failed save', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    const { Route } = await import('../_app/cv-builder');
    const Component = Route.options.component!;
    render(<Component />);
    const saveButton = screen.getByText('Save Changes');
    await act(async () => {
      fireEvent.click(saveButton);
    });
    expect(screen.getByText(/Failed to save/i)).toBeTruthy();
    expect(screen.getByText('Retry')).toBeTruthy();
  });

  it('should retry save when Retry button is clicked', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('Network error')) // First fails
      .mockResolvedValueOnce({
        // Retry succeeds
        ok: true,
        json: async () => ({ id: 2, versionNumber: 2, full_cv_json: {} }),
      });
    const { Route } = await import('../_app/cv-builder');
    const Component = Route.options.component!;
    render(<Component />);
    const saveButton = screen.getByText('Save Changes');
    await act(async () => {
      fireEvent.click(saveButton);
    });
    expect(screen.getByText('Retry')).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByText('Retry'));
    });
    // After retry succeeds
    expect(screen.getByText('Saved!')).toBeTruthy();
  });

  // --- Offline Tests ---

  it('should show disabled save button when offline', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    const { Route } = await import('../_app/cv-builder');
    const Component = Route.options.component!;
    render(<Component />);
    expect(screen.getByText('Save Changes')).toBeTruthy();
    const saveButton = screen.getByText('Save Changes');
    expect(saveButton.className).toContain('cursor-not-allowed');
  });

  it('should render skeleton with multiple shimmer panels', async () => {
    const { Route } = await import('../_app/cv-builder');
    const PendingComponent = Route.options.pendingComponent!;
    const { container } = render(<PendingComponent />);
    // Verify multiple animated shimmer panels
    const shimmerPanels = container.querySelectorAll('.animate-pulse');
    expect(shimmerPanels.length).toBeGreaterThanOrEqual(10);
  });

  it('should update form data when contact field changes', async () => {
    const { Route } = await import('../_app/cv-builder');
    const Component = Route.options.component!;
    render(<Component />);
    const nameInput = screen.getByDisplayValue('John');
    fireEvent.change(nameInput, { target: { value: 'Jane' } });
    expect((nameInput as HTMLInputElement).value).toBe('Jane');
  });

  it('should collapse contact section when header is clicked', async () => {
    const { Route } = await import('../_app/cv-builder');
    const Component = Route.options.component!;
    render(<Component />);
    const contactHeader = screen.getByText('Contact');
    fireEvent.click(contactHeader);
    // Contact section should close
    expect(screen.queryByDisplayValue('John')).toBeNull();
  });

  it('should have loader defined', async () => {
    const { Route } = await import('../_app/cv-builder');
    expect(Route.options.loader).toBeDefined();
  });

  it('should show Save Changes text on button', async () => {
    const { Route } = await import('../_app/cv-builder');
    const Component = Route.options.component!;
    render(<Component />);
    expect(screen.getByText('Save Changes')).toBeTruthy();
  });

  // --- ChatPanel Integration Tests ---

  it('should render ChatPanel above the manual form when integrated', async () => {
    mockUseChat.mockReturnValue({
      messages: [],
      sendMessage: vi.fn(),
      status: 'ready',
      error: undefined,
      clearError: vi.fn(),
    });

    // Reset scrollIntoView mock for the ChatPanel's useEffect
    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    const { Route } = await import('../_app/cv-builder');
    const Component = Route.options.component!;
    render(<Component />);

    // ChatPanel header should be present
    expect(screen.getByText('AI Resume Writer')).toBeTruthy();
    // Manual form should still be present
    expect(screen.getByText('Contact')).toBeTruthy();
    expect(screen.getByText('Executive Summary')).toBeTruthy();
  });

  it('should render ChatPanel welcome message with AI greeting', async () => {
    mockUseChat.mockReturnValue({
      messages: [],
      sendMessage: vi.fn(),
      status: 'ready',
      error: undefined,
      clearError: vi.fn(),
    });

    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    const { Route } = await import('../_app/cv-builder');
    const Component = Route.options.component!;
    render(<Component />);

    expect(screen.getByText(/Welcome! I'll be your executive resume writer/i)).toBeTruthy();
  });

  it('should render manual form sections with ChatPanel present', async () => {
    mockUseChat.mockReturnValue({
      messages: [],
      sendMessage: vi.fn(),
      status: 'ready',
      error: undefined,
      clearError: vi.fn(),
    });

    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    const { Route } = await import('../_app/cv-builder');
    const Component = Route.options.component!;
    render(<Component />);

    // All existing sections should render
    expect(screen.getByDisplayValue('John')).toBeTruthy();
    expect(screen.getByDisplayValue('Acme')).toBeTruthy();
    expect(screen.getByDisplayValue('MIT')).toBeTruthy();
  });
});
