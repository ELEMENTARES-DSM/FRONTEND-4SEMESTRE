import { twMerge } from 'tailwind-merge'
import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'
let openDialogs = 0
let originalOverflow = ''

interface Props {
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
  busy?: boolean
  sheet?: boolean
  compact?: boolean
}
export function Modal({
  title,
  description,
  children,
  onClose,
  busy = false,
  sheet = false,
  compact = false,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  useEffect(() => {
    const dialog = ref.current
    const previous = document.activeElement as HTMLElement | null
    if (openDialogs === 0) originalOverflow = document.body.style.overflow
    openDialogs += 1
    dialog?.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog?.close()
      openDialogs -= 1
      if (openDialogs === 0) document.body.style.overflow = originalOverflow
      previous?.focus()
    }
  }, [])
  return createPortal(
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose()
      }}
      className={twMerge(
        `modal m-0 h-dvh max-h-none w-screen max-w-none bg-base-100/85 p-4 text-base-content backdrop-blur-[4px] backdrop:bg-transparent ${sheet ? 'items-end p-0 sm:items-center sm:p-4' : ''}`,
      )}
    >
      <section
        className={twMerge(
          `modal-box w-full max-h-[calc(100dvh-32px)] overflow-y-auto border border-line bg-base-200 p-6 shadow-[0_20px_60px_#0009] ${compact ? 'max-w-[380px]' : 'max-w-[440px]'} ${sheet ? 'max-w-none rounded-t-2xl rounded-b-none animate-sheet sm:max-w-[440px] sm:rounded-xl' : 'rounded-xl animate-dialog'}`,
        )}
      >
        <div className="mb-1 flex items-start justify-between gap-3">
          <h2
            id={titleId}
            className="text-[17px] leading-6 font-bold tracking-[-0.01em]"
          >
            {title}
          </h2>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            disabled={busy}
            className="p-0.5 text-muted transition hover:text-base-content disabled:opacity-40"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        {description && (
          <p
            id={descriptionId}
            className="mb-5 text-[13px] leading-5 text-muted"
          >
            {description}
          </p>
        )}
        {children}
      </section>
    </dialog>,
    document.body,
  )
}
