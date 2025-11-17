import { FC, useState } from 'react';
import { format } from 'date-fns';

interface ChangelogEntry {
  id: number;
  activity_type: string;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  description: string;
  metadata: Record<string, unknown>;
  changed_fields: string[];
  previous_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  change_reason?: string;
  created_at: string;
}

interface ChangelogProps {
  entries: ChangelogEntry[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const getActivityIcon = (activityType: string): string => {
  const labels: Record<string, string> = {
    created: '✨',
    updated: '✏',
    status_changed: '→',
    health_changed: '⚕',
    team_added: '👤',
    team_removed: '✕',
    team_updated: '👥',
    milestone_added: '🎯',
    milestone_updated: '📝',
    milestone_completed: '✓',
    milestone_deleted: '🗑',
    progress_updated: '📊',
    comment_added: '💬',
    restored: '↩',
    bulk_updated: '⚡',
  };
  return labels[activityType] || activityType;
};

const getActivityLabel = (activityType: string): string => {
  const labels: Record<string, string> = {
    created: 'Project Created',
    updated: 'Project Updated',
    status_changed: 'Status Changed',
    health_changed: 'Health Changed',
    team_added: 'Team Member Added',
    team_removed: 'Team Member Removed',
    team_updated: 'Team Member Updated',
    milestone_added: 'Milestone Added',
    milestone_updated: 'Milestone Updated',
    milestone_completed: 'Milestone Completed',
    milestone_deleted: 'Milestone Deleted',
    progress_updated: 'Progress Updated',
    comment_added: 'Comment Added',
    restored: 'Project Restored',
    bulk_updated: 'Bulk Update',
  };
  return labels[activityType] || activityType;
};

const getActivityColor = (activityType: string): string => {
  if (activityType.includes('deleted') || activityType === 'restored') return 'text-red-600';
  if (activityType.includes('created') || activityType.includes('added')) return 'text-green-600';
  if (activityType.includes('updated') || activityType === 'updated') return 'text-blue-600';
  if (activityType.includes('progress') || activityType.includes('completed'))
    return 'text-purple-600';
  return 'text-gray-600';
};

export const Changelog: FC<ChangelogProps> = ({
  entries,
  isLoading = false,
  onLoadMore,
  hasMore = false,
}) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpanded = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (entries.length === 0 && !isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">No changelog entries yet</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const isExpanded = expandedId === entry.id;
        const userDisplay = entry.user?.first_name || entry.user?.username || 'Unknown';

        return (
          <div
            key={entry.id}
            className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
          >
            <button
              onClick={() => toggleExpanded(entry.id)}
              className="w-full p-4 text-left hover:bg-gray-50 flex items-start justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{getActivityIcon(entry.activity_type)}</span>
                  <span
                    className={`font-semibold text-sm ${getActivityColor(entry.activity_type)}`}
                  >
                    {getActivityLabel(entry.activity_type)}
                  </span>
                  {entry.changed_fields.length > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {entry.changed_fields.length} field
                      {entry.changed_fields.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700">{entry.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span>{userDisplay}</span>
                  <span>•</span>
                  <span>{format(new Date(entry.created_at), 'MMM dd, yyyy HH:mm')}</span>
                </div>
              </div>
              <span className={`ml-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {isExpanded && entry.changed_fields.length > 0 && (
              <div className="border-t border-gray-200 bg-gray-50 p-4">
                <h4 className="font-semibold text-sm mb-3 text-gray-700">Changed Fields</h4>
                <div className="space-y-3">
                  {entry.changed_fields.map((field) => (
                    <div key={field} className="bg-white p-3 rounded border border-gray-200">
                      <p className="font-mono text-xs text-gray-600 mb-2">{field}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">Before</p>
                          <p className="text-sm bg-red-50 text-red-700 p-2 rounded font-mono text-xs break-words">
                            {String(entry.previous_values[field] ?? '(empty)')}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">After</p>
                          <p className="text-sm bg-green-50 text-green-700 p-2 rounded font-mono text-xs break-words">
                            {String(entry.new_values[field] ?? '(empty)')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {entry.change_reason && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-xs font-semibold text-blue-900 mb-1">Reason</p>
                    <p className="text-sm text-blue-800">{entry.change_reason}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {isLoading && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">Loading more entries...</p>
        </div>
      )}

      {hasMore && !isLoading && (
        <button
          onClick={onLoadMore}
          className="w-full py-3 text-center text-sm font-medium text-blue-600 hover:bg-blue-50 rounded border border-blue-200"
        >
          Load More
        </button>
      )}
    </div>
  );
};
