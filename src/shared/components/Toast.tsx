import { useEffect, useRef } from 'react'
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
  const toastRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!notification) return

    try {
      if (toastRef.current && !toastRef.current.matches(':popover-open')) {
        toastRef.current.showPopover()
      }
    } catch (error) {
      console.warn('Popover API não suportada neste navegador', error)
    }

    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [notification, onClose])

  if (!notification) return null

  return (
    <div
      ref={toastRef}
      popover="manual"
      key={notification.id}
      role={notification.type === 'error' ? 'alert' : 'status'}
      className={`fixed m-0 top-5 right-5 left-auto bottom-auto z-[9999] flex w-[calc(100vw-40px)] max-w-[360px] animate-toast items-center gap-2.5 rounded-lg border bg-base-200 p-3.5 text-[13px] shadow-xl ${
        notification.type === 'error' ? 'border-error/40' : 'border-success/40'
      }`}
    >
      <Icon
        name={notification.type === 'error' ? 'alert' : 'check'}
        className={
          notification.type === 'error' ? 'text-error' : 'text-success'
        }
      />
      <span className="flex-1">{notification.message}</span>
      <button
        type="button"
        aria-label="Fechar notificação"
        onClick={onClose}
        className="text-muted"
      >
        <Icon name="close" size={12} />
      </button>
    </div>
  )
}