import { useState } from 'react'
import { UploadZone } from './UploadZone'

type Props = {
  apiOk: boolean | null
  onRetryHealth: () => void
  onNewChat: () => void
  newChatDisabled: boolean
  uploadDisabled: boolean
  isUploading: boolean
  uploadPhaseLabel: string
  selectedFiles: File[]
  onFilesChosen: (files: File[]) => void
  onProcessUpload: () => void
  uploadError: string | null
  sessionId: string | null
  onSessionIdChange: (id: string | null) => void
}

export function AppSidebar({
  apiOk,
  onRetryHealth,
  onNewChat,
  newChatDisabled,
  uploadDisabled,
  isUploading,
  uploadPhaseLabel,
  selectedFiles,
  onFilesChosen,
  onProcessUpload,
  uploadError,
  sessionId,
  onSessionIdChange,
}: Props) {
  const [manualSessionId, setManualSessionId] = useState('')
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!sessionId) return
    void navigator.clipboard.writeText(sessionId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanId = manualSessionId.trim()
    if (cleanId) {
      onSessionIdChange(cleanId)
      setManualSessionId('')
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-zinc-800/80 px-3 py-3 md:px-4 md:py-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight text-zinc-100">
            PDF RAG
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
              apiOk === null
                ? 'bg-zinc-800 text-zinc-400'
                : apiOk
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-red-500/15 text-red-400'
            }`}
          >
            {apiOk === null
              ? '…'
              : apiOk
                ? 'Online'
                : 'Offline'}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-zinc-500">
          Local RAG with Ollama + FAISS. Add PDFs, then chat in the main panel.
        </p>
        {apiOk === false && (
          <button
            type="button"
            onClick={onRetryHealth}
            className="mt-2 text-xs font-medium text-violet-400 underline hover:text-violet-300"
          >
            Retry connection
          </button>
        )}
        <button
          type="button"
          onClick={onNewChat}
          disabled={newChatDisabled}
          className="mt-3 w-full rounded-lg border border-zinc-700/90 bg-zinc-800/50 px-3 py-2 text-left text-sm font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          New chat
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 md:px-4 md:py-4 space-y-4">
        <UploadZone
          variant="sidebar"
          disabled={uploadDisabled}
          busy={isUploading}
          phaseLabel={uploadPhaseLabel}
          selectedFiles={selectedFiles}
          onFilesChosen={onFilesChosen}
          onProcess={onProcessUpload}
        />

        {uploadError && (
          <p className="rounded-lg border border-red-500/35 bg-red-950/40 px-2.5 py-2 text-xs text-red-200">
            {uploadError}
          </p>
        )}

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-3 shadow-sm">
          <h3 className="text-xs font-semibold tracking-wide text-zinc-400 uppercase mb-2">
            Session Manager
          </h3>
          {sessionId ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <span>Active Session:</span>
                <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Ready
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={sessionId}
                  className="flex-1 min-w-0 rounded border border-zinc-800 bg-zinc-950/80 px-2 py-1 text-[11px] font-mono text-zinc-300"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copy session ID"
                  className="flex h-7 w-7 items-center justify-center rounded border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition"
                >
                  {copied ? (
                    <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={() => onSessionIdChange(null)}
                className="w-full text-center text-[10px] font-semibold text-zinc-500 hover:text-red-400 transition"
              >
                Disconnect Session
              </button>
            </div>
          ) : (
            <form onSubmit={handleConnect} className="space-y-2">
              <p className="text-[11px] leading-relaxed text-zinc-500">
                Pasted a Session ID? Enter it below to resume chat without re-uploading.
              </p>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Paste session ID..."
                  value={manualSessionId}
                  onChange={(e) => setManualSessionId(e.target.value)}
                  className="flex-1 min-w-0 rounded border border-zinc-800 bg-zinc-950/80 px-2 py-1 text-[11px] text-zinc-300 placeholder-zinc-650 focus:border-zinc-700 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!manualSessionId.trim()}
                  className="rounded bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:hover:bg-zinc-800 text-white px-2 py-1 text-[11px] font-semibold transition"
                >
                  Connect
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
