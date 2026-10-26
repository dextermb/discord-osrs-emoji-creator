"use client"

import { useId, type Dispatch } from "react"
import { Trash2Icon } from "lucide-react"

import { BackgroundField } from "@/components/background-field"
import { IconPicker } from "@/components/icon-picker"
import { PanelHeading } from "@/components/panel-heading"
import { ShapeControls } from "@/components/shape-controls"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  rectInsets,
  type EditorAction,
  type EditorState,
  type Selection,
} from "@/lib/editor"

const MAX_TEXT_LENGTH = 32
const DEFAULT_CANVAS_COLOUR = "#000000"

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
            colour={state.text.colour}
            onColourChange={(colour) => dispatch({ type: "setTextColour", colour })}
          />
        </div>
        <div hidden={selection !== "rect"}>
          <ShapeControls
            rect={state.rect}
            insets={rectInsets(state)}
            dispatch={dispatch}
          />
        </div>
        <FieldGroup hidden={selection !== "background"}>
          <CanvasColourField
            colour={state.canvasColour}
            onColourChange={(colour) => dispatch({ type: "setCanvasColour", colour })}
          />
          <BackgroundField
            background={state.background}
            onBackgroundChange={(background) =>
              dispatch({ type: "setBackground", background })
            }
          />
        </FieldGroup>
      </div>
    </section>
  )
}

function TextField({
  value,
  onValueChange,
  colour,
  onColourChange,
}: {
  value: string
  onValueChange: (text: string) => void
  colour: string
  onColourChange: (colour: string) => void
}) {
  const id = useId()

  return (
    <Field>
      <FieldLabel htmlFor={id}>Text</FieldLabel>
      <div className="flex items-center gap-3">
        <Input
          type="color"
          value={colour}
          aria-label="Text colour"
          className="w-12 shrink-0 p-1"
          onChange={(event) => onColourChange(event.target.value)}
        />
        <Input
          id={id}
          value={value}
          maxLength={MAX_TEXT_LENGTH}
          autoComplete="off"
          placeholder="Add text to the emoji"
          onChange={(event) => onValueChange(event.target.value)}
        />
      </div>
    </Field>
  )
}

function CanvasColourField({
  colour,
  onColourChange,
}: {
  colour: string | null
  onColourChange: (colour: string | null) => void
}) {
  const id = useId()

  return (
    <Field>
      <FieldLabel htmlFor={id}>Canvas colour</FieldLabel>
      <div className="flex flex-wrap items-center gap-3">
        <Input
          id={id}
          type="color"
          value={colour ?? DEFAULT_CANVAS_COLOUR}
          className="w-12 shrink-0 p-1"
          onChange={(event) => onColourChange(event.target.value)}
        />
        {colour ? (
          <Button variant="destructive" onClick={() => onColourChange(null)}>
            <Trash2Icon data-icon="inline-start" />
            Remove
          </Button>
        ) : (
          <FieldDescription>None (transparent)</FieldDescription>
        )}
      </div>
    </Field>
  )
}
