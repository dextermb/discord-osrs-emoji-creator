"use client"

import { useId, useMemo, useState, type ChangeEvent, type Dispatch } from "react"
import { Trash2Icon, TypeIcon } from "lucide-react"
import { cn } from "cn"

import { toolClass } from "@/components/emoji-preview"
import { fileButtonClass } from "@/components/background-field"
import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useGoogleFonts } from "@/hooks/use-google-fonts"
import type { FontStatus } from "@/hooks/use-text-font"
import type { EditorAction } from "@/lib/editor"
import {
  DEFAULT_TEXT_FONT,
  FONT_FILE_ACCEPT,
  FontTooLargeError,
  googleFont,
  readFontFile,
  type GoogleFont,
  type TextFont,
} from "@/lib/fonts"

const MAX_RESULTS = 100

export function FontField({
  font,
  status,
  dispatch,
}: {
  font: TextFont
  status: FontStatus
  dispatch: Dispatch<EditorAction>
}) {
  return (
    <>
      <FontCombobox
        font={font}
        status={status}
        onFontChange={(next) => dispatch({ type: "setTextFont", font: next })}
      />
      {font.source === "google" && (
        <WeightField
          weights={font.weights}
          weight={font.weight}
          onWeightChange={(weight) => dispatch({ type: "setFontWeight", weight })}
        />
      )}
      <FontUploadField
        font={font}
        onFontChange={(next) => dispatch({ type: "setTextFont", font: next })}
      />
    </>
  )
}

function FontCombobox({
  font,
  status,
  onFontChange,
}: {
  font: TextFont
  status: FontStatus
  onFontChange: (font: TextFont) => void
}) {
  const id = useId()
  const [query, setQuery] = useState("")
  const [hasOpened, setHasOpened] = useState(false)
  const catalogue = useGoogleFonts(hasOpened)

  const value = useMemo<GoogleFont | null>(
    () =>
      font.source === "google" ? { family: font.family, weights: font.weights } : null,
    [font]
  )
  const needle = query.trim().toLowerCase()
  const matches = catalogue.fonts.filter((option) =>
    option.family.toLowerCase().includes(needle)
  )
  const shown = matches.slice(0, MAX_RESULTS)
  const items =
    value && !shown.some((option) => option.family === value.family)
      ? [...shown, value]
      : shown

  return (
    <Field data-invalid={status.failed || undefined}>
      <FieldLabel htmlFor={id}>Font</FieldLabel>
      <Combobox
        items={items}
        filter={null}
        itemToStringLabel={(option: GoogleFont) => option.family}
        isItemEqualToValue={(item, selected) => item.family === selected.family}
        value={value}
        onValueChange={(next) => {
          if (next) onFontChange(googleFont(next))
          setQuery("")
        }}
        onInputValueChange={(nextQuery, { reason }) => {
          if (reason !== "item-press") setQuery(nextQuery)
        }}
        onOpenChange={(open) => {
          if (open) setHasOpened(true)
        }}
      >
        <ComboboxInput
          id={id}
          placeholder="Search Google Fonts"
          aria-invalid={status.failed || undefined}
        />
        <ComboboxContent aria-busy={catalogue.isLoading || undefined}>
          {catalogue.isLoading && (
            <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
              <Spinner />
              Loading fonts…
            </div>
          )}
          {!catalogue.isLoading && (
            <ComboboxEmpty>
              {catalogue.failed ? "Could not load the font list." : "No fonts found."}
            </ComboboxEmpty>
          )}
          <ComboboxList>
            {(option: GoogleFont) => (
              <ComboboxItem key={option.family} value={option}>
                <span className="truncate">{option.family}</span>
              </ComboboxItem>
            )}
          </ComboboxList>
          {matches.length > shown.length && (
            <p className="border-t px-2 py-1.5 text-xs text-muted-foreground">
              Showing {shown.length} of {matches.length}. Type to narrow the results.
            </p>
          )}
        </ComboboxContent>
      </Combobox>
      {status.isLoading && (
        <FieldDescription className="flex items-center gap-2">
          <Spinner />
          Loading font…
        </FieldDescription>
      )}
      {status.failed && <FieldError>Could not load the font.</FieldError>}
    </Field>
  )
}

function WeightField({
  weights,
  weight,
  onWeightChange,
}: {
  weights: number[]
  weight: number
  onWeightChange: (weight: number) => void
}) {
  const id = useId()

  return (
    <Field>
      <FieldLabel id={id}>Weight</FieldLabel>
      <ToggleGroup
        aria-labelledby={id}
        spacing={0}
        className="flex-wrap"
        value={[String(weight)]}
        onValueChange={([next]) => next && onWeightChange(Number(next))}
      >
        {weights.map((option) => (
          <ToggleGroupItem
            key={option}
            value={String(option)}
            className={cn(toolClass, "tabular-nums")}
          >
            {option}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Field>
  )
}

type ReadStatus = "idle" | "reading" | "too-large" | "failed"

const READ_ERRORS: Partial<Record<ReadStatus, string>> = {
  "too-large": "The font file is larger than 5 MB.",
  failed: "Could not read the font file.",
}

function FontUploadField({
  font,
  onFontChange,
}: {
  font: TextFont
  onFontChange: (font: TextFont) => void
}) {
  const id = useId()
  const [status, setStatus] = useState<ReadStatus>("idle")
  const error = READ_ERRORS[status]

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const file = input.files?.[0]
    input.value = ""
    if (!file) return

    setStatus("reading")
    try {
      onFontChange(await readFontFile(file))
      setStatus("idle")
    } catch (caught) {
      setStatus(caught instanceof FontTooLargeError ? "too-large" : "failed")
    }
  }

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>Upload font</FieldLabel>
      <div className="flex flex-wrap items-center gap-2">
        <span className={fileButtonClass}>
          <TypeIcon data-icon="inline-start" />
          Choose font
          <input
            id={id}
            type="file"
            accept={FONT_FILE_ACCEPT}
            disabled={status === "reading"}
            aria-invalid={error ? true : undefined}
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={handleFileChange}
          />
        </span>
        {status === "reading" && <Spinner />}
        {font.source === "upload" && (
          <Button variant="destructive" onClick={() => onFontChange(DEFAULT_TEXT_FONT)}>
            <Trash2Icon data-icon="inline-start" />
            Remove
          </Button>
        )}
      </div>
      <FieldDescription>
        {font.source === "upload" ? font.name : "TTF, OTF, WOFF or WOFF2, up to 5 MB."}
      </FieldDescription>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}
