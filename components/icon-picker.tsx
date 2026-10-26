"use client"

import { useId, useState } from "react"
import Image from "next/image"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { useIconSearch } from "@/hooks/use-icon-search"
import {
  assetSourceAtLeast,
  ICON_CATEGORIES,
  MIN_SEARCH_LENGTH,
  type IconAsset,
  type IconCategory,
} from "@/lib/osrsclans"

const THUMBNAIL_MIN_WIDTH = 48

export function IconPicker({
  initialCategorySlug,
  asset,
  onAssetChange,
}: {
  initialCategorySlug: string | null
  asset: IconAsset | null
  onAssetChange: (asset: IconAsset | null) => void
}) {
  const [category, setCategory] = useState(
    () =>
      ICON_CATEGORIES.find((category) => category.slug === initialCategorySlug) ??
      null
  )

  return (
    <>
      <CategoryCombobox
        value={category}
        onValueChange={(nextCategory) => {
          setCategory(nextCategory)
          onAssetChange(null)
        }}
      />
      <IconCombobox
        key={category?.slug ?? "none"}
        category={category}
        value={asset}
        onValueChange={onAssetChange}
      />
    </>
  )
}

function CategoryCombobox({
  value,
  onValueChange,
}: {
  value: IconCategory | null
  onValueChange: (category: IconCategory | null) => void
}) {
  const id = useId()

  return (
    <Field>
      <FieldLabel htmlFor={id}>Category</FieldLabel>
      <Combobox
        items={ICON_CATEGORIES}
        itemToStringLabel={(category: IconCategory) => category.label}
        isItemEqualToValue={(item, selected) => item.slug === selected.slug}
        value={value}
        onValueChange={onValueChange}
      >
        <ComboboxInput id={id} placeholder="Select a category" />
        <ComboboxContent>
          <ComboboxEmpty>No categories found.</ComboboxEmpty>
          <ComboboxList>
            {(category: IconCategory) => (
              <ComboboxItem key={category.slug} value={category}>
                {category.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  )
}

function IconCombobox({
  category,
  value,
  onValueChange,
}: {
  category: IconCategory | null
  value: IconAsset | null
  onValueChange: (asset: IconAsset | null) => void
}) {
  const id = useId()
  const [query, setQuery] = useState("")
  const [hasOpened, setHasOpened] = useState(false)
  const { assets, total, isLoading, failed, needsQuery } = useIconSearch(
    category,
    query,
    hasOpened
  )

  const items =
    value && !assets.some((asset) => asset.key === value.key)
      ? [...assets, value]
      : assets
  const hasMore = !isLoading && total > assets.length

  return (
    <Field data-disabled={!category || undefined}>
      <FieldLabel htmlFor={id}>Icon</FieldLabel>
      <Combobox
        items={items}
        filter={null}
        itemToStringLabel={(asset: IconAsset) => asset.name}
        isItemEqualToValue={(item, selected) => item.key === selected.key}
        value={value}
        onValueChange={(nextAsset) => {
          onValueChange(nextAsset)
          setQuery("")
        }}
        onInputValueChange={(nextQuery, { reason }) => {
          if (reason !== "item-press") setQuery(nextQuery)
        }}
        onOpenChange={(open) => {
          if (open) setHasOpened(true)
        }}
        disabled={!category}
      >
        <ComboboxInput
          id={id}
          placeholder={
            category
              ? `Search ${category.label.toLowerCase()}`
              : "Select a category first"
          }
          disabled={!category}
        />
        <ComboboxContent aria-busy={isLoading || undefined}>
          {isLoading && (
            <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
              <Spinner />
              Loading icons…
            </div>
          )}
          {needsQuery && (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">
              Type {MIN_SEARCH_LENGTH} or more letters to search items.
            </p>
          )}
          {!isLoading && !needsQuery && (
            <ComboboxEmpty>
              {failed ? "Could not load icons." : "No icons found."}
            </ComboboxEmpty>
          )}
          <ComboboxList>
            {(asset: IconAsset) => (
              <ComboboxItem key={asset.key} value={asset}>
                <AssetImage
                  asset={asset}
                  minWidth={THUMBNAIL_MIN_WIDTH}
                  className="size-6 object-contain"
                />
                <span className="truncate">{asset.name}</span>
                {asset.detail && (
                  <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                    {asset.detail}
                  </span>
                )}
              </ComboboxItem>
            )}
          </ComboboxList>
          {hasMore && (
            <p className="border-t px-2 py-1.5 text-xs text-muted-foreground">
              Showing {assets.length} of {total}. Type to narrow the results.
            </p>
          )}
        </ComboboxContent>
      </Combobox>
    </Field>
  )
}

function AssetImage({
  asset,
  minWidth,
  className,
}: {
  asset: IconAsset
  minWidth: number
  className?: string
}) {
  const source = assetSourceAtLeast(asset, minWidth)
  if (!source) return null

  return (
    <Image
      src={source.file}
      width={source.width}
      height={source.height}
      alt=""
      unoptimized
      className={className}
    />
  )
}
