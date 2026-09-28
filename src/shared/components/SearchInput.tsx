import { twMerge } from 'tailwind-merge'
import { useState, useId, useRef } from 'react'
import type {
  ChangeEvent,
  InputHTMLAttributes,
  KeyboardEvent,
  ReactNode,
} from 'react'
import { Icon } from './Icon'

const sizeClasses = {
  sm: 'h-8 py-1 px-2.5 text-xs rounded-md gap-1.5',
  md: 'h-auto min-h-0 py-2 px-3 text-sm rounded-lg gap-2',
  lg: 'h-11 py-2.5 px-3.5 text-base rounded-lg gap-2.5',
}

const iconSizes = {
  sm: 14,
  md: 16,
  lg: 18,
}

const clearIconSizes = {
  sm: 12,
  md: 14,
  lg: 16,
}

export interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  loading?: boolean
  clearable?: boolean
  size?: 'sm' | 'md' | 'lg'
  onClear?: () => void
  onSearch?: (value: string) => void
  containerClassName?: string
  inputClassName?: string
  startAddon?: ReactNode
  endAddon?: ReactNode
}

export function SearchInput({
  label,
  error,
  loading = false,
  clearable = true,
  size = 'md',
  onClear,
  onSearch,
  className = '',
  containerClassName = '',
  inputClassName = '',
  startAddon,
  endAddon,
  id: suppliedId,
  value: controlledValue,
  defaultValue = '',
  placeholder = 'Buscar...',
  disabled,
  onChange,
  onKeyDown,
  ...props
}: SearchInputProps) {
  const generatedId = useId()
  const id = suppliedId ?? generatedId
  const inputRef = useRef<HTMLInputElement>(null)

  const isControlled = controlledValue !== undefined
  const [internalValue, setInternalValue] = useState<string>(
    String(defaultValue ?? ''),
  )

  const currentValue = isControlled ? String(controlledValue ?? '') : internalValue
  const hasValue = currentValue.length > 0

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) {
      setInternalValue(e.target.value)
    }
    onChange?.(e)
  }

  const handleClear = () => {
    if (!isControlled) {
      setInternalValue('')
    }
    onClear?.()

    // Trigger synthetic change if input is uncontrolled
    if (inputRef.current) {
      inputRef.current.value = ''
      const event = new Event('input', { bubbles: true })
      inputRef.current.dispatchEvent(event)
      inputRef.current.focus()
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch?.(currentValue)
    } else if (e.key === 'Escape' && clearable && hasValue) {
      handleClear()
    }
    onKeyDown?.(e)
  }

  return (
    <div className={twMerge('min-w-0 w-full', className)}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-xs font-semibold tracking-wide text-muted"
        >
          {label}
        </label>
      )}

      <label
        htmlFor={id}
        className={twMerge(
          'input group flex items-center w-full min-w-0 border border-line bg-base-300 text-base-content shadow-none outline-none transition',
          'focus-within:border-primary focus-within:outline-none focus-within:shadow-[0_0_0_3px_#00A6E61F]',
          error && 'border-error/60 focus-within:border-error focus-within:shadow-[0_0_0_3px_#F052521F]',
          disabled && 'opacity-50 cursor-not-allowed bg-base-200',
          sizeClasses[size],
          containerClassName,
        )}
      >
        {startAddon}

        {loading ? (
          <span className="loading loading-spinner size-4 text-primary shrink-0" />
        ) : (
          <Icon
            name="search"
            size={iconSizes[size]}
            className="text-muted shrink-0 transition-colors group-focus-within:text-primary"
          />
        )}

        <input
          {...props}
          ref={inputRef}
          id={id}
          type="search"
          disabled={disabled}
          value={isControlled ? controlledValue : internalValue}
          placeholder={placeholder}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={twMerge(
            'h-full w-full min-w-0 bg-transparent text-inherit placeholder:text-muted/60 outline-none border-none p-0 text-sm [appearance:textfield] [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden',
            inputClassName,
          )}
        />

        {clearable && hasValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Limpar pesquisa"
            tabIndex={-1}
            className="text-muted hover:text-base-content p-0.5 rounded transition active:scale-95 shrink-0"
          >
            <Icon name="close" size={clearIconSizes[size]} />
          </button>
        )}

        {endAddon}
      </label>

      {error && (
        <p id={`${id}-error`} className="mt-1 text-[11px] text-error">
          {error}
        </p>
      )}
    </div>
  )
}