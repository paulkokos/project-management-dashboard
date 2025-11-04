/**
 * RiskBadge Component
 *
 * Displays a visual indicator of project risk level.
 * Shows color-coded badge with risk level label.
 *
 * For the full implementation, see:
 * https://github.com/paulkokos/project-management-dashboard/blob/master/frontend/src/components/RiskBadge.tsx
 */

import { FC } from 'react'

export interface RiskBadgeProps {
  /**
   * The risk level to display
   * @example "low" | "medium" | "high" | "critical"
   */
  riskLevel: 'low' | 'medium' | 'high' | 'critical' | undefined | null
}

/**
 * RiskBadge component
 *
 * Displays a color-coded risk badge with the following levels:
 * - **low**: Green badge
 * - **medium**: Amber/Yellow badge
 * - **high**: Orange badge
 * - **critical**: Red badge
 *
 * @param props Component props
 * @returns React component or null if no risk level provided
 *
 * @example
 * ```tsx
 * <RiskBadge riskLevel="high" />
 * // Renders: High Risk [red dot]
 *
 * <RiskBadge riskLevel="low" />
 * // Renders: Low Risk [green dot]
 *
 * <RiskBadge riskLevel={undefined} />
 * // Renders: null (nothing)
 * ```
 *
 * @example
 * ```tsx
 * import { RiskBadge } from '@paulkokos/ui-components'
 *
 * export function ProjectCard({ riskLevel }) {
 *   return (
 *     <div className="p-4 border rounded">
 *       <h3>My Project</h3>
 *       <RiskBadge riskLevel={riskLevel} />
 *     </div>
 *   )
 * }
 * ```
 *
 * @styling
 * - Uses Tailwind CSS classes for styling
 * - Requires Tailwind CSS to be configured in your project
 * - Color classes: bg-green-100, bg-amber-100, bg-orange-100, bg-red-100
 * - Customizable via className prop modifications
 */
export const RiskBadge: FC<RiskBadgeProps> = ({ riskLevel }) => {
  if (!riskLevel) {
    return null
  }

  let bgColor = 'bg-gray-100'
  let textColor = 'text-gray-700'
  let label = ''
  let dotColor = 'bg-gray-500'

  switch (riskLevel) {
    case 'low':
      bgColor = 'bg-green-100'
      textColor = 'text-green-700'
      label = 'Low Risk'
      dotColor = 'bg-green-500'
      break
    case 'medium':
      bgColor = 'bg-amber-100'
      textColor = 'text-amber-700'
      label = 'Medium Risk'
      dotColor = 'bg-amber-500'
      break
    case 'high':
      bgColor = 'bg-orange-100'
      textColor = 'text-orange-700'
      label = 'High Risk'
      dotColor = 'bg-orange-500'
      break
    case 'critical':
      bgColor = 'bg-red-100'
      textColor = 'text-red-700'
      label = 'Critical'
      dotColor = 'bg-red-500'
      break
    default:
      label = riskLevel
  }

  return (
    <div className={`${bgColor} ${textColor} inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium`}>
      <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
      {label}
    </div>
  )
}
