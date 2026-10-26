# Emoji canvas: state and rendering

The editor state, the SVG layers, and the canvas size. Back to
[emoji-canvas.md](../emoji-canvas.md).

## Editor state

All editor state is in one reducer (`editorReducer` in `lib/editor.ts`). The
reducer and its selectors are pure functions. `EmojiCanvas` and the controls
read the state and send actions. A later "download" step can read the whole
emoji from one place.

```
EditorState
  asset:      IconAsset | null             sprite or item, see icon-picker.md
  icon:       Placement
  iconBasis:  { width, height } | null    natural size of the last icon
  text:       { value, box: Box, placement: Placement }
  background: { dataUri, name } | null
  rect:       { placement: RectPlacement, style: RectStyle } | null
  selection:  "icon" | "text" | "rect" | "background" | null
  locked:     { icon, text, rect: boolean }
```

```
EmojiEditor ── useReducer(editorReducer) ──▶ state
  ├─ LayerList ──────────────────────────────▶ select, setLocked
  ├─ "Add rectangle" (no rectangle) ─────────▶ addRect
  ├─ LayerPanel                                one panel for the selection
  │    ├─ IconPicker ────────────────────────▶ selectAsset
  │    ├─ TextField ─────────────────────────▶ setText
  │    ├─ ShapeControls ─────────────────────▶ addRect, removeRect, setRectStyle,
  │    │                                        setRectInsets
  │    └─ BackgroundField ─ readImageAsDataUri ▶ setBackground
  └─ EmojiCanvas
       ├─ pointer, keyboard ─────────────────▶ set*Placement, moveBy, select
       └─ <text> getBBox ────────────────────▶ textMeasured
```

## Layers

From the bottom to the top:

```
<svg>                               clip-path = canvas
  ├─ no rectangle:  background <image>, full canvas
  ├─ rectangle:     <g filter=drop-shadow>
  │                   ├─ background <image>, full canvas, clip-path = rectangle
  │                   └─ <rect> fill + fill-opacity, stroke + stroke-width, rx
  ├─ icon
  ├─ text
  └─ handles                        outside the canvas clip path
```

- With no rectangle, the background image fills the canvas.
- With a rectangle, the image shows only inside the rectangle. The rectangle
  fill goes on top of the image, so the fill colour and opacity fade it.
- The image keeps its full-canvas position. The rectangle is a window into the
  image: when the rectangle moves, the image does not move.
- The drop shadow applies to the whole rectangle group, so the shadow follows
  the alpha of the image and the fill together.

## Canvas size

The SVG `viewBox` height is always 128.

```
contentWidth = max(128, ceil(max(iconRight, textRight + 8)))
width        = max(contentWidth, ceil(rectRight))
```

- Each `…Right` value is the right edge of the rotated element box. The shadow
  does not count.
- `contentWidth` is the width without the rectangle. The rectangle insets and
  "Add rectangle" use it, so that the rectangle does not refer to a width that
  it changes itself.
- The text has 8 px of space at its right. The icon and the rectangle have none.
- The canvas clips the elements at the left, top and bottom edges.
- The SVG is left-aligned in a container that scrolls horizontally. A centred
  SVG moves on the screen when its width changes, and that breaks a drag that
  changes the width.
