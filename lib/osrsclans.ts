const API_BASE = "https://osrsclans.cc/api/v1/osrs"

export const MIN_SEARCH_LENGTH = 2
export const PAGE_SIZE = 100

export type IconCategory =
  | { slug: string; label: string; source: "sprites"; spriteCategories: string[] }
  | { slug: string; label: string; source: "items" }

export const ICON_CATEGORIES: IconCategory[] = [
  { slug: "rank-icons", label: "Rank icons", source: "sprites", spriteCategories: ["ClanRankIcons"] },
  { slug: "skill-icons", label: "Skill icons", source: "sprites", spriteCategories: ["Staticons", "Staticons2"] },
  { slug: "boss-icons", label: "Boss icons", source: "sprites", spriteCategories: ["IconBoss25x25"] },
  { slug: "map-icons", label: "Map icons", source: "sprites", spriteCategories: ["Mapfunction"] },
  { slug: "prayer-icons", label: "Prayer icons", source: "sprites", spriteCategories: ["Prayeron"] },
  { slug: "spell-icons", label: "Spell icons", source: "sprites", spriteCategories: ["Magicon"] },
  { slug: "emotes", label: "Emote icons", source: "sprites", spriteCategories: ["Emotes"] },
  { slug: "item-icons", label: "Item icons", source: "items" },
]

export type ImageSource = {
  file: string
  width: number
  height: number
  format: "webp" | "svg"
  scale: string | null
  byteCount: number
}

export type SpriteFrame = {
  frame: number
  width: number
  height: number
  empty: boolean
  classic: { sources: ImageSource[]; srcset: string; svg: string | null }
  upscaled: { sources: ImageSource[]; srcset: string; svg: string | null }
}

export type Sprite = {
  id: number
  name: string | null
  category: string | null
  frames: SpriteFrame[]
}

export type Item = {
  id: number
  name: string | null
  images: { sources: ImageSource[]; srcset: string; svg: string | null }
}

type Page<T> = {
  items: T[]
  total: number
  limit: number
  offset: number
}

export type IconAsset = {
  key: string
  kind: "sprite" | "item"
  id: number
  name: string
  detail: string | null
  width: number
  height: number
  sources: ImageSource[]
  svg: string | null
}

export type IconPage = { assets: IconAsset[]; total: number }

export function toSpriteAsset(sprite: Sprite): IconAsset {
  const frame = sprite.frames[0]
  return {
    key: `sprite:${sprite.id}`,
    kind: "sprite",
    id: sprite.id,
    name: sprite.name ?? `Sprite ${sprite.id}`,
    detail: null,
    width: frame?.width ?? 0,
    height: frame?.height ?? 0,
    sources: frame?.classic.sources ?? [],
    svg: frame?.classic.svg ?? null,
  }
}

export function toItemAsset(item: Item): IconAsset {
  const base = item.images.sources.find((source) => source.scale === "1x")
  return {
    key: `item:${item.id}`,
    kind: "item",
    id: item.id,
    name: item.name ?? `Item ${item.id}`,
    detail: `#${item.id}`,
    width: base?.width ?? 0,
    height: base?.height ?? 0,
    sources: item.images.sources,
    svg: item.images.svg,
  }
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`osrsclans.cc responded ${response.status}`)
  }
  return response.json()
}

export function isSearchQuery(query: string) {
  return query.trim().length >= MIN_SEARCH_LENGTH
}

export async function fetchIcons(
  category: IconCategory,
  query: string,
  signal?: AbortSignal
): Promise<IconPage> {
  const trimmed = query.trim()
  const params = new URLSearchParams({ limit: String(PAGE_SIZE) })
  if (isSearchQuery(trimmed)) params.set("q", trimmed)

  if (category.source === "items") {
    const page = await getJson<Page<Item>>(`${API_BASE}/items/search?${params}`, signal)
    return { assets: page.items.map(toItemAsset), total: page.total }
  }

  for (const spriteCategory of category.spriteCategories) {
    params.append("category", spriteCategory)
  }
  const path = isSearchQuery(trimmed) ? "/sprites/search" : "/sprites"
  const page = await getJson<Page<Sprite>>(`${API_BASE}${path}?${params}`, signal)
  return { assets: page.items.map(toSpriteAsset), total: page.total }
}

const assetDataUris = new Map<string, string>()

const toSvgDataUri = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

export function cacheAssetSvg(assetKey: string, svg: string) {
  assetDataUris.set(assetKey, toSvgDataUri(svg))
}

export function cachedAssetDataUri(assetKey: string) {
  return assetDataUris.get(assetKey)
}

async function fetchFromApi(url: string, signal?: AbortSignal) {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`osrsclans.cc responded ${response.status}`)
  return response
}

function blobToDataUri(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

async function loadAssetDataUri(asset: IconAsset, signal?: AbortSignal) {
  if (asset.kind === "item") {
    const largest = webpSources(asset).at(-1)
    if (!largest) throw new Error(`${asset.name} has no WebP image`)
    return blobToDataUri(await (await fetchFromApi(largest.file, signal)).blob())
  }

  if (!asset.svg) throw new Error(`${asset.name} has no SVG`)
  return toSvgDataUri(await (await fetchFromApi(asset.svg, signal)).text())
}

export async function fetchAssetDataUri(asset: IconAsset, signal?: AbortSignal) {
  const cached = cachedAssetDataUri(asset.key)
  if (cached) return cached

  const dataUri = await loadAssetDataUri(asset, signal)
  assetDataUris.set(asset.key, dataUri)
  return dataUri
}

function webpSources(asset: IconAsset) {
  return asset.sources
    .filter((source) => source.format === "webp")
    .sort((a, b) => a.width - b.width)
}

export function assetSourceAtLeast(asset: IconAsset, minWidth: number) {
  const sources = webpSources(asset)
  return sources.find((source) => source.width >= minWidth) ?? sources.at(-1)
}
