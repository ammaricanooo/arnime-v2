export async function fetchJson<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  const text = await res.text()
  const trimmed = text.trim()

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${trimmed}`)

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed) as T
    } catch {
      throw new Error(`Invalid JSON response from ${url}`)
    }
  }

  throw new Error(`Unexpected non-JSON response from ${url}`)
}
