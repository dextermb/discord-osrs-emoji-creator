# Emoji canvas: text fonts

The font of the emoji text: the Google Fonts list, the upload, the weight, and
how a font loads. Back to [emoji-canvas.md](../emoji-canvas.md).

## Files

| File                          | Purpose                                                  |
| ----------------------------- | -------------------------------------------------------- |
| `lib/fonts.ts`                | `TextFont`, `textFontStyle`, `nearestWeight`, the Google load, the upload. |
| `lib/google-fonts.json`       | The Google Fonts list. `pnpm fonts` writes it.           |
| `scripts/google-fonts.mjs`    | Makes `lib/google-fonts.json` from the Next.js font data. |
| `hooks/use-google-fonts.ts`   | Loads the list when the font combobox opens.             |
| `hooks/use-text-font.ts`      | Loads the selected Google font. Gives `isLoading`, `failed`. |
| `components/font-field.tsx`   | "Font", "Weight" and "Upload font" in the "Text" panel.  |

## The font in the state

```
EditorState.text.font: TextFont
  | { source: "google", family, weights: number[], weight }
  | { source: "upload", family: "upload-<n>", name, dataUri, weight: 400 }

DEFAULT_TEXT_FONT = { google, "Jim Nightshade", weights [400], weight 400 }
```

- `setTextFont` replaces the font. `setFontWeight` changes the weight of a
  Google font, only to a weight in `weights`.
- A Google font keeps its `weights`, so the "Weight" control needs no list.
- An upload keeps its file as a data URI (as the background image does), so a
  later download step can embed the font.

`textFontStyle(font)` gives `{ fontFamily, fontWeight }`. `EmojiArtwork` and
`TextMeasure` put it in the `style` of the `<text>`. A `font-family`
presentation attribute cannot hold `var(--font-sans)`. The fallback font is
Geist (`var(--font-sans)`).

## The Google Fonts list

`scripts/google-fonts.mjs` reads the font data that Next.js includes for
`next/font/google` (`next/dist/compiled/@next/font/dist/google/font-data.json`).
It writes each family name and its static weights to `lib/google-fonts.json`.
The script drops "Molle", the one family with no normal style, because its
`css2` request needs `ital`. Run `pnpm fonts` again after a Next.js upgrade to
get new families.

- The file is about 100 KB, or 14 KB with gzip. The font combobox loads it with
  `import()` when the user opens the list for the first time. The production
  page does not load it.
- The Google Fonts Developer API needs an API key and a server proxy, and
  `fonts.google.com/metadata/fonts` sends no CORS header. The app keeps
  nothing on a server, so it uses neither.
- A committed file breaks only when the script runs. A route that reads the
  Next.js file at build time breaks the build when a Next.js upgrade moves it.

## How a font loads

```
Jim Nightshade, Geist ─▶ next/font in app/layout.tsx, no request
                         (--font-emoji, --font-sans)

Google font ─▶ <link rel="stylesheet" href="fonts.googleapis.com/css2?
                 family=<family>:wght@<weight>&display=swap">
            ─▶ document.fonts.load("<weight> 48px '<family>'")
            ─▶ isLoading false

Upload ─▶ size ≤ 5 MB ─▶ new FontFace("upload-<n>", bytes, { weight: 400 })
       ─▶ face.load() ─▶ document.fonts.add ─▶ setTextFont
```

- The Google CSS has one `@font-face` for each subset, with a
  `unicode-range`. The browser downloads only the subsets that the text uses.
  `fonts.googleapis.com` sends `access-control-allow-origin: *`.
- Each family and weight gets one `<link>`. The link stays after the user
  selects a different font, so a return to the font sends no request. A
  failed link is removed, so a new selection tries again.
- Jim Nightshade comes from `next/font`, not from Google at runtime. With a
  runtime load, the first render shows the fallback font, and the text box
  changes when the font arrives.
- `useTextFont` runs in `EmojiEditor`, so the font loads also when the "Text"
  panel is closed.
- While a font loads, the text shows in the fallback font. When it loads,
  `document.fonts` sends `loadingdone`, and `TextMeasure` measures again. The
  left edge of the text stays in the same position (see
  [elements.md](./elements.md)).
- An upload gets a new family name each time. Thus it cannot collide with a
  Google font or a page font.

## Weight

1,081 of the Google families have no 700 weight. If the text asks for a
weight that the font does not have, the browser makes a false bold or a false
thin. A false bold looks bad on a pixel font such as "Press Start 2P". So the
text uses only a weight that the font has.

- A new Google font starts at 700, or at the weight nearest to 700. A tie goes
  to the heavier weight.
- The "Weight" toggle group shows the weights of the font. Jim Nightshade has
  only 400.
- An upload is one file with one face. The `FontFace` is 400, the text is
  400, and the "Weight" control is not shown.

## Workflow

The "Text" panel, from the top:

1. "Text": the colour input and the text input.
2. "Font": a combobox with "Jim Nightshade" at the start. The list shows the
   first 100 families that contain the query, and "Showing 100 of N". During
   the first load of the list, it shows "Loading fonts…".
3. "Weight": the toggle group, for a Google font only.
4. "Upload font": "Choose font" accepts `.ttf`, `.otf`, `.woff` and `.woff2`.
   With an upload, the field shows the file name and "Remove". "Remove" sets
   the font back to Jim Nightshade. A choice in "Font" replaces the upload.

States:

- A Google font loads: a spinner and "Loading font…" below the combobox.
- A Google font fails: "Could not load the font." The text stays in the
  fallback font.
- An upload is larger than 5 MB: "The font file is larger than 5 MB."
- The browser cannot read an upload: "Could not read the font file."
- After an upload error, the font does not change.

The combobox value must be the same object between renders. A new object at
each render makes the combobox put the font name back into the input, and the
user cannot type.
