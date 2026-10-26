export type Point = { x: number; y: number }

export type Box = { x: number; y: number; width: number; height: number }

export type Placement = {
  cx: number
  cy: number
  scale: number
  rotation: number
}

export type Bounds = { minX: number; minY: number; maxX: number; maxY: number }

const MIN_RENDERED_HEIGHT = 8
const ROTATION_SNAP_DEGREES = 15

const toRadians = (degrees: number) => (degrees * Math.PI) / 180

const angleFrom = (centre: Point, point: Point) =>
  (Math.atan2(point.y - centre.y, point.x - centre.x) * 180) / Math.PI

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)

const centreOf = (placement: Placement): Point => ({
  x: placement.cx,
  y: placement.cy,
})

function normaliseDegrees(degrees: number) {
  const wrapped = ((degrees % 360) + 360) % 360
  return wrapped > 180 ? wrapped - 360 : wrapped
}

export function fitScale(width: number, height: number, slot: number) {
  const scale = slot / Math.max(width, height)
  return scale >= 1 ? Math.floor(scale) : scale
}

export function moveBy(placement: Placement, dx: number, dy: number): Placement {
  return { ...placement, cx: placement.cx + dx, cy: placement.cy + dy }
}

export function resizeFrom(
  start: Placement,
  startPointer: Point,
  pointer: Point,
  naturalHeight: number
): Placement {
  const startDistance = distance(startPointer, centreOf(start))
  if (startDistance === 0 || naturalHeight === 0) return start

  const scale = start.scale * (distance(pointer, centreOf(start)) / startDistance)
  return { ...start, scale: Math.max(scale, MIN_RENDERED_HEIGHT / naturalHeight) }
}

export function rotateFrom(
  start: Placement,
  startPointer: Point,
  pointer: Point,
  snap: boolean
): Placement {
  const centre = centreOf(start)
  const raw = start.rotation + angleFrom(centre, pointer) - angleFrom(centre, startPointer)
  const rotation = snap
    ? Math.round(raw / ROTATION_SNAP_DEGREES) * ROTATION_SNAP_DEGREES
    : raw
  return { ...start, rotation: normaliseDegrees(rotation) }
}

export function shiftAlongRotation(placement: Placement, localDx: number): Placement {
  const radians = toRadians(placement.rotation)
  const dx = localDx * placement.scale
  return moveBy(placement, dx * Math.cos(radians), dx * Math.sin(radians))
}

export function rotatedBounds(placement: Placement, box: Box): Bounds {
  const radians = toRadians(placement.rotation)
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const corners = [
    { x: box.x, y: box.y },
    { x: box.x + box.width, y: box.y },
    { x: box.x, y: box.y + box.height },
    { x: box.x + box.width, y: box.y + box.height },
  ].map(({ x, y }) => ({
    x: placement.cx + placement.scale * (x * cos - y * sin),
    y: placement.cy + placement.scale * (x * sin + y * cos),
  }))

  return {
    minX: Math.min(...corners.map((corner) => corner.x)),
    minY: Math.min(...corners.map((corner) => corner.y)),
    maxX: Math.max(...corners.map((corner) => corner.x)),
    maxY: Math.max(...corners.map((corner) => corner.y)),
  }
}

export type RectPlacement = {
  cx: number
  cy: number
  width: number
  height: number
  rotation: number
}

export type Corner = { sx: -1 | 1; sy: -1 | 1 }

export const MIN_RECT_SIDE = 8

export function rectLocalBox({ width, height }: RectPlacement): Box {
  return { x: -width / 2, y: -height / 2, width, height }
}

export function rectBounds(rect: RectPlacement): Bounds {
  return rotatedBounds(
    { cx: rect.cx, cy: rect.cy, scale: 1, rotation: rect.rotation },
    rectLocalBox(rect)
  )
}

export function moveRectBy(rect: RectPlacement, dx: number, dy: number): RectPlacement {
  return { ...rect, cx: rect.cx + dx, cy: rect.cy + dy }
}

export function rotateRectFrom(
  start: RectPlacement,
  startPointer: Point,
  pointer: Point,
  snap: boolean
): RectPlacement {
  const { rotation } = rotateFrom(
    { cx: start.cx, cy: start.cy, scale: 1, rotation: start.rotation },
    startPointer,
    pointer,
    snap
  )
  return { ...start, rotation }
}

export function resizeRectFrom(
  start: RectPlacement,
  corner: Corner,
  startPointer: Point,
  pointer: Point,
  keepAspect: boolean
): RectPlacement {
  const radians = toRadians(start.rotation)
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const dx = pointer.x - startPointer.x
  const dy = pointer.y - startPointer.y
  const dragged = {
    x: (corner.sx * start.width) / 2 + dx * cos + dy * sin,
    y: (corner.sy * start.height) / 2 - dx * sin + dy * cos,
  }
  const anchor = {
    x: (-corner.sx * start.width) / 2,
    y: (-corner.sy * start.height) / 2,
  }

  let width = Math.max(MIN_RECT_SIDE, corner.sx * (dragged.x - anchor.x))
  let height = Math.max(MIN_RECT_SIDE, corner.sy * (dragged.y - anchor.y))
  if (keepAspect) {
    const ratio = start.width / start.height
    if (width / height > ratio) height = width / ratio
    else width = height * ratio
  }

  const centre = {
    x: anchor.x + (corner.sx * width) / 2,
    y: anchor.y + (corner.sy * height) / 2,
  }
  return {
    ...start,
    width,
    height,
    cx: start.cx + centre.x * cos - centre.y * sin,
    cy: start.cy + centre.x * sin + centre.y * cos,
  }
}
