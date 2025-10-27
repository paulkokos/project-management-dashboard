import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { projectAPI, tagAPI } from '@/services';
import { useAllProjectUpdates } from '@/hooks';
import { useAuthStore } from '@/stores/authStore';
import { Project, Tag } from '@/types';
import { DeadlineIndicator } from '@/components/DeadlineIndicator';
import { RiskBadge } from '@/components/RiskBadge';
import { TeamMemberCount } from '@/components/TeamMemberCount';
import { MilestoneProgress } from '@/components/MilestoneProgress';
import { canDeleteProject } from '@/utils/permissions';

export default function ProjectList() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);

  // Subscribe to all project updates via WebSocket
  useAllProjectUpdates();
  const [statusFilter, setStatusFilter] = useState('');
  const [healthFilter, setHealthFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [tagFilters, setTagFilters] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState('-updated_at');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch projects
  const { data, isLoading } = useQuery({
    queryKey: ['projects', { page, status: statusFilter, health: healthFilter, owner: ownerFilter, tags: tagFilters, ordering: sortBy, search: searchTerm }],
    queryFn: () =>
      projectAPI.list({
        page,
        status: statusFilter || undefined,
        health: healthFilter || undefined,
        owner: ownerFilter || undefined,
        tags: tagFilters.length > 0 ? tagFilters : undefined,
        ordering: sortBy,
        search: searchTerm || undefined,
      }),
  });

  // Fetch tags for filter
  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagAPI.list(),
  });

  const projects = data?.data?.results || [];
  const totalPages = Math.ceil((data?.data?.count || 0) / 20);
  const tags = tagsData?.data?.results || [];

  const handleDeleteProject = async () => {
    if (!deleteConfirm) return;

    setIsDeleting(true);
    try {
      await projectAPI.softDelete(deleteConfirm.id);
      setDeleteConfirm(null);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    } catch {
      // Deletion failed silently
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleTagFilter = (tagId: number) => {
    setTagFilters(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
    setPage(1);
  };

  const resetFilters = () => {
    setStatusFilter('');
    setHealthFilter('');
    setOwnerFilter('');
    setTagFilters([]);
    setSearchTerm('');
    setSortBy('-updated_at');
    setPage(1);
  };

  const hasActiveFilters = statusFilter || healthFilter || ownerFilter || tagFilters.length > 0 || searchTerm;

  return (
    <div className="space-y-6">
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm">
            <h2 className="text-xl font-bold mb-4">Delete Project?</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete &quot;<strong>{deleteConfirm.title}</strong>&quot;? This action can be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Projects</h1>
        <div className="flex gap-2">
          <Link
            to="/projects/deleted"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Trash
          </Link>
          <Link
            to="/projects/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            New Project
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className="w-full px-4 py-2 border rounded-lg"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="archived">Archived</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={healthFilter}
            onChange={(e) => {
              setHealthFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">All Health</option>
            <option value="healthy">Healthy</option>
            <option value="at_risk">At Risk</option>
            <option value="critical">Critical</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="-updated_at">Newest</option>
            <option value="updated_at">Oldest</option>
            <option value="title">Title A-Z</option>
            <option value="-title">Title Z-A</option>
            <option value="-progress">Progress High-Low</option>
            <option value="progress">Progress Low-High</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Clear Filters
            </button>
          )}
        </div>

        {tags.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Filter by Tags:</p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag: Tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTagFilter(tag.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                    tagFilters.includes(tag.id)
                      ? 'text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                  style={{
                    backgroundColor: tagFilters.includes(tag.id) ? tag.color : undefined
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : projects.length === 0 ? (
        <div className="text-center text-gray-500">No projects found</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project: Project) => (
              <div key={project.id} className="card hover:shadow-lg">
                <div className="flex justify-between items-start mb-2">
                  <Link to={`/projects/${project.id}`} className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold truncate hover:underline">{project.title}</h3>
                  </Link>
                  {canDeleteProject(user, project) && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setDeleteConfirm({ id: project.id, title: project.title });
                      }}
                      className="ml-2 text-red-600 hover:text-red-800 font-bold text-lg hover:bg-red-50 w-8 h-8 flex items-center justify-center rounded"
                      title="Delete project"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Owner and Last Updated */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>Owner: <span className="font-medium text-gray-700">{project.owner?.username || 'Unknown'}</span></span>
                  <span title={new Date(project.updated_at).toLocaleString()}>
                    {new Date(project.updated_at).toLocaleDateString()}
                  </span>
                </div>

                <Link to={`/projects/${project.id}`}>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                    {project.description}
                  </p>

                  {/* Tags */}
                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 mb-3">
                      {project.tags.map((tag: Tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: tag.color }}
                          title={tag.name}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Duration Display */}
                  {project.duration_display && (
                    <div className="text-xs text-gray-600 mb-3">
                      Duration: {project.duration_display}
                    </div>
                  )}

                  <div className="mt-4 space-y-3">
                    {/* Status, Health and Risk Badges */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className={`status-badge status-${project.status}`}>
                        {project.status}
                      </span>
                      <span className={`health-${project.health}`}>
                        ● {project.health}
                      </span>
                      <RiskBadge riskLevel={project.risk_level} />
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {project.progress}% complete
                      </p>
                    </div>

                    {/* Team Count and Milestone Progress */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <TeamMemberCount teamCount={project.team_count} />
                      <MilestoneProgress
                        milestoneCount={project.milestone_count}
                        completedMilestoneCount={project.completed_milestone_count}
                      />
                    </div>

                    {/* Deadline Indicator */}
                    {project.end_date && (
                      <DeadlineIndicator
                        daysUntilDeadline={project.days_until_deadline}
                        endDate={project.end_date}
                      />
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`px-4 py-2 rounded ${
                    page === i + 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
