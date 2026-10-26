"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { DownloadIcon, FileArchiveIcon, TriangleAlertIcon } from "lucide-react"
import { cn } from "cn"

import { EmojiArtwork } from "@/components/emoji-artwork"
import { OptionGroup } from "@/components/emoji-chat"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAssetDataUri } from "@/hooks/use-asset-data-uri"
import type { FontStatus } from "@/hooks/use-text-font"
import { CANVAS_HEIGHT, canvasWidth, hasText, sections, type EditorState } from "@/lib/editor"
import { embeddedFontCss } from "@/lib/embedded-font"
import {
  canEncode,
  emojiFileName,
  EXPORT_FORMATS,
  exportFiles,
  MAX_EMOJI_BYTES,
  zipFiles,
  type ExportFile,
  type ExportFormat,
} from "@/lib/export"

type ReadyFile = ExportFile & { url: string }

type ExportResult =
  | { status: "ready"; combined: ReadyFile; split: ReadyFile[]; zipUrl: string; fontFailed: boolean }
  | { status: "failed" }

const labelClass = "text-sm tracking-label text-muted-foreground uppercase"

function serializeSvg(svg: SVGSVGElement, fontFamily: string, fontCss: string | null) {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.querySelector("text")?.style.setProperty("font-family", fontFamily)
  if (fontCss) {
    const style = document.createElementNS("http://www.w3.org/2000/svg", "style")
    style.textContent = fontCss
    clone.prepend(style)
  }
  return new XMLSerializer().serializeToString(clone)
}

function withUrl(file: ExportFile): ReadyFile {
  return { ...file, url: URL.createObjectURL(file.blob) }
}

function formatBytes(bytes: number) {
  return `${(bytes / 1024).toFixed(1)} KiB`
}

export function EmojiExport({
  state,
  fontStatus,
  format,
  onFormatChange,
}: {
  state: EditorState
  fontStatus: FontStatus
  format: ExportFormat
  onFormatChange: (format: ExportFormat) => void
}) {
  const { dataUri, isLoading } = useAssetDataUri(state.asset)
  const svgRef = useRef<SVGSVGElement>(null)
  const [result, setResult] = useState<ExportResult | null>(null)
  const [unsupported, setUnsupported] = useState<ExportFormat[]>([])
  const loading = isLoading || fontStatus.isLoading
  const width = canvasWidth(state)
  const splitCount = sections({ ...state, split: true }).length

  useEffect(() => {
    let cancelled = false
    Promise.all(
      EXPORT_FORMATS.map(async ({ format: entry, type }) =>
        (await canEncode(type).catch(() => false)) ? null : entry
      )
    ).then((formats) => {
      if (!cancelled) setUnsupported(formats.filter((entry) => entry !== null))
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg || loading) return

    let cancelled = false
    const render = async () => {
      const text = svg.querySelector("text")
      const fontFamily = text ? getComputedStyle(text).fontFamily : ""
      const fontCss = await embeddedFontCss(
        state.text.font,
        fontFamily,
        hasText(state) ? state.text.value : ""
      ).catch(() => null)
      const markup = serializeSvg(svg, fontFamily, fontCss)
      const files = await exportFiles(
        markup,
        canvasWidth(state),
        sections({ ...state, split: true }),
        format
      )
      const zip = await zipFiles(files.split)
      if (cancelled) return
      setResult({
        status: "ready",
        combined: withUrl(files.combined),
        split: files.split.map(withUrl),
        zipUrl: URL.createObjectURL(zip),
        fontFailed: fontCss === null && hasText(state),
      })
    }
    render().catch(() => {
      if (!cancelled) setResult({ status: "failed" })
    })
    return () => {
      cancelled = true
    }
  }, [state, dataUri, loading, format])

  useEffect(() => {
    if (result?.status !== "ready") return
    return () => {
      for (const file of [result.combined, ...result.split]) URL.revokeObjectURL(file.url)
      URL.revokeObjectURL(result.zipUrl)
    }
  }, [result])

  const ready = result?.status === "ready" && !loading ? result : null

  return (
    <div className="flex flex-col gap-6 p-6">
      <div aria-hidden className="invisible absolute size-0 overflow-hidden">
        <svg
          ref={svgRef}
          xmlns="http://www.w3.org/2000/svg"
          width={width}
          height={CANVAS_HEIGHT}
          viewBox={`0 0 ${width} ${CANVAS_HEIGHT}`}
>
          <EmojiArtwork state={state} dataUri={dataUri} />
        </svg>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <OptionGroup
          label="Format"
          value={format}
          options={EXPORT_FORMATS.map(({ format: value, label }) => ({
            value,
            label,
            disabled: unsupported.includes(value),
          }))}
          onValueChange={onFormatChange}
        />
        {unsupported.map((entry) => (
          <span key={entry} className="text-sm text-muted-foreground">
            This browser cannot make {EXPORT_FORMATS.find((f) => f.format === entry)!.label} files.
          </span>
        ))}
        <span className="text-sm text-muted-foreground">
          Discord accepts emoji files up to {MAX_EMOJI_BYTES / 1024} KiB.
        </span>
      </div>
      {result?.status === "failed" && (
        <Alert variant="destructive">
          <AlertDescription>Could not make the image files.</AlertDescription>
        </Alert>
      )}
      {ready?.fontFailed && (
        <Alert variant="destructive">
          <AlertDescription>
            Could not embed the text font. The text in the files can look different.
          </AlertDescription>
        </Alert>
      )}
      <section aria-labelledby="export-combined" className="flex flex-col gap-3">
        <h2 id="export-combined" className={labelClass}>
          Combined
        </h2>
        <FileRow
          file={ready?.combined}
          width={width}
          name={emojiFileName(format)}
        />
      </section>
      <section aria-labelledby="export-split" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="export-split" className={labelClass}>
            Split · {splitCount} emoji
          </h2>
          <a
            href={ready?.zipUrl}
            download="emoji.zip"
            aria-disabled={!ready}
            className={cn(
              buttonVariants({ variant: "outline" }),
              !ready && "pointer-events-none opacity-50"
            )}
          >
            <FileArchiveIcon data-icon="inline-start" />
            Download all (ZIP)
          </a>
        </div>
        <ul className="flex flex-col gap-3">
          {Array.from({ length: splitCount }, (_, index) => (
            <li key={index}>
              <FileRow
                file={ready?.split[index]}
                      width={CANVAS_HEIGHT}
                name={emojiFileName(format, index)}
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function FileRow({
  file,
  width,
  name,
}: {
  file: ReadyFile | undefined
  width: number
  name: string
}) {
  const tooLarge = file !== undefined && file.blob.size > MAX_EMOJI_BYTES

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      {file ? (
        <Image
          unoptimized
          src={file.url}
          alt={`${file.name}, ${file.width} × ${file.height} px`}
          width={file.width}
          height={file.height}
          className="block h-auto max-w-full border border-dashed border-border-strong"
        />
      ) : (
        <Skeleton className="max-w-full" style={{ width, height: CANVAS_HEIGHT }} />
      )}
      <dl className="grid grid-cols-[auto_auto] content-start gap-x-6 gap-y-1">
        <dt className={labelClass}>File</dt>
        <dd className="text-sm">{file?.name ?? name}</dd>
        <dt className={labelClass}>Size</dt>
        <dd className="text-sm">
          {file ? `${file.width} × ${file.height} px` : `${width} × ${CANVAS_HEIGHT} px`}
        </dd>
        <dt className={labelClass}>Bytes</dt>
        <dd className={cn("flex items-center gap-1 text-sm", tooLarge && "text-destructive")}>
          {tooLarge && <TriangleAlertIcon aria-hidden className="size-4" />}
          {file ? formatBytes(file.blob.size) : "…"}
          {tooLarge && " (too large for Discord)"}
        </dd>
      </dl>
      <a
        href={file?.url}
        download={file?.name}
        aria-disabled={!file}
        className={cn(
          buttonVariants({ variant: "outline" }),
          !file && "pointer-events-none opacity-50"
        )}
      >
        <DownloadIcon data-icon="inline-start" />
        Download
      </a>
    </div>
  )
}
