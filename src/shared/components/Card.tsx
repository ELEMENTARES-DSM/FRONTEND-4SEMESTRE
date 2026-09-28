import { twMerge } from 'tailwind-merge'
import type { HTMLAttributes, ReactNode } from 'react'

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode
  icon?: ReactNode
  actions?: ReactNode
  header?: ReactNode
  headerClassName?: string
  bodyClassName?: string
  actionsClassName?: string
  noBody?: boolean
  children?: ReactNode
}

export function Card({
  title,
  icon,
  actions,
  header,
  headerClassName = '',
  bodyClassName = '',
  actionsClassName = '',
  className = '',
  noBody = false,
  children,
  ...props
}: CardProps) {
  const hasHeader = Boolean(header || title || icon || actions)

  const headerElement = header ?? (hasHeader ? (
    <h2
      className={twMerge(
        'card-title mb-4 text-lg font-semibold text-base-content border-b border-line pb-2 flex items-center gap-2',
        headerClassName,
      )}
    >
      {icon}
      {title}
      {actions && (
        <div className={twMerge('card-actions ml-auto flex items-center gap-2', actionsClassName)}>
          {actions}
        </div>
      )}
    </h2>
  ) : null)

  return (
    <section
      {...props}
      className={twMerge(
        'card rounded-xl border border-line bg-base-200 shadow-sm',
        noBody ? 'p-5' : '',
        className,
      )}
    >
      {noBody ? (
        <>
          {headerElement}
          {children}
        </>
      ) : (
        <div className={twMerge('card-body p-5', bodyClassName)}>
          {headerElement}
          {children}
        </div>
      )}
    </section>
  )
}

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
}

export function CardBody({
  className = '',
  children,
  ...props
}: CardBodyProps) {
  return (
    <div
      {...props}
      className={twMerge('card-body p-5', className)}
    >
      {children}
    </div>
  )
}

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children?: ReactNode
}

export function CardTitle({
  className = '',
  children,
  ...props
}: CardTitleProps) {
  return (
    <h2
      {...props}
      className={twMerge(
        'card-title mb-4 text-lg font-semibold text-base-content border-b border-line pb-2 flex items-center gap-2',
        className,
      )}
    >
      {children}
    </h2>
  )
}

export interface CardActionsProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
}

export function CardActions({
  className = '',
  children,
  ...props
}: CardActionsProps) {
  return (
    <div
      {...props}
      className={twMerge('card-actions items-center gap-2', className)}
    >
      {children}
    </div>
  )
}

Card.Body = CardBody
Card.Title = CardTitle
Card.Header = CardTitle
Card.Actions = CardActions
