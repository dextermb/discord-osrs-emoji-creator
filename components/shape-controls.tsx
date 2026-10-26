"use client"

import { useId, type Dispatch } from "react"
import { SquarePlusIcon, Trash2Icon } from "lucide-react"

import { NumberField } from "@/components/number-field"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import type { EditorAction, EditorState, Insets, RectStyle } from "@/lib/editor"

const INSET_SIDES: { side: keyof Insets; label: string }[] = [
  { side: "top", label: "Top" },
  { side: "right", label: "Right" },
  { side: "bottom", label: "Bottom" },
  { side: "left", label: "Left" },
]

const firstValue = (value: number | readonly number[]) =>
  typeof value === "number" ? value : (value[0] ?? 0)

export function ShapeControls({
  rect,
  insets,
  dispatch,
}: {
  rect: EditorState["rect"]
  insets: Insets | null
  dispatch: Dispatch<EditorAction>
}) {
  const setStyle = (style: Partial<RectStyle>) =>
    dispatch({ type: "setRectStyle", style })

  return (
    <FieldSet>
      <FieldLegend className="sr-only">Rectangle</FieldLegend>
      {rect ? (
        <FieldGroup>
          {insets && (
            <FieldSet>
              <FieldLegend variant="label">Inset (px)</FieldLegend>
              <FieldGroup className="grid grid-cols-4 gap-3">
                {INSET_SIDES.map(({ side, label }) => (
                  <NumberField
                    key={side}
                    label={label}
                    value={insets[side]}
                    onValueChange={(value) =>
                      dispatch({ type: "setRectInsets", insets: { [side]: value } })
                    }
                  />
                ))}
              </FieldGroup>
            </FieldSet>
          )}
          <SliderField
            label="Fill"
            sliderLabel="Fill opacity"
            colour={rect.style.fill}
            onColourChange={(fill) => setStyle({ fill })}
            value={Math.round(rect.style.fillOpacity * 100)}
            max={100}
            unit="%"
            onValueChange={(value) => setStyle({ fillOpacity: value / 100 })}
          />
          <SliderField
            label="Border"
            sliderLabel="Border width"
            colour={rect.style.stroke}
            onColourChange={(stroke) => setStyle({ stroke })}
            value={rect.style.strokeWidth}
            max={8}
            unit="px"
            onValueChange={(strokeWidth) => setStyle({ strokeWidth })}
          />
          <SliderField
            label="Shadow"
            sliderLabel="Shadow blur"
            colour={rect.style.shadow}
            onColourChange={(shadow) => setStyle({ shadow })}
            value={rect.style.shadowBlur}
            max={16}
            unit="px"
            onValueChange={(shadowBlur) => setStyle({ shadowBlur })}
          />
          <SliderField
            label="Corner radius"
            sliderLabel="Corner radius"
            value={rect.style.radius}
            max={64}
            unit="px"
            onValueChange={(radius) => setStyle({ radius })}
          />
          <Button
            variant="destructive"
            className="self-start"
            onClick={() => dispatch({ type: "removeRect" })}
          >
            <Trash2Icon data-icon="inline-start" />
            Remove rectangle
          </Button>
        </FieldGroup>
      ) : (
        <Button
          variant="outline"
          className="self-start"
          onClick={() => dispatch({ type: "addRect" })}
        >
          <SquarePlusIcon data-icon="inline-start" />
          Add rectangle
        </Button>
      )}
    </FieldSet>
  )
}

function SliderField({
  label,
  sliderLabel,
  colour,
  onColourChange,
  value,
  max,
  unit,
  onValueChange,
}: {
  label: string
  sliderLabel: string
  colour?: string
  onColourChange?: (colour: string) => void
  value: number
  max: number
  unit: string
  onValueChange: (value: number) => void
}) {
  const id = useId()

  return (
    <Field>
      <FieldLabel htmlFor={colour === undefined ? undefined : id}>
        {label}
      </FieldLabel>
      <div className="flex items-center gap-3">
        {colour !== undefined && (
          <Input
            id={id}
            type="color"
            value={colour}
            aria-label={`${label} colour`}
            className="w-12 shrink-0 p-1"
            onChange={(event) => onColourChange?.(event.target.value)}
          />
        )}
        <Slider
          getAriaLabel={() => sliderLabel}
          value={[value]}
          min={0}
          max={max}
          step={1}
          onValueChange={(next) => onValueChange(firstValue(next))}
        />
        <span className="w-12 shrink-0 text-right text-sm text-muted-foreground tabular-nums">
          {value} {unit}
        </span>
      </div>
    </Field>
  )
}
