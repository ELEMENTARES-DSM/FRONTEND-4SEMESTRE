import { twMerge } from 'tailwind-merge'
import type { HTMLAttributes, ReactNode } from 'react'

export type LoadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type LoadingVariant = 'spinner' | 'dots' | 'ring' | 'ball' | 'bars' | 'infinity'

const sizeClasses: Record<LoadingSize, string> = {
  xs: 'loading-xs',
  sm: 'loading-sm',
  md: 'loading-md',
  lg: 'loading-lg',
  xl: 'loading-xl',
}

const variantClasses: Record<LoadingVariant, string> = {
  spinner: 'loading-spinner',
  dots: 'loading-dots',
  ring: 'loading-ring',
  ball: 'loading-ball',
  bars: 'loading-bars',
  infinity: 'loading-infinity',
}

export interface LoadingProps extends HTMLAttributes<HTMLDivElement> {
  size?: LoadingSize
  variant?: LoadingVariant
  color?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'muted' | 'current'
  text?: ReactNode
  centered?: boolean
  fullScreen?: boolean
  spinnerClassName?: string
}

export function Loading({
  size = 'md',
  variant = 'spinner',
  color = 'primary',
  text,
  centered = false,
  fullScreen = false,
  className = '',
  spinnerClassName = '',
  ...props
}: LoadingProps) {
  const colorClass = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-accent',
    neutral: 'text-neutral-content',
    muted: 'text-muted',
    current: 'text-current',
  }[color]

  const spinner = (
    <span
      className={twMerge(
        'loading',
        variantClasses[variant],
        sizeClasses[size],
        colorClass,
        spinnerClassName,
      )}
      aria-hidden="true"
    />
  )

  if (fullScreen) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={twMerge(
          'fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-base-100/80 backdrop-blur-sm p-4',
          className,
        )}
        {...props}
      >
        {spinner}
        {text && <p className="text-sm font-medium text-muted animate-pulse">{text}</p>}
        <span className="sr-only">Carregando...</span>
      </div>
    )
  }

  if (centered || text) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={twMerge(
          'flex flex-col items-center justify-center gap-3 p-6 text-center',
          centered && 'min-h-[200px] w-full',
          className,
        )}
        {...props}
      >
        {spinner}
        {text && <p className="text-sm font-medium text-muted animate-pulse">{text}</p>}
        <span className="sr-only">Carregando...</span>
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={twMerge('inline-flex items-center gap-2', className)}
      {...props}
    >
      {spinner}
      <span className="sr-only">Carregando...</span>
    </div>
  )
}

export default Loading