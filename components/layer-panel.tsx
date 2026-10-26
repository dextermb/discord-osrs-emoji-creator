"use client"

import { useId, type Dispatch } from "react"

import { BackgroundField } from "@/components/background-field"
import { IconPicker } from "@/components/icon-picker"
import { PanelHeading } from "@/components/panel-heading"
import { ShapeControls } from "@/components/shape-controls"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  rectInsets,
  type EditorAction,
  type EditorState,
  type Selection,
} from "@/lib/editor"

const MAX_TEXT_LENGTH = 32

const TITLES: Record<Selection, string> = {
  icon: "Icon",
  text: "Text",
  rect: "Rectangle",
  background: "Background",
}

export function LayerPanel({
  state,
  dispatch,
  initialCategorySlug,
}: {
  state: EditorState
  dispatch: Dispatch<EditorAction>
  initialCategorySlug: string | null
}) {
  const { selection } = state

  return (
    <section aria-label="Selected layer" className="flex min-w-0 flex-col">
      <PanelHeading>{selection ? TITLES[selection] : "No selection"}</PanelHeading>
      <div className="p-3">
        {selection === null && (
          <p className="text-sm text-muted-foreground">
            Select a layer, or click an element on the canvas.
          </p>
        )}
        <FieldGroup hidden={selection !== "icon"}>
          <IconPicker
            initialCategorySlug={initialCategorySlug}
            asset={state.asset}
            onAssetChange={(asset) => dispatch({ type: "selectAsset", asset })}
          />
        </FieldGroup>
        <div hidden={selection !== "text"}>
          <TextField
            value={state.text.value}
            onValueChange={(value) => dispatch({ type: "setText", value })}
          />
        </div>
        <div hidden={selection !== "rect"}>
          <ShapeControls
            rect={state.rect}
            insets={rectInsets(state)}
            dispatch={dispatch}
          />
        </div>
        <div hidden={selection !== "background"}>
          <BackgroundField
            background={state.background}
            onBackgroundChange={(background) =>
              dispatch({ type: "setBackground", background })
            }
          />
        </div>
      </div>
    </section>
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
