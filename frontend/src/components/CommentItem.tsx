import { FC, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface CommentItemProps {
  id: number;
  content: string;
  author: User;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  reply_count: number;
  onEdit?: (id: number, content: string) => void;
  onDelete?: (id: number) => void;
  onReply?: (id: number) => void;
  isAuthor: boolean;
  isLoading?: boolean;
}

/**
 * CommentItem component displays a single comment with author details,
 * timestamps, and action buttons for edit/delete/reply.
 */
export const CommentItem: FC<CommentItemProps> = ({
  id,
  content,
  author,
  created_at,
  is_edited,
  reply_count,
  onEdit,
  onDelete,
  onReply,
  isAuthor,
  isLoading = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  const handleEdit = () => {
    if (editedContent.trim() && onEdit) {
      onEdit(id, editedContent);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  const authorName = author.first_name && author.last_name
    ? `${author.first_name} ${author.last_name}`
    : author.username;

  return (
    <div className="border-l-2 border-gray-200 pl-4 py-3">
      {/* Author and timestamp */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-blue-700">
              {author.username[0].toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{authorName}</p>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
              {is_edited && ' (edited)'}
            </p>
          </div>
        </div>
        {isAuthor && (
          <div className="flex gap-2">
            {!isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  disabled={isLoading}
                  title="Edit comment"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete?.(id)}
                  className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                  disabled={isLoading}
                  title="Delete comment"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="mb-3">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            disabled={isLoading}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleEdit}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading || !editedContent.trim()}
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400 disabled:opacity-50"
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">{content}</p>
      )}

      {/* Actions */}
      {!isEditing && (
        <div className="flex items-center gap-4">
          {onReply && (
            <button
              onClick={() => onReply(id)}
              className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
              disabled={isLoading}
            >
              Reply
            </button>
          )}
          {reply_count > 0 && (
            <span className="text-xs text-gray-500">
              {reply_count} {reply_count === 1 ? 'reply' : 'replies'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
