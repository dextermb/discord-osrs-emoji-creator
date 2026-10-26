# Emoji canvas: export

The "Export" tab makes the image files that the user uploads to Discord as
guild emoji. Back to [emoji-canvas.md](../emoji-canvas.md). For the sections,
see [preview.md](./preview.md).

## Files

| File                            | Purpose                                                   |
| ------------------------------- | --------------------------------------------------------- |
| `components/emoji-export.tsx`   | The tab: the format choice, the hidden SVG, the file rows. |
| `lib/export.ts`                 | The formats, the size limit, the file names, `canvasFont`, `exportFiles`, `zipFiles`. |

## Discord rules

From the developer document "Emoji", section "Create Guild Emoji" (read on
26 October 2026):

| Rule      | Value                                   |
| --------- | --------------------------------------- |
| Formats   | JPEG, PNG, GIF, WebP, AVIF              |
| File size | 256 KiB or less, else `400 Bad Request` |
| Size      | "the 128x128 emoji image"               |

The tab offers PNG (default) and WebP. Both keep the transparency. The tab
does not offer JPEG (no transparency), AVIF (few browsers can encode it) or
GIF (the emoji is not animated, and the browser has no GIF encoder).

## The files

The tab always shows two groups, and the "Split" toggle of the other tabs does
not change them:

| Group    | Files                                    | Pixel size          |
| -------- | ---------------------------------------- | ------------------- |
| Combined | `emoji.png`                              | `canvasWidth` × 128 |
| Split    | `emoji_1.png`, `emoji_2.png`, …          | 128 × 128 each      |
| Split    | `emoji.zip`: all split files, no compression | —               |

- The split files are `sections({ ...state, split: true })`, so they agree
  with the "Preview" and "Chat" tabs when the split is on. The last section
  keeps its transparent strip at the right.
- The combined file has the true canvas width. Discord makes a wide emoji
  smaller to fit its square, so a larger or square file adds nothing.
- The Discord client gives the file name as the default emoji name. The names
  have only letters, digits and `_`, so Discord accepts them.

Each row shows the image, the file name, the pixel size, the byte size and a
"Download" link. If a file is larger than 256 KiB, the byte size shows in red
with "(too large for Discord)". The link stays active.

## Render path

```
EmojiExport (format comes from EmojiEditor, so it stays across tab changes)
  ├─ hidden <svg xmlns width height> ─▶ EmojiArtwork    the same layers
  └─ effect, on state, icon, text font or format change:
       getComputedStyle(text).fontFamily ─▶ canvasFont ─▶ "400 48px \"Lobster\", …"
       document.fonts.load(font, text) ─▶ document.fonts.check ─▶ fontReady
       svg.cloneNode ─▶ remove <text> ─▶ XMLSerializer
         ─▶ Blob(image/svg+xml) ─▶ Image.decode()
         ─▶ <canvas> canvasWidth × 128: drawImage, then fillText   combined
         ─▶ crop each section to 128 × 128 ─▶ toBlob(type)         split
         ─▶ fflate zipSync(split, level 0) ─▶ Blob                ZIP
       ─▶ object URLs ─▶ <Image unoptimized> + <a download>
```

- The tab is not kept mounted, so a drag on the canvas does not make files.
- When a new result arrives, the effect revokes the object URLs of the old
  result.
- The icon and the background are data URIs already, so the canvas does not
  become tainted and `toBlob` works.

## The font

The SVG image holds every layer except the text. The canvas draws the text
with `fillText`, on top of the image. The text is the top layer, so the layer
order does not change. For the text font, see [fonts.md](./fonts.md).

Why not the text in the SVG: an SVG that loads as an `Image` cannot see the
page fonts. A font in a `<style>` in the SVG works, but `Image.decode()` does
not wait for it. WebKit then draws the text in a fallback font, in 4 of 5
tests. The canvas uses the page fonts, and `document.fonts.load()` tells when
the font is ready.

1. `getComputedStyle(text).fontFamily` on the hidden `<text>` gives the
   resolved families. A `var(--font-emoji)` becomes "Jim Nightshade".
2. `canvasFont(weight, 48, families)` quotes each family, because a canvas
   font with `Press Start 2P` unquoted is not valid. Generic families such as
   `serif` stay unquoted.
3. `document.fonts.load(font, text)`, then `document.fonts.check(font, text)`.
   An upload is a `FontFace` in `document.fonts`, so it works the same.
4. `drawText` applies the text placement (`translate`, `rotate`, `scale`) and
   draws with `textAlign = "center"`.

The SVG text uses `dominant-baseline="central"`. The canvas has no "central"
baseline, and its "middle" is 2–3 px higher. So the canvas uses
`textBaseline = "alphabetic"` at
`y = (fontBoundingBoxAscent − fontBoundingBoxDescent) / 2`. In Chromium this
gives the same pixels as the SVG. In WebKit the text is 1 px higher than in
the canvas view.

The tab waits while the Google font loads (`useTextFont`). If the font check
fails, the tab still makes the files and shows "Could not load the text
font".

## Format support

`toBlob` gives a PNG when the browser cannot encode the type. On mount,
`canEncode` makes a 1 × 1 blob of each format and checks `blob.type`. A format
that fails is disabled, with the text "This browser cannot make WebP files".

WebP uses the browser default quality, which is lossy.

## Loading and errors

- While the icon or the text font loads, each row shows a skeleton, and the
  links are inactive.
- If the render fails, the tab shows "Could not make the image files".
