import { useEffect } from 'react'
import { Icon } from './Icon'
export interface Notificacao {
  id: number
  message: string
  type: 'success' | 'error'
}
export function Toast({
  notification,
  onClose,
}: {
  notification: Notificacao | null
  onClose: () => void
}) {
  useEffect(() => {
    if (!notification) return
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [notification, onClose])
  if (!notification) return null
  return (
    <div
      key={notification.id}
      role={notification.type === 'error' ? 'alert' : 'status'}
      className={`fixed top-5 right-5 z-[100] flex w-[calc(100vw-40px)] max-w-[360px] animate-toast items-center gap-2.5 rounded-lg border bg-base-200 p-3.5 text-[13px] shadow-xl ${notification.type === 'error' ? 'border-error/40' : 'border-success/40'}`}
    >
      <Icon
        name={notification.type === 'error' ? 'alert' : 'check'}
        className={
          notification.type === 'error' ? 'text-error' : 'text-success'
        }
      />
      <span className="flex-1">{notification.message}</span>
      <button
        aria-label="Fechar notificação"
        onClick={onClose}
        className="text-muted"
      >
        <Icon name="close" size={12} />
      </button>
    </div>
  )
}
