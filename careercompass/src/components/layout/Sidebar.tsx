import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Compass, LayoutDashboard, Briefcase, BookOpen, FlaskConical,
  Map, BarChart3, Upload, Settings, LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import clsx from 'clsx'

const navItems = [
  { icon: LayoutDashboard, label: 'Overview',       href: '/dashboard' },
  { icon: Upload,          label: 'Resume',          href: '/dashboard/resume' },
  { icon: Briefcase,       label: 'Jobs',            href: '/dashboard/jobs' },
  { icon: BookOpen,        label: 'Courses',         href: '/dashboard/courses' },
  { icon: FlaskConical,    label: 'Research',        href: '/dashboard/research' },
  { icon: Map,             label: 'Career Roadmap',  href: '/dashboard/roadmap' },
  { icon: BarChart3,       label: 'Analytics',       href: '/dashboard/analytics' },
]

const bottomItems = [
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
]

interface SidebarProps {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
}

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const navigate = useNavigate()
  const { logout } = useAuth()

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 bottom-0 z-40 flex flex-col',
        'bg-[#0c0c18] border-r border-white/8 transition-all duration-300 ease-in-out',
        collapsed ? 'w-[68px]' : 'w-[240px]',
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-white/8 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-glow-sm shrink-0">
            <Compass size={18} className="text-white" />
          </div>
          <span
            className={clsx(
              'font-display font-bold text-white text-base whitespace-nowrap overflow-hidden transition-all duration-300',
              collapsed ? 'w-0 opacity-0' : 'w-36 opacity-100',
            )}
          >
            Career<span className="text-brand-400">Compass</span>
          </span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-0.5">
        {navItems.map(({ icon: Icon, label, href }) => (
          <NavLink
            key={href}
            to={href}
            end={href === '/dashboard'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative',
                isActive
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/6',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={clsx('shrink-0', isActive ? 'text-brand-400' : '')} />
                <span
                  className={clsx(
                    'whitespace-nowrap overflow-hidden transition-all duration-300',
                    collapsed ? 'w-0 opacity-0' : 'w-full opacity-100',
                  )}
                >
                  {label}
                </span>
                {/* Tooltip when collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1 bg-surface-800 border border-white/10 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                    {label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="shrink-0 border-t border-white/8 py-3 px-2 space-y-0.5">
        {bottomItems.map(({ icon: Icon, label, href }) => (
          <NavLink
            key={href}
            to={href}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative',
                isActive ? 'bg-brand-600/20 text-brand-300' : 'text-slate-400 hover:text-white hover:bg-white/6',
              )
            }
          >
            <Icon size={18} className="shrink-0" />
            <span className={clsx('whitespace-nowrap overflow-hidden transition-all duration-300', collapsed ? 'w-0 opacity-0' : 'w-full opacity-100')}>
              {label}
            </span>
            {collapsed && (
              <div className="absolute left-full ml-3 px-2.5 py-1 bg-surface-800 border border-white/10 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                {label}
              </div>
            )}
          </NavLink>
        ))}

        {/* Logout */}
        <button
          onClick={() => { logout(); navigate('/') }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/8 transition-all w-full group relative"
        >
          <LogOut size={18} className="shrink-0" />
          <span className={clsx('whitespace-nowrap overflow-hidden transition-all duration-300 text-left', collapsed ? 'w-0 opacity-0' : 'w-full opacity-100')}>
            Sign out
          </span>
          {collapsed && (
            <div className="absolute left-full ml-3 px-2.5 py-1 bg-surface-800 border border-white/10 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
              Sign out
            </div>
          )}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-white hover:bg-white/6 transition-all w-full"
        >
          {collapsed
            ? <ChevronRight size={18} className="shrink-0" />
            : <ChevronLeft size={18} className="shrink-0" />}
          <span className={clsx('whitespace-nowrap overflow-hidden transition-all duration-300', collapsed ? 'w-0 opacity-0' : 'w-full opacity-100')}>
            Collapse
          </span>
        </button>
      </div>
    </aside>
  )
}
