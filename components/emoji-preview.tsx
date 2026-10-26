"use client"

import { useId, useState, type Dispatch } from "react"
import { MoonIcon, ScissorsIcon, SunIcon } from "lucide-react"
import { cn } from "cn"

import { EmojiArtwork } from "@/components/emoji-artwork"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useAssetDataUri } from "@/hooks/use-asset-data-uri"
import {
  CANVAS_HEIGHT,
  sections,
  SPLIT_WIDTH,
  type EditorAction,
  type EditorState,
} from "@/lib/editor"

type Ground = "dark" | "light"

const DISCORD_SIZES = [
  { label: "Inline", size: 22 },
  { label: "Jumbo", size: 48 },
]

const MAX_GAP = 32

const GROUND_CLASS: Record<Ground, string> = {
  dark: "bg-transparent",
  light: "bg-white",
}

const toolClass =
  "border border-border-strong uppercase tracking-label hover:border-foreground hover:bg-foreground hover:text-background aria-pressed:border-foreground"

export function EmojiPreview({
  state,
  dispatch,
}: {
  state: EditorState
  dispatch: Dispatch<EditorAction>
}) {
  const { dataUri, isLoading } = useAssetDataUri(state.asset)
  const [ground, setGround] = useState<Ground>("dark")
  const [gap, setGap] = useState(0)
  const gapId = useId()
  const emojiSections = sections(state)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Toggle
          pressed={state.split}
          onPressedChange={(split) => dispatch({ type: "setSplit", split })}
          className={toolClass}
        >
          <ScissorsIcon data-icon="inline-start" />
          Split {SPLIT_WIDTH} px
        </Toggle>
        <Field orientation="horizontal" className="w-auto">
          <FieldLabel htmlFor={gapId}>Gap (px)</FieldLabel>
          <Input
            id={gapId}
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_GAP}
            step={1}
            value={gap}
            disabled={!state.split}
            className="w-16"
            onChange={(event) => {
              const next = Math.round(Number(event.target.value))
              if (Number.isFinite(next)) setGap(Math.min(MAX_GAP, Math.max(0, next)))
            }}
          />
        </Field>
        <ToggleGroup
          aria-label="Preview ground"
          spacing={0}
          value={[ground]}
          onValueChange={([next]) => next && setGround(next as Ground)}
        >
          <ToggleGroupItem value="dark" aria-label="Dark ground" className={toolClass}>
            <MoonIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="light" aria-label="Light ground" className={toolClass}>
            <SunIcon />
          </ToggleGroupItem>
        </ToggleGroup>
        <span className="text-sm text-muted-foreground">
          {emojiSections.length} emoji
        </span>
      </div>
      <dl className="grid w-fit grid-cols-[auto_auto] items-center gap-x-6 gap-y-3">
        {DISCORD_SIZES.map(({ label, size }) => (
          <div key={label} className="contents">
            <dt className="text-sm tracking-label text-muted-foreground uppercase">
              {label} {size} px
            </dt>
            <dd
              className={cn("flex w-fit p-3", GROUND_CLASS[ground])}
              style={{ gap: state.split ? gap : 0 }}
            >
              {isLoading ? (
                <Skeleton style={{ width: size, height: size }} />
              ) : (
                emojiSections.map((section) => (
                  <svg
                    key={section.x}
                    role="img"
                    aria-label={`Emoji at ${size} px, from x = ${section.x}`}
                    width={size}
                    height={size}
                    viewBox={`${section.x} 0 ${section.width} ${CANVAS_HEIGHT}`}
                    preserveAspectRatio="xMidYMid meet"
                    className="block shrink-0 font-sans"
                  >
                    <EmojiArtwork state={state} dataUri={dataUri} />
                  </svg>
                ))
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
