"use client"

import { useId, useReducer } from "react"

import { BackgroundField } from "@/components/background-field"
import { EmojiCanvas } from "@/components/emoji-canvas"
import { IconPicker } from "@/components/icon-picker"
import { LayerList } from "@/components/layer-list"
import { ShapeControls } from "@/components/shape-controls"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { DEV_ASSET, DEV_CATEGORY_SLUG, DEV_SPRITE_SVG } from "@/lib/dev-fixture"
import { editorReducer, initialEditorState, rectInsets } from "@/lib/editor"
import { cacheAssetSvg } from "@/lib/osrsclans"

const MAX_TEXT_LENGTH = 32

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
    <div className="flex w-full max-w-xl flex-col gap-8">
      <FieldGroup>
        <IconPicker
          initialCategorySlug={INITIAL_CATEGORY_SLUG}
          asset={state.asset}
          onAssetChange={(asset) => dispatch({ type: "selectAsset", asset })}
        />
        <TextField
          value={state.text.value}
          onValueChange={(value) => dispatch({ type: "setText", value })}
        />
        <BackgroundField
          background={state.background}
          onBackgroundChange={(background) =>
            dispatch({ type: "setBackground", background })
          }
        />
      </FieldGroup>
      <EmojiCanvas state={state} dispatch={dispatch} />
      <LayerList state={state} dispatch={dispatch} />
      <ShapeControls
        rect={state.rect}
        insets={rectInsets(state)}
        dispatch={dispatch}
      />
    </div>
  )
}

function TextField({
  value,
  onValueChange,
}: {
  value: string
  onValueChange: (text: string) => void
}) {
  const id = useId()

  return (
    <Field>
      <FieldLabel htmlFor={id}>Text</FieldLabel>
      <Input
        id={id}
        value={value}
        maxLength={MAX_TEXT_LENGTH}
        autoComplete="off"
        placeholder="Add text to the emoji"
        onChange={(event) => onValueChange(event.target.value)}
      />
    </Field>
  )
}
