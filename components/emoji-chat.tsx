"use client"

import { useId, useState, type Dispatch } from "react"
import { CirclePlusIcon, HashIcon } from "lucide-react"

import {
  DiscordMessage,
  DiscordReaction,
  type Author,
} from "@/components/discord-message"
import { SplitToggle, toolClass } from "@/components/emoji-preview"
import { EmojiSection } from "@/components/emoji-section"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useAssetDataUri } from "@/hooks/use-asset-data-uri"
import {
  chatSizes,
  DEFAULT_GROUP_SPACING,
  DEFAULT_THEME,
  DISCORD_THEMES,
  GROUP_SPACINGS,
  MESSAGE_DISPLAYS,
  themeStyle,
  type DiscordTheme,
  type MessageDisplay,
} from "@/lib/discord"
import {
  sections,
  type EditorAction,
  type EditorState,
  type Section,
} from "@/lib/editor"

const POSTER: Author = { name: "ironbtw", colour: "#e67e22", avatar: "#e67e22" }
const REPLIER: Author = { name: "skillersam", colour: "#1abc9c", avatar: "#1abc9c" }
const OTHER_REACTIONS = 4

export function EmojiChat({
  state,
  dispatch,
}: {
  state: EditorState
  dispatch: Dispatch<EditorAction>
}) {
  const { dataUri, isLoading } = useAssetDataUri(state.asset)
  const [theme, setTheme] = useState<DiscordTheme>(DEFAULT_THEME)
  const [display, setDisplay] = useState<MessageDisplay>("default")
  const [spacing, setSpacing] = useState(DEFAULT_GROUP_SPACING)
  const [reacted, setReacted] = useState(true)
  const emojiSections = sections(state)
  const sizes = chatSizes(display, emojiSections.length)

  const emoji = (size: number, shown: Section[] = emojiSections) => (
    <EmojiRun
      state={state}
      dataUri={dataUri}
      isLoading={isLoading}
      sections={shown}
      size={size}
    />
  )

  const reactions = (
    <div className="flex flex-wrap pt-0.5 pb-1.5 indent-0">
      <DiscordReaction
        own={reacted}
        count={OTHER_REACTIONS + (reacted ? 1 : 0)}
        label={`Emoji reaction, ${OTHER_REACTIONS + (reacted ? 1 : 0)} reactions${reacted ? ", you reacted" : ""}`}
        onPressedChange={setReacted}
      >
        {emoji(sizes.reaction, emojiSections.slice(0, 1))}
      </DiscordReaction>
    </div>
  )

  const sizeRows = [
    { label: "Emoji per message", value: String(emojiSections.length) },
    { label: "Inline", value: `${sizes.inline} px` },
    {
      label: "Jumbo",
      value: sizes.jumboOn
        ? `${sizes.jumbo} px`
        : display === "compact"
          ? `${sizes.jumbo} px (off in compact)`
          : `${sizes.jumbo} px (more than 30 emoji)`,
    },
    { label: "Reaction", value: `${sizes.reaction} px` },
    { label: "Reply", value: `${sizes.reply} px` },
  ]

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <SplitToggle split={state.split} dispatch={dispatch} />
        <ChatOption
          label="Theme"
          value={theme}
          options={DISCORD_THEMES.map(({ theme: value, label }) => ({ value, label }))}
          onValueChange={setTheme}
        />
        <ChatOption
          label="Display"
          value={display}
          options={MESSAGE_DISPLAYS.map(({ display: value, label }) => ({ value, label }))}
          onValueChange={setDisplay}
        />
        <ChatOption
          label="Spacing"
          value={String(spacing)}
          options={GROUP_SPACINGS.map((gap) => ({ value: String(gap), label: `${gap} px` }))}
          onValueChange={(next) => setSpacing(Number(next))}
        />
      </div>
      <div className="flex flex-wrap items-start gap-6">
        <div
          style={themeStyle(theme)}
          className="min-w-0 flex-[1_1_560px] border bg-(--dc-background) font-(family-name:--font-discord) text-[16px]/[22px] tracking-normal text-(--dc-text) normal-case md:max-w-[760px]"
        >
          <div className="flex h-12 items-center gap-2 border-b border-(--dc-border) px-4">
            <HashIcon aria-hidden="true" className="size-5 text-(--dc-muted)" />
            <h2 className="text-[16px] font-[600] text-(--dc-strong)">clan-chat</h2>
          </div>
          <ol aria-label="Messages" className="pb-2">
            <DiscordMessage
              display={display}
              author={POSTER}
              time="21:04"
              groupStart
              spacing={spacing}
            >
              new clan emoji is up, details in the pins {emoji(sizes.inline)}
            </DiscordMessage>
            <DiscordMessage
              display={display}
              author={POSTER}
              time="21:04"
              groupStart={false}
              spacing={spacing}
              reactions={reactions}
            >
              {emoji(sizes.jumbo)}
            </DiscordMessage>
            <DiscordMessage
              display={display}
              author={REPLIER}
              time="21:06"
              groupStart
              spacing={spacing}
              reply={{ author: POSTER, content: emoji(sizes.reply) }}
            >
              what are the clan benefits?
            </DiscordMessage>
          </ol>
          <div className="mx-4 mt-2 mb-6 flex min-h-14 items-center gap-4 rounded-[8px] border border-(--dc-border) bg-(--dc-input) px-4">
            <CirclePlusIcon aria-hidden="true" className="size-6 shrink-0 text-(--dc-muted)" />
            <div
              role="textbox"
              aria-readonly="true"
              aria-label="Message #clan-chat"
              className="flex min-w-0 items-center"
            >
              see&nbsp;
              {emoji(sizes.inline)}
              <span aria-hidden="true" className="ml-px block h-[22px] w-px bg-(--dc-text)" />
            </div>
          </div>
        </div>
        <dl className="grid grid-cols-[auto_auto] content-start gap-x-6 gap-y-2">
          {sizeRows.map(({ label, value }) => (
            <div key={label} className="contents">
              <dt className="text-sm tracking-label text-muted-foreground uppercase">{label}</dt>
              <dd className="text-sm">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}

function EmojiRun({
  state,
  dataUri,
  isLoading,
  sections,
  size,
}: {
  state: EditorState
  dataUri: string | null
  isLoading: boolean
  sections: Section[]
  size: number
}) {
  return (
    <span className="inline-flex shrink-0 align-bottom indent-0">
      {sections.map((section) =>
        isLoading ? (
          <Skeleton key={section.x} style={{ width: size, height: size }} />
        ) : (
          <EmojiSection
            key={section.x}
            state={state}
            dataUri={dataUri}
            section={section}
            size={size}
          />
        )
      )}
    </span>
  )
}

function ChatOption<Value extends string>({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string
  value: Value
  options: { value: Value; label: string }[]
  onValueChange: (value: Value) => void
}) {
  const labelId = useId()

  return (
    <div className="flex items-center gap-2">
      <span id={labelId} className="text-sm tracking-label text-muted-foreground uppercase">
        {label}
      </span>
      <ToggleGroup
        aria-labelledby={labelId}
        spacing={0}
        value={[value]}
        onValueChange={([next]) => next && onValueChange(next as Value)}
      >
        {options.map((option) => (
          <ToggleGroupItem key={option.value} value={option.value} className={toolClass}>
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
