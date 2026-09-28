import { twMerge } from 'tailwind-merge'
import { useId } from 'react'
import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  ReactNode,
} from 'react'
const fieldClass =
  'h-auto min-h-0 w-full min-w-0 rounded-lg border border-line bg-base-300 px-3 py-2 text-sm text-base-content shadow-none outline-none transition focus:border-primary focus:outline-none focus:shadow-[0_0_0_3px_#00A6E61F] aria-invalid:border-error/60 disabled:opacity-50'
interface Common {
  label?: string
  error?: string
}
export function Input({
  label,
  error,
  className = '',
  id: suppliedId,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & Common) {
  const generatedId = useId()
  const id = suppliedId ?? generatedId
  return (
    <div className="min-w-0">
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-xs font-semibold tracking-wide text-muted"
        >
          {label}
        </label>
      )}
      <input
        {...props}
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={twMerge(`input ${fieldClass}`, className)}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-[11px] text-error">
          {error}
        </p>
      )}
    </div>
  )
}
export function Select({
  label,
  error,
  className = '',
  id: suppliedId,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & Common & { children: ReactNode }) {
  const generatedId = useId()
  const id = suppliedId ?? generatedId
  return (
    <div className="min-w-0">
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-xs font-semibold tracking-wide text-muted"
        >
          {label}
        </label>
      )}
      <select
        {...props}
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={twMerge(`select ${fieldClass} pr-7`, className)}
      >
        {children}
      </select>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-[11px] text-error">
          {error}
        </p>
      )}
    </div>
  )
}
