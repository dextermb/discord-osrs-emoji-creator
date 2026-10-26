# Emoji canvas

The emoji canvas is an SVG on the home page. It holds a background image, one
rectangle, the selected icon, and the text from the "Text" input. The user can
click the rectangle, the icon or the text, and then move, resize and rotate it
with grab handles. For the icon picker, see [icon-picker.md](./icon-picker.md).

## Files

| File                               | Purpose                                                   |
| ---------------------------------- | --------------------------------------------------------- |
| `lib/editor.ts`                    | The editor state, the actions, the reducer, `canvasWidth`. |
| `lib/placement.ts`                 | The placement types and the pure geometry functions.      |
| `lib/image.ts`                     | `readImageAsDataUri`: reduce an upload to a data URI.     |
| `components/emoji-editor.tsx`      | Holds the reducer. Renders the canvas, the layer list and the layer panel. |
| `components/layer-panel.tsx`       | The controls of the selected layer, and the "Text" input. |
| `components/panel-heading.tsx`     | The heading strip above the canvas, the list and the panel. |
| `components/emoji-canvas.tsx`      | The SVG view of the state, the handles, and the gestures. |
| `components/background-field.tsx`  | The file input and the remove button.                     |
| `components/shape-controls.tsx`    | The rectangle buttons, insets and style controls.         |
| `components/layer-list.tsx`        | The "Layers" list: select each layer, lock each element.  |
| `hooks/use-asset-data-uri.ts`      | The icon SVG as a data URI: cache, fetch, and state.      |

## Pages

| Page                                                  | Read it for                                               |
| ----------------------------------------------------- | --------------------------------------------------------- |
| [emoji-canvas/state.md](./emoji-canvas/state.md)             | The editor state, the actions, the SVG layers, the canvas width. |
| [emoji-canvas/elements.md](./emoji-canvas/elements.md)       | The background, the icon, the text and the rectangle: placement, insets and style. |
| [emoji-canvas/interaction.md](./emoji-canvas/interaction.md) | The layer list and the panel, the locks, the gestures, loading and errors. |

For the colours, the fonts and the component styles, see [theme.md](./theme.md).
