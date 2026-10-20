/**
 * ErrorBoundary
 * ─────────────
 * React class component boundary that catches render errors gracefully.
 * Wraps the entire App in main.tsx.
 */
import React from 'react'

interface Props  { children: React.ReactNode }
interface State  { hasError: boolean; message: string }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen bg-[#08080f] flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-3xl">
            ⚠️
          </div>
          <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
          <p className="text-slate-400 text-sm">{this.state.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-colors"
          >
            Reload page
          </button>
        </div>
      </div>
    )
  }
}
