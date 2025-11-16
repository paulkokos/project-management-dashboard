import { FC } from 'react';

interface TeamMemberCountProps {
  teamCount: number | undefined | null;
}

export const TeamMemberCount: FC<TeamMemberCountProps> = ({ teamCount }) => {
  if (teamCount === null || teamCount === undefined) {
    return null;
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
  );
};
