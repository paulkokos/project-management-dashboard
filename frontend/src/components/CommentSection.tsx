import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentAPI } from '@/services';
import { useAuthStore } from '@/stores/authStore';
import { useNotification } from '@/contexts/NotificationContext';
import CommentForm from './CommentForm';
import CommentThread from './CommentThread';

interface CommentSectionProps {
  projectId: number;
}

export const CommentSection = ({ projectId }: CommentSectionProps) => {
  const { user } = useAuthStore();
  const { addNotification } = useNotification();
  const queryClient = useQueryClient();

  // Fetch comments for the project
  const { data: commentsResponse, isLoading } = useQuery({
    queryKey: ['comments', projectId],
    queryFn: () => commentAPI.list(projectId),
  });

  // Handle both array and object responses
  const comments = Array.isArray(commentsResponse?.data)
    ? commentsResponse.data
    : commentsResponse?.data?.results || [];

  // Create comment mutation
  const createMutation = useMutation({
    mutationFn: (content: string) =>
      commentAPI.create({ project: projectId, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', projectId] });
      addNotification({
        type: 'success',
        message: 'Comment added successfully',
        duration: 3000,
      });
    },
    onError: () => {
      addNotification({
        type: 'error',
        message: 'Failed to add comment',
        duration: 3000,
      });
    },
  });

  // Delete comment mutation
  const deleteMutation = useMutation({
    mutationFn: (commentId: number) => commentAPI.delete(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', projectId] });
      addNotification({
        type: 'success',
        message: 'Comment deleted successfully',
        duration: 3000,
      });
    },
    onError: () => {
      addNotification({
        type: 'error',
        message: 'Failed to delete comment',
        duration: 3000,
      });
    },
  });

  const handleAddComment = (content: string) => {
    createMutation.mutate(content);
  };

  const handleDeleteComment = (commentId: number) => {
    deleteMutation.mutate(commentId);
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading comments...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Comment form */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <CommentForm
          onSubmit={handleAddComment}
          isLoading={createMutation.isPending}
          placeholder="Share your thoughts..."
          submitLabel="Post Comment"
        />
      </div>

      {/* Comments list */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No comments yet. Be the first to share!
          </p>
        ) : (
          comments.map((comment) => (
            <CommentThread
              key={comment.id}
              id={comment.id}
              content={comment.content}
              author={comment.author}
              created_at={comment.created_at}
              updated_at={comment.updated_at}
              is_edited={comment.updated_at !== comment.created_at}
              replies={comment.replies || []}
              currentUserId={user?.id || 0}
              onDeleteComment={handleDeleteComment}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
