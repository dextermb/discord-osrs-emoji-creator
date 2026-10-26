"use client"

import {
  useRef,
  type Dispatch,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react"

import {
  EmojiArtwork,
  rotationTransform,
  scaledBox,
  type LayerWrapper,
} from "@/components/emoji-artwork"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useAssetDataUri } from "@/hooks/use-asset-data-uri"
import {
  areaWidth,
  CANVAS_HEIGHT,
  canvasBox,
  hasText,
  iconLocalBox,
  type EditorAction,
  type EditorState,
  type ElementId,
} from "@/lib/editor"
import {
  moveBy,
  moveRectBy,
  rectLocalBox,
  resizeFrom,
  resizeRectFrom,
  rotateFrom,
  rotateRectFrom,
  type Box,
  type Corner,
  type Placement,
  type Point,
  type RectPlacement,
} from "@/lib/placement"

const HANDLE_SIZE = 8
const ROTATE_HANDLE_OFFSET = 20
const NUDGE = 1
const NUDGE_LARGE = 10
const GUIDE_DASH = "4 4"

const ARROW_DIRECTIONS: Record<string, Point> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
}

const CORNERS: { name: string; corner: Corner; cursor: string }[] = [
  { name: "nw", corner: { sx: -1, sy: -1 }, cursor: "nwse-resize" },
  { name: "ne", corner: { sx: 1, sy: -1 }, cursor: "nesw-resize" },
  { name: "se", corner: { sx: 1, sy: 1 }, cursor: "nwse-resize" },
  { name: "sw", corner: { sx: -1, sy: 1 }, cursor: "nesw-resize" },
]

type Gesture = "move" | "resize" | "rotate"

type Drag = {
  element: ElementId
  gesture: Gesture
  corner: Corner
  pointerId: number
  startPointer: Point
  startIcon: Placement
  startText: Placement
  startRect: RectPlacement | null
}

function toSvgPoint(svg: SVGSVGElement, event: PointerEvent): Point {
  const matrix = svg.getScreenCTM()
  if (!matrix) return { x: 0, y: 0 }
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(
    matrix.inverse()
  )
  return { x: point.x, y: point.y }
}

function nextPlacementAction(
  drag: Drag,
  pointer: Point,
  shiftKey: boolean,
  state: EditorState
): EditorAction | null {
  const { startPointer } = drag
  const dx = pointer.x - startPointer.x
  const dy = pointer.y - startPointer.y

  if (drag.element === "rect") {
    if (!drag.startRect) return null
    const placement =
      drag.gesture === "move"
        ? moveRectBy(drag.startRect, dx, dy)
        : drag.gesture === "resize"
          ? resizeRectFrom(drag.startRect, drag.corner, startPointer, pointer, shiftKey)
          : rotateRectFrom(drag.startRect, startPointer, pointer, shiftKey)
    return { type: "setRectPlacement", placement }
  }

  const start = drag.element === "icon" ? drag.startIcon : drag.startText
  const naturalHeight =
    drag.element === "icon"
      ? state.asset
        ? iconLocalBox(state.asset).height
        : 0
      : state.text.box.height
  const placement =
    drag.gesture === "move"
      ? moveBy(start, dx, dy)
      : drag.gesture === "resize"
        ? resizeFrom(start, startPointer, pointer, naturalHeight)
        : rotateFrom(start, startPointer, pointer, shiftKey)
  return drag.element === "icon"
    ? { type: "setIconPlacement", placement }
    : { type: "setTextPlacement", placement }
}

export function EmojiCanvas({
  state,
  dispatch,
}: {
  state: EditorState
  dispatch: Dispatch<EditorAction>
}) {
  const { asset, icon, text, rect, locked } = state
  const { dataUri, isLoading, failed } = useAssetDataUri(asset)
  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<Drag | null>(null)

  const hasIcon = asset !== null && dataUri !== null
  const exists = { icon: hasIcon, text: hasText(state), rect: rect !== null }
  const selection = state.selection === "canvas" ? null : state.selection
  const selected =
    selection && exists[selection] && !locked[selection] ? selection : null
  const box = canvasBox(state)

  function select(selection: ElementId | null) {
    dispatch({ type: "select", selection })
  }

  function startGesture(
    element: ElementId,
    gesture: Gesture,
    event: PointerEvent<SVGElement>,
    corner: Corner = { sx: 1, sy: 1 }
  ) {
    const svg = svgRef.current
    if (!svg) return
    event.stopPropagation()
    svg.setPointerCapture(event.pointerId)
    select(element)
    dragRef.current = {
      element,
      gesture,
      corner,
      pointerId: event.pointerId,
      startPointer: toSvgPoint(svg, event),
      startIcon: icon,
      startText: text.placement,
      startRect: rect?.placement ?? null,
    }
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const drag = dragRef.current
    const svg = svgRef.current
    if (!drag || !svg || drag.pointerId !== event.pointerId) return

    const action = nextPlacementAction(
      drag,
      toSvgPoint(svg, event),
      event.shiftKey,
      state
    )
    if (action) dispatch(action)
  }

  function handlePointerEnd(event: PointerEvent<SVGSVGElement>) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null
    }
  }

  function handleKeyDown(element: ElementId, event: KeyboardEvent<SVGGElement>) {
    if (event.key === "Escape") {
      select(null)
      event.currentTarget.blur()
      return
    }
    const direction = ARROW_DIRECTIONS[event.key]
    if (!direction) return

    event.preventDefault()
    const step = event.shiftKey ? NUDGE_LARGE : NUDGE
    dispatch({
      type: "moveBy",
      element,
      dx: direction.x * step,
      dy: direction.y * step,
    })
  }

  function selectionFrame(element: ElementId) {
    if (element === "rect" && rect) {
      return { transform: rotationTransform(rect.placement), frame: rectLocalBox(rect.placement) }
    }
    if (element === "icon" && asset) {
      return { transform: rotationTransform(icon), frame: scaledBox(iconLocalBox(asset), icon.scale) }
    }
    return {
      transform: rotationTransform(text.placement),
      frame: scaledBox(text.box, text.placement.scale),
    }
  }

  const wrapLayer: LayerWrapper = (element, { label, hidden, transform, children }) => (
    <ElementGroup
      label={label}
      hidden={hidden}
      locked={locked[element]}
      transform={transform}
      onPointerDown={(event) => startGesture(element, "move", event)}
      onFocus={() => select(element)}
      onKeyDown={(event) => handleKeyDown(element, event)}
    >
      {children}
    </ElementGroup>
  )

  if (isLoading) {
    return <Skeleton className="size-32" />
  }

  return (
    <div className="flex flex-col gap-4">
      {failed && (
        <Alert variant="destructive">
          <AlertDescription>Could not load the icon.</AlertDescription>
        </Alert>
      )}
      <div className="overflow-x-auto p-6">
        <svg
          ref={svgRef}
          width={box.width}
          height={CANVAS_HEIGHT}
          viewBox={`${box.x} 0 ${box.width} ${CANVAS_HEIGHT}`}
          aria-label="Emoji canvas"
          className="block touch-none overflow-visible font-sans outline outline-dashed outline-border select-none"
          onPointerDown={() => select(null)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        >
          <EmojiArtwork state={state} dataUri={dataUri} wrapLayer={wrapLayer} />
          <PaddingGuides state={state} />
          {selected && (
            <SelectionHandles
              {...selectionFrame(selected)}
              onGestureStart={(gesture, event, corner) =>
                startGesture(selected, gesture, event, corner)
              }
            />
          )}
        </svg>
      </div>
    </div>
  )
}

function PaddingGuides({ state }: { state: EditorState }) {
  const { left, right } = state.padding
  const guides = [
    ...(left > 0 ? [-0.5] : []),
    ...(right > 0 ? [areaWidth(state) + 0.5] : []),
  ]

  return (
    <g aria-hidden pointerEvents="none" className="stroke-border">
      {guides.map((x) => (
        <line key={x} x1={x} y1={0} x2={x} y2={CANVAS_HEIGHT} strokeDasharray={GUIDE_DASH} />
      ))}
    </g>
  )
}

function ElementGroup({
  label,
  hidden = false,
  locked,
  transform,
  onPointerDown,
  onFocus,
  onKeyDown,
  children,
}: {
  label: string
  hidden?: boolean
  locked: boolean
  transform: string
  onPointerDown: (event: PointerEvent<SVGGElement>) => void
  onFocus: () => void
  onKeyDown: (event: KeyboardEvent<SVGGElement>) => void
  children: ReactNode
}) {
  return (
    <g
      tabIndex={hidden || locked ? -1 : 0}
      role="button"
      aria-label={locked ? `${label} (locked)` : label}
      aria-disabled={locked || undefined}
      aria-hidden={hidden || undefined}
      visibility={hidden ? "hidden" : undefined}
      pointerEvents={locked ? "none" : undefined}
      transform={transform}
      className="cursor-move outline-none"
      onPointerDown={onPointerDown}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
    >
      {children}
    </g>
  )
}

function SelectionHandles({
  transform,
  frame,
  onGestureStart,
}: {
  transform: string
  frame: Box
  onGestureStart: (
    gesture: Gesture,
    event: PointerEvent<SVGElement>,
    corner?: Corner
  ) => void
}) {
  const middle = frame.x + frame.width / 2
  const top = frame.y

  return (
    <g aria-hidden transform={transform} className="text-primary">
      <rect {...frame} fill="none" stroke="currentColor" pointerEvents="none" />
      <line
        x1={middle}
        y1={top}
        x2={middle}
        y2={top - ROTATE_HANDLE_OFFSET}
        stroke="currentColor"
        pointerEvents="none"
      />
      <circle
        cx={middle}
        cy={top - ROTATE_HANDLE_OFFSET}
        r={HANDLE_SIZE / 2 + 1}
        stroke="currentColor"
        className="cursor-grab fill-background"
        onPointerDown={(event) => onGestureStart("rotate", event)}
      />
      {CORNERS.map(({ name, corner, cursor }) => (
        <rect
          key={name}
          x={frame.x + ((corner.sx + 1) / 2) * frame.width - HANDLE_SIZE / 2}
          y={frame.y + ((corner.sy + 1) / 2) * frame.height - HANDLE_SIZE / 2}
          width={HANDLE_SIZE}
          height={HANDLE_SIZE}
          stroke="currentColor"
          className="fill-background"
          style={{ cursor }}
          onPointerDown={(event) => onGestureStart("resize", event, corner)}
        />
      ))}
    </g>
  )
}
