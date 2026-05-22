/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

// Mock scrollIntoView (not implemented in JSDOM)
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock the useChat hook from @ai-sdk/react
const mockUseChat = vi.fn();
vi.mock('@ai-sdk/react', () => ({
  useChat: (...args: unknown[]) => mockUseChat(...args),
}));

const defaultMockChat = {
  messages: [],
  sendMessage: vi.fn(),
  status: 'ready',
  error: undefined,
  clearError: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUseChat.mockReturnValue({ ...defaultMockChat });
});

afterEach(() => {
  cleanup();
});

describe('ChatPanel', () => {
  it('renders welcome message when no messages exist', async () => {
    const { ChatPanel } = await import('./ChatPanel');
    render(<ChatPanel />);

    expect(screen.getByText(/Welcome! I'll be your executive resume writer/i)).toBeTruthy();
  });

  it('renders a list of messages with AI left-aligned and user right-aligned', async () => {
    const { ChatPanel } = await import('./ChatPanel');
    mockUseChat.mockReturnValue({
      ...defaultMockChat,
      messages: [
        { id: '1', role: 'assistant', content: 'Hello, how can I help?' },
        { id: '2', role: 'user', content: 'I want to build my CV' },
      ],
    });

    render(<ChatPanel />);

    expect(screen.getByText('Hello, how can I help?')).toBeTruthy();
    expect(screen.getByText('I want to build my CV')).toBeTruthy();
  });

  it('disables input field while AI is streaming', async () => {
    const { ChatPanel } = await import('./ChatPanel');
    mockUseChat.mockReturnValue({
      ...defaultMockChat,
      status: 'streaming',
    });

    render(<ChatPanel />);
    const input = screen.getByPlaceholderText(/Type your message/i);
    expect((input as HTMLInputElement).disabled).toBe(true);
  });

  it('disables send button while AI is streaming', async () => {
    const { ChatPanel } = await import('./ChatPanel');
    mockUseChat.mockReturnValue({
      ...defaultMockChat,
      status: 'streaming',
    });

    render(<ChatPanel />);
    const sendButton = screen.getByText('Send');
    expect((sendButton as HTMLButtonElement).disabled).toBe(true);
  });

  it('sends a message when Enter is pressed', async () => {
    const { ChatPanel } = await import('./ChatPanel');
    const sendMessage = vi.fn();
    mockUseChat.mockReturnValue({
      ...defaultMockChat,
      sendMessage,
    });

    render(<ChatPanel />);
    const input = screen.getByPlaceholderText(/Type your message/i);

    // Type a message
    fireEvent.change(input, { target: { value: 'Hello' } });
    // Press Enter
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(sendMessage).toHaveBeenCalledWith({ text: 'Hello' });
  });

  it('shows error state with Connection lost banner and Retry button', async () => {
    const { ChatPanel } = await import('./ChatPanel');
    const sendMessage = vi.fn();
    const clearError = vi.fn();
    mockUseChat.mockReturnValue({
      ...defaultMockChat,
      error: new Error('Network error'),
      sendMessage,
      clearError,
      messages: [
        { id: '1', role: 'user', content: 'Hello' },
        { id: '2', role: 'assistant', content: 'Hi there' },
      ],
    });

    render(<ChatPanel />);

    expect(screen.getByText(/Connection to the AI provider was lost/i)).toBeTruthy();
    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeTruthy();

    fireEvent.click(retryButton);
    expect(clearError).toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalledWith({ text: 'Hello' });
  });

  it('shows connecting spinner while waiting for response', async () => {
    const { ChatPanel } = await import('./ChatPanel');
    mockUseChat.mockReturnValue({
      ...defaultMockChat,
      messages: [{ id: '1', role: 'user', content: 'Hello' }],
      status: 'streaming',
    });

    render(<ChatPanel />);
    expect(screen.getByText(/Connecting to AI provider/i)).toBeTruthy();
  });

  it('shows missing provider placeholder with link to settings', async () => {
    const { ChatPanel } = await import('./ChatPanel');
    mockUseChat.mockReturnValue({
      ...defaultMockChat,
      error: new Error('AI provider not configured'),
    });

    render(<ChatPanel />);
    expect(screen.getByText(/Configure your AI provider in settings/i)).toBeTruthy();
  });

  it('renders Done - extract this section placeholder button on AI messages', async () => {
    const { ChatPanel } = await import('./ChatPanel');
    mockUseChat.mockReturnValue({
      ...defaultMockChat,
      messages: [{ id: '1', role: 'assistant', content: 'What is your name?' }],
    });

    render(<ChatPanel />);
    const extractButtons = screen.getAllByText(/Done.*extract this section/i);
    expect(extractButtons.length).toBeGreaterThan(0);
  });
});
