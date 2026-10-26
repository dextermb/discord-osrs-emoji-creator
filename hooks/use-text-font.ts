"use client"

import { useEffect, useState } from "react"

import { fontKey, isFontLoaded, loadGoogleFont, type TextFont } from "@/lib/fonts"

type LoadResult = { key: string; failed: boolean }

export type FontStatus = { isLoading: boolean; failed: boolean }

export function useTextFont(font: TextFont): FontStatus {
  const key = fontKey(font)
  const loaded = isFontLoaded(font)
  const [result, setResult] = useState<LoadResult | null>(null)

  useEffect(() => {
    if (loaded || font.source !== "google") return

    let cancelled = false
    loadGoogleFont(font)
      .then(() => {
        if (!cancelled) setResult({ key, failed: false })
      })
      .catch(() => {
        if (!cancelled) setResult({ key, failed: true })
      })

    return () => {
      cancelled = true
    }
  }, [font, key, loaded])

  if (loaded) return { isLoading: false, failed: false }

  const current = result?.key === key ? result : null
  return { isLoading: current === null, failed: current?.failed ?? false }
}
