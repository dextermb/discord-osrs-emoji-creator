import { googleFontHref, isBundledFont, type TextFont } from "@/lib/fonts"

type FaceRule = { cssText: string; family: string; unicodeRange: string; base: string }

const URL_PATTERN = /url\(\s*(["']?)(.*?)\1\s*\)/g

const dataUris = new Map<string, Promise<string>>()
const googleSheets = new Map<string, Promise<CSSStyleSheet>>()

function unquote(name: string) {
  return name.trim().replace(/^["']|["']$/g, "")
}

function cached<T>(cache: Map<string, Promise<T>>, key: string, load: () => Promise<T>) {
  let value = cache.get(key)
  if (!value) {
    value = load()
    value.catch(() => cache.delete(key))
    cache.set(key, value)
  }
  return value
}

function faceRules(sheet: CSSStyleSheet, base: string): FaceRule[] {
  let cssRules: CSSRuleList
  try {
    cssRules = sheet.cssRules
  } catch {
    return []
  }
  return Array.from(cssRules)
    .filter((rule) => rule instanceof CSSFontFaceRule)
    .map((rule) => ({
      cssText: rule.cssText,
      family: unquote(rule.style.getPropertyValue("font-family")),
      unicodeRange: rule.style.getPropertyValue("unicode-range"),
      base,
    }))
}

function pageFaceRules() {
  return Array.from(document.styleSheets).flatMap((sheet) =>
    faceRules(sheet, sheet.href ?? document.baseURI)
  )
}

async function googleFaceRules(font: TextFont) {
  const href = googleFontHref(font.family, font.weight)
  const sheet = await cached(googleSheets, href, async () => {
    const response = await fetch(href)
    if (!response.ok) throw new Error(`Font CSS fetch failed: ${response.status}`)
    const parsed = new CSSStyleSheet()
    parsed.replaceSync(await response.text())
    return parsed
  })
  return faceRules(sheet, href)
}

function uploadFaceRule(font: TextFont & { source: "upload" }): FaceRule {
  return {
    cssText: `@font-face { font-family: "${font.family}"; src: url("${font.dataUri}"); font-weight: ${font.weight}; }`,
    family: font.family,
    unicodeRange: "",
    base: document.baseURI,
  }
}

function rangeSpan(part: string): [number, number] {
  const [start, end = start] = part.trim().replace(/^U\+/i, "").split("-")
  if (start.includes("?")) {
    return [parseInt(start.replaceAll("?", "0"), 16), parseInt(start.replaceAll("?", "F"), 16)]
  }
  return [parseInt(start, 16), parseInt(end, 16)]
}

function coversText(unicodeRange: string, text: string) {
  if (!unicodeRange) return true
  const spans = unicodeRange.split(",").map(rangeSpan)
  return Array.from(text).some((character) => {
    const codePoint = character.codePointAt(0)!
    return spans.some(([start, end]) => codePoint >= start && codePoint <= end)
  })
}

function blobToDataUri(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

async function inlineUrls({ cssText, base }: FaceRule) {
  let inlined = cssText
  for (const [match, , url] of cssText.matchAll(URL_PATTERN)) {
    if (url.startsWith("data:")) continue
    const absolute = new URL(url, base).href
    const dataUri = await cached(dataUris, absolute, async () => {
      const response = await fetch(absolute)
      if (!response.ok) throw new Error(`Font fetch failed: ${response.status}`)
      return blobToDataUri(await response.blob())
    })
    inlined = inlined.replace(match, `url("${dataUri}")`)
  }
  return inlined
}

export async function embeddedFontCss(font: TextFont, fontFamily: string, text: string) {
  const families = new Set(fontFamily.split(",").map(unquote))
  const rules = pageFaceRules()
  if (font.source === "google" && !isBundledFont(font)) rules.push(...(await googleFaceRules(font)))
  if (font.source === "upload") rules.push(uploadFaceRule(font))

  const needed = rules.filter(
    (rule) => families.has(rule.family) && coversText(rule.unicodeRange, text)
  )
  if (text && !needed.some((rule) => rule.family === unquote(fontFamily.split(",")[0]))) {
    throw new Error(`No @font-face for ${fontFamily}`)
  }
  return (await Promise.all(needed.map(inlineUrls))).join("\n")
}
