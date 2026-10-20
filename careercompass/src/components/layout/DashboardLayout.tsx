import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Bell, Search, ChevronDown, Menu, X } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { useAuth } from '../../context/AuthContext'
import clsx from 'clsx'

const crumbMap: Record<string, string> = {
  '/dashboard':           'Overview',
  '/dashboard/resume':    'Resume',
  '/dashboard/jobs':      'Jobs',
  '/dashboard/courses':   'Courses',
  '/dashboard/research':  'Research',
  '/dashboard/roadmap':   'Career Roadmap',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/settings':  'Settings',
}

export function DashboardLayout() {
  const [collapsed,    setCollapsed]    = useState(false)
  const [mobileOpen,   setMobileOpen]   = useState(false)
  const location = useLocation()
  const { user } = useAuth()
  const pageTitle = crumbMap[location.pathname] ?? 'Dashboard'

  return (
    <div className="min-h-screen bg-[#080810] flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — always visible on lg+, drawer on mobile */}
      <div className={clsx('lg:block', mobileOpen ? 'block' : 'hidden')}>
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Main area */}
      <div
        className={clsx(
          'flex-1 flex flex-col min-w-0 transition-all duration-300',
          collapsed ? 'lg:ml-[68px]' : 'lg:ml-[240px]',
        )}
      >
        {/* Top header */}
        <header className="sticky top-0 z-20 h-16 flex items-center gap-4 px-4 sm:px-6 bg-[#080810]/90 backdrop-blur-xl border-b border-white/8 shrink-0">
          {/* Mobile menu toggle */}
          <button
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-all"
            onClick={() => setMobileOpen(o => !o)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Page title + breadcrumb */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-white truncate">{pageTitle}</h1>
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <span>Dashboard</span>
              {pageTitle !== 'Overview' && (
                <>
                  <span>/</span>
                  <span className="text-slate-400">{pageTitle}</span>
                </>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-xl bg-white/6 border border-white/10 hover:border-white/20 transition-colors cursor-text min-w-[200px]">
            <Search size={14} className="text-slate-500 shrink-0" />
            <span className="text-slate-500 text-sm">Search…</span>
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition-all">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-[#080810]" />
          </button>

          {/* Avatar */}
          <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-white/6 transition-all group">
            <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user?.full_name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <span className="hidden sm:block text-sm text-slate-300 group-hover:text-white transition-colors">
              {user?.full_name?.split(' ')[0] ?? 'User'}
            </span>
            <ChevronDown size={14} className="text-slate-500 hidden sm:block" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
