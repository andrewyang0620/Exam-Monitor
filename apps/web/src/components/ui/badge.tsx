import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-blue-50 text-blue-700 border-blue-200',
        open: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        sold: 'bg-red-50 text-red-600 border-red-200',
        expected: 'bg-amber-50 text-amber-700 border-amber-200',
        monitoring: 'bg-blue-50 text-blue-600 border-blue-200',
        unknown: 'bg-slate-50 text-slate-500 border-slate-200',
        secondary: 'bg-slate-100 text-slate-700 border-slate-200',
        outline: 'border-slate-300 text-slate-700',
        success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        warning: 'bg-amber-50 text-amber-700 border-amber-200',
        destructive: 'bg-red-50 text-red-600 border-red-200',
        purple: 'bg-purple-50 text-purple-700 border-purple-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
