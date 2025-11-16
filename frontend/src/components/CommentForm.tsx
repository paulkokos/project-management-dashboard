import { FC, useState, useEffect, FormEvent } from 'react';

interface CommentFormProps {
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string;
  placeholder?: string;
  maxLength?: number;
  initialContent?: string;
  submitLabel?: string;
}

/**
 * CommentForm component provides a textarea for creating or editing comments.
 * Includes character counter, markdown preview toggle, and form validation.
 */
export const CommentForm: FC<CommentFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
  error,
  placeholder = 'Add a comment...',
  maxLength = 5000,
  initialContent = '',
  submitLabel = 'Post',
}) => {
  const [content, setContent] = useState(initialContent);
  const [showPreview, setShowPreview] = useState(false);
  const charCount = content.length;
  const isValid = content.trim().length > 0 && charCount <= maxLength;

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isValid) {
      onSubmit(content);
      setContent('');
    }
  };

  const handleCancel = () => {
    setContent(initialContent);
    onCancel?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Tabs for edit/preview */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setShowPreview(false)}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            !showPreview
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Write
        </button>
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            showPreview
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Preview
        </button>
      </div>

      {/* Content area */}
      {!showPreview ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:opacity-50"
          rows={4}
          maxLength={maxLength}
        />
      ) : (
        <div className="min-h-[120px] px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm">
          {content ? (
            <div className="whitespace-pre-wrap text-gray-700">{content}</div>
          ) : (
            <p className="text-gray-400">Nothing to preview</p>
          )}
        </div>
      )}

      {/* Character counter and error */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {charCount} / {maxLength} characters
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      {charCount > maxLength * 0.8 && (
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div
            className={`h-1 rounded-full transition-all ${
              charCount > maxLength ? 'bg-red-500' : 'bg-yellow-500'
            }`}
            style={{ width: `${Math.min((charCount / maxLength) * 100, 100)}%` }}
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-400 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!isValid || isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Posting...</span>
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
};

export default CommentForm;
