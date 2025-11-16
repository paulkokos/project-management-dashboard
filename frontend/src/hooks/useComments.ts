import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';

interface Comment {
  id: number;
  content: string;
  author: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  reply_count: number;
}

interface CommentDetail extends Comment {
  parent_comment: number | null;
  replies: Comment[];
  edited_at: string | null;
  edit_count: number;
}

const COMMENTS_QUERY_KEY = ['comments'];

/**
 * Hook to fetch all comments for a project
 */
export function useComments(projectId: number) {
  return useQuery({
    queryKey: [...COMMENTS_QUERY_KEY, projectId],
    queryFn: async () => {
      const response = await apiClient.get('/comments/', {
        params: { project_id: projectId },
      });
      return response.data as Comment[];
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
  });
}

/**
 * Hook to fetch a single comment with its replies
 */
export function useComment(commentId: number) {
  return useQuery({
    queryKey: [...COMMENTS_QUERY_KEY, commentId],
    queryFn: async () => {
      const response = await apiClient.get(`/comments/${commentId}/`);
      return response.data as CommentDetail;
    },
    enabled: !!commentId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}

/**
 * Hook to create a new comment
 */
export function useCreateComment(projectId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { content: string; parent_comment?: number }) => {
      const response = await apiClient.post('/comments/', {
        ...data,
        project_id: projectId,
      });
      return response.data as Comment;
    },
    onSuccess: (newComment) => {
      // Invalidate comments list to refetch
      queryClient.invalidateQueries({
        queryKey: [...COMMENTS_QUERY_KEY, projectId],
      });
      // Optionally invalidate specific comment if it's a reply
      if (newComment.parent_comment) {
        queryClient.invalidateQueries({
          queryKey: [...COMMENTS_QUERY_KEY, newComment.parent_comment],
        });
      }
    },
    onError: (error) => {
      console.error('Failed to create comment:', error);
    },
  });
}

/**
 * Hook to update an existing comment
 */
export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: number; content: string }) => {
      const response = await apiClient.patch(`/comments/${data.id}/`, {
        content: data.content,
      });
      return response.data as Comment;
    },
    onSuccess: () => {
      // Invalidate all comment queries to ensure consistency
      queryClient.invalidateQueries({
        queryKey: COMMENTS_QUERY_KEY,
      });
    },
    onError: (error) => {
      console.error('Failed to update comment:', error);
    },
  });
}

/**
 * Hook to delete (soft delete) a comment
 */
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: number) => {
      await apiClient.delete(`/comments/${commentId}/`);
    },
    onSuccess: () => {
      // Invalidate all comment queries
      queryClient.invalidateQueries({
        queryKey: COMMENTS_QUERY_KEY,
      });
    },
    onError: (error) => {
      console.error('Failed to delete comment:', error);
    },
  });
}

/**
 * Hook to fetch comments with filtering and pagination
 */
export function useFilteredComments(
  projectId: number,
  filters?: {
    parentCommentId?: number;
    sortBy?: 'newest' | 'oldest';
  }
) {
  return useQuery({
    queryKey: [
      ...COMMENTS_QUERY_KEY,
      projectId,
      filters?.parentCommentId,
      filters?.sortBy,
    ],
    queryFn: async () => {
      const response = await apiClient.get('/comments/', {
        params: {
          project_id: projectId,
          parent_comment: filters?.parentCommentId,
        },
      });
      let comments = response.data as Comment[];

      // Apply sorting if specified
      if (filters?.sortBy === 'oldest') {
        comments = comments.reverse();
      }

      return comments;
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}

export default {
  useComments,
  useComment,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
  useFilteredComments,
};
