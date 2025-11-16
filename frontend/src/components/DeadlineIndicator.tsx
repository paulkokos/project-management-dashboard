import { FC } from 'react';

interface DeadlineIndicatorProps {
  daysUntilDeadline: number | null | undefined;
  endDate: string | null | undefined;
}

export const DeadlineIndicator: FC<DeadlineIndicatorProps> = ({ daysUntilDeadline, endDate }) => {
  if (daysUntilDeadline === null || daysUntilDeadline === undefined || !endDate) {
    return <div className="text-xs text-gray-500">No deadline</div>;
  }

  let bgColor = 'bg-green-50';
  let textColor = 'text-green-700';
  let label = '';

  if (daysUntilDeadline < 0) {
    bgColor = 'bg-red-50';
    textColor = 'text-red-700';
    label = `Overdue by ${Math.abs(daysUntilDeadline)} day${Math.abs(daysUntilDeadline) !== 1 ? 's' : ''}`;
  } else if (daysUntilDeadline === 0) {
    bgColor = 'bg-red-50';
    textColor = 'text-red-700';
    label = 'Due today';
  } else if (daysUntilDeadline < 5) {
    bgColor = 'bg-red-50';
    textColor = 'text-red-700';
    label = `Due in ${daysUntilDeadline} day${daysUntilDeadline !== 1 ? 's' : ''}`;
  } else if (daysUntilDeadline <= 30) {
    bgColor = 'bg-amber-50';
    textColor = 'text-amber-700';
    label = `Due in ${daysUntilDeadline} day${daysUntilDeadline !== 1 ? 's' : ''}`;
  } else {
    bgColor = 'bg-green-50';
    textColor = 'text-green-700';
    label = `Due in ${daysUntilDeadline} day${daysUntilDeadline !== 1 ? 's' : ''}`;
  }

  return (
    <div className={`${bgColor} ${textColor} px-2 py-1 rounded text-xs font-medium`}>{label}</div>
  );
};
