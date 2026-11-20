'use client'

import { useEffect, useState } from 'react'

type QueryResult<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string; detail?: string }
  | { status: 'ready'; data: T }

export function usePortalQuery<T>(url: string) {
  const [result, setResult] = useState<QueryResult<T>>({ status: 'loading' })
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        const response = await fetch(url, { signal: controller.signal })
        if (!response.ok) {
          const failure = await response.json().catch(() => null)
          if (!controller.signal.aborted) {
            setResult({
              status: 'error',
              message: response.status === 401 || response.status === 403 ? '현재 세션으로 조회할 수 없습니다.' : '데이터를 불러오지 못했습니다.',
              detail: typeof failure?.error === 'string' ? failure.error : undefined,
            })
          }
          return
        }
        const data: T = await response.json()
        if (!controller.signal.aborted) setResult({ status: 'ready', data })
      } catch (error) {
        if (!controller.signal.aborted) {
          setResult({ status: 'error', message: error instanceof Error ? error.message : '조회 중 오류가 발생했습니다.' })
        }
      }
    }

    void load()
    return () => controller.abort()
  }, [url, revision])

  const refresh = () => {
    setResult({ status: 'loading' })
    setRevision((current) => current + 1)
  }

  return { result, refresh }
}
