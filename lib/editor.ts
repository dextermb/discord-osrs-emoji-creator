import type { IconAsset } from "@/lib/osrsclans"
import {
  fitScale,
  MIN_RECT_SIDE,
  moveBy,
  moveRectBy,
  rectBounds,
  rotatedBounds,
  shiftAlongRotation,
  type Box,
  type Placement,
  type RectPlacement,
} from "@/lib/placement"

export const CANVAS_HEIGHT = 128
export const ICON_SLOT = 128
export const BACKGROUND_MAX_HEIGHT = 512
export const SPLIT_WIDTH = 128
export const DEFAULT_TEXT_COLOUR = "#ffffff"

const TEXT_GAP = 8
const TEXT_PADDING = 8
const RECT_INSET = 8

export type ElementId = "icon" | "text" | "rect"

export type Selection = ElementId | "background"

export type RectStyle = {
  fill: string
  fillOpacity: number
  stroke: string
  strokeWidth: number
  shadow: string
  shadowBlur: number
  radius: number
}

export type Background = { dataUri: string; name: string }

export type Size = { width: number; height: number }

export type Insets = { top: number; right: number; bottom: number; left: number }

export type EditorState = {
  asset: IconAsset | null
  icon: Placement
  iconBasis: Size | null
  text: { value: string; box: Box; placement: Placement; colour: string }
  background: Background | null
  canvasColour: string | null
  split: boolean
  rect: { placement: RectPlacement; style: RectStyle } | null
  selection: Selection | null
  locked: Record<ElementId, boolean>
}

export type EditorAction =
  | { type: "selectAsset"; asset: IconAsset | null }
  | { type: "setText"; value: string }
  | { type: "setTextColour"; colour: string }
  | { type: "setCanvasColour"; colour: string | null }
  | { type: "setSplit"; split: boolean }
  | { type: "textMeasured"; box: Box }
  | { type: "setBackground"; background: Background | null }
  | { type: "addRect" }
  | { type: "removeRect" }
  | { type: "setRectStyle"; style: Partial<RectStyle> }
  | { type: "setRectInsets"; insets: Partial<Insets> }
  | { type: "setIconPlacement"; placement: Placement }
  | { type: "setTextPlacement"; placement: Placement }
  | { type: "setRectPlacement"; placement: RectPlacement }
  | { type: "moveBy"; element: ElementId; dx: number; dy: number }
  | { type: "select"; selection: Selection | null }
  | { type: "setLocked"; element: ElementId; locked: boolean }

export const DEFAULT_RECT_STYLE: RectStyle = {
  fill: "#000000",
  fillOpacity: 0.4,
  stroke: "#ffffff",
  strokeWidth: 2,
  shadow: "#000000",
  shadowBlur: 4,
  radius: 8,
}

const EMPTY_BOX: Box = { x: 0, y: 0, width: 0, height: 0 }

export function iconLocalBox({ width, height }: IconAsset): Box {
  return { x: -width / 2, y: -height / 2, width, height }
}

function nextIconPlacement(
  asset: IconAsset,
  previous: Placement,
  previousBasis: Size | null
): Placement {
  if (!previousBasis) return defaultIconPlacement(asset)

  const { width, height } = asset
  const previousSide =
    previous.scale * Math.max(previousBasis.width, previousBasis.height)
  return { ...previous, scale: fitScale(width, height, previousSide) }
}

function defaultIconPlacement(asset: IconAsset | null): Placement {
  const { width, height } = asset ?? { width: 1, height: 1 }
  return {
    cx: ICON_SLOT / 2,
    cy: CANVAS_HEIGHT / 2,
    scale: fitScale(width, height, ICON_SLOT),
    rotation: 0,
  }
}

const sizeOf = ({ width, height }: IconAsset): Size => ({ width, height })

export function initialEditorState(asset: IconAsset | null): EditorState {
  return {
    asset,
    icon: defaultIconPlacement(asset),
    iconBasis: asset ? sizeOf(asset) : null,
    text: {
      value: "",
      box: EMPTY_BOX,
      placement: {
        cx: ICON_SLOT + TEXT_GAP,
        cy: CANVAS_HEIGHT / 2,
        scale: 1,
        rotation: 0,
      },
      colour: DEFAULT_TEXT_COLOUR,
    },
    background: null,
    canvasColour: null,
    split: false,
    rect: null,
    selection: null,
    locked: { icon: false, text: false, rect: false },
  }
}

export function hasText(state: EditorState) {
  return state.text.value.length > 0 && state.text.box.width > 0
}

function canvasWidthFrom(rightEdges: number[]) {
  return Math.max(CANVAS_HEIGHT, Math.ceil(Math.max(...rightEdges)))
}

export function contentWidth(state: EditorState) {
  const iconRight = state.asset
    ? rotatedBounds(state.icon, iconLocalBox(state.asset)).maxX
    : 0
  const textRight = hasText(state)
    ? rotatedBounds(state.text.placement, state.text.box).maxX + TEXT_PADDING
    : 0
  return canvasWidthFrom([iconRight, textRight])
}

export function canvasWidth(state: EditorState) {
  const rectRight = state.rect ? rectBounds(state.rect.placement).maxX : 0
  return canvasWidthFrom([contentWidth(state), rectRight])
}

export type Section = { x: number; width: number }

export function sections(state: EditorState): Section[] {
  const width = canvasWidth(state)
  if (!state.split) return [{ x: 0, width }]
  return Array.from({ length: Math.ceil(width / SPLIT_WIDTH) }, (_, index) => ({
    x: index * SPLIT_WIDTH,
    width: SPLIT_WIDTH,
  }))
}

export function rectInsets(state: EditorState): Insets | null {
  if (!state.rect) return null
  const { cx, cy, width, height } = state.rect.placement
  return {
    top: cy - height / 2,
    right: contentWidth(state) - (cx + width / 2),
    bottom: CANVAS_HEIGHT - (cy + height / 2),
    left: cx - width / 2,
  }
}

function placementFromInsets(
  insets: Insets,
  referenceWidth: number,
  rotation: number
): RectPlacement {
  const width = Math.max(MIN_RECT_SIDE, referenceWidth - insets.left - insets.right)
  const height = Math.max(MIN_RECT_SIDE, CANVAS_HEIGHT - insets.top - insets.bottom)
  return {
    cx: insets.left + width / 2,
    cy: insets.top + height / 2,
    width,
    height,
    rotation,
  }
}

function sameBox(a: Box, b: Box) {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
}

function moveElement(
  state: EditorState,
  element: ElementId,
  dx: number,
  dy: number
): EditorState {
  switch (element) {
    case "icon":
      return { ...state, icon: moveBy(state.icon, dx, dy) }
    case "text":
      return {
        ...state,
        text: { ...state.text, placement: moveBy(state.text.placement, dx, dy) },
      }
    case "rect":
      return state.rect
        ? {
            ...state,
            rect: { ...state.rect, placement: moveRectBy(state.rect.placement, dx, dy) },
          }
        : state
  }
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "selectAsset":
      if (!action.asset) return { ...state, asset: null }
      return {
        ...state,
        asset: action.asset,
        icon: nextIconPlacement(action.asset, state.icon, state.iconBasis),
        iconBasis: sizeOf(action.asset),
      }
    case "setText":
      return { ...state, text: { ...state.text, value: action.value } }
    case "setTextColour":
      return { ...state, text: { ...state.text, colour: action.colour } }
    case "setCanvasColour":
      return { ...state, canvasColour: action.colour }
    case "setSplit":
      return { ...state, split: action.split }
    case "textMeasured": {
      const { box, placement } = state.text
      if (sameBox(box, action.box)) return state
      return {
        ...state,
        text: {
          ...state.text,
          box: action.box,
          placement: shiftAlongRotation(placement, (action.box.width - box.width) / 2),
        },
      }
    }
    case "setBackground":
      return { ...state, background: action.background }
    case "addRect":
      return {
        ...state,
        rect: {
          placement: placementFromInsets(
            { top: RECT_INSET, right: RECT_INSET, bottom: RECT_INSET, left: RECT_INSET },
            contentWidth(state),
            0
          ),
          style: DEFAULT_RECT_STYLE,
        },
        selection: "rect",
      }
    case "setRectInsets": {
      const current = rectInsets(state)
      if (!state.rect || !current) return state
      return {
        ...state,
        rect: {
          ...state.rect,
          placement: placementFromInsets(
            { ...current, ...action.insets },
            contentWidth(state),
            state.rect.placement.rotation
          ),
        },
      }
    }
    case "removeRect":
      return { ...state, rect: null }
    case "setRectStyle":
      return state.rect
        ? { ...state, rect: { ...state.rect, style: { ...state.rect.style, ...action.style } } }
        : state
    case "setIconPlacement":
      return { ...state, icon: action.placement }
    case "setTextPlacement":
      return { ...state, text: { ...state.text, placement: action.placement } }
    case "setRectPlacement":
      return state.rect
        ? { ...state, rect: { ...state.rect, placement: action.placement } }
        : state
    case "moveBy":
      if (state.locked[action.element]) return state
      return moveElement(state, action.element, action.dx, action.dy)
    case "select":
      if (
        action.selection &&
        action.selection !== "background" &&
        state.locked[action.selection]
      )
        return state
      return { ...state, selection: action.selection }
    case "setLocked":
      return {
        ...state,
        locked: { ...state.locked, [action.element]: action.locked },
        selection:
          action.locked && state.selection === action.element
            ? null
            : state.selection,
      }
  }
}
