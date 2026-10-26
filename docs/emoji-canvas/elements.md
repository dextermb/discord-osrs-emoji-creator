# Emoji canvas: elements

The background image, the icon, the text and the rectangle: their sources,
placement and style. Back to [emoji-canvas.md](../emoji-canvas.md).

## Background image

- The user picks a file in the "Background image" input (`accept="image/*"`).
- `readImageAsDataUri` draws the image on a canvas with a maximum height of
  512 px (4 × 128, sharp on a high-density display). It keeps the image as a
  WebP data URI. A 4000 × 3000 photo becomes 683 × 512 px, about 30 KB.
- A data URI keeps the SVG self-contained. A large raw photo uses much memory
  and makes a later download large. An animated GIF becomes a still image.
- The image fills the canvas with "cover" (`preserveAspectRatio="xMidYMid
  slice"`). When the canvas width changes, the image fills the new width.
- If the browser cannot read the file as an image, the field shows an error.

## The icon is a data URI

The icon is an SVG `<image>` whose `href` is a data URI:

- **Sprite:** the sprite SVG file (`asset.svg`), with one square for each game
  pixel and `shape-rendering="crispEdges"`. It stays sharp at every size and
  rotation.
- **Item:** the 512 px WebP render of the 3D model. The item SVG has visible
  mesh lines at small sizes. See [icon-picker.md](../icon-picker.md).

A data URI makes the canvas self-contained. An `href` to osrsclans.cc breaks
when the SVG is saved, and it taints an HTML canvas that draws the SVG. The data
URIs stay in a cache in memory, keyed by `asset.key` ("sprite:3063",
"item:4587").

## Placement

The icon and the text use `Placement = { cx, cy, scale, rotation }`. One
`scale` keeps their aspect ratio.

- The natural size comes from the content: the sprite size in game pixels (an
  item: 36 × 32), or
  the `getBBox()` box of the `<text>` at 48 px.
- The rendered size is the natural size × `scale`.

The rectangle uses `RectPlacement = { cx, cy, width, height, rotation }`,
because its width and height change separately.

For all three, `(cx, cy)` is the centre and `rotation` is in degrees. The
elements render with `translate(cx cy) rotate(rotation)`. The handles render in
a separate group with no `scale`, so they keep the same size on the screen.

Default placements:

- **Icon:** centred at (64, 64). The scale is the largest whole number that fits
  the icon in 128 px, so each game pixel of a sprite has the same size. This applies only
  to the first icon. See "A new icon" below.
- **Text:** the left edge at x = 136, vertically centred. When the text changes,
  the centre moves by half of the width change, along the rotated text
  direction. Thus the left edge stays in the same position.
- **Rectangle:** the canvas width at the time of "Add rectangle", with an inset
  of 8 px on each side.

The code measures the text again after each change, and when `document.fonts`
finishes loading a font.

### A new icon

A new icon keeps the centre and the rotation of the previous icon. Its scale is
the largest whole number that fits the new icon in the longest rendered side
of the previous icon (`scale × max(iconBasis)`). A whole-number scale keeps each
game pixel the same size. For example, Owner (13 px) at 70 px gives a 25 px
boss icon a scale of 2 (50 px).

The category combobox sets the asset to `null` before the user picks a new
icon. `selectAsset(null)` keeps the icon placement and `iconBasis`, so the
rule also applies across a category change.

## Rectangle style

| Control       | Input                          | Default         |
| ------------- | ------------------------------ | --------------- |
| Fill          | colour + opacity (0–100 %)     | `#000000`, 40 % |
| Border        | colour + width (0–8 px)        | `#ffffff`, 2 px |
| Shadow        | colour + blur (0–16 px)        | `#000000`, 4 px |
| Corner radius | radius (0–64 px)               | 8 px            |

- A border width of 0 gives no border. A shadow blur of 0 gives no shadow.
- The shadow has a fixed offset of (0, 2) px and a fixed opacity of 50 %. The
  blur value is twice the `feDropShadow` `stdDeviation`.
- The radius applies to the clip and to the visible rectangle. SVG limits `rx`
  to half of a side, so a large radius gives a pill shape.
- The colour inputs are native `<input type="color">`. The sliders are the
  shadcn `Slider`. `components/ui/slider.tsx` passes `getAriaLabel` to the
  thumb, because the thumb input holds the accessible name.

## Rectangle insets

The "Inset (px)" inputs set the distance from each canvas edge to the
rectangle: Top, Right, Bottom and Left. They give an exact position and size
without the grab handles.

- The inputs show the current insets, rounded to whole pixels. A drag, a resize
  or a rotation changes them.
- The insets describe the rectangle before rotation. A new inset changes the
  centre and the size, and the rotation stays.
- "Right" refers to the canvas width without the rectangle (`contentWidth`).
  The rectangle pushes the canvas width, so the full width would change when
  "Right" changes.
- The insets are one-time values. When the canvas becomes wider, the rectangle
  keeps its size, and "Right" shows a larger number.
- Negative values are allowed. A negative right inset makes the canvas wider.
- An input keeps the typed text while the text matches the state, so an empty
  field or a single "-" does not jump back. When the state changes for another
  reason, the input shows the new value.

```
left   = cx - width / 2          width  = max(8, contentWidth - left - right)
top    = cy - height / 2         height = max(8, 128 - top - bottom)
right  = contentWidth - (cx + width / 2)
bottom = 128 - (cy + height / 2)
```

## Text style

The text uses the app font (Geist), 48 px, bold, with `fill="currentColor"`.
A font selection is a planned change.
