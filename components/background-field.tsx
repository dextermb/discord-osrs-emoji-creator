"use client"

import { useId, useState, type ChangeEvent } from "react"
import { ImageUpIcon, Trash2Icon } from "lucide-react"
import { cn } from "cn"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
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
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            buttonVariants({ variant: "outline" }),
            "relative cursor-pointer has-focus-visible:border-foreground has-focus-visible:bg-foreground has-focus-visible:text-background has-disabled:pointer-events-none has-disabled:opacity-50"
          )}
        >
          <ImageUpIcon data-icon="inline-start" />
          Choose image
          <input
            id={id}
            type="file"
            accept="image/*"
            disabled={status === "reading"}
            aria-invalid={failed || undefined}
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={handleFileChange}
          />
        </span>
        {status === "reading" && <Spinner />}
        {background && (
          <Button variant="destructive" onClick={() => onBackgroundChange(null)}>
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
