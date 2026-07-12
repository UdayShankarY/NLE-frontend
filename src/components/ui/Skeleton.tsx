import { type HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

/** Loading placeholder. Use to replace ad-hoc spinners on product grids, admin tables, dashboard cards. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-black/10', className)} {...props} />
}
