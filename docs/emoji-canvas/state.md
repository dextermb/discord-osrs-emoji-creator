# Emoji canvas: state and rendering

The editor state, the SVG layers, and the canvas size. Back to
[emoji-canvas.md](../emoji-canvas.md).

## Editor state

All editor state is in one reducer (`editorReducer` in `lib/editor.ts`). The
reducer and its selectors are pure functions. `EmojiCanvas` and the controls
read the state and send actions. The "Export" tab reads the whole emoji from
one place, see [export.md](./export.md).

```
EditorState
  asset:      IconAsset | null             sprite or item, see icon-picker.md
  icon:       Placement
  iconBasis:  { width, height } | null    natural size of the last icon
  text:         { value, box: Box, placement: Placement, colour,
                  font: TextFont }         see fonts.md
  background:   { dataUri, name } | null
  canvasColour: string | null              null = transparent
  padding:      { left, right }            whole px, 0–256, see elements.md
  split:        boolean                    cut into 128 px sections, see preview.md
  rect:       { placement: RectPlacement, style: RectStyle } | null
  selection:  "icon" | "text" | "rect" | "canvas" | null
  locked:     { icon, text, rect: boolean }
```

```
EmojiEditor ── useReducer(editorReducer) ──▶ state
  ├─ useTextFont(text.font) ─────────────────▶ fontStatus, see fonts.md
  ├─ TextMeasure: hidden <text> getBBox ─────▶ textMeasured
  ├─ tab "Canvas":  EmojiCanvas
  │    ├─ EmojiArtwork                         the layers, see below
  │    └─ pointer, keyboard ─────────────────▶ set*Placement, moveBy, select
  ├─ tab "Preview": EmojiPreview
  │    ├─ split toggle ──────────────────────▶ setSplit
  │    └─ sections(state) ─▶ EmojiSection each ─▶ EmojiArtwork
  ├─ tab "Chat":    EmojiChat                  see chat.md
  │    ├─ split toggle ──────────────────────▶ setSplit
  │    └─ sections(state) ─▶ EmojiSection each ─▶ EmojiArtwork
  ├─ tab "Export":  EmojiExport                see export.md
  │    └─ hidden <svg> ─▶ EmojiArtwork ─▶ PNG / WebP files, ZIP
  ├─ LayerList ──────────────────────────────▶ select, setLocked
  ├─ "Add rectangle" (no rectangle) ─────────▶ addRect
  ├─ LayerPanel                                one panel for the selection
  │    ├─ IconPicker ────────────────────────▶ selectAsset
  │    ├─ TextField ─────────────────────────▶ setText, setTextColour
  │    ├─ FontField ─────────────────────────▶ setTextFont, setFontWeight
  │    ├─ ShapeControls ─────────────────────▶ addRect, removeRect, setRectStyle,
  │    │                                        setRectInsets
  │    ├─ CanvasColourField ─────────────────▶ setCanvasColour
  │    ├─ BackgroundField ─ readImageAsDataUri ▶ setBackground
  │    └─ PaddingField ──────────────────────▶ setPadding
```

`TextMeasure` is a separate, invisible SVG that is always mounted. Thus the
text box stays correct while the "Preview" tab is open and the canvas is not
mounted. It uses `visibility: hidden`, because `getBBox()` gives no box for an
element with `display: none`.

## One artwork, two views

`EmojiArtwork` renders the layers below, with no event handlers. It takes an
optional `wrapLayer` function. `EmojiCanvas` passes a function that wraps the
rectangle, the icon and the text in a focusable group with the gestures. The
preview uses the plain default. Each instance has its own `useId`, so the clip
and filter IDs do not collide.

## Layers

From the bottom to the top:

```
<svg>                               clip-path = canvas
  ├─ canvas colour  <rect>, full canvas, only when set
  ├─ no rectangle:  background <image>, full canvas
  ├─ rectangle:     <g filter=drop-shadow>
  │                   ├─ background <image>, full canvas, clip-path = rectangle
  │                   └─ <rect> fill + fill-opacity, stroke + stroke-width, rx
  ├─ icon
  ├─ text
  ├─ padding guides                 "Canvas" tab only, see elements.md
  └─ handles                        outside the canvas clip path
```

"Full canvas" is the canvas box, padding included.

- With no rectangle, the background image fills the canvas.
- With a rectangle, the image shows only inside the rectangle. The rectangle
  fill goes on top of the image, so the fill colour and opacity fade it.
- The image keeps its full-canvas position. The rectangle is a window into the
  image: when the rectangle moves, the image does not move.
- The drop shadow applies to the whole rectangle group, so the shadow follows
  the alpha of the image and the fill together.

## Canvas size

The SVG `viewBox` height is always 128. The padding adds width at the left
and at the right, and the elements keep their coordinates.

```
contentWidth = max(128, ceil(max(iconRight, textRight + 8)))
areaWidth    = max(contentWidth, ceil(rectRight))
canvasBox    = { x: -padding.left, width: areaWidth + padding.left + padding.right }
viewBox      = "canvasBox.x 0 canvasBox.width 128"
```

- Each `…Right` value is the right edge of the rotated element box. The shadow
  does not count.
- `contentWidth` is the width without the rectangle. The rectangle insets and
  "Add rectangle" use it, so that the rectangle does not refer to a width that
  it changes itself.
- The text has 8 px of space at its right. The icon and the rectangle have none.
  The right padding adds to this space.
- The canvas clips the elements at the edges of `canvasBox`. An element in the
  padding shows, and it does not make the canvas wider.
- The "Canvas", "Preview", "Chat" and "Export" views all use `canvasBox`. Only
  `contentWidth` and the rectangle insets ignore the padding.
- The SVG is left-aligned in a container that scrolls horizontally. A centred
  SVG moves on the screen when its width changes, and that breaks a drag that
  changes the width.
