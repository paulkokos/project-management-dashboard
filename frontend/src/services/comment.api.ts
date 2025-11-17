import api from './api';

export interface Comment {
  id: number;
  project: number;
  content: string;
  author: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  parent_comment: number | null;
  reply_count: number;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  replies?: Comment[];
}

export interface CreateCommentRequest {
  project: number;
  content: string;
  parent_comment?: number | null | undefined;
}

export const commentAPI = {
  // Get all comments for a project
  list: (projectId: number) =>
    api.get<Comment[]>('/comments/', {
      params: { project_id: projectId },
    }),

  // Get a single comment
  get: (commentId: number) =>
    api.get<Comment>(`/comments/${commentId}/`),

  // Create a new comment
  create: (data: CreateCommentRequest) =>
    api.post<Comment>('/comments/', data),

  // Update a comment
  update: (commentId: number, data: Partial<CreateCommentRequest>) =>
    api.patch<Comment>(`/comments/${commentId}/`, data),

  // Delete a comment
  delete: (commentId: number) =>
    api.delete(`/comments/${commentId}/`),
};
