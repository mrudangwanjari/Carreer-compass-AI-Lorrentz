/**
 * RecommendationsContext
 * ──────────────────────
 * Manages course recommendations, research domain predictions, and
 * roadmap milestones.  Resume-reactive: re-scores when resume changes.
 * In Milestone 5 all scoring comes from the Python inference API.
 */
import React, {
  createContext, useContext, useState,
  useCallback, useEffect, useMemo,
} from 'react'
import {
  COURSES, RESEARCH_DOMAINS, ROADMAP,
  type Course, type ResearchDomain, type RoadmapMilestone,
} from '../data/coursesData'
import { useResume } from './ResumeContext'

/* ── Types ─────────────────────────────────────────────────────────────────── */
export type CourseFilter = 'all' | 'ml-ai' | 'cloud' | 'data' | 'software' | 'free'
export type CourseSort   = 'relevance' | 'rating' | 'hours'

interface RecsState {
  courses:     Course[]
  domains:     ResearchDomain[]
  roadmap:     RoadmapMilestone[]
  loading:     boolean
  courseFilter: CourseFilter
  courseSort:   CourseSort
}

interface RecsContextValue extends RecsState {
  setCourseFilter: (f: CourseFilter) => void
  setCourseSort:   (s: CourseSort)   => void
  refreshRecs:     () => Promise<void>
}

/* ── Context ─────────────────────────────────────────────────────────────────── */
const RecsCtx = createContext<RecsContextValue | null>(null)

export function useRecs(): RecsContextValue {
  const ctx = useContext(RecsCtx)
  if (!ctx) throw new Error('useRecs must be inside <RecsProvider>')
  return ctx
}

/* ── Helpers ─────────────────────────────────────────────────────────────────── */
function scoreCoursesForResume(
  courses: Course[],
  userSkills: Set<string>,
): Course[] {
  return courses.map(c => {
    const gap   = c.skills.filter(s => !userSkills.has(s.toLowerCase()))
    const match = c.skills.filter(s => userSkills.has(s.toLowerCase()))
    // gap_score: high = many missing skills this course teaches = highly recommended
    const gap_score = Math.round((gap.length / Math.max(c.skills.length, 1)) * 100)
    return { ...c, gap_score }
  })
}

function scoreDomainsForResume(
  domains: ResearchDomain[],
  userSkills: Set<string>,
): ResearchDomain[] {
  return domains.map(d => {
    const overlap = d.top_skills.filter(s => userSkills.has(s.toLowerCase())).length
    const bonus   = Math.min(overlap * 3, 15)
    return { ...d, score: Math.min(99, d.score + bonus) }
  })
}

/* ── Provider ────────────────────────────────────────────────────────────────── */
export function RecsProvider({ children }: { children: React.ReactNode }) {
  const { resume } = useResume()

  const [loading,       setLoading]       = useState(false)
  const [courses,       setCourses]       = useState<Course[]>(COURSES)
  const [domains,       setDomains]       = useState<ResearchDomain[]>(RESEARCH_DOMAINS)
  const [roadmap,       setRoadmap]       = useState<RoadmapMilestone[]>(ROADMAP)
  const [courseFilter,  setCourseFilter]  = useState<CourseFilter>('all')
  const [courseSort,    setCourseSort]    = useState<CourseSort>('relevance')

  const refreshRecs = useCallback(async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 500))

    const userSkills = new Set(
      (resume?.tech_skills ?? []).map(s => s.toLowerCase()),
    )

    setCourses(scoreCoursesForResume(COURSES, userSkills))
    setDomains(scoreDomainsForResume(RESEARCH_DOMAINS, userSkills))

    // Personalise roadmap current role from resume
    if (resume) {
      setRoadmap(prev => prev.map((m, i) =>
        i === 0
          ? { ...m, role: resume.current_role || m.role }
          : m,
      ))
    } else {
      setRoadmap(ROADMAP)
    }

    setLoading(false)
  }, [resume])

  useEffect(() => { refreshRecs() }, [resume?.filename])

  /* Apply course filter + sort */
  const filteredCourses = useMemo(() => {
    let result = [...courses]

    if (courseFilter !== 'all') {
      const MAP: Record<CourseFilter, string> = {
        'all':      '',
        'ml-ai':    'ML/AI',
        'cloud':    'Cloud/DevOps',
        'data':     'Data Science',
        'software': 'Software Engineering',
        'free':     '',
      }
      if (courseFilter === 'free') {
        result = result.filter(c => c.price_usd === 'Free')
      } else {
        result = result.filter(c => c.domain === MAP[courseFilter])
      }
    }

    if (courseSort === 'relevance')
      result.sort((a, b) => (b.gap_score ?? 0) - (a.gap_score ?? 0))
    if (courseSort === 'rating')
      result.sort((a, b) => b.rating - a.rating)
    if (courseSort === 'hours')
      result.sort((a, b) => a.hours - b.hours)

    return result
  }, [courses, courseFilter, courseSort])

  /* Sort domains descending */
  const sortedDomains = useMemo(
    () => [...domains].sort((a, b) => b.score - a.score),
    [domains],
  )

  return (
    <RecsCtx.Provider value={{
      courses:    filteredCourses,
      domains:    sortedDomains,
      roadmap,
      loading,
      courseFilter,
      courseSort,
      setCourseFilter,
      setCourseSort,
      refreshRecs,
    }}>
      {children}
    </RecsCtx.Provider>
  )
}
