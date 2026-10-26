"use client"

import { EmojiArtwork } from "@/components/emoji-artwork"
import { CANVAS_HEIGHT, type EditorState, type Section } from "@/lib/editor"

export function EmojiSection({
  state,
  dataUri,
  section,
  size,
}: {
  state: EditorState
  dataUri: string | null
  section: Section
  size: number
}) {
  return (
    <svg
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
  )
}
