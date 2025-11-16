import { FC } from 'react';
import CommentItem from './CommentItem';

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

interface CommentListProps {
  comments: Comment[];
  currentUserId: number;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  onEditComment?: (id: number, content: string) => void;
  onDeleteComment?: (id: number) => void;
  onReplyComment?: (id: number) => void;
}

/**
 * CommentList component displays a list of comments with pagination/infinite scroll support.
 * Shows loading and empty states.
 */
export const CommentList: FC<CommentListProps> = ({
  comments,
  currentUserId,
  isLoading = false,
  isEmpty = false,
  emptyMessage = 'No comments yet',
  onEditComment,
  onDeleteComment,
  onReplyComment,
}) => {
  if (isEmpty && comments.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  if (isLoading && comments.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          id={comment.id}
          content={comment.content}
          author={comment.author}
          created_at={comment.created_at}
          updated_at={comment.updated_at}
          is_edited={comment.is_edited}
          reply_count={comment.reply_count}
          isAuthor={comment.author.id === currentUserId}
          isLoading={isLoading}
          onEdit={onEditComment}
          onDelete={onDeleteComment}
          onReply={onReplyComment}
        />
      ))}

      {isLoading && comments.length > 0 && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentList;
