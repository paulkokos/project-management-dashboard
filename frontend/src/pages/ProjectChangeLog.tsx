import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectAPI } from '@/services';
import { Changelog } from '@/components/Changelog';
import { useAuthStore } from '@/stores/authStore';
import { useChangelogUpdates } from '@/hooks/useProjectUpdates';

export default function ProjectChangeLog() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const projectId = id ? parseInt(id) : undefined;

  // Subscribe to real-time changelog updates
  useChangelogUpdates(projectId);

  const [filters, setFilters] = useState({
    activity_type: '',
    user_id: '',
    start_date: '',
    end_date: '',
    page: 1,
    page_size: 20,
  });

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectAPI.get(parseInt(id!)),
    enabled: !!id,
  });

  const { data: changelogData, isLoading } = useQuery({
    queryKey: ['changelog', id, filters],
    queryFn: () =>
      projectAPI.getChangelog(parseInt(id!), {
        activity_type: filters.activity_type || undefined,
        user_id: filters.user_id || undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
        page: filters.page,
        page_size: filters.page_size,
      }),
    enabled: !!id,
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handleLoadMore = () => {
    setFilters((prev) => ({
      ...prev,
      page: prev.page + 1,
    }));
  };
  const hasMore = changelogData?.data?.next !== null;

  if (isLoading && filters.page === 1) return <div>Loading...</div>;
  if (!project?.data) return <div>Project not found</div>;

  const p = project.data;
  const entries = changelogData?.data?.results || [];

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
        >
          ← Back
        </button>
      </div>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Changelog - {p.title}</h1>
          <p className="text-gray-600 mt-2">Track all changes made to this project</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
            <select
              value={filters.activity_type}
              onChange={(e) => handleFilterChange('activity_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="created">Created</option>
              <option value="updated">Updated</option>
              <option value="status_changed">Status Changed</option>
              <option value="health_changed">Health Changed</option>
              <option value="team_added">Team Added</option>
              <option value="team_removed">Team Removed</option>
              <option value="team_updated">Team Updated</option>
              <option value="milestone_added">Milestone Added</option>
              <option value="milestone_completed">Milestone Completed</option>
              <option value="progress_updated">Progress Updated</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Results Per Page</label>
            <select
              value={filters.page_size}
              onChange={(e) => handleFilterChange('page_size', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Changelog */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Change History ({entries.length} entries)</h2>
        <Changelog
          entries={entries}
          isLoading={isLoading}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
        />
      </div>
    </div>
  );
}
