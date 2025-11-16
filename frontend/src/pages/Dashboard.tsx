import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { projectAPI } from '@/services';
import { useAllProjectUpdates } from '@/hooks';
import { Project, Tag } from '@/types';
import { DeadlineIndicator } from '@/components/DeadlineIndicator';
import { RiskBadge } from '@/components/RiskBadge';
import { TeamMemberCount } from '@/components/TeamMemberCount';
import { MilestoneProgress } from '@/components/MilestoneProgress';

export default function Dashboard() {
  // Subscribe to all project updates via WebSocket
  useAllProjectUpdates();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects', { page_size: 5 }],
    queryFn: () => projectAPI.list({ page_size: 5 }),
  });

  if (isLoading) return <div>Loading...</div>;

  const projectsData = (projects?.data?.results || []) as Project[];
  const totalProjects = projects?.data?.count || 0;
  const activeProjects = projectsData.filter((p: Project) => p.status === 'active').length;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-700">Total Projects</h3>
          <p className="text-4xl font-bold text-blue-600 mt-2">{totalProjects}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-700">Active</h3>
          <p className="text-4xl font-bold text-green-600 mt-2">{activeProjects}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-700">Health</h3>
          <p className="text-4xl font-bold text-yellow-600 mt-2">Good</p>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6">Recent Projects</h2>
        {projectsData.length === 0 ? (
          <div className="card">
            <p className="text-gray-500">No projects yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectsData.map((project: Project) => (
              <div key={project.id} className="card hover:shadow-lg">
                <div className="flex justify-between items-start mb-2">
                  <Link to={`/projects/${project.id}`} className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold truncate hover:underline">{project.title}</h3>
                  </Link>
                </div>

                {/* Owner and Last Updated */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>
                    Owner:{' '}
                    <span className="font-medium text-gray-700">
                      {project.owner?.username || 'Unknown'}
                    </span>
                  </span>
                  <span title={new Date(project.updated_at).toLocaleString()}>
                    {new Date(project.updated_at).toLocaleDateString()}
                  </span>
                </div>

                <Link to={`/projects/${project.id}`}>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">{project.description}</p>

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
                      <span className={`health-${project.health}`}>● {project.health}</span>
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
                      <p className="text-xs text-gray-600 mt-1">{project.progress}% complete</p>
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
        )}
      </div>
    </div>
  );
}
