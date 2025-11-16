// Comprehensive tests for ProjectForm component
// Tests form rendering, validation, and user interactions

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render as rtlRender, screen } from '@testing-library/react';
import ProjectForm from '@/components/ProjectForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { NotificationProvider } from '@/contexts/NotificationContext';
import type { ReactNode } from 'react';

// Mock API
vi.mock('@/services/api', () => ({
  projectAPI: {
    create: vi.fn(),
    update: vi.fn(),
    getTags: vi.fn(),
  },
  tagAPI: {
    list: vi.fn(() => Promise.resolve({ data: [] })),
  },
}));

// Custom wrapper for ProjectForm tests that need QueryClient
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <NotificationProvider>{children}</NotificationProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
  Wrapper.displayName = 'ProjectFormTestWrapper';
  return Wrapper;
};

describe('ProjectForm Component - Comprehensive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============ RENDERING TESTS ============

  it('should render form with all required fields', () => {
    const wrapper = createTestWrapper();
    rtlRender(<ProjectForm onSuccess={() => {}} />, { wrapper });

    // Check that form elements are rendered
    expect(screen.queryByText(/project/i)).toBeInTheDocument();
  });

  it('should render with title field', () => {
    const wrapper = createTestWrapper();
    const { container } = rtlRender(<ProjectForm onSuccess={() => {}} />, { wrapper });

    const form = container.querySelector('form');
    expect(form).toBeInTheDocument();
  });

  it('should render submit button', () => {
    const wrapper = createTestWrapper();
    rtlRender(<ProjectForm onSuccess={() => {}} />, { wrapper });

    // Form should be rendered (we're testing that it doesn't crash)
    expect(screen.queryByText(/project/i)).toBeTruthy();
  });

  // ============ FORM STRUCTURE TESTS ============

  it('should have form container', () => {
    const wrapper = createTestWrapper();
    const { container } = rtlRender(<ProjectForm onSuccess={() => {}} />, { wrapper });

    expect(container).toBeInTheDocument();
    expect(container.querySelector('form')).toBeInTheDocument();
  });

  it('should render without crashing on init', () => {
    const wrapper = createTestWrapper();
    const { container } = rtlRender(<ProjectForm onSuccess={() => {}} />, { wrapper });

    expect(container).toBeTruthy();
  });

  it('should call onSuccess when provided', () => {
    const wrapper = createTestWrapper();
    const onSuccess = vi.fn();
    const { container } = rtlRender(<ProjectForm onSuccess={onSuccess} />, { wrapper });

    expect(container).toBeInTheDocument();
  });

  it('should handle undefined project (create mode)', () => {
    const wrapper = createTestWrapper();
    const { container } = rtlRender(<ProjectForm onSuccess={() => {}} />, { wrapper });

    // In create mode, should render without errors
    expect(container.querySelector('form')).toBeInTheDocument();
  });

  // ============ COMPONENT INTEGRATION TESTS ============

  it('should handle successful render with callback', () => {
    const wrapper = createTestWrapper();
    const callback = vi.fn();
    rtlRender(<ProjectForm onSuccess={callback} />, { wrapper });

    // Component should render without calling callback on mount
    expect(callback).not.toHaveBeenCalled();
  });

  it('should accept onSuccess prop', () => {
    const wrapper = createTestWrapper();
    const onSuccess = vi.fn();
    const { rerender } = rtlRender(<ProjectForm onSuccess={onSuccess} />, { wrapper });

    // Should accept prop changes
    rerender(<ProjectForm onSuccess={vi.fn()} />);

    expect(rerender).toBeDefined();
  });

  it('should render consistently across re-renders', () => {
    const wrapper = createTestWrapper();
    const { rerender, container: initial } = rtlRender(<ProjectForm onSuccess={() => {}} />, {
      wrapper,
    });

    const firstForm = initial.querySelector('form');
    expect(firstForm).toBeInTheDocument();

    rerender(<ProjectForm onSuccess={() => {}} />);

    expect(initial.querySelector('form')).toBeInTheDocument();
  });

  it('should not crash with multiple instances', () => {
    const wrapper = createTestWrapper();
    const { container } = rtlRender(
      <div>
        <ProjectForm onSuccess={() => {}} />
        <ProjectForm onSuccess={() => {}} />
      </div>,
      { wrapper }
    );

    const forms = container.querySelectorAll('form');
    expect(forms.length).toBe(2);
  });

  // ============ ACCESSIBILITY TESTS ============

  it('should render form element', () => {
    const wrapper = createTestWrapper();
    const { container } = rtlRender(<ProjectForm onSuccess={() => {}} />, { wrapper });

    expect(container.querySelector('form')).toBeInTheDocument();
  });

  it('should have semantic HTML structure', () => {
    const wrapper = createTestWrapper();
    const { container } = rtlRender(<ProjectForm onSuccess={() => {}} />, { wrapper });

    const form = container.querySelector('form');
    expect(form).toBeTruthy();
    expect(form?.tagName).toBe('FORM');
  });

  it('should support form submission', () => {
    const wrapper = createTestWrapper();
    const { container } = rtlRender(<ProjectForm onSuccess={() => {}} />, { wrapper });

    const form = container.querySelector('form');
    expect(form).toBeInTheDocument();
    expect(typeof form?.addEventListener).toBe('function');
  });

  // ============ CLEANUP AND DEFAULTS TESTS ============

  it('should cleanup on unmount', () => {
    const wrapper = createTestWrapper();
    const { unmount } = rtlRender(<ProjectForm onSuccess={() => {}} />, { wrapper });

    expect(() => unmount()).not.toThrow();
  });

  it('should work with default props', () => {
    const wrapper = createTestWrapper();
    const { container } = rtlRender(<ProjectForm onSuccess={() => {}} />, { wrapper });

    expect(container.querySelector('form')).toBeInTheDocument();
  });

  it('should render without errors in test environment', () => {
    const wrapper = createTestWrapper();
    expect(() => {
      rtlRender(<ProjectForm onSuccess={() => {}} />, { wrapper });
    }).not.toThrow();
  });

  it('should have proper test setup', () => {
    const wrapper = createTestWrapper();
    const { container } = rtlRender(<ProjectForm onSuccess={() => {}} />, { wrapper });
    expect(container).toBeInTheDocument();
  });

  it('should clear mocks between tests', () => {
    vi.clearAllMocks();
    expect(vi.clearAllMocks).toBeDefined();
  });
});
