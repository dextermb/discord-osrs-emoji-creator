"use client"

import type { Dispatch } from "react"
import {
  ImageIcon,
  LockIcon,
  LockOpenIcon,
  SquareIcon,
  TypeIcon,
  type LucideIcon,
} from "lucide-react"

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
import type { EditorAction, EditorState, ElementId } from "@/lib/editor"

type Layer = {
  id: ElementId
  label: string
  detail: string | null
  icon: LucideIcon
}

function layersOf(state: EditorState): Layer[] {
  const layers: Layer[] = []
  if (state.text.value) {
    layers.push({ id: "text", label: "Text", detail: state.text.value, icon: TypeIcon })
  }
  if (state.asset) {
    const { name, detail } = state.asset
    layers.push({
      id: "icon",
      label: "Icon",
      detail: detail ? `${name} ${detail}` : name,
      icon: ImageIcon,
    })
  }
  if (state.rect) {
    layers.push({ id: "rect", label: "Rectangle", detail: null, icon: SquareIcon })
  }
  return layers
}

export function LayerList({
  state,
  dispatch,
}: {
  state: EditorState
  dispatch: Dispatch<EditorAction>
}) {
  const layers = layersOf(state)
  if (layers.length === 0) return null

  return (
    <FieldSet>
      <FieldLegend>Layers</FieldLegend>
      <ItemGroup className="gap-2">
        {layers.map((layer) => {
          const locked = state.locked[layer.id]
          const LayerIcon = layer.icon
          const LockStateIcon = locked ? LockIcon : LockOpenIcon

          return (
            <Item
              key={layer.id}
              size="sm"
              variant={state.selection === layer.id ? "muted" : "outline"}
              className="relative"
            >
              <ItemMedia variant="icon">
                <LayerIcon />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>
                  <button
                    type="button"
                    disabled={locked}
                    className="text-left outline-none after:absolute after:inset-0 focus-visible:underline disabled:cursor-not-allowed"
                    onClick={() => dispatch({ type: "select", selection: layer.id })}
                  >
                    {layer.label}
                  </button>
                </ItemTitle>
                {layer.detail && (
                  <ItemDescription className="truncate">{layer.detail}</ItemDescription>
                )}
              </ItemContent>
              <ItemActions className="relative">
                <Toggle
                  size="sm"
                  variant="outline"
                  aria-label={`Lock ${layer.label.toLowerCase()}`}
                  pressed={locked}
                  onPressedChange={(pressed) =>
                    dispatch({ type: "setLocked", element: layer.id, locked: pressed })
                  }
                >
                  <LockStateIcon />
                </Toggle>
              </ItemActions>
            </Item>
          )
        })}
      </ItemGroup>
    </FieldSet>
  )
}
