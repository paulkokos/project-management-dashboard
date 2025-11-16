import { FC, useState } from 'react';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface Reply {
  id: number;
  content: string;
  author: User;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  reply_count: number;
}

interface CommentThreadProps {
  id: number;
  content: string;
  author: User;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  replies: Reply[];
  currentUserId: number;
  isLoading?: boolean;
  onEditComment?: (id: number, content: string) => void;
  onDeleteComment?: (id: number) => void;
  onAddReply?: (parentId: number, content: string) => void;
}

/**
 * CommentThread component displays a comment with its nested replies.
 * Supports expanding/collapsing the thread and adding new replies.
 */
export const CommentThread: FC<CommentThreadProps> = ({
  id,
  content,
  author,
  created_at,
  updated_at,
  is_edited,
  replies,
  currentUserId,
  isLoading = false,
  onEditComment,
  onDeleteComment,
  onAddReply,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showReplyForm, setShowReplyForm] = useState(false);

  const handleReply = (content: string) => {
    onAddReply?.(id, content);
    setShowReplyForm(false);
  };

  const replyCount = replies.length;

  return (
    <div className="space-y-3">
      {/* Main comment */}
      <CommentItem
        id={id}
        content={content}
        author={author}
        created_at={created_at}
        updated_at={updated_at}
        is_edited={is_edited}
        reply_count={replyCount}
        isAuthor={author.id === currentUserId}
        isLoading={isLoading}
        onEdit={onEditComment}
        onDelete={onDeleteComment}
        onReply={() => setShowReplyForm(true)}
      />

      {/* Reply form */}
      {showReplyForm && (
        <div className="ml-4 mt-2 p-3 bg-gray-50 rounded-md">
          <CommentForm
            onSubmit={handleReply}
            onCancel={() => setShowReplyForm(false)}
            isLoading={isLoading}
            placeholder="Write a reply..."
            submitLabel="Reply"
          />
        </div>
      )}

      {/* Replies section */}
      {replyCount > 0 && (
        <div className="ml-4 space-y-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            <span className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
              ▶
            </span>
            {isExpanded ? 'Hide' : 'Show'} {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
          </button>

          {isExpanded && (
            <div className="space-y-3 mt-2">
              {replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  id={reply.id}
                  content={reply.content}
                  author={reply.author}
                  created_at={reply.created_at}
                  updated_at={reply.updated_at}
                  is_edited={reply.is_edited}
                  reply_count={0}  // Limit threading depth to 1 level
                  isAuthor={reply.author.id === currentUserId}
                  isLoading={isLoading}
                  onEdit={onEditComment}
                  onDelete={onDeleteComment}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentThread;
