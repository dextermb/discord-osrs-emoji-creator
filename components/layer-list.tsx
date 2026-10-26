"use client"

import type { Dispatch } from "react"
import {
  FrameIcon,
  ImageIcon,
  LockIcon,
  LockOpenIcon,
  SquareIcon,
  TypeIcon,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"

import { panelHeadingClass } from "@/components/panel-heading"
import { FieldLegend, FieldSet } from "@/components/ui/field"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Toggle } from "@/components/ui/toggle"
import {
  CANVAS_HEIGHT,
  canvasBox,
  type EditorAction,
  type EditorState,
  type ElementId,
  type Selection,
} from "@/lib/editor"

type Layer = {
  id: Selection
  label: string
  detail: string | null
  icon: LucideIcon
  lock: ElementId | null
}

function layersOf(state: EditorState): Layer[] {
  const { asset, text, rect } = state
  const layers: Layer[] = [
    {
      id: "text",
      label: "Text",
      detail: text.value || "No text",
      icon: TypeIcon,
      lock: text.value ? "text" : null,
    },
    {
      id: "icon",
      label: "Icon",
      detail: asset
        ? asset.detail
          ? `${asset.name} ${asset.detail}`
          : asset.name
        : "No icon",
      icon: ImageIcon,
      lock: asset ? "icon" : null,
    },
  ]
  if (rect) {
    layers.push({ id: "rect", label: "Rectangle", detail: null, icon: SquareIcon, lock: "rect" })
  }
  layers.push({
    id: "canvas",
    label: "Canvas",
    detail: `${canvasBox(state).width} × ${CANVAS_HEIGHT} px`,
    icon: FrameIcon,
    lock: null,
  })
  return layers
}

export function LayerList({
  state,
  dispatch,
}: {
  state: EditorState
  dispatch: Dispatch<EditorAction>
}) {
  return (
    <FieldSet className="gap-0">
      <FieldLegend className={cn(panelHeadingClass, "mb-0")}>Layers</FieldLegend>
      <ItemGroup className="gap-0">
        {layersOf(state).map((layer) => {
          const { lock } = layer
          const locked = lock !== null && state.locked[lock]
          const selected = state.selection === layer.id
          const LayerIcon = layer.icon
          const LockStateIcon = locked ? LockIcon : LockOpenIcon

          return (
            <Item
              key={layer.id}
              role="listitem"
              size="sm"
              data-selected={selected || undefined}
              className="relative rounded-none border-0 border-b border-border/50 transition-colors hover:bg-foreground hover:text-background has-focus-visible:bg-foreground has-focus-visible:text-background data-selected:bg-foreground data-selected:text-background"
            >
              <ItemMedia variant="icon">
                <LayerIcon />
              </ItemMedia>
              <ItemContent className="min-w-0">
                <ItemTitle>
                  <button
                    type="button"
                    disabled={locked}
                    aria-current={selected || undefined}
                    className="text-left tracking-label uppercase outline-none after:absolute after:inset-0 disabled:cursor-not-allowed"
                    onClick={() => dispatch({ type: "select", selection: layer.id })}
                  >
                    {layer.label}
                  </button>
                </ItemTitle>
                {layer.detail && (
                  <ItemDescription className="truncate group-hover/item:text-background group-has-focus-visible/item:text-background group-data-selected/item:text-background">
                    {layer.detail}
                  </ItemDescription>
                )}
              </ItemContent>
              {lock && (
                <ItemActions className="relative">
                  <Toggle
                    size="sm"
                    aria-label={`Lock ${layer.label.toLowerCase()}`}
                    pressed={locked}
                    onPressedChange={(pressed) =>
                      dispatch({
                        type: "setLocked",
                        element: lock,
                        locked: pressed,
                      })
                    }
                    className="hover:bg-transparent hover:text-current aria-pressed:border aria-pressed:border-current"
                  >
                    <LockStateIcon />
                  </Toggle>
                </ItemActions>
              )}
            </Item>
          )
        })}
      </ItemGroup>
    </FieldSet>
  )
}
