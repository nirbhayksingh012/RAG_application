import { useCallback, useRef, useState } from 'react'

type Props = {
  disabled: boolean
  busy: boolean
  onFilesChosen: (files: File[]) => void
  onProcess: () => void
  selectedFiles: File[]
  phaseLabel: string
  variant?: 'default' | 'sidebar'
}

export function UploadZone({
  disabled,
  busy,
  onFilesChosen,
  onProcess,
  selectedFiles,
  phaseLabel,
  variant = 'default',
}: Props) {
  const isSidebar = variant === 'sidebar'
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const pickFiles = useCallback(
    (list: FileList | null) => {
      if (!list?.length) return
      const pdfs = Array.from(list).filter((f) =>
        f.name.toLowerCase().endsWith('.pdf'),
      )
      if (pdfs.length) onFilesChosen(pdfs)
    },
    [onFilesChosen],
  )

  return (
    <section
      className={
        isSidebar
          ? 'rounded-xl border border-zinc-800/90 bg-zinc-900/30 p-3 shadow-none'
          : 'rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-xl backdrop-blur-sm'
      }
    >
      <div className={isSidebar ? 'mb-2 flex flex-col gap-0.5' : 'mb-4 flex flex-col gap-1'}>
        <h2
          className={
            isSidebar
              ? 'text-sm font-semibold tracking-tight text-zinc-100'
              : 'text-lg font-semibold tracking-tight text-zinc-100'
          }
        >
          Documents
        </h2>
        <p
          className={
            isSidebar ? 'text-[11px] leading-snug text-zinc-500' : 'text-sm text-zinc-500'
          }
        >
          Drop PDFs or browse. Indexed locally for grounded answers.
        </p>
      </div>

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onClick={() => !disabled && !busy && inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          setDragOver(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (disabled || busy) return
          pickFiles(e.dataTransfer.files)
        }}
        className={[
          'group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-200',
          isSidebar ? 'min-h-[100px] px-2 py-4' : 'min-h-[160px] px-4 py-8',
          dragOver
            ? 'border-violet-500/70 bg-violet-500/10'
            : 'border-zinc-700 bg-zinc-950/50 hover:border-zinc-600 hover:bg-zinc-900/60',
          disabled || busy ? 'pointer-events-none opacity-60' : '',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => pickFiles(e.target.files)}
          disabled={disabled || busy}
        />
        <div className="pointer-events-none flex flex-col items-center gap-1.5 text-center">
          <div
            className={
              isSidebar
                ? 'rounded-full bg-violet-500/15 p-2 ring-1 ring-violet-500/25'
                : 'rounded-full bg-violet-500/15 p-3 ring-1 ring-violet-500/30'
            }
          >
            <svg
              className={isSidebar ? 'h-5 w-5 text-violet-300' : 'h-8 w-8 text-violet-300'}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <p
            className={
              isSidebar
                ? 'text-xs font-medium text-zinc-300'
                : 'text-sm font-medium text-zinc-300'
            }
          >
            {busy ? phaseLabel : 'Drop PDFs or click to upload'}
          </p>
          {!busy && (
            <p
              className={
                isSidebar
                  ? 'max-w-[14rem] text-[10px] text-zinc-500'
                  : 'max-w-xs text-xs text-zinc-500'
              }
            >
              Multiple files supported
            </p>
          )}
        </div>
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-zinc-950/70 backdrop-blur-[2px]">
            <div
              className={
                isSidebar
                  ? 'h-7 w-7 animate-spin rounded-full border-2 border-violet-400/30 border-t-violet-400'
                  : 'h-10 w-10 animate-spin rounded-full border-2 border-violet-400/30 border-t-violet-400'
              }
            />
          </div>
        )}
      </div>

      {selectedFiles.length > 0 && (
        <ul
          className={
            isSidebar
              ? 'mt-2 max-h-24 space-y-1 overflow-y-auto text-left text-zinc-400'
              : 'mt-4 max-h-32 space-y-1.5 overflow-y-auto text-left text-sm text-zinc-400'
          }
        >
          {selectedFiles.map((f) => (
            <li
              key={`${f.name}-${f.size}`}
              className={
                isSidebar
                  ? 'truncate rounded-md bg-zinc-800/50 px-2 py-1 font-mono text-[10px]'
                  : 'truncate rounded-lg bg-zinc-800/50 px-3 py-1.5 font-mono text-xs'
              }
            >
              {f.name}
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={onProcess}
        disabled={disabled || busy || selectedFiles.length === 0}
        className={
          isSidebar
            ? 'mt-3 w-full rounded-lg bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40'
            : 'mt-5 w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:from-violet-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-40'
        }
      >
        {busy ? 'Processing…' : 'Index documents'}
      </button>
    </section>
  )
}
