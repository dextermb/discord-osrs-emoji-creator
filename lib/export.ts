import { zipSync } from "fflate"

import { CANVAS_HEIGHT, type Section } from "@/lib/editor"
import type { Placement } from "@/lib/placement"

export type ExportFormat = "png" | "webp"

export const EXPORT_FORMATS: { format: ExportFormat; label: string; type: string }[] = [
  { format: "png", label: "PNG", type: "image/png" },
  { format: "webp", label: "WebP", type: "image/webp" },
]

export const MAX_EMOJI_BYTES = 256 * 1024

const BASE_NAME = "emoji"

const GENERIC_FAMILIES = new Set([
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
  "ui-serif",
  "ui-sans-serif",
  "ui-monospace",
  "ui-rounded",
  "math",
  "emoji",
  "fangsong",
])

export type ExportText = {
  value: string
  font: string
  colour: string
  placement: Placement
}

export type ExportFile = {
  name: string
  width: number
  height: number
  blob: Blob
}

export function formatType(format: ExportFormat) {
  return EXPORT_FORMATS.find((entry) => entry.format === format)!.type
}

export function emojiFileName(format: ExportFormat, index?: number) {
  const suffix = index === undefined ? "" : `_${index + 1}`
  return `${BASE_NAME}${suffix}.${format}`
}

export function canvasFont(weight: number, size: number, fontFamily: string) {
  const families = fontFamily
    .split(",")
    .map((family) => family.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean)
    .map((family) => (GENERIC_FAMILIES.has(family) ? family : `"${family.replaceAll('"', '\\"')}"`))
  return `${weight} ${size}px ${families.join(", ")}`
}

function drawText(context: CanvasRenderingContext2D, text: ExportText) {
  const { cx, cy, rotation, scale } = text.placement
  context.save()
  context.font = text.font
  context.textAlign = "center"
  context.textBaseline = "alphabetic"
  context.fillStyle = text.colour
  context.translate(cx, cy)
  context.rotate((rotation * Math.PI) / 180)
  context.scale(scale, scale)
  const { fontBoundingBoxAscent, fontBoundingBoxDescent } = context.measureText(text.value)
  context.fillText(text.value, 0, (fontBoundingBoxAscent - fontBoundingBoxDescent) / 2)
  context.restore()
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas encode failed"))),
      type
    )
  })
}

export async function canEncode(type: string) {
  const canvas = document.createElement("canvas")
  canvas.width = 1
  canvas.height = 1
  const blob = await canvasToBlob(canvas, type)
  return blob.type === type
}

async function svgToCanvas(svg: string, box: Section, text: ExportText | null) {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }))
  try {
    const image = new Image()
    image.src = url
    await image.decode()

    const canvas = document.createElement("canvas")
    canvas.width = box.width
    canvas.height = CANVAS_HEIGHT
    const context = canvas.getContext("2d")
    if (!context) throw new Error("Canvas 2D is not available")
    context.drawImage(image, 0, 0, box.width, CANVAS_HEIGHT)
    if (text) {
      context.translate(-box.x, 0)
      drawText(context, text)
    }
    return canvas
  } finally {
    URL.revokeObjectURL(url)
  }
}

function cropSection(source: HTMLCanvasElement, box: Section, section: Section) {
  const x = section.x - box.x
  const { width } = section
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = CANVAS_HEIGHT
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Canvas 2D is not available")
  const sourceWidth = Math.min(width, source.width - x)
  context.drawImage(source, x, 0, sourceWidth, CANVAS_HEIGHT, 0, 0, sourceWidth, CANVAS_HEIGHT)
  return canvas
}

export async function exportFiles(
  svg: string,
  text: ExportText | null,
  box: Section,
  splitSections: Section[],
  format: ExportFormat
) {
  const type = formatType(format)
  const full = await svgToCanvas(svg, box, text)
  const toFile = async (canvas: HTMLCanvasElement, name: string): Promise<ExportFile> => ({
    name,
    width: canvas.width,
    height: canvas.height,
    blob: await canvasToBlob(canvas, type),
  })

  const combined = await toFile(full, emojiFileName(format))
  const split = await Promise.all(
    splitSections.map((section, index) =>
      toFile(cropSection(full, box, section), emojiFileName(format, index))
    )
  )
  return { combined, split }
}

export async function zipFiles(files: ExportFile[]) {
  const entries = await Promise.all(
    files.map(async (file) => [file.name, new Uint8Array(await file.blob.arrayBuffer())] as const)
  )
  const zipped = zipSync(Object.fromEntries(entries), { level: 0 })
  return new Blob([zipped as Uint8Array<ArrayBuffer>], { type: "application/zip" })
}
