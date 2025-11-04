/**
 * DeadlineIndicator Component
 *
 * Displays a deadline indicator showing time until or past deadline.
 * Color changes based on urgency: green (plenty of time), amber (soon), red (urgent/overdue).
 *
 * For the full implementation, see:
 * https://github.com/paulkokos/project-management-dashboard/blob/master/frontend/src/components/DeadlineIndicator.tsx
 */

import { FC } from 'react'

export interface DeadlineIndicatorProps {
  /**
   * Number of days until deadline
   * Negative values indicate days overdue
   */
  daysUntilDeadline: number | null | undefined

  /**
   * End date in ISO format (YYYY-MM-DD)
   * Used for display purposes
   */
  endDate: string | null | undefined
}

/**
 * DeadlineIndicator component
 *
 * Displays deadline status with color coding:
 * - **Green**: >30 days remaining
 * - **Amber**: 5-30 days remaining
 * - **Red**: <5 days remaining or overdue
 * - **Gray**: No deadline set
 *
 * @param props Component props
 * @returns React component
 *
 * @example
 * ```tsx
 * <DeadlineIndicator
 *   daysUntilDeadline={15}
 *   endDate="2025-11-15"
 * />
 * // Renders: Due in 15 days [amber background]
 *
 * <DeadlineIndicator
 *   daysUntilDeadline={-3}
 *   endDate="2025-10-24"
 * />
 * // Renders: Overdue by 3 days [red background]
 *
 * <DeadlineIndicator
 *   daysUntilDeadline={0}
 *   endDate="2025-10-27"
 * />
 * // Renders: Due today [red background]
 *
 * <DeadlineIndicator
 *   daysUntilDeadline={45}
 *   endDate="2025-12-11"
 * />
 * // Renders: Due in 45 days [green background]
 * ```
 *
 * @example
 * ```tsx
 * import { DeadlineIndicator } from '@paulkokos/ui-components'
 *
 * interface ProjectCardProps {
 *   title: string
 *   daysUntilDeadline: number
 *   endDate: string
 * }
 *
 * export function ProjectCard({
 *   title,
 *   daysUntilDeadline,
 *   endDate
 * }: ProjectCardProps) {
 *   return (
 *     <div className="p-4 border rounded">
 *       <h3>{title}</h3>
 *       <DeadlineIndicator
 *         daysUntilDeadline={daysUntilDeadline}
 *         endDate={endDate}
 *       />
 *     </div>
 *   )
 * }
 * ```
 *
 * @styling
 * - Uses Tailwind CSS classes for styling
 * - Requires Tailwind CSS to be configured in your project
 * - Color classes: bg-green-50, bg-amber-50, bg-red-50
 * - No external dependencies required
 */
export const DeadlineIndicator: FC<DeadlineIndicatorProps> = ({
  daysUntilDeadline,
  endDate,
}) => {
  if (daysUntilDeadline === null || daysUntilDeadline === undefined || !endDate) {
    return (
      <div className="text-xs text-gray-500">
        No deadline
      </div>
    )
  }

  let bgColor = 'bg-green-50'
  let textColor = 'text-green-700'
  let label = ''

  if (daysUntilDeadline < 0) {
    bgColor = 'bg-red-50'
    textColor = 'text-red-700'
    label = `Overdue by ${Math.abs(daysUntilDeadline)} day${Math.abs(daysUntilDeadline) !== 1 ? 's' : ''}`
  } else if (daysUntilDeadline === 0) {
    bgColor = 'bg-red-50'
    textColor = 'text-red-700'
    label = 'Due today'
  } else if (daysUntilDeadline < 5) {
    bgColor = 'bg-red-50'
    textColor = 'text-red-700'
    label = `Due in ${daysUntilDeadline} day${daysUntilDeadline !== 1 ? 's' : ''}`
  } else if (daysUntilDeadline <= 30) {
    bgColor = 'bg-amber-50'
    textColor = 'text-amber-700'
    label = `Due in ${daysUntilDeadline} day${daysUntilDeadline !== 1 ? 's' : ''}`
  } else {
    bgColor = 'bg-green-50'
    textColor = 'text-green-700'
    label = `Due in ${daysUntilDeadline} day${daysUntilDeadline !== 1 ? 's' : ''}`
  }

  return (
    <div className={`${bgColor} ${textColor} px-2 py-1 rounded text-xs font-medium`}>
      {label}
    </div>
  )
}
