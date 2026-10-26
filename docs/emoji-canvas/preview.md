# Emoji canvas: preview

The "Preview" tab shows the emoji at the sizes that Discord shows it. Back to
[emoji-canvas.md](../emoji-canvas.md).

## Discord sizes

| Row    | Size  | Where Discord shows it          |
| ------ | ----- | ------------------------------- |
| Inline | 22 px | An emoji in a line of text.     |
| Jumbo  | 48 px | A message that holds only emoji. |

These sizes come from Discord community posts, not from a Discord document.
Discord shows each emoji in a square. A wide image gets smaller to fit the
square, with empty space above and below it.

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

Each section is an `<svg>` with `viewBox="x 0 width 128"` that renders the
same `EmojiArtwork`. The sections touch. Discord adds a small margin between
emoji, so the preview is an approximation.

## Ground

The moon and sun toggles set the ground behind the preview: dark (`bg-muted`,
the editor ground) or light (white). The ground is local to the tab and is not
part of the emoji. Use it to check a transparent emoji on both themes.

## Loading

While the icon loads, each row shows a skeleton. The preview reads the icon
with `useAssetDataUri`, which uses the same cache as the canvas.
