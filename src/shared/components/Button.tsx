import { twMerge } from 'tailwind-merge'
import type { ButtonHTMLAttributes } from 'react'
const variants = {
  primary:
    'border-primary bg-primary text-primary-content font-bold hover:bg-primary/90 animate-glow',
  outline: 'border-primary bg-primary/15 text-primary hover:bg-primary/25',
  secondary:
    'border-line bg-transparent text-muted hover:text-base-content hover:border-line-hover',
  danger: 'border-error/40 bg-error/10 text-error hover:bg-error/20',
}
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  busy?: boolean
}
export function Button({
  variant = 'secondary',
  busy = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...props
}: Props) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={twMerge(
        `btn h-auto min-h-0 gap-2 rounded-md border px-4 py-2 text-[13px] font-semibold shadow-none transition duration-150 focus-visible:outline-primary hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]}`,
        className,
      )}
    >
      {busy && <span className="loading loading-spinner size-3.5" />}
      {children}
    </button>
  )
}
