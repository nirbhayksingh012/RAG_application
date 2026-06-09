const rawBase =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''

/** Use same-origin /api when proxying in dev, or full URL from env */
export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  if (rawBase) return `${rawBase}${p}`
  return `/api${p}`
}

export type UploadResponse = {
  session_id: string
  files_processed: number
  chunks_indexed: number
  status: string
}

export type AskResponse = {
  answer: string
  status: string
  latency_ms: number
}

export async function uploadPdfs(files: File[]): Promise<UploadResponse> {
  const form = new FormData()
  for (const f of files) {
    form.append('files', f)
  }
  const res = await fetch(apiUrl('/upload'), {
    method: 'POST',
    body: form,
  })
  const text = await res.text()
  let data: unknown
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    throw new Error(text || `Upload failed (${res.status})`)
  }
  if (!res.ok) {
    const detail =
      typeof data === 'object' && data !== null && 'detail' in data
        ? String((data as { detail: unknown }).detail)
        : text
    throw new Error(detail || `Upload failed (${res.status})`)
  }
  return data as UploadResponse
}

export async function askQuestion(
  sessionId: string,
  question: string,
): Promise<AskResponse> {
  const res = await fetch(apiUrl('/ask'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, question }),
  })
  const text = await res.text()
  let data: unknown
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    throw new Error(text || `Request failed (${res.status})`)
  }
  if (!res.ok) {
    const detail =
      typeof data === 'object' && data !== null && 'detail' in data
        ? String((data as { detail: unknown }).detail)
        : text
    throw new Error(detail || `Request failed (${res.status})`)
  }
  return data as AskResponse
}

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(apiUrl('/health'))
    return res.ok
  } catch {
    return false
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  const res = await fetch(
    apiUrl(`/session/${encodeURIComponent(sessionId)}`),
    { method: 'DELETE' },
  )
  if (!res.ok) {
    const text = await res.text()
    let data: unknown
    try {
      data = text ? JSON.parse(text) : {}
    } catch {
      throw new Error(text || `Delete session failed (${res.status})`)
    }
    const detail =
      typeof data === 'object' && data !== null && 'detail' in data
        ? String((data as { detail: unknown }).detail)
        : text
    throw new Error(detail || `Delete session failed (${res.status})`)
  }
}
