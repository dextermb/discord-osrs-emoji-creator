"use client"

import { useId, useState } from "react"

import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function NumberField({
  label,
  value,
  min,
  max,
  onValueChange,
}: {
  label: string
  value: number
  min?: number
  max?: number
  onValueChange: (value: number) => void
}) {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)
  const draftNumber = draft === null || draft.trim() === "" ? NaN : Number(draft)
  const draftIsCurrent =
    draft !== null &&
    (!Number.isFinite(draftNumber) ||
      Math.round(draftNumber) === Math.round(value))

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        step={1}
        min={min}
        max={max}
        value={draftIsCurrent ? draft : String(Math.round(value))}
        onChange={(event) => {
          const text = event.target.value
          setDraft(text)
          const next = Number(text)
          if (text.trim() !== "" && Number.isFinite(next)) onValueChange(next)
        }}
        onBlur={() => setDraft(null)}
      />
    </Field>
  )
}
