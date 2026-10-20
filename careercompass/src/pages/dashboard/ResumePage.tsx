/**
 * ResumePage  (Milestone 2)
 * ─────────────────────────
 * Full resume upload + profile analysis page.
 *
 * Layout (after upload):
 *  ┌──────────────────────────────────────────┐
 *  │  ProfileSummary (full width)             │
 *  │  ProfileStatsBar                         │
 *  ├──────────────────────────┬───────────────┤
 *  │  Skills (radar + tags)   │  Education    │
 *  │                          │  Experience   │
 *  │                          │  Certs        │
 *  │                          │  Industries   │
 *  └──────────────────────────┴───────────────┘
 */
import { useNavigate } from 'react-router-dom'
import { FileText, Briefcase, ChevronRight, RefreshCw, Sparkles } from 'lucide-react'
import { useResume } from '../../context/ResumeContext'
import { UploadZone } from '../../components/resume/UploadZone'
import { ProfileSummary } from '../../components/resume/ProfileSummary'
import { SkillChart, SkillTagCloud } from '../../components/resume/SkillChart'
import {
  EducationSection,
  ExperienceSection,
  CertificationsSection,
  IndustriesSection,
  ProfileStatsBar,
} from '../../components/resume/ProfileSections'
import { Card, Badge, Button } from '../../components/ui'

export default function ResumePage() {
  const { status, resume } = useResume()
  const navigate = useNavigate()

  /* ── idle / uploading / parsing / error ─────────────────────────────────── */
  if (status !== 'done' || !resume) {
    return (
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText size={20} className="text-brand-400" />
            <h2 className="text-2xl font-bold text-white">Resume Upload</h2>
          </div>
          <p className="text-slate-400 text-sm">
            Upload your PDF or DOCX resume. Our AI will extract your skills,
            experience, education, and certifications — then unlock personalised
            job and course recommendations.
          </p>
        </div>

        {/* Upload zone */}
        <UploadZone />

        {/* What we extract */}
        <Card className="border-brand-500/15 bg-brand-500/5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-brand-400" />
            <span className="text-white text-sm font-semibold">What we extract</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              'Professional Summary',
              'Technical Skills',
              'Work Experience',
              'Education & Degrees',
              'Certifications',
              'Industry Background',
              'Job Titles',
              'Seniority Level',
              'Skill Count',
            ].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </Card>

        {/* Supported formats */}
        <div className="flex items-center gap-4 text-xs text-slate-600">
          {[
            { fmt: 'PDF', icon: '📄' },
            { fmt: 'DOCX', icon: '📝' },
          ].map(({ fmt, icon }) => (
            <div key={fmt} className="flex items-center gap-1.5">
              <span>{icon}</span>
              <span>{fmt} supported</span>
            </div>
          ))}
          <span className="ml-auto">Max 10 MB</span>
        </div>
      </div>
    )
  }

  /* ── done — full profile analysis view ──────────────────────────────────── */
  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText size={20} className="text-brand-400" />
            <h2 className="text-2xl font-bold text-white">Profile Analysis</h2>
            <Badge variant="success" dot>Parsed</Badge>
          </div>
          <p className="text-slate-400 text-sm">
            Parsed from <span className="text-slate-300 font-medium">{resume.filename}</span>
            {' · '}
            {new Date(resume.parsed_at).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <UploadZone />    {/* shows compact "Replace" strip */}
          <Button
            variant="primary"
            leftIcon={<Briefcase size={16} />}
            rightIcon={<ChevronRight size={16} />}
            onClick={() => navigate('/dashboard/jobs')}
          >
            View Job Matches
          </Button>
        </div>
      </div>

      {/* Profile hero card */}
      <ProfileSummary resume={resume} />

      {/* Quick stats */}
      <ProfileStatsBar resume={resume} />

      {/* Main 2-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left — skills (wider) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Skill radar + bars */}
          <Card>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-500" />
                Skill Distribution
              </h3>
              <Badge variant="brand">{resume.skill_count} skills</Badge>
            </div>
            <SkillChart skills={resume.tech_skills} />
          </Card>

          {/* All skills tag cloud */}
          <Card>
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-500" />
              All Skills
            </h3>
            <SkillTagCloud skills={resume.tech_skills} />
          </Card>
        </div>

        {/* Right — structured info (narrower) */}
        <div className="lg:col-span-2 space-y-5">
          <EducationSection   resume={resume} />
          <ExperienceSection  resume={resume} />
          <CertificationsSection resume={resume} />
          <IndustriesSection  resume={resume} />
        </div>
      </div>

      {/* CTA to recommendations */}
      <div className="rounded-2xl border border-brand-500/20 bg-gradient-to-r from-brand-600/10 to-accent-600/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-white font-semibold text-lg">Your profile is ready!</h3>
          <p className="text-slate-400 text-sm mt-0.5">
            Explore your personalised job matches, course recommendations, and research domains.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap shrink-0">
          <Button
            variant="secondary"
            onClick={() => navigate('/dashboard/courses')}
          >
            View Courses
          </Button>
          <Button
            variant="primary"
            rightIcon={<ChevronRight size={16} />}
            onClick={() => navigate('/dashboard/jobs')}
          >
            View Jobs
          </Button>
        </div>
      </div>
    </div>
  )
}
