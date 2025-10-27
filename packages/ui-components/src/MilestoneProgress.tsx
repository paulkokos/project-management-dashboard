/**
 * MilestoneProgress Component
 *
 * Displays milestone completion progress with count and progress bar.
 *
 * For the full implementation, see:
 * https://github.com/paulkokos/project-management-dashboard/blob/master/frontend/src/components/MilestoneProgress.tsx
 */

import { FC } from 'react'

export interface MilestoneProgressProps {
  /**
   * Total number of milestones
   */
  milestoneCount: number | undefined | null

  /**
   * Number of completed milestones
   */
  completedMilestoneCount: number | undefined | null
}

/**
 * MilestoneProgress component
 *
 * Displays milestone completion status with:
 * - Completion counter (e.g., "3/5")
 * - Visual progress bar
 * - Percentage calculation
 *
 * @param props Component props
 * @returns React component or null if counts not provided
 *
 * @example
 * ```tsx
 * <MilestoneProgress
 *   milestoneCount={5}
 *   completedMilestoneCount={3}
 * />
 * // Renders: [icon] 3/5 [=======>-----] (60%)
 *
 * <MilestoneProgress
 *   milestoneCount={0}
 *   completedMilestoneCount={0}
 * />
 * // Renders: No milestones
 *
 * <MilestoneProgress
 *   milestoneCount={5}
 *   completedMilestoneCount={5}
 * />
 * // Renders: [icon] 5/5 [==========] (100%)
 * ```
 *
 * @example
 * ```tsx
 * import { MilestoneProgress } from '@paulkokos/ui-components'
 *
 * interface ProjectStats {
 *   totalMilestones: number
 *   completedMilestones: number
 * }
 *
 * function ProjectHeader({ stats }: { stats: ProjectStats }) {
 *   return (
 *     <div className="flex items-center justify-between">
 *       <h1>Project Title</h1>
 *       <MilestoneProgress
 *         milestoneCount={stats.totalMilestones}
 *         completedMilestoneCount={stats.completedMilestones}
 *       />
 *     </div>
 *   )
 * }
 * ```
 *
 * @styling
 * - Uses Tailwind CSS classes for styling
 * - Requires Tailwind CSS to be configured in your project
 * - Progress bar colors: bg-blue-500 (filled), bg-gray-200 (background)
 * - Counter styling: bg-blue-50 text-blue-700
 * - Progress width calculated as percentage
 */
export const MilestoneProgress: FC<MilestoneProgressProps> = ({
  milestoneCount,
  completedMilestoneCount,
}) => {
  if (
    milestoneCount === null ||
    milestoneCount === undefined ||
    completedMilestoneCount === null ||
    completedMilestoneCount === undefined
  ) {
    return null
  }

  if (milestoneCount === 0) {
    return (
      <div className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
        No milestones
      </div>
    )
  }

  const percentage = Math.round((completedMilestoneCount / milestoneCount) * 100)

  return (
    <div className="inline-flex items-center gap-2 text-xs">
      <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium">
        <svg
          className="w-3 h-3"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
          <path
            fillRule="evenodd"
            d="M4 5a2 2 0 012-2 1 1 0 100-2H6a3 3 0 00-3 3v10a3 3 0 003 3h8a3 3 0 003-3V5a1 1 0 10-2 0v10a1 1 0 01-1 1H6a1 1 0 01-1-1V5z"
            clipRule="evenodd"
          />
        </svg>
        <span>
          {completedMilestoneCount}/{milestoneCount}
        </span>
      </div>
      <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  )
}
