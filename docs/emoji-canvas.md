# Emoji canvas

The emoji canvas is an SVG on the home page. It holds a canvas colour, a
background image, one rectangle, the selected icon, and the text from the
"Text" input, in a Google font or an uploaded font. The user can click the
rectangle, the icon or the text, and then move, resize and rotate it with grab
handles. The "Preview" tab shows the emoji at the Discord display sizes. The
"Chat" tab shows it in Discord messages. The "Export" tab makes the image
files for Discord. For the icon picker, see [icon-picker.md](./icon-picker.md).

## Files

| File                               | Purpose                                                   |
| ---------------------------------- | --------------------------------------------------------- |
| `lib/editor.ts`                    | The editor state, the actions, the reducer, `canvasWidth`. |
| `lib/placement.ts`                 | The placement types and the pure geometry functions.      |
| `lib/image.ts`                     | `readImageAsDataUri`: reduce an upload to a data URI.     |
| `components/emoji-editor.tsx`      | Holds the reducer. Renders the tabs, the layer list and the layer panel. |
| `components/emoji-artwork.tsx`     | The SVG layers of the emoji, with no handlers. The canvas and the preview use it. |
| `components/text-measure.tsx`      | A hidden `<text>` that measures the text and sends `textMeasured`. |
| `components/emoji-preview.tsx`     | The "Preview" tab: the split toggle, the ground toggle, the Discord sizes. |
| `components/emoji-section.tsx`     | One section of the emoji as an `<svg>` at a given size.   |
| `components/emoji-chat.tsx`        | The "Chat" tab: the controls, the channel, the size list. |
| `components/discord-message.tsx`   | One Discord message, the reply line, a reaction pill.     |
| `lib/discord.ts`                   | The Discord themes, sizes and spacings.                   |
| `components/emoji-export.tsx`      | The "Export" tab: the format, the file rows, the downloads. |
| `lib/export.ts`                    | The export formats, the file names, the render and the ZIP. |
| `components/layer-panel.tsx`       | The controls of the selected layer, and the "Text" input. |
| `components/font-field.tsx`        | The "Font", "Weight" and "Upload font" fields.          |
| `lib/fonts.ts`                     | The text font: the style, the Google load, the upload.    |
| `components/panel-heading.tsx`     | The heading strip above the canvas, the list and the panel. |
| `components/emoji-canvas.tsx`      | The "Canvas" tab: the artwork, the handles, and the gestures. |
| `components/background-field.tsx`  | The background image file input and the remove button.   |
| `components/shape-controls.tsx`    | The rectangle buttons, insets and style controls.         |
| `components/layer-list.tsx`        | The "Layers" list: select each layer, lock each element.  |
| `hooks/use-asset-data-uri.ts`      | The icon SVG as a data URI: cache, fetch, and state.      |

## Pages

| Page                                                  | Read it for                                               |
| ----------------------------------------------------- | --------------------------------------------------------- |
| [emoji-canvas/state.md](./emoji-canvas/state.md)             | The editor state, the actions, the SVG layers, the canvas width. |
| [emoji-canvas/elements.md](./emoji-canvas/elements.md)       | The canvas colour, the background, the icon, the text and the rectangle: placement, insets and style. |
| [emoji-canvas/fonts.md](./emoji-canvas/fonts.md)             | The text font: the Google Fonts list, the upload, the weight, the load. |
| [emoji-canvas/interaction.md](./emoji-canvas/interaction.md) | The layer list and the panel, the locks, the gestures, loading and errors. |
| [emoji-canvas/preview.md](./emoji-canvas/preview.md)         | The "Preview" tab: the Discord sizes, the split, the ground. |
| [emoji-canvas/chat.md](./emoji-canvas/chat.md)               | The "Chat" tab: the Discord messages, sizes, themes and sources. |
| [emoji-canvas/export.md](./emoji-canvas/export.md)           | The "Export" tab: the Discord file rules, the formats, the render path, the font. |

For the colours, the fonts and the component styles, see [theme.md](./theme.md).
