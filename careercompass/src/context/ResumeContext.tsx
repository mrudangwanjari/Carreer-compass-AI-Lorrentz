/**
 * ResumeContext
 * ─────────────
 * Holds the parsed resume profile in memory so every dashboard page
 * can read it without re-parsing.  In Milestone 5 this will be backed
 * by a real API call; for now the parsing is simulated client-side and
 * the result is stored in React state.
 */
import React, { createContext, useContext, useState, useCallback } from 'react'

/* ── Types ─────────────────────────────────────────────────────────────────── */
export interface ParsedResume {
  /* identity */
  full_name:          string
  email:              string
  phone:              string
  location:           string
  /* content */
  summary:            string
  current_role:       string
  years_experience:   number
  seniority_level:    string
  /* education */
  education_level:    string
  education_score:    number          // 1–4
  degrees:            string[]
  universities:       string[]
  /* skills & certs */
  tech_skills:        string[]        // tokenised skill list
  certifications:     string[]
  skill_count:        number
  cert_count:         number
  /* history */
  companies:          string[]
  job_titles_found:   string[]
  industries_mentioned: string[]
  /* quality */
  parse_quality_score: number         // 0–100
  total_text_length:  number
  /* file meta */
  filename:           string
  file_size_kb:       number
  parsed_at:          string          // ISO timestamp
}

export type ParseStatus = 'idle' | 'uploading' | 'parsing' | 'done' | 'error'

interface ResumeState {
  status:    ParseStatus
  resume:    ParsedResume | null
  error:     string | null
  progress:  number                   // 0–100 upload %
}

interface ResumeContextValue extends ResumeState {
  uploadAndParse: (file: File) => Promise<void>
  clearResume:    () => void
}

/* ── Context ───────────────────────────────────────────────────────────────── */
const ResumeContext = createContext<ResumeContextValue | null>(null)

export function useResume(): ResumeContextValue {
  const ctx = useContext(ResumeContext)
  if (!ctx) throw new Error('useResume must be used inside <ResumeProvider>')
  return ctx
}

/* ── Mock parser — mimics what the real BERT data pipeline produces ────────── */
async function mockParse(file: File): Promise<ParsedResume> {
  // Simulate network latency for each stage
  await new Promise(r => setTimeout(r, 800))

  const name = file.name.replace(/\.(pdf|docx)$/i, '').replace(/[_-]/g, ' ')

  return {
    full_name:          name || 'Demo User',
    email:              'demo@careercompass.ai',
    phone:              '+1 (415) 555-0192',
    location:           'San Francisco, CA',
    summary:
      'Experienced software engineer with 8+ years designing and shipping large-scale distributed systems. Deep expertise in cloud-native architectures, machine learning pipelines, and cross-functional team leadership. Passionate about turning research prototypes into production-grade AI products.',
    current_role:       'Senior Software Engineer',
    years_experience:   8,
    seniority_level:    'Mid-Senior level',
    education_level:    'MS',
    education_score:    4,
    degrees:            ['B.Tech Computer Science', 'MS Software Engineering'],
    universities:       ['IIT Bombay', 'Stanford University'],
    tech_skills: [
      'Python', 'TypeScript', 'React', 'Node.js', 'FastAPI',
      'PyTorch', 'TensorFlow', 'scikit-learn', 'BERT', 'Transformers',
      'AWS', 'GCP', 'Docker', 'Kubernetes', 'Terraform',
      'PostgreSQL', 'Redis', 'Kafka', 'Spark', 'Airflow',
      'Git', 'CI/CD', 'Agile', 'REST', 'GraphQL',
    ],
    certifications:     ['AWS Solutions Architect', 'Google Cloud Professional Data Engineer'],
    skill_count:        25,
    cert_count:         2,
    companies:          ['Google', 'Stripe', 'Startup (Series B)'],
    job_titles_found:   ['Software Engineer', 'Senior Software Engineer', 'Tech Lead'],
    industries_mentioned: ['Technology', 'FinTech', 'Healthcare', 'Cloud Computing'],
    parse_quality_score: 92,
    total_text_length:  14_200,
    filename:           file.name,
    file_size_kb:       Math.round(file.size / 1024),
    parsed_at:          new Date().toISOString(),
  }
}
export function ResumeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ResumeState>({
    status:   'idle',
    resume:   null,
    error:    null,
    progress: 0,
  })

  const uploadAndParse = useCallback(async (file: File) => {
    setState({ status: 'uploading', resume: null, error: null, progress: 0 })

    // Simulate upload progress ticks
    for (let p = 10; p <= 70; p += 20) {
      await new Promise(r => setTimeout(r, 120))
      setState(s => ({ ...s, progress: p }))
    }

    setState(s => ({ ...s, status: 'parsing', progress: 80 }))

    try {
      // ── Try real API ────────────────────────────────────────────────────
      let parsed: ParsedResume
      try {
        const { apiParseResume } = await import('../lib/api')
        const result = await apiParseResume(file)
        parsed = result as ParsedResume
      } catch {
        // Backend offline or error — fall back to mock parser
        parsed = await mockParse(file)
      }
      setState({ status: 'done', resume: parsed, error: null, progress: 100 })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Parsing failed'
      setState({ status: 'error', resume: null, error: msg, progress: 0 })
    }
  }, [])

  const clearResume = useCallback(() => {
    setState({ status: 'idle', resume: null, error: null, progress: 0 })
  }, [])

  return (
    <ResumeContext.Provider value={{ ...state, uploadAndParse, clearResume }}>
      {children}
    </ResumeContext.Provider>
  )
}
