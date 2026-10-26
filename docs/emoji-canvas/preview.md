# Emoji canvas: preview

The "Preview" tab shows the emoji at the sizes that Discord shows it. Back to
[emoji-canvas.md](../emoji-canvas.md). For the emoji in Discord messages, see
[chat.md](./chat.md).

## Discord sizes

| Row    | Size  | Where Discord shows it          |
| ------ | ----- | ------------------------------- |
| Inline | 22 px | An emoji in a line of text.     |
| Jumbo  | 48 px | A message that holds only emoji. |

Discord shows each emoji in a square. A wide image gets smaller to fit the
square, with empty space above and below it. [chat.md](./chat.md) gives all
the sizes and their sources.

## Split

The "Split 128 px" toggle sets `split` in the editor state. A later download
step can then read the sections from the state.

- **Off:** one section, the full canvas width. The preview shows it in one
  square, as Discord does.
- **On:** the canvas is cut into sections of `SPLIT_WIDTH` (128 px). Each
  section is one square emoji. The user sends them side by side, and they
  show as one wide image.

`sections(state)` in `lib/editor.ts` gives the sections:

```
split off:  [{ x: 0, width: canvasWidth }]
split on:   [{ x: 0, width: 128 }, { x: 128, width: 128 }, …]
            count = ceil(canvasWidth / 128)
```

Each section has the full 128 px width. The last section gets a transparent
strip at its right. Discord centres a narrow image in its square, so a narrow
last section would show a gap.

Each section is an `EmojiSection`: an `<svg>` with `viewBox="x 0 width 128"`
that renders the same `EmojiArtwork`.

## Gap

The "Gap (px)" input (0–32, default 0) sets the space between the emoji in the
preview, in screen pixels. Discord adds no margin between emoji: emoji that
the user types together touch, as with a gap of 0. A space character between
the emoji gives a gap of one space width. Use the input to see that case.

- The gap is only in the preview. The sections do not change: section 2 still
  starts at canvas x = 128, so no canvas pixels are skipped.
- Both rows use the same gap.
- With the split off, there is one emoji, so the input is disabled.
- The gap is local to the tab and is not part of the emoji.

## Ground

The moon and sun toggles set the ground behind the preview: dark (no ground,
so the black page shows) or light (white). The ground is local to the tab and
is not part of the emoji. Use it to check a transparent emoji on both themes.
The preview tab stays mounted (`keepMounted`), so the gap and the ground stay
when the user goes to the "Canvas" tab and back.

## Loading

While the icon loads, each row shows a skeleton. The preview reads the icon
with `useAssetDataUri`, which uses the same cache as the canvas.
