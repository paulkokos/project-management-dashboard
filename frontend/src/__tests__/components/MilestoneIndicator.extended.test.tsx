import { describe, it, expect } from 'vitest'
import { render, screen } from '@/__tests__/utils/test-utils'
import { MilestoneProgress } from '@/components/MilestoneProgress'

describe('MilestoneProgress Component - Extended Coverage', () => {
  describe('Rendering', () => {
    it('should render without crashing with valid props', () => {
      const { container } = render(
        <MilestoneProgress
          milestoneCount={5}
          completedMilestoneCount={3}
        />
      )

      expect(container).toBeInTheDocument()
    })

    it('should display milestone count', () => {
      render(
        <MilestoneProgress
          milestoneCount={5}
          completedMilestoneCount={3}
        />
      )

      expect(screen.getByText('3/5')).toBeInTheDocument()
    })

    it('should render progress bar', () => {
      const { container } = render(
        <MilestoneProgress
          milestoneCount={5}
          completedMilestoneCount={3}
        />
      )

      const progressBar = container.querySelector('.bg-blue-500')
      expect(progressBar).toBeInTheDocument()
    })

    it('should render icon', () => {
      const { container } = render(
        <MilestoneProgress
          milestoneCount={5}
          completedMilestoneCount={3}
        />
      )

      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Null and undefined handling', () => {
    it('should return null when milestoneCount is null', () => {
      const { container } = render(
        <MilestoneProgress
          milestoneCount={null}
          completedMilestoneCount={3}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('should return null when milestoneCount is undefined', () => {
      const { container } = render(
        <MilestoneProgress
          milestoneCount={undefined}
          completedMilestoneCount={3}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('should return null when completedMilestoneCount is null', () => {
      const { container } = render(
        <MilestoneProgress
          milestoneCount={5}
          completedMilestoneCount={null}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('should return null when completedMilestoneCount is undefined', () => {
      const { container } = render(
        <MilestoneProgress
          milestoneCount={5}
          completedMilestoneCount={undefined}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('should return null when both are null', () => {
      const { container } = render(
        <MilestoneProgress
          milestoneCount={null}
          completedMilestoneCount={null}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('should return null when both are undefined', () => {
      const { container } = render(
        <MilestoneProgress
          milestoneCount={undefined}
          completedMilestoneCount={undefined}
        />
      )

      expect(container.firstChild).toBeNull()
    })
  })

  describe('Zero milestones state', () => {
    it('should display "No milestones" when count is 0', () => {
      render(
        <MilestoneProgress
          milestoneCount={0}
          completedMilestoneCount={0}
        />
      )

      expect(screen.getByText('No milestones')).toBeInTheDocument()
    })

    it('should not display progress bar when count is 0', () => {
      const { container } = render(
        <MilestoneProgress
          milestoneCount={0}
          completedMilestoneCount={0}
        />
      )

      const progressBar = container.querySelector('.bg-blue-500')
      expect(progressBar).not.toBeInTheDocument()
    })

    it('should have gray styling for no milestones state', () => {
      const { container } = render(
        <MilestoneProgress
          milestoneCount={0}
          completedMilestoneCount={0}
        />
      )

      const element = container.querySelector('.bg-gray-50')
      expect(element).toBeInTheDocument()
    })
  })

  describe('Different completion percentages', () => {
    it('should render 0% completion (0/10)', () => {
      render(
        <MilestoneProgress
          milestoneCount={10}
          completedMilestoneCount={0}
        />
      )

      expect(screen.getByText('0/10')).toBeInTheDocument()

      const { container } = render(
        <MilestoneProgress
          milestoneCount={10}
          completedMilestoneCount={0}
        />
      )

      const progressBar = container.querySelector('.bg-blue-500') as HTMLElement
      expect(progressBar).toHaveStyle({ width: '0%' })
    })

    it('should render 50% completion (5/10)', () => {
      render(
        <MilestoneProgress
          milestoneCount={10}
          completedMilestoneCount={5}
        />
      )

      expect(screen.getByText('5/10')).toBeInTheDocument()

      const { container } = render(
        <MilestoneProgress
          milestoneCount={10}
          completedMilestoneCount={5}
        />
      )

      const progressBar = container.querySelector('.bg-blue-500') as HTMLElement
      expect(progressBar).toHaveStyle({ width: '50%' })
    })

    it('should render 100% completion (10/10)', () => {
      render(
        <MilestoneProgress
          milestoneCount={10}
          completedMilestoneCount={10}
        />
      )

      expect(screen.getByText('10/10')).toBeInTheDocument()

      const { container } = render(
        <MilestoneProgress
          milestoneCount={10}
          completedMilestoneCount={10}
        />
      )

      const progressBar = container.querySelector('.bg-blue-500') as HTMLElement
      expect(progressBar).toHaveStyle({ width: '100%' })
    })

    it('should render 25% completion (1/4)', () => {
      render(
        <MilestoneProgress
          milestoneCount={4}
          completedMilestoneCount={1}
        />
      )

      expect(screen.getByText('1/4')).toBeInTheDocument()

      const { container } = render(
        <MilestoneProgress
          milestoneCount={4}
          completedMilestoneCount={1}
        />
      )

      const progressBar = container.querySelector('.bg-blue-500') as HTMLElement
      expect(progressBar).toHaveStyle({ width: '25%' })
    })

    it('should render 75% completion (3/4)', () => {
      render(
        <MilestoneProgress
          milestoneCount={4}
          completedMilestoneCount={3}
        />
      )

      expect(screen.getByText('3/4')).toBeInTheDocument()

      const { container } = render(
        <MilestoneProgress
          milestoneCount={4}
          completedMilestoneCount={3}
        />
      )

      const progressBar = container.querySelector('.bg-blue-500') as HTMLElement
      expect(progressBar).toHaveStyle({ width: '75%' })
    })

    it('should round percentage correctly (1/3 = 33%)', () => {
      const { container } = render(
        <MilestoneProgress
          milestoneCount={3}
          completedMilestoneCount={1}
        />
      )

      const progressBar = container.querySelector('.bg-blue-500') as HTMLElement
      expect(progressBar).toHaveStyle({ width: '33%' })
    })

    it('should round percentage correctly (2/3 = 67%)', () => {
      const { container } = render(
        <MilestoneProgress
          milestoneCount={3}
          completedMilestoneCount={2}
        />
      )

      const progressBar = container.querySelector('.bg-blue-500') as HTMLElement
      expect(progressBar).toHaveStyle({ width: '67%' })
    })
  })

  describe('Progress bar width calculation', () => {
    it('should calculate correct width for various percentages', () => {
      const testCases = [
        { total: 100, completed: 0, expected: '0%' },
        { total: 100, completed: 25, expected: '25%' },
        { total: 100, completed: 50, expected: '50%' },
        { total: 100, completed: 75, expected: '75%' },
        { total: 100, completed: 100, expected: '100%' },
      ]

      testCases.forEach(({ total, completed, expected }) => {
        const { container } = render(
          <MilestoneProgress
            milestoneCount={total}
            completedMilestoneCount={completed}
          />
        )

        const progressBar = container.querySelector('.bg-blue-500') as HTMLElement
        expect(progressBar).toHaveStyle({ width: expected })
      })
    })
  })

  describe('Status display', () => {
    it('should have blue styling for active milestones', () => {
      const { container } = render(
        <MilestoneProgress
          milestoneCount={5}
          completedMilestoneCount={3}
        />
      )

      const badge = container.querySelector('.bg-blue-50')
      expect(badge).toBeInTheDocument()
    })

    it('should have blue text color', () => {
      const { container } = render(
        <MilestoneProgress
          milestoneCount={5}
          completedMilestoneCount={3}
        />
      )

      const badge = container.querySelector('.text-blue-700')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('Edge cases', () => {
    it('should handle single milestone (1/1)', () => {
      render(
        <MilestoneProgress
          milestoneCount={1}
          completedMilestoneCount={1}
        />
      )

      expect(screen.getByText('1/1')).toBeInTheDocument()
    })

    it('should handle single incomplete milestone (0/1)', () => {
      render(
        <MilestoneProgress
          milestoneCount={1}
          completedMilestoneCount={0}
        />
      )

      expect(screen.getByText('0/1')).toBeInTheDocument()
    })

    it('should handle large milestone count', () => {
      render(
        <MilestoneProgress
          milestoneCount={1000}
          completedMilestoneCount={500}
        />
      )

      expect(screen.getByText('500/1000')).toBeInTheDocument()
    })

    it('should handle completed count exceeding total (edge case)', () => {
      // This shouldn't happen in normal operation, but test defensive coding
      render(
        <MilestoneProgress
          milestoneCount={5}
          completedMilestoneCount={7}
        />
      )

      expect(screen.getByText('7/5')).toBeInTheDocument()

      const { container } = render(
        <MilestoneProgress
          milestoneCount={5}
          completedMilestoneCount={7}
        />
      )

      // Should calculate >100% but display it
      const progressBar = container.querySelector('.bg-blue-500') as HTMLElement
      expect(progressBar).toBeInTheDocument()
    })
  })

  describe('Styling and layout', () => {
    it('should have inline-flex layout', () => {
      const { container } = render(
        <MilestoneProgress
          milestoneCount={5}
          completedMilestoneCount={3}
        />
      )

      const wrapper = container.querySelector('.inline-flex')
      expect(wrapper).toBeInTheDocument()
    })

    it('should have rounded progress bar', () => {
      const { container } = render(
        <MilestoneProgress
          milestoneCount={5}
          completedMilestoneCount={3}
        />
      )

      const progressContainer = container.querySelector('.rounded-full')
      expect(progressContainer).toBeInTheDocument()
    })

    it('should have proper spacing between elements', () => {
      const { container } = render(
        <MilestoneProgress
          milestoneCount={5}
          completedMilestoneCount={3}
        />
      )

      const wrapper = container.querySelector('.gap-2')
      expect(wrapper).toBeInTheDocument()
    })

    it('should have proper padding on badge', () => {
      const { container } = render(
        <MilestoneProgress
          milestoneCount={5}
          completedMilestoneCount={3}
        />
      )

      const badge = container.querySelector('.px-2')
      expect(badge).toBeInTheDocument()
    })

    it('should have medium font weight on badge', () => {
      const { container } = render(
        <MilestoneProgress
          milestoneCount={5}
          completedMilestoneCount={3}
        />
      )

      const badge = container.querySelector('.font-medium')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('Progress bar container', () => {
    it('should have gray background for progress container', () => {
      const { container } = render(
        <MilestoneProgress
          milestoneCount={5}
          completedMilestoneCount={3}
        />
      )

      const progressContainer = container.querySelector('.bg-gray-200')
      expect(progressContainer).toBeInTheDocument()
    })

    it('should have fixed width for progress bar', () => {
      const { container } = render(
        <MilestoneProgress
          milestoneCount={5}
          completedMilestoneCount={3}
        />
      )

      const progressContainer = container.querySelector('.w-12')
      expect(progressContainer).toBeInTheDocument()
    })

    it('should have fixed height for progress bar', () => {
      const { container } = render(
        <MilestoneProgress
          milestoneCount={5}
          completedMilestoneCount={3}
        />
      )

      const progressContainer = container.querySelector('.h-1\\.5')
      expect(progressContainer).toBeInTheDocument()
    })
  })

  describe('Icon rendering', () => {
    it('should render SVG icon with correct size', () => {
      const { container } = render(
        <MilestoneProgress
          milestoneCount={5}
          completedMilestoneCount={3}
        />
      )

      const icon = container.querySelector('svg')
      expect(icon).toHaveClass('w-3')
      expect(icon).toHaveClass('h-3')
    })

    it('should render icon with currentColor fill', () => {
      const { container } = render(
        <MilestoneProgress
          milestoneCount={5}
          completedMilestoneCount={3}
        />
      )

      const icon = container.querySelector('svg')
      expect(icon).toHaveAttribute('fill', 'currentColor')
    })

    it('should have clipboard-style icon paths', () => {
      const { container } = render(
        <MilestoneProgress
          milestoneCount={5}
          completedMilestoneCount={3}
        />
      )

      const icon = container.querySelector('svg')
      const paths = icon?.querySelectorAll('path')
      expect(paths).toHaveLength(2)
    })
  })

  describe('Accessibility', () => {
    it('should have appropriate text size', () => {
      const { container } = render(
        <MilestoneProgress
          milestoneCount={5}
          completedMilestoneCount={3}
        />
      )

      const textElement = container.querySelector('.text-xs')
      expect(textElement).toBeInTheDocument()
    })

    it('should be readable with sufficient contrast', () => {
      const { container } = render(
        <MilestoneProgress
          milestoneCount={5}
          completedMilestoneCount={3}
        />
      )

      const badge = container.querySelector('.text-blue-700')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('Component integration', () => {
    it('should work with different milestone counts', () => {
      const milestones = [
        { total: 1, completed: 0 },
        { total: 3, completed: 2 },
        { total: 5, completed: 5 },
        { total: 10, completed: 7 },
        { total: 20, completed: 15 },
      ]

      milestones.forEach(({ total, completed }) => {
        render(
          <MilestoneProgress
            milestoneCount={total}
            completedMilestoneCount={completed}
          />
        )

        expect(screen.getByText(`${completed}/${total}`)).toBeInTheDocument()
      })
    })
  })
})
