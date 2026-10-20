import React from 'react'
import clsx from 'clsx'

type BadgeVariant = 'brand' | 'success' | 'warning' | 'danger' | 'neutral' | 'accent'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
  dot?: boolean
}

const variants: Record<BadgeVariant, string> = {
  brand:   'bg-brand-500/15 text-brand-300 border-brand-500/30',
  success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  danger:  'bg-red-500/15 text-red-300 border-red-500/30',
  neutral: 'bg-white/8 text-slate-300 border-white/15',
  accent:  'bg-accent-500/15 text-accent-400 border-accent-500/30',
}

const dotColors: Record<BadgeVariant, string> = {
  brand:   'bg-brand-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger:  'bg-red-400',
  neutral: 'bg-slate-400',
  accent:  'bg-accent-400',
}

export function Badge({ variant = 'neutral', children, className, dot = false }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variants[variant],
        className,
      )}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />}
      {children}
    </span>
  )
}
