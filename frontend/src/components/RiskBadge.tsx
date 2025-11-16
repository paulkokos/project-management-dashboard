import { FC } from 'react';

interface RiskBadgeProps {
  riskLevel: 'low' | 'medium' | 'high' | 'critical' | undefined | null;
}

export const RiskBadge: FC<RiskBadgeProps> = ({ riskLevel }) => {
  if (!riskLevel) {
    return null;
  }

  let bgColor = 'bg-gray-100';
  let textColor = 'text-gray-700';
  let label = '';
  let dotColor = 'bg-gray-500';

  switch (riskLevel) {
    case 'low':
      bgColor = 'bg-green-100';
      textColor = 'text-green-700';
      label = 'Low Risk';
      dotColor = 'bg-green-500';
      break;
    case 'medium':
      bgColor = 'bg-amber-100';
      textColor = 'text-amber-700';
      label = 'Medium Risk';
      dotColor = 'bg-amber-500';
      break;
    case 'high':
      bgColor = 'bg-orange-100';
      textColor = 'text-orange-700';
      label = 'High Risk';
      dotColor = 'bg-orange-500';
      break;
    case 'critical':
      bgColor = 'bg-red-100';
      textColor = 'text-red-700';
      label = 'Critical';
      dotColor = 'bg-red-500';
      break;
    default:
      label = riskLevel;
  }

  return (
    <div
      className={`${bgColor} ${textColor} inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium`}
    >
      <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
      {label}
    </div>
  );
};
