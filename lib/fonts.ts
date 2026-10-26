export type GoogleFont = { family: string; weights: number[] }

export type TextFont =
  | { source: "google"; family: string; weights: number[]; weight: number }
  | { source: "upload"; family: string; name: string; dataUri: string; weight: number }

export const PREFERRED_WEIGHT = 700
export const UPLOAD_WEIGHT = 400
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
export const FONT_FILE_ACCEPT = ".ttf,.otf,.woff,.woff2"

export const DEFAULT_TEXT_FONT: TextFont = {
  source: "google",
  family: "Jim Nightshade",
  weights: [400],
  weight: 400,
}

const BUNDLED_FONTS: Record<string, string> = {
  "Jim Nightshade": "var(--font-emoji)",
  Geist: "var(--font-sans)",
}

export class FontTooLargeError extends Error {}

export function isBundledFont(font: TextFont) {
  return font.source === "google" && font.family in BUNDLED_FONTS
}

export function textFontStyle(font: TextFont) {
  const bundled = font.source === "google" ? BUNDLED_FONTS[font.family] : undefined
  return {
    fontFamily: bundled ?? `"${font.family}", var(--font-sans)`,
    fontWeight: font.weight,
  }
}

export function nearestWeight(weights: number[], target = PREFERRED_WEIGHT) {
  return weights.reduce((best, weight) => {
    const distance = Math.abs(weight - target) - Math.abs(best - target)
    return distance < 0 || (distance === 0 && weight > best) ? weight : best
  })
}

export function googleFont({ family, weights }: GoogleFont): TextFont {
  return { source: "google", family, weights, weight: nearestWeight(weights) }
}

export function fontKey(font: TextFont) {
  return `${font.source}:${font.family}:${font.weight}`
}

export function googleFontHref(family: string, weight: number) {
  const name = encodeURIComponent(family).replaceAll("%20", "+")
  return `https://fonts.googleapis.com/css2?family=${name}:wght@${weight}&display=swap`
}

const googleFontLoads = new Map<string, Promise<void>>()
const loadedGoogleFonts = new Set<string>()

export function isFontLoaded(font: TextFont) {
  return font.source === "upload" || isBundledFont(font) || loadedGoogleFonts.has(fontKey(font))
}

export function loadGoogleFont(font: TextFont & { source: "google" }) {
  const key = fontKey(font)
  const pending = googleFontLoads.get(key)
  if (pending) return pending

  const link = document.createElement("link")
  link.rel = "stylesheet"
  link.href = googleFontHref(font.family, font.weight)

  const load = new Promise<void>((resolve, reject) => {
    link.onload = () => resolve()
    link.onerror = () => reject(new Error(`Could not load ${font.family}`))
    document.head.append(link)
  })
    .then(() => document.fonts.load(`${font.weight} 48px "${font.family}"`))
    .then(() => {
      loadedGoogleFonts.add(key)
    })
    .catch((error: unknown) => {
      link.remove()
      googleFontLoads.delete(key)
      throw error
    })

  googleFontLoads.set(key, load)
  return load
}

let uploadCount = 0

function readFileAsDataUri(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export async function readFontFile(file: File): Promise<TextFont> {
  if (file.size > MAX_UPLOAD_BYTES) throw new FontTooLargeError()

  uploadCount += 1
  const family = `upload-${uploadCount}`
  const face = new FontFace(family, await file.arrayBuffer(), {
    weight: String(UPLOAD_WEIGHT),
  })
  await face.load()
  document.fonts.add(face)

  return {
    source: "upload",
    family,
    name: file.name,
    dataUri: await readFileAsDataUri(file),
    weight: UPLOAD_WEIGHT,
  }
}
