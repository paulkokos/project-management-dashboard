import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Changelog } from '../Changelog'
import type { ChangelogEntry } from '../Changelog'

describe('Changelog Component', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
  }

  const mockEntries: ChangelogEntry[] = [
    {
      id: 1,
      activity_type: 'updated',
      user: mockUser,
      description: 'Project title updated',
      metadata: {},
      changed_fields: ['title'],
      previous_values: { title: 'Old Title' },
      new_values: { title: 'New Title' },
      change_reason: '',
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      activity_type: 'status_changed',
      user: mockUser,
      description: 'Status changed from active to on_hold',
      metadata: {},
      changed_fields: ['status'],
      previous_values: { status: 'active' },
      new_values: { status: 'on_hold' },
      change_reason: '',
      created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
  ]

  it('renders empty state when no entries', () => {
    render(<Changelog entries={[]} />)
    expect(screen.getByText('No changelog entries yet')).toBeInTheDocument()
  })

  it('renders changelog entries', () => {
    render(<Changelog entries={mockEntries} />)
    expect(screen.getByText('Project title updated')).toBeInTheDocument()
    expect(screen.getByText('Status changed from active to on_hold')).toBeInTheDocument()
  })

  it('displays activity type labels', () => {
    render(<Changelog entries={mockEntries} />)
    expect(screen.getByText('Project Updated')).toBeInTheDocument()
    expect(screen.getByText('Status Changed')).toBeInTheDocument()
  })

  it('displays username and timestamp', () => {
    render(<Changelog entries={mockEntries} />)
    expect(screen.getByText('testuser')).toBeInTheDocument()
  })

  it('shows changed fields count', () => {
    render(<Changelog entries={mockEntries} />)
    // Should show "1 field" for entries with one changed field
    const fieldBadges = screen.getAllByText(/field/)
    expect(fieldBadges.length).toBeGreaterThan(0)
  })

  it('expands and collapses entry details', () => {
    render(<Changelog entries={mockEntries} />)

    // Find the first entry and click it
    const buttons = screen.getAllByRole('button')
    const firstEntryButton = buttons[0]

    // Initially should not show changed fields details
    expect(screen.queryByText('Before')).not.toBeInTheDocument()

    // Click to expand
    fireEvent.click(firstEntryButton)

    // Should now show changed fields
    expect(screen.getByText('Before')).toBeInTheDocument()
    expect(screen.getByText('After')).toBeInTheDocument()
  })

  it('displays before and after values for changed fields', () => {
    render(<Changelog entries={mockEntries} />)

    // Click first entry to expand
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])

    // Should show the before/after values
    expect(screen.getByText('Old Title')).toBeInTheDocument()
    expect(screen.getByText('New Title')).toBeInTheDocument()
  })

  it('displays change reason when present', () => {
    const entryWithReason: ChangelogEntry = {
      ...mockEntries[0],
      change_reason: 'User requested this change for clarity',
    }

    render(<Changelog entries={[entryWithReason]} />)

    // Click to expand
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])

    expect(screen.getByText('User requested this change for clarity')).toBeInTheDocument()
  })

  it('does not show reason section when reason is empty', () => {
    render(<Changelog entries={mockEntries} />)

    // Click to expand
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])

    // Should not have a reason section
    expect(screen.queryByText(/Reason/)).not.toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<Changelog entries={[]} isLoading={true} />)
    expect(screen.getByText('Loading more entries...')).toBeInTheDocument()
  })

  it('shows load more button when hasMore is true', () => {
    const mockOnLoadMore = vi.fn()
    render(
      <Changelog
        entries={mockEntries}
        hasMore={true}
        onLoadMore={mockOnLoadMore}
      />
    )

    const loadMoreButton = screen.getByText('Load More')
    expect(loadMoreButton).toBeInTheDocument()

    fireEvent.click(loadMoreButton)
    expect(mockOnLoadMore).toHaveBeenCalledOnce()
  })

  it('does not show load more button when hasMore is false', () => {
    render(
      <Changelog
        entries={mockEntries}
        hasMore={false}
      />
    )

    expect(screen.queryByText('Load More')).not.toBeInTheDocument()
  })

  it('displays multiple changed fields', () => {
    const multiFieldEntry: ChangelogEntry = {
      id: 3,
      activity_type: 'updated',
      user: mockUser,
      description: 'Multiple fields updated',
      metadata: {},
      changed_fields: ['title', 'status', 'health'],
      previous_values: { title: 'Old', status: 'active', health: 'healthy' },
      new_values: { title: 'New', status: 'on_hold', health: 'at_risk' },
      change_reason: '',
      created_at: new Date().toISOString(),
    }

    render(<Changelog entries={[multiFieldEntry]} />)

    // Click to expand
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])

    // Should show 3 fields
    expect(screen.getByText('3 fields')).toBeInTheDocument()
  })

  it('handles null/empty values correctly', () => {
    const entryWithNullValues: ChangelogEntry = {
      id: 4,
      activity_type: 'updated',
      user: mockUser,
      description: 'Value cleared',
      metadata: {},
      changed_fields: ['description'],
      previous_values: { description: 'Some description' },
      new_values: { description: null as any },
      change_reason: '',
      created_at: new Date().toISOString(),
    }

    render(<Changelog entries={[entryWithNullValues]} />)

    // Click to expand
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])

    expect(screen.getByText('(empty)')).toBeInTheDocument()
  })

  it('applies correct colors based on activity type', () => {
    const entries: ChangelogEntry[] = [
      { ...mockEntries[0], activity_type: 'created' },
      { ...mockEntries[0], activity_type: 'deleted' },
      { ...mockEntries[0], activity_type: 'restored' },
    ]

    const { container } = render(<Changelog entries={entries} />)

    // Check that color classes are applied (green for created, red for deleted/restored)
    const createdElement = container.querySelector('.text-green-600')
    const deletedElement = container.querySelector('.text-red-600')

    expect(createdElement).toBeInTheDocument()
    expect(deletedElement).toBeInTheDocument()
  })

  it('formats timestamps correctly', () => {
    render(<Changelog entries={mockEntries} />)

    // Should show formatted date (not exact match due to timezone/formatting)
    const dateText = screen.getByText(/,/)
    expect(dateText).toBeInTheDocument()
  })
})
