"use client"

import { useEffect, useState } from "react"

import type { GoogleFont } from "@/lib/fonts"

type CatalogueResult = { fonts: GoogleFont[]; failed: boolean }

let cachedFonts: GoogleFont[] | null = null

export function useGoogleFonts(enabled: boolean) {
  const [result, setResult] = useState<CatalogueResult | null>(null)

  useEffect(() => {
    if (!enabled || cachedFonts) return

    let cancelled = false
    import("@/lib/google-fonts.json")
      .then(({ default: fonts }) => {
        cachedFonts = fonts
        if (!cancelled) setResult({ fonts, failed: false })
      })
      .catch(() => {
        if (!cancelled) setResult({ fonts: [], failed: true })
      })

    return () => {
      cancelled = true
    }
  }, [enabled])

  if (cachedFonts) return { fonts: cachedFonts, isLoading: false, failed: false }
  return {
    fonts: result?.fonts ?? [],
    isLoading: enabled && result === null,
    failed: result?.failed ?? false,
  }
}
