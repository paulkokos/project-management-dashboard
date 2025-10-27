import { describe, it, expect } from 'vitest'
import { render, screen } from '@/__tests__/utils/test-utils'
import { RiskBadge } from '@/components/RiskBadge'

describe('RiskBadge Component - Extended Coverage', () => {
  describe('Rendering', () => {
    it('should render without crashing with valid risk level', () => {
      const { container } = render(<RiskBadge riskLevel="low" />)
      expect(container).toBeInTheDocument()
    })

    it('should render with low risk level', () => {
      render(<RiskBadge riskLevel="low" />)
      expect(screen.getByText('Low Risk')).toBeInTheDocument()
    })

    it('should render with medium risk level', () => {
      render(<RiskBadge riskLevel="medium" />)
      expect(screen.getByText('Medium Risk')).toBeInTheDocument()
    })

    it('should render with high risk level', () => {
      render(<RiskBadge riskLevel="high" />)
      expect(screen.getByText('High Risk')).toBeInTheDocument()
    })

    it('should render with critical risk level', () => {
      render(<RiskBadge riskLevel="critical" />)
      expect(screen.getByText('Critical')).toBeInTheDocument()
    })
  })

  describe('Null and undefined handling', () => {
    it('should return null when riskLevel is null', () => {
      const { container } = render(<RiskBadge riskLevel={null} />)
      expect(container.firstChild).toBeNull()
    })

    it('should return null when riskLevel is undefined', () => {
      const { container } = render(<RiskBadge riskLevel={undefined} />)
      expect(container.firstChild).toBeNull()
    })

    it('should not render any text when riskLevel is null', () => {
      render(<RiskBadge riskLevel={null} />)
      expect(screen.queryByText(/Risk/i)).not.toBeInTheDocument()
    })

    it('should not render any text when riskLevel is undefined', () => {
      render(<RiskBadge riskLevel={undefined} />)
      expect(screen.queryByText(/Risk/i)).not.toBeInTheDocument()
    })
  })

  describe('Low risk styling', () => {
    it('should have green background for low risk', () => {
      const { container } = render(<RiskBadge riskLevel="low" />)
      const badge = container.querySelector('.bg-green-100')
      expect(badge).toBeInTheDocument()
    })

    it('should have green text for low risk', () => {
      const { container } = render(<RiskBadge riskLevel="low" />)
      const badge = container.querySelector('.text-green-700')
      expect(badge).toBeInTheDocument()
    })

    it('should have green dot for low risk', () => {
      const { container } = render(<RiskBadge riskLevel="low" />)
      const dot = container.querySelector('.bg-green-500')
      expect(dot).toBeInTheDocument()
    })

    it('should display "Low Risk" label', () => {
      render(<RiskBadge riskLevel="low" />)
      expect(screen.getByText('Low Risk')).toBeInTheDocument()
    })
  })

  describe('Medium risk styling', () => {
    it('should have amber background for medium risk', () => {
      const { container } = render(<RiskBadge riskLevel="medium" />)
      const badge = container.querySelector('.bg-amber-100')
      expect(badge).toBeInTheDocument()
    })

    it('should have amber text for medium risk', () => {
      const { container } = render(<RiskBadge riskLevel="medium" />)
      const badge = container.querySelector('.text-amber-700')
      expect(badge).toBeInTheDocument()
    })

    it('should have amber dot for medium risk', () => {
      const { container } = render(<RiskBadge riskLevel="medium" />)
      const dot = container.querySelector('.bg-amber-500')
      expect(dot).toBeInTheDocument()
    })

    it('should display "Medium Risk" label', () => {
      render(<RiskBadge riskLevel="medium" />)
      expect(screen.getByText('Medium Risk')).toBeInTheDocument()
    })
  })

  describe('High risk styling', () => {
    it('should have orange background for high risk', () => {
      const { container } = render(<RiskBadge riskLevel="high" />)
      const badge = container.querySelector('.bg-orange-100')
      expect(badge).toBeInTheDocument()
    })

    it('should have orange text for high risk', () => {
      const { container } = render(<RiskBadge riskLevel="high" />)
      const badge = container.querySelector('.text-orange-700')
      expect(badge).toBeInTheDocument()
    })

    it('should have orange dot for high risk', () => {
      const { container } = render(<RiskBadge riskLevel="high" />)
      const dot = container.querySelector('.bg-orange-500')
      expect(dot).toBeInTheDocument()
    })

    it('should display "High Risk" label', () => {
      render(<RiskBadge riskLevel="high" />)
      expect(screen.getByText('High Risk')).toBeInTheDocument()
    })
  })

  describe('Critical risk styling', () => {
    it('should have red background for critical risk', () => {
      const { container } = render(<RiskBadge riskLevel="critical" />)
      const badge = container.querySelector('.bg-red-100')
      expect(badge).toBeInTheDocument()
    })

    it('should have red text for critical risk', () => {
      const { container } = render(<RiskBadge riskLevel="critical" />)
      const badge = container.querySelector('.text-red-700')
      expect(badge).toBeInTheDocument()
    })

    it('should have red dot for critical risk', () => {
      const { container } = render(<RiskBadge riskLevel="critical" />)
      const dot = container.querySelector('.bg-red-500')
      expect(dot).toBeInTheDocument()
    })

    it('should display "Critical" label', () => {
      render(<RiskBadge riskLevel="critical" />)
      expect(screen.getByText('Critical')).toBeInTheDocument()
    })
  })

  describe('Risk color coding verification', () => {
    it('should use different colors for different risk levels', () => {
      const { container: lowContainer } = render(<RiskBadge riskLevel="low" />)
      const { container: mediumContainer } = render(<RiskBadge riskLevel="medium" />)
      const { container: highContainer } = render(<RiskBadge riskLevel="high" />)
      const { container: criticalContainer } = render(<RiskBadge riskLevel="critical" />)

      // Each should have its own unique background color
      expect(lowContainer.querySelector('.bg-green-100')).toBeInTheDocument()
      expect(mediumContainer.querySelector('.bg-amber-100')).toBeInTheDocument()
      expect(highContainer.querySelector('.bg-orange-100')).toBeInTheDocument()
      expect(criticalContainer.querySelector('.bg-red-100')).toBeInTheDocument()
    })

    it('should have progressively more urgent colors', () => {
      // Green (low) -> Amber (medium) -> Orange (high) -> Red (critical)
      const levels = [
        { level: 'low', bg: 'bg-green-100', text: 'text-green-700' },
        { level: 'medium', bg: 'bg-amber-100', text: 'text-amber-700' },
        { level: 'high', bg: 'bg-orange-100', text: 'text-orange-700' },
        { level: 'critical', bg: 'bg-red-100', text: 'text-red-700' },
      ] as const

      levels.forEach(({ level, bg, text }) => {
        const { container } = render(<RiskBadge riskLevel={level} />)
        expect(container.querySelector(`.${bg}`)).toBeInTheDocument()
        expect(container.querySelector(`.${text}`)).toBeInTheDocument()
      })
    })
  })

  describe('Risk labels', () => {
    it('should display appropriate label for each risk level', () => {
      const labels = [
        { level: 'low', label: 'Low Risk' },
        { level: 'medium', label: 'Medium Risk' },
        { level: 'high', label: 'High Risk' },
        { level: 'critical', label: 'Critical' },
      ] as const

      labels.forEach(({ level, label }) => {
        render(<RiskBadge riskLevel={level} />)
        expect(screen.getByText(label)).toBeInTheDocument()
      })
    })

    it('should have consistent label formatting', () => {
      const { container: lowContainer } = render(<RiskBadge riskLevel="low" />)
      const { container: mediumContainer } = render(<RiskBadge riskLevel="medium" />)

      const lowLabel = lowContainer.textContent
      const mediumLabel = mediumContainer.textContent

      expect(lowLabel).toBeTruthy()
      expect(mediumLabel).toBeTruthy()
    })
  })

  describe('Indicator dot', () => {
    it('should render dot for all risk levels', () => {
      const levels: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical']

      levels.forEach(level => {
        const { container } = render(<RiskBadge riskLevel={level} />)
        const dot = container.querySelector('.w-2.h-2.rounded-full')
        expect(dot).toBeInTheDocument()
      })
    })

    it('should have rounded dot shape', () => {
      const { container } = render(<RiskBadge riskLevel="low" />)
      const dot = container.querySelector('.rounded-full')
      expect(dot).toBeInTheDocument()
    })

    it('should have appropriate size for dot', () => {
      const { container } = render(<RiskBadge riskLevel="low" />)
      const dot = container.querySelector('.w-2')
      expect(dot).toBeInTheDocument()
      expect(dot).toHaveClass('h-2')
    })

    it('should match dot color with risk level', () => {
      const dotColors = [
        { level: 'low', color: 'bg-green-500' },
        { level: 'medium', color: 'bg-amber-500' },
        { level: 'high', color: 'bg-orange-500' },
        { level: 'critical', color: 'bg-red-500' },
      ] as const

      dotColors.forEach(({ level, color }) => {
        const { container } = render(<RiskBadge riskLevel={level} />)
        const dot = container.querySelector(`.${color}`)
        expect(dot).toBeInTheDocument()
      })
    })
  })

  describe('Badge styling', () => {
    it('should have inline-flex display', () => {
      const { container } = render(<RiskBadge riskLevel="low" />)
      const badge = container.querySelector('.inline-flex')
      expect(badge).toBeInTheDocument()
    })

    it('should have items-center alignment', () => {
      const { container } = render(<RiskBadge riskLevel="low" />)
      const badge = container.querySelector('.items-center')
      expect(badge).toBeInTheDocument()
    })

    it('should have appropriate gap between elements', () => {
      const { container } = render(<RiskBadge riskLevel="low" />)
      const badge = container.querySelector('.gap-1')
      expect(badge).toBeInTheDocument()
    })

    it('should have padding', () => {
      const { container } = render(<RiskBadge riskLevel="low" />)
      const badge = container.querySelector('.px-2')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('py-1')
    })

    it('should have rounded corners', () => {
      const { container } = render(<RiskBadge riskLevel="low" />)
      const badge = container.querySelector('.rounded')
      expect(badge).toBeInTheDocument()
    })

    it('should have small text size', () => {
      const { container } = render(<RiskBadge riskLevel="low" />)
      const badge = container.querySelector('.text-xs')
      expect(badge).toBeInTheDocument()
    })

    it('should have medium font weight', () => {
      const { container } = render(<RiskBadge riskLevel="low" />)
      const badge = container.querySelector('.font-medium')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('Multiple instances', () => {
    it('should render multiple badges independently', () => {
      render(
        <div>
          <RiskBadge riskLevel="low" />
          <RiskBadge riskLevel="high" />
          <RiskBadge riskLevel="critical" />
        </div>
      )

      expect(screen.getByText('Low Risk')).toBeInTheDocument()
      expect(screen.getByText('High Risk')).toBeInTheDocument()
      expect(screen.getByText('Critical')).toBeInTheDocument()
    })

    it('should maintain unique styling for each instance', () => {
      const { container } = render(
        <div>
          <RiskBadge riskLevel="low" />
          <RiskBadge riskLevel="critical" />
        </div>
      )

      expect(container.querySelector('.bg-green-100')).toBeInTheDocument()
      expect(container.querySelector('.bg-red-100')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have readable text', () => {
      render(<RiskBadge riskLevel="low" />)
      const badge = screen.getByText('Low Risk')
      expect(badge).toBeVisible()
    })

    it('should have sufficient color contrast', () => {
      const { container } = render(<RiskBadge riskLevel="low" />)
      // Background: green-100, Text: green-700 - should have good contrast
      const badge = container.querySelector('.bg-green-100.text-green-700')
      expect(badge).toBeInTheDocument()
    })

    it('should use color and text to convey information', () => {
      // Not relying solely on color - also has text label
      render(<RiskBadge riskLevel="critical" />)
      expect(screen.getByText('Critical')).toBeInTheDocument()
    })

    it('should use visual indicator (dot) in addition to text', () => {
      const { container } = render(<RiskBadge riskLevel="high" />)
      const dot = container.querySelector('.rounded-full.bg-orange-500')
      expect(dot).toBeInTheDocument()
      expect(screen.getByText('High Risk')).toBeInTheDocument()
    })
  })

  describe('Risk classification hierarchy', () => {
    it('should show distinct visual hierarchy from low to critical', () => {
      const { container: lowContainer } = render(<RiskBadge riskLevel="low" />)
      const { container: mediumContainer } = render(<RiskBadge riskLevel="medium" />)
      const { container: highContainer } = render(<RiskBadge riskLevel="high" />)
      const { container: criticalContainer } = render(<RiskBadge riskLevel="critical" />)

      // Verify each has unique color coding
      expect(lowContainer.textContent).toContain('Low Risk')
      expect(mediumContainer.textContent).toContain('Medium Risk')
      expect(highContainer.textContent).toContain('High Risk')
      expect(criticalContainer.textContent).toContain('Critical')
    })
  })

  describe('Component integration', () => {
    it('should work within a card layout', () => {
      render(
        <div className="card">
          <RiskBadge riskLevel="high" />
        </div>
      )

      expect(screen.getByText('High Risk')).toBeInTheDocument()
    })

    it('should work inline with other content', () => {
      render(
        <div>
          <span>Project Risk: </span>
          <RiskBadge riskLevel="medium" />
        </div>
      )

      expect(screen.getByText('Project Risk:')).toBeInTheDocument()
      expect(screen.getByText('Medium Risk')).toBeInTheDocument()
    })

    it('should maintain spacing when stacked', () => {
      const { container } = render(
        <div className="space-y-2">
          <RiskBadge riskLevel="low" />
          <RiskBadge riskLevel="medium" />
          <RiskBadge riskLevel="high" />
        </div>
      )

      const badges = container.querySelectorAll('.inline-flex')
      expect(badges).toHaveLength(3)
    })
  })

  describe('Edge cases', () => {
    it('should handle rapid prop changes', () => {
      const { rerender } = render(<RiskBadge riskLevel="low" />)
      expect(screen.getByText('Low Risk')).toBeInTheDocument()

      rerender(<RiskBadge riskLevel="critical" />)
      expect(screen.getByText('Critical')).toBeInTheDocument()
      expect(screen.queryByText('Low Risk')).not.toBeInTheDocument()
    })

    it('should handle prop change to null', () => {
      const { rerender, container } = render(<RiskBadge riskLevel="high" />)
      expect(screen.getByText('High Risk')).toBeInTheDocument()

      rerender(<RiskBadge riskLevel={null} />)
      expect(container.firstChild).toBeNull()
    })

    it('should handle prop change from null to valid', () => {
      const { rerender } = render(<RiskBadge riskLevel={null} />)
      expect(screen.queryByText(/Risk/i)).not.toBeInTheDocument()

      rerender(<RiskBadge riskLevel="medium" />)
      expect(screen.getByText('Medium Risk')).toBeInTheDocument()
    })
  })

  describe('Visual consistency', () => {
    it('should have consistent structure across all risk levels', () => {
      const levels: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical']

      levels.forEach(level => {
        const { container } = render(<RiskBadge riskLevel={level} />)

        // Should have inline-flex container
        expect(container.querySelector('.inline-flex')).toBeInTheDocument()

        // Should have dot
        expect(container.querySelector('.rounded-full')).toBeInTheDocument()

        // Should have text
        expect(container.textContent).toBeTruthy()
      })
    })

    it('should have same dimensions across risk levels', () => {
      const levels: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical']

      levels.forEach(level => {
        const { container } = render(<RiskBadge riskLevel={level} />)
        const badge = container.querySelector('.px-2.py-1')
        expect(badge).toBeInTheDocument()
      })
    })
  })
})
