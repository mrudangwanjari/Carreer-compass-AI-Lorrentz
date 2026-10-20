/**
 * UploadZone
 * ──────────
 * Drag-and-drop + click-to-browse file uploader.
 * Accepts PDF and DOCX, max 10 MB.
 */
import { useRef, useState, useCallback } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle2, X } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '../ui'
import { useResume } from '../../context/ResumeContext'

const ACCEPTED = ['.pdf', '.docx', 'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const MAX_MB = 10

function validateFile(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!['pdf', 'docx'].includes(ext ?? '')) return 'Only PDF and DOCX files are supported.'
  if (file.size > MAX_MB * 1024 * 1024)      return `File must be smaller than ${MAX_MB} MB.`
  return null
}

export function UploadZone() {
  const { status, progress, error, resume, uploadAndParse, clearResume } = useResume()
  const [dragOver, setDragOver] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (file: File) => {
      setFileError(null)
      const err = validateFile(file)
      if (err) { setFileError(err); return }
      uploadAndParse(file)
    },
    [uploadAndParse],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // reset so same file can be re-selected
    e.target.value = ''
  }

  /* ── already done — show compact "replace" strip ─────────────────────────── */
  if (status === 'done' && resume) {
    return (
      <div className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/8">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
          <CheckCircle2 size={22} className="text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate">{resume.filename}</p>
          <p className="text-slate-500 text-xs">{resume.file_size_kb} KB · Parsed successfully</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<X size={14} />}
          onClick={clearResume}
          className="shrink-0 text-slate-500 hover:text-red-400"
        >
          Remove
        </Button>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Upload size={14} />}
          onClick={() => inputRef.current?.click()}
          className="shrink-0"
        >
          Replace
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          className="hidden"
          onChange={onInputChange}
        />
      </div>
    )
  }

  /* ── uploading / parsing ─────────────────────────────────────────────────── */
  if (status === 'uploading' || status === 'parsing') {
    return (
      <div className="rounded-2xl border border-brand-500/30 bg-brand-500/5 p-8 flex flex-col items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-brand-500/15 flex items-center justify-center">
          <FileText size={26} className="text-brand-400 animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold mb-1">
            {status === 'uploading' ? 'Uploading…' : 'Parsing resume…'}
          </p>
          <p className="text-slate-500 text-xs">
            {status === 'uploading'
              ? 'Sending your file securely'
              : 'Extracting skills, experience, education…'}
          </p>
        </div>
        {/* Progress bar */}
        <div className="w-full max-w-xs">
          <div className="w-full h-1.5 rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-slate-600">
            <span>{status === 'uploading' ? 'Uploading' : 'Parsing'}</span>
            <span>{progress}%</span>
          </div>
        </div>
      </div>
    )
  }

  /* ── idle / error ────────────────────────────────────────────────────────── */
  const displayError = fileError ?? (status === 'error' ? error : null)

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload resume"
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        className={clsx(
          'rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer',
          'flex flex-col items-center justify-center gap-4 py-14 px-6 text-center',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
          dragOver
            ? 'border-brand-400 bg-brand-500/10 scale-[1.01]'
            : 'border-white/15 bg-white/3 hover:border-brand-500/50 hover:bg-brand-500/5',
        )}
      >
        <div
          className={clsx(
            'w-16 h-16 rounded-2xl flex items-center justify-center transition-colors',
            dragOver ? 'bg-brand-500/20' : 'bg-white/6',
          )}
        >
          <Upload
            size={30}
            className={clsx('transition-colors', dragOver ? 'text-brand-300' : 'text-slate-400')}
          />
        </div>

        <div>
          <p className="text-white font-semibold text-lg mb-1">
            {dragOver ? 'Drop to upload' : 'Drop your resume here'}
          </p>
          <p className="text-slate-500 text-sm">
            or{' '}
            <span className="text-brand-400 hover:text-brand-300 transition-colors font-medium">
              click to browse
            </span>
          </p>
          <p className="text-slate-600 text-xs mt-2">PDF or DOCX · Max {MAX_MB} MB</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          className="hidden"
          onChange={onInputChange}
        />
      </div>

      {displayError && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          {displayError}
        </div>
      )}
    </div>
  )
}
