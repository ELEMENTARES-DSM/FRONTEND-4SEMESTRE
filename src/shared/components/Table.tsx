import { twMerge } from 'tailwind-merge'
import { useState, useMemo } from 'react'
import type {
  HTMLAttributes,
  ReactNode,
  TableHTMLAttributes,
  ThHTMLAttributes,
  TdHTMLAttributes,
} from 'react'
import { Icon } from './Icon'

export type SortDirection = 'asc' | 'desc'

export interface TableColumn<T> {
  key: string
  header: ReactNode
  render?: (item: T, index: number) => ReactNode
  align?: 'left' | 'center' | 'right'
  width?: string | number
  sortable?: boolean
  className?: string
  headerClassName?: string
}

const sizeClasses = {
  xs: 'table-xs',
  sm: 'table-sm',
  md: 'table-md',
  lg: 'table-lg',
}

export interface TableProps<T = Record<string, unknown>>
  extends TableHTMLAttributes<HTMLTableElement> {
  columns?: TableColumn<T>[]
  data?: T[]
  keyExtractor?: (item: T, index: number) => string | number
  onRowClick?: (item: T) => void
  loading?: boolean
  emptyMessage?: string
  emptyIcon?: ReactNode
  zebra?: boolean
  pinRows?: boolean
  pinCols?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg'
  containerClassName?: string
  sortBy?: string
  sortDirection?: SortDirection
  onSort?: (key: string, direction: SortDirection) => void
  children?: ReactNode
}

export function Table<T = Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  loading = false,
  emptyMessage = 'Nenhum registro encontrado',
  emptyIcon,
  zebra = false,
  pinRows = false,
  pinCols = false,
  size = 'md',
  containerClassName = '',
  className = '',
  sortBy,
  sortDirection = 'asc',
  onSort,
  children,
  ...props
}: TableProps<T>) {
  const isControlledSort = sortBy !== undefined && onSort !== undefined
  const [internalSortBy, setInternalSortBy] = useState<string | undefined>(sortBy)
  const [internalSortDir, setInternalSortDir] = useState<SortDirection>(sortDirection)

  const currentSortBy = isControlledSort ? sortBy : internalSortBy
  const currentSortDir = isControlledSort ? sortDirection : internalSortDir

  const handleSort = (key: string) => {
    const nextDir: SortDirection =
      currentSortBy === key && currentSortDir === 'asc' ? 'desc' : 'asc'

    if (!isControlledSort) {
      setInternalSortBy(key)
      setInternalSortDir(nextDir)
    }
    onSort?.(key, nextDir)
  }

  const sortedData = useMemo(() => {
    if (!data) return []
    if (isControlledSort || !currentSortBy) return data

    return [...data].sort((a, b) => {
      const aRecord = a as Record<string, unknown>
      const bRecord = b as Record<string, unknown>
      const aVal = aRecord[currentSortBy]
      const bVal = bRecord[currentSortBy]

      if (aVal === bVal) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return currentSortDir === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return currentSortDir === 'asc' ? aVal - bVal : bVal - aVal
      }

      return currentSortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal))
    })
  }, [data, isControlledSort, currentSortBy, currentSortDir])

  const defaultKeyExtractor = (item: T, index: number) => {
    const record = item as Record<string, unknown>
    return (record.id as string | number) ?? (record.key as string | number) ?? index
  }

  const getKey = keyExtractor ?? defaultKeyExtractor

  return (
    <div
      className={twMerge(
        'overflow-x-auto rounded-xl border border-line bg-base-200/40 shadow-sm relative',
        containerClassName,
      )}
    >
      {loading && (
        <div className="h-0.5 w-full bg-primary/20 overflow-hidden absolute top-0 left-0 right-0 z-10">
          <div className="h-full bg-primary animate-pulse w-full" />
        </div>
      )}

      <table
        {...props}
        className={twMerge(
          'table w-full border-collapse text-left text-sm',
          sizeClasses[size],
          zebra && 'table-zebra',
          pinRows && 'table-pin-rows',
          pinCols && 'table-pin-cols',
          className,
        )}
      >
        {columns ? (
          <>
            <thead className="bg-table-head text-muted border-b border-line text-xs uppercase tracking-wider font-semibold">
              <tr>
                {columns.map((col) => {
                  const isSorted = currentSortBy === col.key

                  return (
                    <th
                      key={col.key}
                      style={col.width ? { width: col.width } : undefined}
                      onClick={() => col.sortable && handleSort(col.key)}
                      className={twMerge(
                        'py-3.5 px-4 font-semibold text-muted transition-colors',
                        col.align === 'center' && 'text-center',
                        col.align === 'right' && 'text-right',
                        col.sortable &&
                          'cursor-pointer select-none hover:text-base-content hover:bg-base-300/40',
                        col.headerClassName,
                      )}
                    >
                      <div
                        className={twMerge(
                          'inline-flex items-center gap-1.5',
                          col.align === 'center' && 'justify-center',
                          col.align === 'right' && 'justify-end',
                        )}
                      >
                        <span>{col.header}</span>
                        {col.sortable && (
                          <span
                            className={twMerge(
                              'text-[10px] shrink-0 font-mono',
                              isSorted ? 'text-primary font-bold' : 'text-muted/40',
                            )}
                          >
                            {isSorted ? (currentSortDir === 'asc' ? '▲' : '▼') : '↕'}
                          </span>
                        )}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>

            <tbody className={twMerge('divide-y divide-line/40', loading && data && data.length > 0 && 'opacity-60')}>
              {loading && (!data || data.length === 0) ? (
                Array.from({ length: 4 }).map((_, rowIndex) => (
                  <tr key={`skeleton-${rowIndex}`} className="border-b border-line/40">
                    {columns.map((_, colIndex) => (
                      <td key={`skeleton-cell-${colIndex}`} className="py-4 px-4">
                        <div className="h-4 w-3/4 rounded bg-base-300 animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sortedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-12 text-center text-muted border-none"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      {emptyIcon ?? <Icon name="box" size={32} className="text-muted/40" />}
                      <span className="text-sm font-medium">{emptyMessage}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedData.map((item, index) => {
                  const key = getKey(item, index)

                  return (
                    <tr
                      key={key}
                      tabIndex={onRowClick ? 0 : undefined}
                      onClick={(event) => {
                        if (!onRowClick || loading || (event.target as HTMLElement).closest('button, a, input, select, textarea')) return
                        onRowClick(item)
                      }}
                      onKeyDown={(event) => {
                        if (!onRowClick || loading || event.target !== event.currentTarget) return
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          onRowClick(item)
                        }
                      }}
                      className={twMerge(
                        'border-b border-line/40 transition-colors hover:bg-row-hover/60',
                        onRowClick && 'group cursor-pointer focus-visible:bg-row-hover focus-visible:outline-2 focus-visible:outline-primary',
                      )}
                    >
                      {columns.map((col) => {
                        const cellContent = col.render
                          ? col.render(item, index)
                          : String((item as Record<string, unknown>)[col.key] ?? '')

                        return (
                          <td
                            key={col.key}
                            className={twMerge(
                              'py-3.5 px-4 text-sm text-base-content',
                              col.align === 'center' && 'text-center',
                              col.align === 'right' && 'text-right',
                              col.className,
                            )}
                          >
                            {cellContent}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })
              )}
            </tbody>
          </>
        ) : (
          children
        )}
      </table>
    </div>
  )
}

export function TableHead({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      {...props}
      className={twMerge(
        'bg-table-head text-muted border-b border-line text-xs uppercase tracking-wider font-semibold',
        className,
      )}
    >
      {children}
    </thead>
  )
}

export function TableBody({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      {...props}
      className={twMerge('divide-y divide-line/40', className)}
    >
      {children}
    </tbody>
  )
}

export function TableRow({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      {...props}
      className={twMerge(
        'border-b border-line/40 transition-colors hover:bg-row-hover/60',
        className,
      )}
    >
      {children}
    </tr>
  )
}

export function TableHeaderCell({
  className = '',
  children,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...props}
      className={twMerge(
        'py-3.5 px-4 font-semibold text-muted text-xs uppercase tracking-wider',
        className,
      )}
    >
      {children}
    </th>
  )
}

export function TableCell({
  className = '',
  children,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      {...props}
      className={twMerge('py-3.5 px-4 text-sm text-base-content', className)}
    >
      {children}
    </td>
  )
}

export function TableFooter({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tfoot
      {...props}
      className={twMerge(
        'bg-table-head/60 border-t border-line font-semibold text-muted',
        className,
      )}
    >
      {children}
    </tfoot>
  )
}

Table.Head = TableHead
Table.Body = TableBody
Table.Row = TableRow
Table.HeaderCell = TableHeaderCell
Table.Cell = TableCell
Table.Footer = TableFooter
