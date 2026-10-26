"use client"

import { useId, type ReactNode } from "react"

import {
  CANVAS_HEIGHT,
  canvasBox,
  hasText,
  iconLocalBox,
  type EditorState,
  type ElementId,
  type RectStyle,
} from "@/lib/editor"
import { textFontStyle } from "@/lib/fonts"
import { rectLocalBox, type Box } from "@/lib/placement"

const SHADOW_OFFSET_Y = 2
const SHADOW_OPACITY = 0.5

export const TEXT_ATTRIBUTES = {
  fontSize: 48,
  textAnchor: "middle",
  dominantBaseline: "central",
} as const

export type Layer = {
  label: string
  hidden: boolean
  transform: string
  children: ReactNode
}

export type LayerWrapper = (element: ElementId, layer: Layer) => ReactNode

export function scaledBox(box: Box, scale: number): Box {
  return {
    x: box.x * scale,
    y: box.y * scale,
    width: box.width * scale,
    height: box.height * scale,
  }
}

export function rotationTransform({
  cx,
  cy,
  rotation,
}: {
  cx: number
  cy: number
  rotation: number
}) {
  return `translate(${cx} ${cy}) rotate(${rotation})`
}

function plainLayer(_element: ElementId, { hidden, transform, children }: Layer) {
  return (
    <g transform={transform} visibility={hidden ? "hidden" : undefined}>
      {children}
    </g>
  )
}

export function EmojiArtwork({
  state,
  dataUri,
  wrapLayer = plainLayer,
}: {
  state: EditorState
  dataUri: string | null
  wrapLayer?: LayerWrapper
}) {
  const { asset, icon, text, background, rect, canvasColour } = state
  const idPrefix = useId()
  const canvasClipId = `${idPrefix}canvas`
  const rectClipId = `${idPrefix}rect`
  const shadowId = `${idPrefix}shadow`
  const box = canvasBox(state)

  const backgroundImage = background && (
    <image
      href={background.dataUri}
      x={box.x}
      width={box.width}
      height={CANVAS_HEIGHT}
      preserveAspectRatio="xMidYMid slice"
      pointerEvents="none"
      clipPath={rect ? `url(#${rectClipId})` : undefined}
    />
  )

  return (
    <>
      <defs>
        <clipPath id={canvasClipId}>
          <rect x={box.x} width={box.width} height={CANVAS_HEIGHT} />
        </clipPath>
        {rect && (
          <clipPath id={rectClipId}>
            <rect
              {...rectLocalBox(rect.placement)}
              rx={rect.style.radius}
              transform={rotationTransform(rect.placement)}
            />
          </clipPath>
        )}
        {rect && rect.style.shadowBlur > 0 && (
          <ShadowFilter id={shadowId} style={rect.style} />
        )}
      </defs>
      <g clipPath={`url(#${canvasClipId})`}>
        {canvasColour && (
          <rect
            x={box.x}
            width={box.width}
            height={CANVAS_HEIGHT}
            fill={canvasColour}
            pointerEvents="none"
          />
        )}
        {!rect && backgroundImage}
        {rect && (
          <g filter={rect.style.shadowBlur > 0 ? `url(#${shadowId})` : undefined}>
            {backgroundImage}
            {wrapLayer("rect", {
              label: "Rectangle",
              hidden: false,
              transform: rotationTransform(rect.placement),
              children: (
                <rect
                  {...rectLocalBox(rect.placement)}
                  rx={rect.style.radius}
                  fill={rect.style.fill}
                  fillOpacity={rect.style.fillOpacity}
                  stroke={rect.style.strokeWidth > 0 ? rect.style.stroke : "none"}
                  strokeWidth={rect.style.strokeWidth}
                />
              ),
            })}
          </g>
        )}
        {asset &&
          dataUri &&
          wrapLayer("icon", {
            label: `Icon: ${asset.name}`,
            hidden: false,
            transform: rotationTransform(icon),
            children: (
              <image href={dataUri} {...scaledBox(iconLocalBox(asset), icon.scale)} />
            ),
          })}
        {wrapLayer("text", {
          label: `Text: ${text.value}`,
          hidden: !hasText(state),
          transform: `${rotationTransform(text.placement)} scale(${text.placement.scale})`,
          children: (
            <text {...TEXT_ATTRIBUTES} style={textFontStyle(text.font)} fill={text.colour}>
              {text.value}
            </text>
          ),
        })}
      </g>
    </>
  )
}

function ShadowFilter({ id, style }: { id: string; style: RectStyle }) {
  return (
    <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow
        dx={0}
        dy={SHADOW_OFFSET_Y}
        stdDeviation={style.shadowBlur / 2}
        floodColor={style.shadow}
        floodOpacity={SHADOW_OPACITY}
      />
    </filter>
  )
}
