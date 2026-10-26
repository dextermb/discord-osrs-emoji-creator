"use client"

import { useReducer } from "react"
import { SquarePlusIcon } from "lucide-react"
import { cn } from "cn"

import { EmojiCanvas } from "@/components/emoji-canvas"
import { EmojiPreview } from "@/components/emoji-preview"
import { LayerList } from "@/components/layer-list"
import { LayerPanel } from "@/components/layer-panel"
import { panelHeadingClass } from "@/components/panel-heading"
import { TextMeasure } from "@/components/text-measure"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
      <TextMeasure value={state.text.value} dispatch={dispatch} />
      <Tabs defaultValue="canvas" className="border-b">
        <TabsList aria-label="View" className={cn(panelHeadingClass, "justify-start gap-0 p-0")}>
          <TabsTrigger value="canvas">Canvas</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        <TabsContent value="canvas">
          <EmojiCanvas state={state} dispatch={dispatch} />
        </TabsContent>
        <TabsContent value="preview">
          <EmojiPreview state={state} dispatch={dispatch} />
        </TabsContent>
      </Tabs>
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
