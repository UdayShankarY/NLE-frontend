import { type HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

/**
 * Shared card container. Replaces repeated `.product-card`, `.stat-card`,
 * `.admin-card` box-shadow/radius/border declarations across index.css.
 */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-card border border-border bg-white shadow-card transition-shadow hover:shadow-lg',
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 border-b border-border', className)} {...props} />
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('font-semibold text-ink text-base', className)} {...props} />
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4', className)} {...props} />
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 border-t border-border flex items-center gap-2', className)} {...props} />
}
