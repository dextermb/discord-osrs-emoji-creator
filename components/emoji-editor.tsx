"use client"

import { useReducer } from "react"
import { SquarePlusIcon } from "lucide-react"

import { EmojiCanvas } from "@/components/emoji-canvas"
import { LayerList } from "@/components/layer-list"
import { LayerPanel } from "@/components/layer-panel"
import { PanelHeading } from "@/components/panel-heading"
import { Button } from "@/components/ui/button"
import { DEV_ASSET, DEV_CATEGORY_SLUG, DEV_SPRITE_SVG } from "@/lib/dev-fixture"
import { editorReducer, initialEditorState } from "@/lib/editor"
import { cacheAssetSvg } from "@/lib/osrsclans"

const DEV_PRELOAD = process.env.NODE_ENV === "development"

if (DEV_PRELOAD) cacheAssetSvg(DEV_ASSET.key, DEV_SPRITE_SVG)

const INITIAL_CATEGORY_SLUG = DEV_PRELOAD ? DEV_CATEGORY_SLUG : null
const INITIAL_ASSET = DEV_PRELOAD ? DEV_ASSET : null

export function EmojiEditor() {
  const [state, dispatch] = useReducer(
    editorReducer,
    INITIAL_ASSET,
    initialEditorState
  )

  return (
    <div className="flex w-full flex-1 flex-col">
      <section aria-label="Canvas" className="border-b">
        <PanelHeading>Canvas</PanelHeading>
        <EmojiCanvas state={state} dispatch={dispatch} />
      </section>
      <div className="grid flex-1 grid-cols-1 content-start min-[900px]:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] min-[900px]:content-stretch">
        <div className="flex min-w-0 flex-col border-b min-[900px]:border-r min-[900px]:border-b-0">
          <LayerList state={state} dispatch={dispatch} />
          {!state.rect && (
            <div className="p-3">
              <Button variant="outline" onClick={() => dispatch({ type: "addRect" })}>
                <SquarePlusIcon data-icon="inline-start" />
                Add rectangle
              </Button>
            </div>
          )}
        </div>
        <LayerPanel
          state={state}
          dispatch={dispatch}
          initialCategorySlug={INITIAL_CATEGORY_SLUG}
        />
      </div>
    </div>
  )
}
