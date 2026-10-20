import React from 'react'
import clsx from 'clsx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
type Size    = 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const base =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-950 disabled:opacity-50 disabled:cursor-not-allowed select-none'

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white shadow-glow-sm hover:shadow-glow',
  secondary:
    'bg-white/10 hover:bg-white/15 active:bg-white/20 text-white border border-white/20 hover:border-white/30 backdrop-blur-sm',
  ghost:
    'bg-transparent hover:bg-white/8 active:bg-white/12 text-slate-300 hover:text-white',
  outline:
    'bg-transparent border border-brand-500 hover:bg-brand-600/10 text-brand-400 hover:text-brand-300',
  danger:
    'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white',
}

const sizes: Record<Size, string> = {
  sm:  'text-xs px-3 py-1.5 h-7',
  md:  'text-sm px-4 py-2 h-9',
  lg:  'text-base px-6 py-2.5 h-11',
  xl:  'text-lg px-8 py-3.5 h-14',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size    = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}
      {children}
      {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  ),
)
Button.displayName = 'Button'
