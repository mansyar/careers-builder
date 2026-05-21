/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { CvProfilerLoaderData } from '../_app/cv-builder';

const mockLoaderData: CvProfilerLoaderData = {
  profileId: 1,
  activeVersionId: 1,
  full_cv_json: {},
};

// Mock the server function module
vi.mock('../../lib/server/cv-loader-server', () => ({
  getCvProfileData: vi.fn().mockResolvedValue({
    profileId: 1,
    activeVersionId: 1,
    full_cv_json: {},
  }),
}));

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

afterEach(() => {
  cleanup();
  localStorage.clear();
});

beforeEach(() => {
  localStorage.clear();
});

describe('CV Builder route', () => {
  it('should render the heading', async () => {
    const { Route } = await import('../_app/cv-builder');
    const Component = Route.options.component!;
    render(<Component />);
    expect(screen.getByText('CV Builder')).toBeTruthy();
  });

  it('should render the loader data heading', async () => {
    const { Route } = await import('../_app/cv-builder');
    const Component = Route.options.component!;
    render(<Component />);
    expect(screen.getByText(/Edit your CV details manually/)).toBeTruthy();
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

    // Should render multiple skeleton placeholders
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should have staleTime configured for caching across navigation', async () => {
    const { Route } = await import('../_app/cv-builder');
    expect(Route.options.staleTime).toBe(30_000);
  });
});
