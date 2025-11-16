import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ProjectForm from '@/components/ProjectForm';
import { projectAPI } from '@/services';
import { useAuthStore } from '@/stores/authStore';
import { canEditProject, getEditRestrictionMessage } from '@/utils/permissions';

export default function ProjectEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: projectData, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectAPI.get(parseInt(id!)),
    enabled: !!id,
  });

  if (isLoading) return <div>Loading...</div>;
  if (!projectData?.data) return <div>Project not found</div>;

  const project = projectData.data;
  const hasEditPermission = canEditProject(user, project);

  if (!hasEditPermission) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card bg-red-50 border border-red-200">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-red-800 mb-2">Access Denied</h2>
              <p className="text-red-700 mb-4">{getEditRestrictionMessage(user, project)}</p>
              <button onClick={() => navigate(`/projects/${id}`)} className="btn btn-primary">
                Back to Project
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSuccess = () => {
    navigate(`/projects/${id}`);
  };

  const handleCancel = () => {
    navigate(`/projects/${id}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
      >
        ← Back
      </button>
      <h1 className="text-3xl font-bold mb-8">Edit Project</h1>
      <div className="card">
        <ProjectForm project={project} onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  );
}
