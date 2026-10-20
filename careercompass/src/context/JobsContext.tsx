/**
 * JobsContext
 * ───────────
 * Manages the ranked job list, active filters, sort order, selected job,
 * and simulated "loading" state.  In Milestone 5 this will call the real
 * SBERT + FAISS inference API; for now it works against jobsData.ts.
 */
import React, {
  createContext, useContext, useState, useCallback,
  useMemo, useEffect,
} from 'react'
import { JOBS, type Job, type WorkType, type ExperienceLevel } from '../data/jobsData'
import { useResume } from './ResumeContext'

/* ── Filter / sort types ─────────────────────────────────────────────────────── */
export type SortBy = 'match' | 'recent' | 'salary'

export interface JobFilters {
  search:          string
  domain:          string        // '' = all
  workType:        WorkType | ''
  expLevel:        ExperienceLevel | ''
  remoteOnly:      boolean
  minScore:        number        // 0–100
}

const DEFAULT_FILTERS: JobFilters = {
  search:     '',
  domain:     '',
  workType:   '',
  expLevel:   '',
  remoteOnly: false,
  minScore:   0,
}

interface JobsState {
  jobs:        Job[]
  loading:     boolean
  filters:     JobFilters
  sortBy:      SortBy
  selectedJob: Job | null
  totalCount:  number
}

interface JobsContextValue extends JobsState {
  setFilters:     (f: Partial<JobFilters>) => void
  resetFilters:   () => void
  setSortBy:      (s: SortBy) => void
  selectJob:      (j: Job | null) => void
  refreshJobs:    () => Promise<void>
}

/* ── Context ─────────────────────────────────────────────────────────────────── */
const JobsContext = createContext<JobsContextValue | null>(null)

export function useJobs(): JobsContextValue {
  const ctx = useContext(JobsContext)
  if (!ctx) throw new Error('useJobs must be used inside <JobsProvider>')
  return ctx
}

/* ── Provider ────────────────────────────────────────────────────────────────── */
export function JobsProvider({ children }: { children: React.ReactNode }) {
  const { resume } = useResume()

  const [loading,     setLoading]     = useState(false)
  const [filters,     setFiltersState] = useState<JobFilters>(DEFAULT_FILTERS)
  const [sortBy,      setSortByState]  = useState<SortBy>('match')
  const [selectedJob, setSelectedJob]  = useState<Job | null>(null)

  /* Recompute match_scores when resume changes (simulates re-inference) */
  const [baseJobs, setBaseJobs] = useState<Job[]>(JOBS)

  const refreshJobs = useCallback(async () => {
    setLoading(true)

    try {
      // ── Try real API ────────────────────────────────────────────────────
      if (resume) {
        try {
          const { apiRecommendJobs } = await import('../lib/api')
          const resumeText = `${resume.summary} ${resume.tech_skills.join(' ')} ${resume.current_role}`
          const response = await apiRecommendJobs(resumeText, resume.tech_skills, {
            topK:      50,
            seniority: resume.seniority_level,
            eduScore:  resume.education_score,
            certCount: resume.cert_count,
          })

          // Map API response shape to local Job type
          const mapped: Job[] = response.jobs.map(j => ({
            job_id:           j.job_id,
            title:            j.title,
            company_name:     j.company_name,
            location:         j.location,
            description:      j.description,
            work_type:        j.work_type as any,
            experience_level: j.experience_level as any,
            remote_allowed:   j.remote_allowed,
            industry:         j.industry,
            domain:           j.domain,
            match_score:      j.match_score,
            matched_skills:   j.matched_skills,
            min_salary:       j.min_salary ?? undefined,
            max_salary:       j.max_salary ?? undefined,
            pay_period:       j.pay_period as any ?? undefined,
            posted_days_ago:  j.posted_days_ago,
            applies:          j.applies,
            skills_desc:      j.skills_desc,
            company_size:     j.company_size,
            url:              j.url,
          }))
          setBaseJobs(mapped.length > 0 ? mapped : JOBS)
          setLoading(false)
          return
        } catch {
          // Backend offline — fall through to local scoring
        }
      }

      // ── Local fallback (mock scoring) ───────────────────────────────────
      await new Promise(r => setTimeout(r, 400))
      if (resume) {
        const resumeSkills = new Set(resume.tech_skills.map(s => s.toLowerCase()))
        const updated = JOBS.map(job => {
          const overlap = job.skills_desc.filter(s => resumeSkills.has(s.toLowerCase())).length
          const bonus   = Math.min(overlap * 1.5, 8)
          return {
            ...job,
            match_score:    Math.min(99, Math.round(job.match_score + bonus)),
            matched_skills: job.skills_desc.filter(s => resumeSkills.has(s.toLowerCase())),
          }
        })
        setBaseJobs(updated)
      } else {
        setBaseJobs(JOBS)
      }
    } finally {
      setLoading(false)
    }
  }, [resume])

  /* Auto-refresh when resume changes */
  useEffect(() => {
    refreshJobs()
  }, [resume?.filename])   // dep on filename — changes when new resume uploaded

  /* Apply filters + sort */
  const jobs = useMemo(() => {
    let result = [...baseJobs]

    const q = filters.search.toLowerCase().trim()
    if (q) {
      result = result.filter(j =>
        j.title.toLowerCase().includes(q)        ||
        j.company_name.toLowerCase().includes(q) ||
        j.domain.toLowerCase().includes(q)       ||
        j.description.toLowerCase().includes(q),
      )
    }
    if (filters.domain)    result = result.filter(j => j.domain === filters.domain)
    if (filters.workType)  result = result.filter(j => j.work_type === filters.workType)
    if (filters.expLevel)  result = result.filter(j => j.experience_level === filters.expLevel)
    if (filters.remoteOnly) result = result.filter(j => j.remote_allowed)
    if (filters.minScore > 0)
      result = result.filter(j => j.match_score >= filters.minScore)

    if (sortBy === 'match')  result.sort((a, b) => b.match_score - a.match_score)
    if (sortBy === 'recent') result.sort((a, b) => a.posted_days_ago - b.posted_days_ago)
    if (sortBy === 'salary') result.sort((a, b) => (b.max_salary ?? 0) - (a.max_salary ?? 0))

    return result
  }, [baseJobs, filters, sortBy])

  const setFilters = useCallback((patch: Partial<JobFilters>) => {
    setFiltersState(f => ({ ...f, ...patch }))
  }, [])

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS)
  }, [])

  const setSortBy = useCallback((s: SortBy) => {
    setSortByState(s)
  }, [])

  const selectJob = useCallback((j: Job | null) => {
    setSelectedJob(j)
  }, [])

  return (
    <JobsContext.Provider value={{
      jobs,
      loading,
      filters,
      sortBy,
      selectedJob,
      totalCount: baseJobs.length,
      setFilters,
      resetFilters,
      setSortBy,
      selectJob,
      refreshJobs,
    }}>
      {children}
    </JobsContext.Provider>
  )
}
