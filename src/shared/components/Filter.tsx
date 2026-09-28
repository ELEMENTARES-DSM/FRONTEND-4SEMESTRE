import { useState, useId } from 'react'
import type { FormHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

export interface FilterOption<T extends string | number = string> {
  label: string
  value: T
  count?: number | string
  disabled?: boolean
}

export type RawFilterOption<T extends string | number = string> =
  | T
  | FilterOption<T>

const sizeClasses = {
  xs: 'h-6 px-2 text-xs rounded',
  sm: 'h-8 px-3 text-[13px] rounded-md',
  md: 'h-9 px-3.5 text-sm rounded-lg',
}

const resetSizeClasses = {
  xs: 'h-6 w-6 text-xs rounded',
  sm: 'h-8 w-8 text-sm rounded-md',
  md: 'h-9 w-9 text-base rounded-lg',
}

interface BaseFilterProps<T extends string | number = string>
  extends Omit<FormHTMLAttributes<HTMLFormElement>, 'onChange' | 'defaultValue' | 'value'> {
  options?: RawFilterOption<T>[]
  name?: string
  size?: 'xs' | 'sm' | 'md'
  label?: ReactNode
  icon?: ReactNode
  containerClassName?: string
  itemClassName?: string
  showReset?: boolean
  resetLabel?: string
  collapse?: boolean
  allowDeselect?: boolean
  onReset?: () => void
  children?: ReactNode
}

export interface SingleFilterProps<T extends string | number = string>
  extends BaseFilterProps<T> {
  type?: 'radio'
  multiple?: false
  value?: T
  defaultValue?: T
  onChange?: (value: T) => void
}

export interface MultiCheckboxFilterProps<T extends string | number = string>
  extends BaseFilterProps<T> {
  type: 'checkbox'
  multiple?: boolean
  value?: T[]
  defaultValue?: T[]
  onChange?: (value: T[]) => void
}

export interface MultiExplicitFilterProps<T extends string | number = string>
  extends BaseFilterProps<T> {
  type?: 'checkbox' | 'radio'
  multiple: true
  value?: T[]
  defaultValue?: T[]
  onChange?: (value: T[]) => void
}

export type FilterProps<T extends string | number = string> =
  | SingleFilterProps<T>
  | MultiCheckboxFilterProps<T>
  | MultiExplicitFilterProps<T>

export function Filter<T extends string | number = string>(
  props: MultiCheckboxFilterProps<T>,
): ReactNode
export function Filter<T extends string | number = string>(
  props: MultiExplicitFilterProps<T>,
): ReactNode
export function Filter<T extends string | number = string>(
  props: SingleFilterProps<T>,
): ReactNode
export function Filter<T extends string | number = string>(props: FilterProps<T>) {
  const isMulti = Boolean(
    ('multiple' in props && props.multiple) || ('type' in props && props.type === 'checkbox'),
  )
  const isControlled = 'value' in props && props.value !== undefined

  const {
    options = [],
    name: suppliedName,
    type = 'radio',
    size = 'sm',
    label,
    icon,
    className = '',
    containerClassName = '',
    itemClassName = '',
    showReset = true,
    resetLabel = '×',
    collapse = true,
    allowDeselect = false,
    onReset,
    children,
    id,
    style,
    role,
    title,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
  } = props

  const value = 'value' in props ? props.value : undefined
  const defaultValue = 'defaultValue' in props ? props.defaultValue : undefined
  const onChange = 'onChange' in props ? props.onChange : undefined

  const generatedName = useId()
  const filterName = suppliedName ?? generatedName

  const [internalSingle, setInternalSingle] = useState<T>(
    () => (!isMulti && defaultValue !== undefined ? (defaultValue as T) : ('' as unknown as T)),
  )
  const [internalMulti, setInternalMulti] = useState<T[]>(
    () => (isMulti && defaultValue !== undefined ? (defaultValue as T[]) : []),
  )

  const currentSingle = isControlled ? (value as T) : internalSingle
  const currentMulti = isControlled ? ((value as T[]) ?? []) : internalMulti

  const handleItemChange = (optValue: T) => {
    if (isMulti) {
      const current = currentMulti
      const next = current.includes(optValue)
        ? current.filter((v) => v !== optValue)
        : [...current, optValue]

      if (!isControlled) {
        setInternalMulti(next)
      }
      ;(onChange as ((val: T[]) => void) | undefined)?.(next)
    } else {
      const current = currentSingle
      const next = allowDeselect && current === optValue ? ('' as unknown as T) : optValue

      if (!isControlled) {
        setInternalSingle(next)
      }
      ;(onChange as ((val: T) => void) | undefined)?.(next)
    }
  }

  const handleReset = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isMulti) {
      if (!isControlled) {
        setInternalMulti([])
      }
      ;(onChange as ((val: T[]) => void) | undefined)?.([])
    } else {
      if (!isControlled) {
        setInternalSingle('' as unknown as T)
      }
      ;(onChange as ((val: T) => void) | undefined)?.('' as unknown as T)
    }
    onReset?.()
  }

  const normalizedOptions: FilterOption<T>[] = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null && 'value' in opt) {
      return opt as FilterOption<T>
    }
    return {
      label: String(opt),
      value: opt as T,
    }
  })

  const hasSelection = isMulti ? currentMulti.length > 0 : Boolean(currentSingle)

  const formElement = (
    <form
      id={id}
      style={style}
      role={role}
      title={title}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      onSubmit={(e) => e.preventDefault()}
      onReset={handleReset}
      className={twMerge(
        'filter items-center gap-1.5',
        !collapse && '[&_input]:!opacity-100 [&_input]:!w-auto [&_input]:!scale-100 [&_input]:!inline-flex [&_input]:!visible',
        className,
      )}
    >
      {normalizedOptions.map((opt) => {
        const isChecked = isMulti
          ? currentMulti.includes(opt.value)
          : currentSingle === opt.value

        const displayLabel = `${opt.label}${opt.count !== undefined ? ` (${opt.count})` : ''}`

        return (
          <input
            key={String(opt.value)}
            type={isMulti ? 'checkbox' : type}
            name={filterName}
            aria-label={displayLabel}
            value={String(opt.value)}
            checked={isChecked}
            disabled={opt.disabled}
            onChange={() => handleItemChange(opt.value)}
            className={twMerge(
              'btn min-h-0 border border-line bg-base-300 text-muted font-medium transition duration-150',
              'hover:border-line-hover hover:text-base-content hover:bg-base-300/80 active:scale-95',
              'checked:border-primary checked:bg-primary checked:text-primary-content checked:font-bold checked:shadow-[0_0_12px_#00A6E633]',
              'focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50',
              sizeClasses[size],
              itemClassName,
            )}
          />
        )
      })}

      {children}

      {showReset && hasSelection && (
        <input
          type="reset"
          value={resetLabel}
          aria-label="Limpar filtro"
          title="Limpar filtro"
          className={twMerge(
            'btn btn-square min-h-0 border border-line bg-base-300 text-muted transition duration-150',
            'hover:border-error/40 hover:bg-error/10 hover:text-error active:scale-95',
            'focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50',
            resetSizeClasses[size],
          )}
        />
      )}
    </form>
  )

  if (icon || label) {
    return (
      <div className={twMerge('flex flex-wrap items-center gap-2.5', containerClassName)}>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
          {icon}
          {label && <span>{label}</span>}
        </div>
        {formElement}
      </div>
    )
  }

  return formElement
}

export interface FilterItemProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string
  size?: 'xs' | 'sm' | 'md'
}

export function FilterItem({
  label,
  size = 'sm',
  className = '',
  type = 'checkbox',
  ...props
}: FilterItemProps) {
  return (
    <input
      {...props}
      type={type}
      aria-label={label}
      className={twMerge(
        'btn min-h-0 border border-line bg-base-300 text-muted font-medium transition duration-150',
        'hover:border-line-hover hover:text-base-content hover:bg-base-300/80 active:scale-95',
        'checked:border-primary checked:bg-primary checked:text-primary-content checked:font-bold checked:shadow-[0_0_12px_#00A6E633]',
        'focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50',
        sizeClasses[size],
        className,
      )}
    />
  )
}

export interface FilterResetProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'xs' | 'sm' | 'md'
}

export function FilterReset({
  size = 'sm',
  className = '',
  value = '×',
  title = 'Limpar filtro',
  'aria-label': ariaLabel = 'Limpar filtro',
  ...props
}: FilterResetProps) {
  return (
    <input
      {...props}
      type="reset"
      value={value}
      title={title}
      aria-label={ariaLabel}
      className={twMerge(
        'btn btn-square min-h-0 border border-line bg-base-300 text-muted transition duration-150',
        'hover:border-error/40 hover:bg-error/10 hover:text-error active:scale-95',
        'focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50',
        resetSizeClasses[size],
        className,
      )}
    />
  )
}

Filter.Item = FilterItem
Filter.Reset = FilterReset