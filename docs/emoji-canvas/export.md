# Emoji canvas: export

The "Export" tab makes the image files that the user uploads to Discord as
guild emoji. Back to [emoji-canvas.md](../emoji-canvas.md). For the sections,
see [preview.md](./preview.md).

## Files

| File                            | Purpose                                                   |
| ------------------------------- | --------------------------------------------------------- |
| `components/emoji-export.tsx`   | The tab: the format choice, the hidden SVG, the file rows. |
| `lib/export.ts`                 | The formats, the size limit, the file names, `exportFiles`, `zipFiles`. |
| `lib/embedded-font.ts`          | `embeddedFontCss`: the text font as `@font-face` CSS with data URIs. |

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
       getComputedStyle(text).fontFamily ─▶ embeddedFontCss ─▶ CSS
       svg.cloneNode ─▶ + text font-family, + <style> font CSS
         ─▶ XMLSerializer ─▶ Blob(image/svg+xml) ─▶ Image.decode()
         ─▶ <canvas> canvasWidth × 128 ─▶ toBlob(type)          combined
         ─▶ crop each section to 128 × 128 ─▶ toBlob(type)      split
         ─▶ fflate zipSync(split, level 0) ─▶ Blob             ZIP
       ─▶ object URLs ─▶ <Image unoptimized> + <a download>
```

- The tab is not kept mounted, so a drag on the canvas does not make files.
- When a new result arrives, the effect revokes the object URLs of the old
  result.
- The icon and the background are data URIs already, so the canvas does not
  become tainted and `toBlob` works.

## The font

An SVG that loads as an `Image` cannot see the fonts of the page, and cannot
resolve CSS custom properties such as `var(--font-emoji)`. Without help, the
text renders in a fallback font, and the text width does not agree with
`text.box` from `TextMeasure`. For the text font, see [fonts.md](./fonts.md).

1. The tab reads `getComputedStyle(text).fontFamily` from the hidden `<text>`.
   This gives the resolved family list, for example
   `"Press Start 2P", Geist, "Geist Fallback"`.
2. `embeddedFontCss(font, fontFamily, text)` collects the `@font-face` rules:

   | Font source        | Where the rules come from                              |
   | ------------------ | ------------------------------------------------------ |
   | `next/font`        | `document.styleSheets` (same origin).                  |
   | Google, at runtime | A new fetch of the `css2` URL, parsed with `new CSSStyleSheet()`. The page `<link>` is cross-origin, so its rules cannot be read. |
   | Upload             | A new rule with `font.dataUri` as the `src`.           |

3. It keeps the rules whose family is in the list and whose `unicode-range`
   covers a character of the text. A Google font has one rule for each
   subset, so this skips most files.
4. It fetches each `url(…)` and replaces it with a data URI. Each URL and
   each Google CSS file is cached.
5. The clone gets the resolved family on its `<text>`, and the CSS in a
   `<style>`. The CSS goes in the clone, not in the page, so the page fonts
   do not change.

The tab waits while the Google font loads (`useTextFont`). If the first family
has no rule, or a fetch fails, the tab still makes the files and shows "Could
not embed the text font".

## Format support

`toBlob` gives a PNG when the browser cannot encode the type. On mount,
`canEncode` makes a 1 × 1 blob of each format and checks `blob.type`. A format
that fails is disabled, with the text "This browser cannot make WebP files".

WebP uses the browser default quality, which is lossy.

## Loading and errors

- While the icon or the text font loads, each row shows a skeleton, and the
  links are inactive.
- If the render fails, the tab shows "Could not make the image files".
