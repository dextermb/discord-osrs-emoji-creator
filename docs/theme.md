# Theme

The app uses the Blackline design system: black, monospaced, square, and ruled
with 1 px lines. The interface is grey on black until the user points at it.
Then it inverts to white. For the editor layout, see
[emoji-canvas/interaction.md](./emoji-canvas/interaction.md).

## Files

| File                     | Purpose                                                    |
| ------------------------ | ---------------------------------------------------------- |
| `app/globals.css`        | The colour tokens and the type scale.                      |
| `app/layout.tsx`         | The fonts, and the `dark` class on `<html>`.               |
| `components/ui/*.tsx`    | The shadcn components, with the Blackline styles in place. |

## Colours

Blackline is mapped onto the shadcn tokens. Thus every shadcn utility
(`bg-muted`, `text-muted-foreground`, `border-border`) keeps its name and gets
a Blackline value. Blackline's own `tailwind.css` is not used: it clears
`--color-*`, and that removes the shadcn utilities.

Dark is the default: `<html>` has the `dark` class. `:root` holds the light
values.

| Token                | Dark      | Light     | Use                                        |
| -------------------- | --------- | --------- | ------------------------------------------ |
| `--background`       | `#000000` | `#ffffff` | The page.                                  |
| `--foreground`       | `#ffffff` | `#000000` | Text, and the fill of an inverted element. |
| `--card`             | `#080808` | `#eeeeee` | Heading strips.                            |
| `--popover`          | `#262626` | `#eeeeee` | Combobox lists.                            |
| `--muted`            | `#262626` | `#e4e4e4` | The canvas ground.                         |
| `--muted-foreground` | `#8a8a8a` | `#585858` | Labels and secondary text.                 |
| `--accent`           | `#ffffff` | `#000000` | The highlighted combobox option.           |
| `--destructive`      | `#ff6666` | `#b91c1c` | Remove buttons and errors.                 |
| `--border`           | `#3a3a3a` | `#e4e4e4` | The 1 px rules.                            |
| `--border-strong`    | `#585858` | `#c6c6c6` | The outline button at rest.                |
| `--input`, `--ring`  | `#585858` | `#c6c6c6`, `#8a8a8a` | Inputs and focus rings.         |

- `--radius` is `0`, so every `rounded-*` utility that uses it is square.
- `--muted-foreground` is 4.4:1 on `#262626`, below 4.5:1. The combobox list
  sets it to `--secondary-foreground` (`#c6c6c6`) in dark mode.

## Type

- The interface is Geist Mono (`font-mono` on `<html>`). The canvas `<svg>`
  sets `font-sans`, so the emoji text stays in Geist.
- `text-sm` and `text-base` are 12.75 px, `text-xs` is 11.05 px.
- `font-medium` is 400. Blackline uses one weight. The canvas text stays bold,
  because it sets `font-weight` on the `<text>` element.
- Labels, legends, buttons and layer names are uppercase with `tracking-label`
  (0.08 em).

## Interaction

- The `outline` button and the layer rows invert on hover and focus: white
  fill, black text. A selected layer row stays inverted.
- The `destructive` button is a red outline. It fills red on hover and focus.
- A pressed toggle (a lock) is filled white.
