import { useEffect, useState } from 'react'
import { Notification } from '@/contexts/NotificationContext'

interface NotificationToastProps {
  notification: Notification
  onClose: () => void
}

export const NotificationToast = ({ notification, onClose }: NotificationToastProps) => {
  const [isClosing, setIsClosing] = useState(false)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (notification.duration === 0) return // Don't auto-close permanent notifications

    const timer = setTimeout(() => {
      setIsClosing(true)
      setTimeout(onClose, 300) // Wait for fade out
    }, notification.duration)

    // Update progress bar
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.max(0, prev - (100 / ((notification.duration || 5000) / 50))))
    }, 50)

    return () => {
      clearTimeout(timer)
      clearInterval(progressInterval)
    }
  }, [notification.duration, onClose])

  const getTypeStyles = () => {
    const baseStyles = 'rounded-lg shadow-xl overflow-hidden mb-4'
    const closingStyles = isClosing ? 'opacity-0' : 'opacity-100'

    switch (notification.type) {
      case 'success':
        return `${baseStyles} ${closingStyles} bg-green-50 border border-green-200`
      case 'error':
        return `${baseStyles} ${closingStyles} bg-red-50 border border-red-200`
      case 'warning':
        return `${baseStyles} ${closingStyles} bg-yellow-50 border border-yellow-200`
      case 'info':
      default:
        return `${baseStyles} ${closingStyles} bg-blue-50 border border-blue-200`
    }
  }

  const getIconBgColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'info':
      default:
        return 'bg-blue-500'
    }
  }

  const getTextColor = () => {
    switch (notification.type) {
      case 'success':
        return 'text-green-900'
      case 'error':
        return 'text-red-900'
      case 'warning':
        return 'text-yellow-900'
      case 'info':
      default:
        return 'text-blue-900'
    }
  }

  const getProgressBarColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'info':
      default:
        return 'bg-blue-500'
    }
  }

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return '✓'
      case 'error':
        return '✕'
      case 'warning':
        return '⚠'
      case 'info':
      default:
        return 'ℹ'
    }
  }

  return (
    <div className={getTypeStyles()}>
      <div className={`p-5 flex items-start gap-4 ${getTextColor()}`}>
        <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full font-bold text-white text-lg ${getIconBgColor()}`}>
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">{notification.message}</p>
          {notification.description && (
            <p className="text-xs opacity-80 mt-2">{notification.description}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-lg opacity-60 hover:opacity-100 font-bold"
          aria-label="Close notification"
          title="Close notification"
        >
          ×
        </button>
      </div>
      {notification.duration !== 0 && (
        <div className="h-1 bg-gray-200">
          <div
            className={`h-full ${getProgressBarColor()}`}
            style={{ width: `${progress}%`, transition: 'width 0.05s linear' }}
          />
        </div>
      )}
    </div>
  )
}
