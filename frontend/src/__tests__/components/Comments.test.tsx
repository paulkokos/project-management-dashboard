import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CommentItem from '@/components/CommentItem';
import CommentList from '@/components/CommentList';
import CommentForm from '@/components/CommentForm';
import CommentThread from '@/components/CommentThread';

describe('CommentItem', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
  };

  const mockComment = {
    id: 1,
    content: 'This is a test comment',
    author: mockUser,
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-01T10:00:00Z',
    is_edited: false,
    reply_count: 2,
  };

  it('renders comment with author details', () => {
    render(
      <CommentItem
        {...mockComment}
        isAuthor={true}
      />
    );

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('This is a test comment')).toBeInTheDocument();
  });

  it('shows edit button for author', () => {
    render(
      <CommentItem
        {...mockComment}
        isAuthor={true}
      />
    );

    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('hides edit button for non-author', () => {
    render(
      <CommentItem
        {...mockComment}
        isAuthor={false}
      />
    );

    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  it('enters edit mode when edit button clicked', () => {
    render(
      <CommentItem
        {...mockComment}
        isAuthor={true}
      />
    );

    fireEvent.click(screen.getByText('Edit'));

    expect(screen.getByDisplayValue('This is a test comment')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('shows reply count when available', () => {
    render(
      <CommentItem
        {...mockComment}
        reply_count={2}
        isAuthor={true}
      />
    );

    expect(screen.getByText('2 replies')).toBeInTheDocument();
  });

  it('shows is_edited indicator', () => {
    render(
      <CommentItem
        {...mockComment}
        is_edited={true}
        isAuthor={true}
      />
    );

    expect(screen.getByText(/edited/)).toBeInTheDocument();
  });

  it('calls onEdit when save clicked', async () => {
    const handleEdit = vi.fn();
    render(
      <CommentItem
        {...mockComment}
        isAuthor={true}
        onEdit={handleEdit}
      />
    );

    fireEvent.click(screen.getByText('Edit'));
    const textarea = screen.getByDisplayValue('This is a test comment');
    fireEvent.change(textarea, { target: { value: 'Edited content' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(handleEdit).toHaveBeenCalledWith(1, 'Edited content');
    });
  });
});

describe('CommentList', () => {
  const mockComments = [
    {
      id: 1,
      content: 'First comment',
      author: { id: 1, username: 'user1', email: 'user1@test.com', first_name: 'User', last_name: 'One' },
      created_at: '2025-01-01T10:00:00Z',
      updated_at: '2025-01-01T10:00:00Z',
      is_edited: false,
      reply_count: 0,
    },
    {
      id: 2,
      content: 'Second comment',
      author: { id: 2, username: 'user2', email: 'user2@test.com', first_name: 'User', last_name: 'Two' },
      created_at: '2025-01-01T11:00:00Z',
      updated_at: '2025-01-01T11:00:00Z',
      is_edited: false,
      reply_count: 1,
    },
  ];

  it('renders list of comments', () => {
    render(
      <CommentList
        comments={mockComments}
        currentUserId={1}
      />
    );

    expect(screen.getByText('First comment')).toBeInTheDocument();
    expect(screen.getByText('Second comment')).toBeInTheDocument();
  });

  it('shows empty state when no comments', () => {
    render(
      <CommentList
        comments={[]}
        currentUserId={1}
        isEmpty={true}
        emptyMessage="No comments yet"
      />
    );

    expect(screen.getByText('No comments yet')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <CommentList
        comments={[]}
        currentUserId={1}
        isLoading={true}
      />
    );

    const spinner = screen.getByRole('main', { hidden: true }) || screen.queryByText('', { selector: '.animate-spin' });
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });
});

describe('CommentForm', () => {
  it('renders form with textarea', () => {
    render(
      <CommentForm
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument();
  });

  it('shows character counter', () => {
    render(
      <CommentForm
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText(/0 \/ 5000 characters/)).toBeInTheDocument();
  });

  it('updates character counter on input', () => {
    render(
      <CommentForm
        onSubmit={vi.fn()}
      />
    );

    const textarea = screen.getByPlaceholderText('Add a comment...');
    fireEvent.change(textarea, { target: { value: 'Hello' } });

    expect(screen.getByText(/5 \/ 5000 characters/)).toBeInTheDocument();
  });

  it('disables submit button when empty', () => {
    render(
      <CommentForm
        onSubmit={vi.fn()}
      />
    );

    const submitButton = screen.getByText('Post');
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button with valid content', () => {
    render(
      <CommentForm
        onSubmit={vi.fn()}
      />
    );

    const textarea = screen.getByPlaceholderText('Add a comment...');
    fireEvent.change(textarea, { target: { value: 'Valid comment' } });

    const submitButton = screen.getByText('Post');
    expect(submitButton).not.toBeDisabled();
  });

  it('calls onSubmit when form submitted', async () => {
    const handleSubmit = vi.fn();
    render(
      <CommentForm
        onSubmit={handleSubmit}
      />
    );

    const textarea = screen.getByPlaceholderText('Add a comment...');
    fireEvent.change(textarea, { target: { value: 'Test comment' } });
    fireEvent.click(screen.getByText('Post'));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith('Test comment');
    });
  });

  it('shows write/preview tabs', () => {
    render(
      <CommentForm
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText('Write')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('toggles preview mode', () => {
    render(
      <CommentForm
        onSubmit={vi.fn()}
      />
    );

    const textarea = screen.getByPlaceholderText('Add a comment...');
    fireEvent.change(textarea, { target: { value: 'Preview test' } });

    fireEvent.click(screen.getByText('Preview'));

    expect(screen.getByText('Preview test')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Add a comment...')).not.toBeInTheDocument();
  });
});

describe('CommentThread', () => {
  const mockComment = {
    id: 1,
    content: 'Parent comment',
    author: { id: 1, username: 'user1', email: 'user1@test.com', first_name: 'User', last_name: 'One' },
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-01T10:00:00Z',
    is_edited: false,
  };

  const mockReplies = [
    {
      id: 2,
      content: 'First reply',
      author: { id: 2, username: 'user2', email: 'user2@test.com', first_name: 'User', last_name: 'Two' },
      created_at: '2025-01-01T11:00:00Z',
      updated_at: '2025-01-01T11:00:00Z',
      is_edited: false,
      reply_count: 0,
    },
  ];

  it('renders parent comment and replies', () => {
    render(
      <CommentThread
        {...mockComment}
        replies={mockReplies}
        currentUserId={1}
      />
    );

    expect(screen.getByText('Parent comment')).toBeInTheDocument();
    expect(screen.getByText('First reply')).toBeInTheDocument();
  });

  it('shows reply count badge', () => {
    render(
      <CommentThread
        {...mockComment}
        replies={mockReplies}
        currentUserId={1}
      />
    );

    const replyBadges = screen.getAllByText(/1 reply/);
    expect(replyBadges.length).toBeGreaterThan(0);
  });

  it('toggles reply visibility', () => {
    render(
      <CommentThread
        {...mockComment}
        replies={mockReplies}
        currentUserId={1}
      />
    );

    const toggleButton = screen.getByText(/Hide 1 reply/);
    fireEvent.click(toggleButton);

    expect(screen.getByText(/Show 1 reply/)).toBeInTheDocument();
    expect(screen.queryByText('First reply')).not.toBeInTheDocument();
  });

  it('shows reply form when reply button clicked', () => {
    render(
      <CommentThread
        {...mockComment}
        replies={mockReplies}
        currentUserId={1}
      />
    );

    const replyButton = screen.getByText('Reply');
    fireEvent.click(replyButton);

    expect(screen.getByPlaceholderText('Write a reply...')).toBeInTheDocument();
  });
});
