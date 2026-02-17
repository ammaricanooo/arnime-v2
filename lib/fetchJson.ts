import { log } from "node:console"

export async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  const text = await res.text()

  // Try parsing if it looks like JSON
  const trimmed = text.trim()
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${trimmed}`)
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed)
    } catch (err) {
      throw new Error(`Invalid JSON response: ${err}`)
    }
  }

  // Non-JSON successful response
  throw new Error(`Unexpected non-JSON response: ${trimmed.slice(0, 200)}`)
}
