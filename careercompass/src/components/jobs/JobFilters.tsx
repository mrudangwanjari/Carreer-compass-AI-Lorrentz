/**
 * JobFilters
 * ──────────
 * Left-panel filter controls: search, domain, work-type,
 * experience level, remote toggle, minimum score slider.
 */
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { useJobs } from '../../context/JobsContext'
import { ALL_DOMAINS, ALL_WORK_TYPES, ALL_EXP_LEVELS } from '../../data/jobsData'
import { Button } from '../ui'
import clsx from 'clsx'

interface SelectProps {
  label:    string
  value:    string
  options:  string[]
  onChange: (v: string) => void
}

function FilterSelect({ label, value, options, onChange }: SelectProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={clsx(
          'w-full h-9 rounded-xl px-3 text-sm border transition-all',
          'bg-white/5 text-slate-300 border-white/12',
          'focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500',
          'hover:border-white/20',
          '[&>option]:bg-[#1e293b] [&>option]:text-white',
        )}
      >
        <option value="">All</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}

export function JobFilters() {
  const { filters, setFilters, resetFilters, jobs } = useJobs()

  const hasActiveFilters =
    filters.search      !== '' ||
    filters.domain      !== '' ||
    filters.workType    !== '' ||
    filters.expLevel    !== '' ||
    filters.remoteOnly  !== false ||
    filters.minScore    !== 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-brand-400" />
          <span className="text-sm font-semibold text-white">Filters</span>
          <span className="text-xs text-slate-500">{jobs.length} results</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors"
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Search jobs, companies…"
          value={filters.search}
          onChange={e => setFilters({ search: e.target.value })}
          className={clsx(
            'w-full h-9 pl-9 pr-3 rounded-xl text-sm border transition-all',
            'bg-white/5 text-slate-300 placeholder-slate-600 border-white/12',
            'focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500',
            'hover:border-white/20',
          )}
        />
        {filters.search && (
          <button
            onClick={() => setFilters({ search: '' })}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Domain */}
      <FilterSelect
        label="Domain"
        value={filters.domain}
        options={ALL_DOMAINS}
        onChange={v => setFilters({ domain: v })}
      />

      {/* Work type */}
      <FilterSelect
        label="Work Type"
        value={filters.workType}
        options={ALL_WORK_TYPES as string[]}
        onChange={v => setFilters({ workType: v as any })}
      />

      {/* Experience level */}
      <FilterSelect
        label="Experience Level"
        value={filters.expLevel}
        options={ALL_EXP_LEVELS as string[]}
        onChange={v => setFilters({ expLevel: v as any })}
      />

      {/* Remote toggle */}
      <label className="flex items-center justify-between cursor-pointer group">
        <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
          Remote only
        </span>
        <button
          role="switch"
          aria-checked={filters.remoteOnly}
          onClick={() => setFilters({ remoteOnly: !filters.remoteOnly })}
          className={clsx(
            'relative w-10 h-5 rounded-full transition-all duration-200',
            filters.remoteOnly ? 'bg-brand-600' : 'bg-white/15',
          )}
        >
          <span
            className={clsx(
              'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200',
              filters.remoteOnly ? 'left-5' : 'left-0.5',
            )}
          />
        </button>
      </label>

      {/* Minimum match score */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Min Match Score
          </label>
          <span className="text-xs font-semibold text-brand-400">{filters.minScore}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={90}
          step={5}
          value={filters.minScore}
          onChange={e => setFilters({ minScore: Number(e.target.value) })}
          className="w-full h-1.5 rounded-full accent-brand-500 cursor-pointer bg-white/10"
        />
        <div className="flex justify-between text-[10px] text-slate-600">
          <span>0%</span><span>90%+</span>
        </div>
      </div>

      {/* Score distribution pills */}
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Quick Filter</span>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: '90%+', min: 90, color: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' },
            { label: '80%+', min: 80, color: 'text-brand-300 border-brand-500/30 bg-brand-500/10' },
            { label: '70%+', min: 70, color: 'text-amber-300 border-amber-500/30 bg-amber-500/10' },
            { label: 'All',  min: 0,  color: 'text-slate-400 border-white/15 bg-white/5' },
          ].map(({ label, min, color }) => (
            <button
              key={label}
              onClick={() => setFilters({ minScore: min })}
              className={clsx(
                'px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                color,
                filters.minScore === min && 'ring-1 ring-brand-500/50',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
