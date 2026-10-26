"use client"

import { useEffect, useState } from "react"

import {
  cachedAssetDataUri,
  fetchAssetDataUri,
  type IconAsset,
} from "@/lib/osrsclans"

type FetchResult = {
  assetKey: string
  dataUri: string | null
  failed: boolean
}

export function useAssetDataUri(asset: IconAsset | null) {
  const cached = asset ? cachedAssetDataUri(asset.key) : undefined
  const [result, setResult] = useState<FetchResult | null>(null)

  useEffect(() => {
    if (!asset || cached) return

    const controller = new AbortController()
    fetchAssetDataUri(asset, controller.signal)
      .then((dataUri) => setResult({ assetKey: asset.key, dataUri, failed: false }))
      .catch(() => {
        if (!controller.signal.aborted) {
          setResult({ assetKey: asset.key, dataUri: null, failed: true })
        }
      })

    return () => controller.abort()
  }, [asset, cached])

  if (!asset) return { dataUri: null, isLoading: false, failed: false }
  if (cached) return { dataUri: cached, isLoading: false, failed: false }

  const current = result?.assetKey === asset.key ? result : null
  return {
    dataUri: current?.dataUri ?? null,
    isLoading: current === null,
    failed: current?.failed ?? false,
  }
}
