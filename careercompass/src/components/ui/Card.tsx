import React from 'react'
import clsx from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  glow?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  onClick?: () => void
}

const paddings = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' }

export function Card({
  children,
  className,
  hover = false,
  glow = false,
  padding = 'md',
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm',
        paddings[padding],
        hover && 'transition-all duration-300 hover:border-brand-500/40 hover:bg-white/8 hover:-translate-y-0.5 hover:shadow-card-hover cursor-pointer',
        glow && 'hover:shadow-glow-sm',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps { children: React.ReactNode; className?: string }
export function CardHeader({ children, className }: CardHeaderProps) {
  return <div className={clsx('mb-4', className)}>{children}</div>
}

interface CardTitleProps { children: React.ReactNode; className?: string }
export function CardTitle({ children, className }: CardTitleProps) {
  return <h3 className={clsx('text-lg font-semibold text-white', className)}>{children}</h3>
}

interface CardContentProps { children: React.ReactNode; className?: string }
export function CardContent({ children, className }: CardContentProps) {
  return <div className={clsx(className)}>{children}</div>
}
