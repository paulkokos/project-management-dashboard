/**
 * TeamMemberCount Component
 *
 * Displays the number of team members on a project with an icon and label.
 *
 * For the full implementation, see:
 * https://github.com/paulkokos/project-management-dashboard/blob/master/frontend/src/components/TeamMemberCount.tsx
 */

import { FC } from 'react'

export interface TeamMemberCountProps {
  /**
   * The number of team members
   * If null or undefined, component returns null (renders nothing)
   */
  teamCount: number | undefined | null
}

/**
 * TeamMemberCount component
 *
 * Displays a small badge showing the number of team members with an icon.
 * Uses proper pluralization (member/members).
 *
 * @param props Component props
 * @returns React component or null if teamCount not provided
 *
 * @example
 * ```tsx
 * <TeamMemberCount teamCount={5} />
 * // Renders: [icon] 5 members
 *
 * <TeamMemberCount teamCount={1} />
 * // Renders: [icon] 1 member
 *
 * <TeamMemberCount teamCount={0} />
 * // Renders: [icon] 0 members
 *
 * <TeamMemberCount teamCount={null} />
 * // Renders: null (nothing)
 * ```
 *
 * @example
 * ```tsx
 * import { TeamMemberCount } from '@paulkokos/ui-components'
 *
 * interface Project {
 *   id: number
 *   title: string
 *   teamMembersCount: number
 * }
 *
 * function ProjectCard({ project }: { project: Project }) {
 *   return (
 *     <div className="p-4 border rounded">
 *       <h3>{project.title}</h3>
 *       <TeamMemberCount teamCount={project.teamMembersCount} />
 *     </div>
 *   )
 * }
 * ```
 *
 * @styling
 * - Uses Tailwind CSS classes for styling
 * - Requires Tailwind CSS to be configured in your project
 * - Default styling: gray background with inline-flex layout
 * - SVG icon is 12x12 pixels with currentColor fill
 */
export const TeamMemberCount: FC<TeamMemberCountProps> = ({ teamCount }) => {
  if (teamCount === null || teamCount === undefined) {
    return null
  }

  return (
    <div className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
      <svg
        className="w-3 h-3"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M10.5 1.5H3.75A2.25 2.25 0 001.5 3.75v12.5A2.25 2.25 0 003.75 18.5h12.5a2.25 2.25 0 002.25-2.25V9.5M10.5 1.5v4M10.5 1.5L16 7m-5.5 2.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm6 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM4 14a3 3 0 106 0 3 3 0 00-6 0z" />
      </svg>
      <span className="font-medium">{teamCount}</span>
      <span>{teamCount === 1 ? 'member' : 'members'}</span>
    </div>
  )
}
