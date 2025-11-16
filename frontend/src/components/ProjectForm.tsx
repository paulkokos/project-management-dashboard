import { useState, ChangeEvent, FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { projectAPI, tagAPI } from '@/services';
import { Project, Tag } from '@/types';

interface ProjectFormProps {
  project?: Project;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ProjectForm({ project, onSuccess, onCancel }: ProjectFormProps) {
  const [formData, setFormData] = useState({
    title: project?.title || '',
    description: project?.description || '',
    status: project?.status || 'active',
    health: project?.health || 'healthy',
    progress: project?.progress || 0,
    start_date: project?.start_date || '',
    end_date: project?.end_date || '',
    tag_ids: project?.tags?.map((t) => t.id) || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch tags
  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagAPI.list(),
  });

  const tags = tagsData?.data?.results || [];

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: (data: typeof formData) =>
      project ? projectAPI.patch(project.id, data) : projectAPI.create(data),
    onSuccess: () => {
      onSuccess?.();
    },
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: Record<string, string> } };
      setErrors(apiError.response?.data || { general: 'An error occurred' });
    },
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'progress' ? parseInt(value) : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleTagToggle = (tagId: number) => {
    setFormData((prev) => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter((id) => id !== tagId)
        : [...prev.tag_ids, tagId],
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      setErrors({ title: 'Title is required' });
      return;
    }

    // Remove empty date fields so they don't get cleared on update
    const { start_date, end_date, ...submitData } = formData;
    const finalData = {
      ...submitData,
      ...(start_date ? { start_date } : { start_date: '' }),
      ...(end_date ? { end_date } : { end_date: '' }),
    } as typeof formData;

    mutation.mutate(finalData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errors.general}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="Project title"
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="Project description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="archived">Archived</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Health</label>
          <select
            name="health"
            value={formData.health}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="healthy">Healthy</option>
            <option value="at_risk">At Risk</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Progress: {formData.progress}%
        </label>
        <input
          type="range"
          name="progress"
          min="0"
          max="100"
          value={formData.progress}
          onChange={handleChange}
          className="mt-1 block w-full"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag: Tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleTagToggle(tag.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                formData.tag_ids.includes(tag.id)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
              style={formData.tag_ids.includes(tag.id) ? { backgroundColor: tag.color } : {}}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {mutation.isPending ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md font-medium hover:bg-gray-300"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
