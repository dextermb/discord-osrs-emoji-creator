"use client"

import { useEffect, useState } from "react"

import {
  fetchIcons,
  isSearchQuery,
  type IconCategory,
  type IconPage,
} from "@/lib/osrsclans"

const DEBOUNCE_MS = 300

type SearchResult = {
  key: string
  page: IconPage | null
  failed: boolean
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timeout)
  }, [value, delay])

  return debounced
}

function toEffectiveQuery(query: string) {
  return isSearchQuery(query) ? query.trim() : ""
}

export function useIconSearch(
  category: IconCategory | null,
  query: string,
  enabled: boolean
) {
  const effectiveQuery = toEffectiveQuery(query)
  const debouncedQuery = useDebouncedValue(effectiveQuery, DEBOUNCE_MS)
  const [result, setResult] = useState<SearchResult | null>(null)

  const needsQuery = category?.source === "items" && effectiveQuery === ""
  const key =
    category && enabled && !(category.source === "items" && debouncedQuery === "")
      ? `${category.slug}:${debouncedQuery}`
      : null

  useEffect(() => {
    if (!category || !key) return

    const controller = new AbortController()
    fetchIcons(category, debouncedQuery, controller.signal)
      .then((page) => setResult({ key, page, failed: false }))
      .catch(() => {
        if (!controller.signal.aborted) {
          setResult({ key, page: null, failed: true })
        }
      })

    return () => controller.abort()
  }, [category, debouncedQuery, key])

  const current = result?.key === key ? result : null
  const isLoading =
    !needsQuery &&
    enabled &&
    category !== null &&
    (current === null || effectiveQuery !== debouncedQuery)

  return {
    assets: needsQuery ? [] : (current?.page?.assets ?? []),
    total: needsQuery ? 0 : (current?.page?.total ?? 0),
    isLoading,
    failed: !needsQuery && (current?.failed ?? false),
    needsQuery,
  }
}
