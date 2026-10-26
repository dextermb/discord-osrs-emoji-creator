# Emoji canvas: chat

The "Chat" tab shows the emoji in a copy of a Discord channel: inline in text,
as a jumbo emoji, as a reaction, in a reply line and in the message box. Back
to [emoji-canvas.md](../emoji-canvas.md). For the plain size rows, see
[preview.md](./preview.md).

## Files

| File                               | Purpose                                                  |
| ---------------------------------- | -------------------------------------------------------- |
| `lib/discord.ts`                   | The theme tokens, the sizes, the spacings, `chatSizes`, `groupGap`, `themeStyle`. |
| `components/emoji-chat.tsx`        | The tab: the controls, the channel, the size list.       |
| `components/discord-message.tsx`   | One message (default or compact display), the reply line, a reaction pill. |
| `components/emoji-section.tsx`     | One section as an `<svg>` at a given size. The preview uses it too. |

## Why a chat

A wide emoji looks correct on a plain ground, but it is too small to read in a
message. Discord draws each emoji in a fixed square with `object-fit: contain`
and does not make the square wider. The 458 px example ("Clan benefits" and
the Chest) shows at about 22 × 6 px inline. With the split, the 4 sections sit
side by side and read as one banner.

## Discord sizes

| Place                  | Size    | Rule                                                     |
| ---------------------- | ------- | -------------------------------------------------------- |
| Inline, in text        | 22 px   | `1.375em` at 16 px text.                                 |
| Jumbo                  | 48 px   | Only emoji in the message, 30 or fewer (`MAX_JUMBO_EMOJI`). |
| Jumbo, compact display | 22 px   | Compact display turns jumbo off.                         |
| Reaction pill          | 20 px   | 2 px × 6 px padding, 8 px radius, count 14 px, weight 600. |
| Reply line             | 17.5 px | `1.25em` at 14 px text.                                  |
| Message box            | 22 px   | The same rule as inline.                                 |

`chatSizes(display, count)` gives these sizes. The jumbo size is 48 px only
for the default display and 30 sections or fewer. With the split, 31 sections
need a canvas that is wider than 3,840 px.

Discord adds no margin between emoji. Emoji that the user types together
touch, so the sections in the chat touch.

These values come from the Discord web client CSS and JS of 26 October 2026,
the support articles 360036479811 and 9507780972951, and the developer
documents "Emoji" and "Message". Discord can change them at each deploy.

## Message layout

- **Default display:** the avatar is 40 px at 16 px from the left. The text
  starts at 72 px. The name is 16 px, weight 500. The time is 12 px, weight
  500. The body is 16 px with a 22 px line height. A message that continues a
  group has no avatar and no name.
- **Compact display:** the time (11 px), the name and the text are on one
  line. Wrapped lines and the reactions start at 80 px.
- **Reply line:** 14 px text, a 16 px avatar, the name at 64 % opacity. In the
  default display a 2 px line with a 6 px corner joins it to the avatar.
- **Space between groups:** 0, 4, 8, 16 or 24 px. The margin is the setting
  + 1 px (`groupGap`), as in Discord.

## Themes

The four themes use Discord's names. Light is `.theme-light`, Ash is the old
"Dark", Dark is `.theme-darker`, and Onyx is `.theme-midnight`.

| Token            | Light     | Ash       | Dark      | Onyx      |
| ---------------- | --------- | --------- | --------- | --------- |
| Chat background  | `#fbfbfb` | `#333338` | `#1a1a1e` | `#000000` |
| Text             | `#2e2e33` | `#f2f2f5` | `#f0f0f2` | `#d4d6d9` |
| Name (no role)   | `#29292e` | `#ffffff` | `#fafafa` | `#dbdbde` |
| Time             | `#70707a` | `#9e9ea6` | `#82828a` | `#73737d` |
| Muted text       | `#6b6e75` | `#ababb3` | `#96969e` | `#82828a` |
| Message box      | `#ffffff` | `#383b40` | `#212426` | `#101013` |
| Reply line       | `#c4c7c9` | `#595963` | `#474752` | `#383840` |
| Reaction count   | `#595963` | `#c4c7c9` | `#ababb3` | `#96969e` |
| Own reaction count | `#4752c4` | `#dee3ff` | `#bac7ff` | `#99adff` |

- Own reaction: the background is `#e7e9fd` (Light) or
  `rgba(89, 102, 242, 0.24)`. The border is `#5865f2` (Light) or `#5966f2`.
- Other reactions: `hsla(240, 4%, 61%, 0.12)` in all themes.

The Discord colours stay out of the app theme. `themeStyle(theme)` sets them
as CSS custom properties (`--dc-background` and so on) on the chat root. The
chat elements read them with Tailwind arbitrary values, for example
`bg-(--dc-background)`.

## Font

Discord uses gg sans, which is not open source. The chat uses Noto Sans, the
first fallback in Discord's own font stack. `app/layout.tsx` loads it as
`--font-discord` with `preload: false`, so the browser gets the file only when
the chat shows.

The app theme sets `font-medium` to 400. The chat uses `font-[500]` and
`font-[600]` for the Discord weights.

## Content

The conversation is fixed. Only the emoji comes from the editor.

1. "ironbtw" writes "new clan emoji is up, details in the pins" with the emoji
   inline.
2. "ironbtw" sends the emoji alone (jumbo).
3. The jumbo message has one reaction pill for each section, in order, so the
   pills spell the emoji with a 4 px gap between them. A reaction is one emoji,
   so a split emoji needs one pill for each section. The viewer reacted with
   all sections. A click on a pill toggles the viewer's reaction for that
   section only.
4. "skillersam" replies "what are the clan benefits?". The reply line quotes
   the emoji.
5. The message box holds the draft "see" and the emoji.

The avatars are circles with one letter. The chat shows no hover tooltip and
no `:name:` autocomplete, because the emoji has no name.

## State and data flow

```
EmojiEditor ── state ─────────────────────────────▶ EmojiChat
EmojiChat (local: theme, display, spacing, unreacted sections)
  ├─ split toggle ────────────────────────────────▶ setSplit
  ├─ useAssetDataUri(state.asset) ─▶ dataUri         the same cache
  ├─ sections(state) ─▶ Section[]
  ├─ chatSizes(display, sections.length) ─▶ sizes
  └─ each place ─▶ EmojiSection(section, size) ─▶ <svg> ─▶ EmojiArtwork
```

- The split is the editor's `split`, so the "Preview" tab shows the same
  sections.
- The theme (default Dark), the display (default Default) and the spacing
  (default 16 px) are local to the tab and are not part of the emoji. The tab
  stays mounted (`keepMounted`), so they stay when the user changes tab.
- The chat draws one `EmojiArtwork` copy for each section at each of 5 places
  (inline, jumbo, reactions, reply line, message box): 20 copies for the
  4-section example. Each copy
  holds the icon and the background as data URIs. If this becomes slow,
  render the artwork one time in a hidden `<svg>` and point at it with
  `<use href>`.

## Loading

While the icon loads, each emoji place shows a skeleton of its size.
