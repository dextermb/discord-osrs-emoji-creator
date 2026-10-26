"use client"

import { useEffect, useLayoutEffect, useRef, useState, type Dispatch } from "react"

import { TEXT_ATTRIBUTES } from "@/components/emoji-artwork"
import type { EditorAction } from "@/lib/editor"
import { textFontStyle, type TextFont } from "@/lib/fonts"

export function TextMeasure({
  value,
  font,
  dispatch,
}: {
  value: string
  font: TextFont
  dispatch: Dispatch<EditorAction>
}) {
  const textRef = useRef<SVGTextElement>(null)
  const [fontEpoch, setFontEpoch] = useState(0)

  useEffect(() => {
    const remeasure = () => setFontEpoch((epoch) => epoch + 1)
    document.fonts.addEventListener("loadingdone", remeasure)
    return () => document.fonts.removeEventListener("loadingdone", remeasure)
  }, [])

  useLayoutEffect(() => {
    const element = textRef.current
    const measured = element && value ? element.getBBox() : null
    dispatch({
      type: "textMeasured",
      box: {
        x: measured?.x ?? 0,
        y: measured?.y ?? 0,
        width: measured?.width ?? 0,
        height: measured?.height ?? 0,
      },
    })
  }, [value, font, fontEpoch, dispatch])

  return (
    <svg
      aria-hidden
      width={0}
      height={0}
      className="pointer-events-none invisible absolute font-sans"
    >
      <text ref={textRef} {...TEXT_ATTRIBUTES} style={textFontStyle(font)}>
        {value}
      </text>
    </svg>
  )
}
