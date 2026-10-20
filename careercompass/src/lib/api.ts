/**
 * api.ts
 * ──────
 * Centralised HTTP client for the CareerCompass AI FastAPI backend.
 * All fetch calls go through here so error handling, auth headers,
 * and base URL are managed in one place.
 *
 * Base URL: import.meta.env.VITE_API_URL  (defaults to http://localhost:5455)
 * Set VITE_API_URL in .env.local to point to a deployed backend.
 */

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5455'
const API  = `${BASE}/api`

/* ── Auth token helpers ───────────────────────────────────────────────────── */
const TOKEN_KEY = 'cc_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(t: string) {
  localStorage.setItem(TOKEN_KEY, t)
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

/* ── Base fetch wrapper ───────────────────────────────────────────────────── */
async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    ...(options.body && !(options.body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined ?? {}),
  }

  const res = await fetch(`${API}${path}`, { ...options, headers })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new ApiError(err.detail ?? 'Request failed', res.status)
  }

  return res.json() as Promise<T>
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message)
    this.name = 'ApiError'
  }
}

/* ── Health ────────────────────────────────────────────────────────────────── */
export interface HealthStatus {
  status:       string
  version:      string
  sbert_loaded: boolean
  faiss_loaded: boolean
  jobs_indexed: number
}

export async function getHealth(): Promise<HealthStatus> {
  const res = await fetch(`${BASE}/health`)
  if (!res.ok) throw new ApiError('Backend unreachable', res.status)
  return res.json()
}

/* ── Auth ─────────────────────────────────────────────────────────────────── */
export interface UserOut {
  id:        string
  full_name: string
  email:     string
}

export interface AuthResponse {
  access_token: string
  token_type:   string
  user:         UserOut
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const r = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body:   JSON.stringify({ email, password }),
  })
  setToken(r.access_token)
  return r
}

export async function apiRegister(full_name: string, email: string, password: string): Promise<AuthResponse> {
  const r = await apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body:   JSON.stringify({ full_name, email, password }),
  })
  setToken(r.access_token)
  return r
}

export async function apiDemoLogin(): Promise<AuthResponse> {
  const r = await apiFetch<AuthResponse>('/auth/demo', { method: 'POST' })
  setToken(r.access_token)
  return r
}

export function apiLogout() {
  clearToken()
}

/* ── Resume ───────────────────────────────────────────────────────────────── */
export interface ParsedResumeAPI {
  full_name:            string
  email:                string
  phone:                string
  location:             string
  summary:              string
  current_role:         string
  years_experience:     number
  seniority_level:      string
  education_level:      string
  education_score:      number
  degrees:              string[]
  universities:         string[]
  tech_skills:          string[]
  certifications:       string[]
  skill_count:          number
  cert_count:           number
  companies:            string[]
  job_titles_found:     string[]
  industries_mentioned: string[]
  parse_quality_score:  number
  total_text_length:    number
  filename:             string
  file_size_kb:         number
  parsed_at:            string
}

export async function apiParseResume(file: File): Promise<ParsedResumeAPI> {
  const form = new FormData()
  form.append('file', file)
  return apiFetch<ParsedResumeAPI>('/resume/parse', {
    method: 'POST',
    body:   form,
  })
}

/* ── Jobs ─────────────────────────────────────────────────────────────────── */
export interface JobAPI {
  job_id:            string
  title:             string
  company_name:      string
  location:          string
  description:       string
  work_type:         string
  experience_level:  string
  remote_allowed:    boolean
  industry:          string
  domain:            string
  match_score:       number
  matched_skills:    string[]
  min_salary:        number | null
  max_salary:        number | null
  pay_period:        string | null
  posted_days_ago:   number
  applies:           number
  skills_desc:       string[]
  company_size:      string
  url:               string
}

export interface JobsResponse {
  jobs:            JobAPI[]
  total:           number
  query_time_ms:   number
}

export interface RecommendJobsOpts {
  topK?:       number
  seniority?:  string
  eduScore?:   number
  certCount?:  number
}

export async function apiRecommendJobs(
  resumeText:   string,
  resumeSkills: string[],
  opts: RecommendJobsOpts = {},
): Promise<JobsResponse> {
  return apiFetch<JobsResponse>('/jobs/recommend', {
    method: 'POST',
    body:   JSON.stringify({
      resume_text:   resumeText,
      resume_skills: resumeSkills,
      top_k:         opts.topK      ?? 50,
      seniority:     opts.seniority ?? 'Unknown',
      edu_score:     opts.eduScore  ?? 3,
      cert_count:    opts.certCount ?? 0,
    }),
  })
}

export async function apiJobsStatus() {
  return apiFetch<{ sbert_loaded: boolean; faiss_loaded: boolean; jobs_indexed: number }>('/jobs/status')
}
