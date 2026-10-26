"use client"

import { useId, useState, type ChangeEvent } from "react"
import { Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { BACKGROUND_MAX_HEIGHT, type Background } from "@/lib/editor"
import { readImageAsDataUri } from "@/lib/image"

type ReadStatus = "idle" | "reading" | "failed"

export function BackgroundField({
  background,
  onBackgroundChange,
}: {
  background: Background | null
  onBackgroundChange: (background: Background | null) => void
}) {
  const id = useId()
  const [status, setStatus] = useState<ReadStatus>("idle")
  const failed = status === "failed"

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const file = input.files?.[0]
    input.value = ""
    if (!file) return

    setStatus("reading")
    try {
      const dataUri = await readImageAsDataUri(file, BACKGROUND_MAX_HEIGHT)
      onBackgroundChange({ dataUri, name: file.name })
      setStatus("idle")
    } catch {
      setStatus("failed")
    }
  }

  return (
    <Field data-invalid={failed || undefined}>
      <FieldLabel htmlFor={id}>Background image</FieldLabel>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="file"
          accept="image/*"
          disabled={status === "reading"}
          aria-invalid={failed || undefined}
          onChange={handleFileChange}
        />
        {status === "reading" && <Spinner />}
        {background && (
          <Button variant="outline" onClick={() => onBackgroundChange(null)}>
            <Trash2Icon data-icon="inline-start" />
            Remove
          </Button>
        )}
      </div>
      {background && <FieldDescription>{background.name}</FieldDescription>}
      {failed && <FieldError>Could not read this file as an image.</FieldError>}
    </Field>
  )
}
