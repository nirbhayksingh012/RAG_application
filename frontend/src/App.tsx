import { useCallback, useEffect, useState } from 'react'

import { AppSidebar } from './components/AppSidebar'
import type { ChatMessage } from './components/ChatPanel'
import { ChatPanel } from './components/ChatPanel'
import { useRotatingPhase } from './hooks/useRotatingPhase'
import {
  askQuestion,
  deleteSession,
  healthCheck,
  uploadPdfs,
} from './lib/api'

const UPLOAD_PHASES = [
  'Uploading…',
  'Extracting text…',
  'Embedding & indexing…',
] as const

const ASK_PHASES = ['Retrieving context…', 'Generating answer…'] as const

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [apiOk, setApiOk] = useState<boolean | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(() => {
    return localStorage.getItem('pdf_rag_session_id')
  })
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('pdf_rag_messages')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [input, setInput] = useState('')
  const [isAsking, setIsAsking] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)

  const uploadPhaseLabel = useRotatingPhase(isUploading, UPLOAD_PHASES)
  const askPhaseLabel = useRotatingPhase(isAsking, ASK_PHASES)

  const refreshHealth = useCallback(async () => {
    const ok = await healthCheck()
    setApiOk(ok)
  }, [])

  useEffect(() => {
    void refreshHealth()
    const id = window.setInterval(() => void refreshHealth(), 15000)
    return () => window.clearInterval(id)
  }, [refreshHealth])

  useEffect(() => {
    localStorage.setItem('pdf_rag_messages', JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    if (!sidebarOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sidebarOpen])

  const handleNewChat = useCallback(async () => {
    if (isUploading) return
    const sid = sessionId
    if (sid) {
      try {
        await deleteSession(sid)
      } catch {
        /* still reset local UI */
      }
    }
    setSessionId(null)
    localStorage.removeItem('pdf_rag_session_id')
    setMessages([])
    setFiles([])
    setInput('')
    setChatError(null)
    setUploadError(null)
    setSidebarOpen(false)
  }, [isUploading, sessionId])

  const handleProcess = useCallback(async () => {
    if (!files.length || isUploading) return
    setUploadError(null)
    setChatError(null)
    setIsUploading(true)
    try {
      const res = await uploadPdfs(files)
      setSessionId(res.session_id)
      localStorage.setItem('pdf_rag_session_id', res.session_id)
      setMessages([])
      setInput('')
      setSidebarOpen(false)
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed')
      setSessionId(null)
      localStorage.removeItem('pdf_rag_session_id')
    } finally {
      setIsUploading(false)
    }
  }, [files, isUploading])

  const handleFilesChosen = useCallback((incoming: File[]) => {
    setFiles((prev) => {
      const seen = new Set(prev.map((f) => `${f.name}:${f.size}:${f.lastModified}`))
      const merged = [...prev]
      for (const file of incoming) {
        const key = `${file.name}:${file.size}:${file.lastModified}`
        if (seen.has(key)) continue
        seen.add(key)
        merged.push(file)
      }
      return merged
    })
  }, [])

  const handleSend = useCallback(async () => {
    const q = input.trim()
    if (!sessionId || !q || isAsking) return
    setChatError(null)
    setInput('')
    const userMsg: ChatMessage = {
      id: newId(),
      role: 'user',
      text: q,
    }
    setMessages((prev) => [...prev, userMsg])
    setIsAsking(true)
    try {
      const res = await askQuestion(sessionId, q)
      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: 'assistant',
          text: res.answer,
          latencyMs: res.latency_ms,
        },
      ])
    } catch (e) {
      setChatError(e instanceof Error ? e.message : 'Could not get answer')
    } finally {
      setIsAsking(false)
    }
  }, [input, sessionId, isAsking])

  const chatDisabled = !sessionId || apiOk === false

  const sidebarBody = (
    <AppSidebar
      apiOk={apiOk}
      onRetryHealth={() => void refreshHealth()}
      onNewChat={() => void handleNewChat()}
      newChatDisabled={isUploading}
      uploadDisabled={apiOk === false}
      isUploading={isUploading}
      uploadPhaseLabel={uploadPhaseLabel}
      selectedFiles={files}
      onFilesChosen={handleFilesChosen}
      onProcessUpload={() => void handleProcess()}
      uploadError={uploadError}
      sessionId={sessionId}
      onSessionIdChange={(id) => {
        setSessionId(id)
        if (id) {
          localStorage.setItem('pdf_rag_session_id', id)
        } else {
          localStorage.removeItem('pdf_rag_session_id')
          localStorage.removeItem('pdf_rag_messages')
          setMessages([])
        }
      }}
    />
  )

  return (
    <div className="flex h-dvh min-h-0 w-full overflow-hidden bg-zinc-950">
      <aside className="hidden h-full w-[260px] shrink-0 border-r border-zinc-800/80 bg-zinc-900/25 md:flex md:flex-col">
        {sidebarBody}
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[1px] md:hidden"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(100vw-2.5rem,280px)] max-w-[calc(100vw-2rem)] flex-col overflow-hidden border-r border-zinc-800/80 bg-zinc-950 shadow-2xl transition-transform duration-200 ease-out md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!sidebarOpen}
      >
        {sidebarBody}
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-2 border-b border-zinc-800/80 bg-zinc-950/80 px-3 py-2.5 backdrop-blur-md md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-700/80 bg-zinc-900/50 text-zinc-200 hover:bg-zinc-800"
            aria-expanded={sidebarOpen}
            aria-label="Open sidebar"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <span className="text-sm font-semibold text-zinc-100">PDF RAG</span>
        </header>

        <ChatPanel
          messages={messages}
          isGenerating={isAsking}
          generatingPhaseLabel={askPhaseLabel}
          disabled={chatDisabled}
          input={input}
          onInputChange={setInput}
          onSend={() => void handleSend()}
          error={chatError}
        />
      </main>
    </div>
  )
}
