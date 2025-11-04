import { FC } from 'react'

interface MilestoneProgressProps {
  milestoneCount: number | undefined | null
  completedMilestoneCount: number | undefined | null
}

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
