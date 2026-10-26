# Icon picker

The home page lets the user select an Old School RuneScape icon. The user
selects a category in one combobox, then searches for an icon of that category
in a second combobox. A category holds sprites (rank, skill, boss, map, prayer,
spell and emote icons) or items. The selected icon goes into the emoji canvas
below the comboboxes. See [emoji-canvas.md](./emoji-canvas.md).

All icons come from the public osrsclans.cc API. The app stores nothing on a
server.

## Files

| File                          | Purpose                                                    |
| ----------------------------- | ---------------------------------------------------------- |
| `lib/osrsclans.ts`            | API types, categories, `IconAsset`, fetch functions, cache. |
| `lib/dev-fixture.ts`          | The data and the SVG file of sprite 3063 ("Owner").        |
| `hooks/use-icon-search.ts`    | The debounce, the request abort, and the loading state.    |
| `hooks/use-asset-data-uri.ts` | The icon SVG as a data URI: cache, fetch, and state.       |
| `components/icon-picker.tsx`  | The two comboboxes. The selected asset is a prop.          |
| `components/ui/*`             | shadcn components (`base-nova` style, on Base UI).         |

## The osrsclans.cc API

- Spec: `https://osrsclans.cc/openapi/public.json`. No sign-in is necessary.
- CORS: every response sends `access-control-allow-origin: *`, so the browser
  calls the API directly. A Next.js proxy route gives no benefit.
- `q` must have 2 to 64 characters on each search endpoint. One character gives
  a `422` error. A search `limit` is 1 to 100.

Sprites:

- `GET /api/v1/osrs/sprites?category=&limit=` gives the sprites of the
  categories in id order. `limit` is 1 to 500.
- `GET /api/v1/osrs/sprites/search?q=&category=&limit=` gives the sprites whose
  name contains `q`. `category` can occur more than one time.
- Each frame of a sprite has `classic.sources[]` (WebP at `1x` to `16x` and
  `max`, and one SVG). `classic.svg` is the SVG: pixel art, one square for each
  game pixel.

Items:

- `GET /api/v1/osrs/items/search?q=&limit=` gives items whose name contains `q`.
  There is no category filter. The search leaves out noted and placeholder
  forms.
- There are about 35,000 items. `GET /api/v1/osrs/items` gives them in id order,
  with nameless noted forms between them, so it is not a useful browse list.
- Different items can have the same name. For example, "Dragon scimitar" is
  item 4587 and item 20406.
- `images.sources[]` has WebP at 36 × 32 (`1x`) up to 512 px, and one SVG.
- **The item images are renders of the 3D model, not the in-game images.**
  osrsclans.cc has no true in-game item image. The `1x` WebP is a 36 × 32
  reduction of the render, with soft edges.
- Every item WebP is lossy (`VP8` with an alpha channel). The API has no
  lossless raster item image.
- The item SVG (`images.svg`) is a mesh of flat triangles. Each triangle has a
  0.7-unit outline in its own colour to cover the gaps, sized for 512 px. At
  about 100 px the outline is too thin, and the gaps show as lines (easy to
  see on "Chest"). The `max` WebP (512 px) has smooth shading and no lines.

## Categories

The category combobox uses a static list. The API has no endpoint for the
osrsclans.cc resource pages, and `/sprites/categories` gives 519 raw categories.
The sprite map is the same map that the osrsclans.cc resource pages use:

| Label        | Source  | Resource page             | API categories          |
| ------------ | ------- | ------------------------- | ----------------------- |
| Rank icons   | sprites | `/resources/rank-icons`   | `ClanRankIcons`         |
| Skill icons  | sprites | `/resources/skill-icons`  | `Staticons, Staticons2` |
| Boss icons   | sprites | `/resources/boss-icons`   | `IconBoss25x25`         |
| Map icons    | sprites | `/resources/map-icons`    | `Mapfunction`           |
| Prayer icons | sprites | `/resources/prayer-icons` | `Prayeron`              |
| Spell icons  | sprites | `/resources/spell-icons`  | `Magicon`               |
| Emote icons  | sprites | `/resources/emotes`       | `Emotes`                |
| Item icons   | items   | —                         | —                       |

## Icon assets

`fetchIcons` turns sprites and items into one type, `IconAsset`, so that the
picker, the canvas and the layer list do not need to know the source:

```
IconAsset
  key:     "sprite:3063" | "item:4587"     cache key and React key
  kind:    "sprite" | "item"
  id, name
  detail:  "#4587" for items, null for sprites
  width, height                            natural size (items: 36 × 32)
  sources: ImageSource[]                   WebP sources for the list and items
  svg:     string | null                   the SVG for sprites
```

The canvas image differs by kind:

- **Sprite:** the SVG, as a data URI. It is pixel art, sharp at every size.
- **Item:** the largest WebP (`max`, 512 px wide), as a data URI (about
  15–20 KB). The canvas shows it at 128 px or less, so the lossy compression
  is not visible. It would blur only above 512 px. The item SVG is not used,
  because of the mesh lines (see above).

The data URIs stay in a cache in memory, keyed by `asset.key`.

## Data flow

```
CategoryCombobox ──select──▶ category (state in IconPicker)
                                │  clears the asset, and remounts IconCombobox
                                ▼
IconCombobox input ──▶ query ──(300 ms debounce)──▶ useIconSearch(category, query)
                                                     │ aborts the previous request
                                                     │ sprites, query < 2 → GET /sprites
                                                     │ sprites, query ≥ 2 → GET /sprites/search
                                                     │ items,   query < 2 → no request
                                                     │ items,   query ≥ 2 → GET /items/search
                                                     ▼
                                   { assets, total, isLoading, failed, needsQuery }
                                                     │
IconCombobox list ◀──────────────────────────────────┘
       │ select
       ▼
onAssetChange ──▶ EmojiEditor state (asset) ──▶ EmojiCanvas
```

- A query of 0 or 1 character gives the same request (the browse list), so the
  hook does not send a new request when the user types the first character.
- Each result keeps the key of its request (`category:query`). The hook shows a
  result only when its key is the current key. Thus an old response cannot
  replace a new response.
- `IconCombobox` has `key={category.slug}`. A new category gives a new
  component, so the query and the debounce start again from empty.
- The icon combobox sends no request until the user opens it for the first
  time. Thus a page load with a preselected icon sends no request.

## Workflow

1. The icon combobox is disabled until the user selects a category.
   In development, "Rank icons" and "Owner" are selected when the page opens.
2. A sprite category shows its first 100 icons when the user opens the list. If
   the category has more, the list shows "Showing 100 of N".
3. "Item icons" shows "Type 2 or more letters to search items." until the query
   has 2 letters. Each item option shows its id ("#4587"), because different
   items can have the same name.
4. During a request, the list shows a spinner. With no results, it shows
   "No icons found." If the request fails, it shows "Could not load icons."
5. A selected icon shows in the emoji canvas below the comboboxes.

## Development preload

In development (`process.env.NODE_ENV === "development"`), the page starts with
"Rank icons" and "Owner" (sprite 3063) selected. `lib/dev-fixture.ts` holds the
API data and the SVG file of this sprite. `components/emoji-editor.tsx` puts the
SVG into the data URI cache when the module loads. Thus a page load sends no
request to osrsclans.cc. In production, the page starts empty, and the build
drops the fixture from the client bundle.

## List images

List options use `next/image` with `unoptimized`. The API already gives scaled
WebP files, and the Next.js optimizer can blur pixel art. `next.config.ts`
allows `osrsclans.cc/api/v1/osrs/**` in `images.remotePatterns`. Each option
shows the smallest WebP source with a width of 48 px or more, at 24 px (sharp
on a 2x display).
