# Emoji canvas: interaction

The locks, the gestures, and the loading and error states. Back to
[emoji-canvas.md](../emoji-canvas.md).

## Locks

The "Layers" list below the canvas has one row for each element that exists,
from the top layer to the bottom: Text, Icon, Rectangle. The background image
is not in the list, because it cannot be selected. Each row uses the shadcn
`Item` component.

- A click on the row name selects the element, if it is not locked.
- The lock toggle (shadcn `Toggle`, `aria-label` "Lock icon" and so on, with
  `aria-pressed`) sends `setLocked`.

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
