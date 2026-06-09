import { useEffect, useRef } from 'react'

import { GeneratingPlaceholder } from './GeneratingPlaceholder'

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  latencyMs?: number
}

const SUGGESTION_CHIPS = [
  'Summarize the main points from the documents.',
  'What are the key dates or deadlines mentioned?',
  'List any action items or next steps.',
] as const

type Props = {
  messages: ChatMessage[]
  isGenerating: boolean
  generatingPhaseLabel: string
  disabled: boolean
  input: string
  onInputChange: (v: string) => void
  onSend: () => void
  error: string | null
}

function AssistantGlyph() {
  return (
    <div
      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-600/20 text-emerald-400"
      aria-hidden
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    </div>
  )
}

export function ChatPanel({
  messages,
  isGenerating,
  generatingPhaseLabel,
  disabled,
  input,
  onInputChange,
  onSend,
  error,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isGenerating])

  const showEmpty = messages.length === 0 && !isGenerating

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-zinc-950/40">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {showEmpty && (
          <div className="mx-auto flex min-h-[50%] max-w-3xl flex-col items-center justify-center px-4 py-12 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 md:text-3xl">
              What can I help you find?
            </h1>
            <p className="mt-2 max-w-md text-sm text-zinc-500">
              Index PDFs from the sidebar, then ask questions grounded in your
              documents.
            </p>
            <div className="mt-8 flex w-full max-w-lg flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
              {SUGGESTION_CHIPS.map((label) => (
                <button
                  key={label}
                  type="button"
                  disabled={disabled}
                  onClick={() => onInputChange(label)}
                  className="rounded-2xl border border-zinc-700/80 bg-zinc-900/60 px-4 py-2.5 text-left text-xs text-zinc-300 transition hover:bg-zinc-800/80 disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="pb-4">
          {messages.map((m) =>
            m.role === 'assistant' ? (
              <div
                key={m.id}
                className="w-full border-b border-zinc-800/40 bg-zinc-900/35"
              >
                <div className="mx-auto flex max-w-3xl gap-3 px-4 py-5 md:gap-4">
                  <AssistantGlyph />
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-zinc-100">
                      {m.text}
                    </p>
                    {m.latencyMs != null && (
                      <p className="mt-2 text-xs text-zinc-500">{m.latencyMs} ms</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div key={m.id} className="w-full border-b border-zinc-800/30">
                <div className="mx-auto max-w-3xl px-4 py-5">
                  <div className="flex justify-end">
                    <div className="max-w-[min(100%,28rem)] rounded-3xl bg-zinc-800 px-4 py-3 text-[15px] leading-relaxed text-zinc-100">
                      <p className="whitespace-pre-wrap break-words">{m.text}</p>
                    </div>
                  </div>
                </div>
              </div>
            ),
          )}

          {isGenerating && (
            <div className="w-full border-b border-zinc-800/40 bg-zinc-900/35">
              <div className="mx-auto flex max-w-3xl gap-3 px-4 py-5 md:gap-4">
                <AssistantGlyph />
                <div className="min-w-0 flex-1 pt-0.5">
                  <GeneratingPlaceholder phaseLabel={generatingPhaseLabel} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} className="h-px" aria-hidden />
        </div>
      </div>

      <div className="shrink-0 border-t border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-3 pb-4 pt-3 md:px-4">
          {error && (
            <div className="mb-3 rounded-xl border border-red-500/35 bg-red-950/40 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}
          <div className="flex items-end gap-2 rounded-[28px] border border-zinc-700/90 bg-zinc-900/80 px-2 py-2 shadow-lg shadow-black/20 focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-zinc-500/40">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onInput={(e) => {
                const el = e.target as HTMLTextAreaElement
                el.style.height = 'auto'
                el.style.height = `${Math.min(el.scrollHeight, 200)}px`
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (!disabled && !isGenerating && input.trim()) onSend()
                }
              }}
              placeholder={
                disabled
                  ? 'Index PDFs in the sidebar to start…'
                  : 'Message PDF RAG…'
              }
              disabled={disabled || isGenerating}
              className="max-h-[200px] min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none disabled:opacity-50"
            />
            <button
              type="button"
              onClick={onSend}
              disabled={disabled || isGenerating || !input.trim()}
              className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500"
              aria-label="Send message"
            >
              <svg
                className="h-5 w-5 -translate-x-px translate-y-px"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-zinc-600">
            Answers use your indexed PDFs. Verify important facts in the source files.
          </p>
        </div>
      </div>
    </div>
  )
}
