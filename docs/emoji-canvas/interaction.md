# Emoji canvas: interaction

The layer list and the panel, the locks, the gestures, and the loading and
error states. Back to [emoji-canvas.md](../emoji-canvas.md).

## Tabs

The heading strip above the canvas holds two tabs: "Canvas" and "Preview". The
active tab is inverted. "Canvas" is the editor. "Preview" shows the emoji at
the Discord sizes, see [preview.md](./preview.md). The layer list and the
panel stay below both tabs, so the user can change the emoji in the preview.

## Layer list and panel

Below the canvas, the "Layers" list is on the left and the panel of the
selected layer is on the right. Under 900 px, the panel goes below the list.

The list has one row for each layer, from the top to the bottom: Text, Icon,
Rectangle and Background. Each row uses the shadcn `Item` component.

- Text, Icon and Background always have a row. With no text or no icon, the
  row shows "No text" or "No icon", so that its panel stays reachable.
- The Rectangle row shows only when there is a rectangle. With no rectangle,
  an "Add rectangle" button shows below the list.
- A click on the row name selects the layer, if it is not locked. The selected
  row is inverted (white fill, black text).
- The lock toggle shows only for an element that exists. It is an icon
  (`LockIcon` or `LockOpenIcon`) with `aria-label` "Lock icon" and so on, and
  `aria-pressed`. It sends `setLocked`. The background has no lock.

`LayerPanel` shows the controls of the selection: the icon picker, the "Text"
input and its colour, the rectangle controls, or the canvas colour and the
background image. With no selection, it
shows a hint. All four panels stay mounted and only the selected one shows, so
the icon picker keeps its category and the inputs keep their drafts.

Selecting "background" only opens its panel. The background has no frame and
no handles on the canvas. A click on the empty canvas clears every selection,
"background" too.

## Locks

A locked element:

- has `pointer-events: none`, so a click goes through it to the element below,
- cannot get keyboard focus on the canvas, and shows no handles,
- cannot be selected or nudged. The reducer ignores `select` and `moveBy` for
  it.

When the user locks the selected element, the selection clears. A lock does
not stop style changes: the user can still type text, change the rectangle
style, or remove the rectangle.

## Gestures

| Gesture | How                                | Result                                    |
| ------- | ---------------------------------- | ----------------------------------------- |
| Select  | Click the element, or focus it     | The frame and the handles show.           |
| Move    | Drag the element                   | The centre moves with the pointer.        |
| Resize  | Drag a corner handle               | See below.                                |
| Rotate  | Drag the round handle at the top   | Rotation about the centre.                |
| Snap    | Hold Shift during a rotation       | The angle snaps to 15° steps.             |
| Nudge   | Arrow keys on a focused element    | 1 px, or 10 px with Shift.                |
| Clear   | Click the empty canvas, or Escape  | The handles go away.                      |

Resize:

- **Icon and text:** scale about the centre, with the aspect ratio kept. New
  scale = start scale × distance(pointer, centre) ÷ distance(start, centre).
  Minimum rendered height: 8 px.
- **Rectangle:** the opposite corner stays in its position, and the width and
  the height change freely. With Shift, the aspect ratio stays. The code turns
  the pointer movement into the rectangle's own (rotated) axes. Minimum size:
  8 × 8 px.

Other details:

- On `pointerdown`, the SVG gets pointer capture. Thus a drag continues when
  the pointer leaves the SVG.
- The code converts screen points to SVG points with `getScreenCTM()`.
- The SVG has `overflow: visible`, and the handles are outside the clip path.
  The scroll container has 24 px of padding, so handles near the canvas edges
  stay visible. Handles further out are cut off by the container.

## Loading and errors

- While the icon SVG file loads, a skeleton shows in place of the canvas.
- If the icon fetch fails, an alert shows "Could not load the icon." The
  canvas still shows the other elements.
