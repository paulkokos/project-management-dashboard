import { useNotification } from '@/contexts/NotificationContext'
import { NotificationToast } from './NotificationToast'

export const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotification()

  if (notifications.length === 0) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="w-96 max-w-[calc(100vw-2rem)] pointer-events-auto">
        {notifications.map(notification => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </div>
  )
}
