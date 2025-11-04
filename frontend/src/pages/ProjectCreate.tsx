import { useNavigate } from 'react-router-dom'
import ProjectForm from '@/components/ProjectForm'

export default function ProjectCreate() {
  const navigate = useNavigate()

  const handleSuccess = () => {
    navigate('/projects')
  }

  const handleCancel = () => {
    navigate('/projects')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Create New Project</h1>
      <div className="card">
        <ProjectForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  )
}
