import type { ReactNode } from "react"

import { groupGap, type MessageDisplay } from "@/lib/discord"

export type Author = {
  name: string
  colour: string | null
  avatar: string
}

export type Reply = {
  author: Author
  content: ReactNode
}

const nameColour = (author: Author) => author.colour ?? "var(--dc-strong)"

export function DiscordMessage({
  display,
  author,
  time,
  groupStart,
  spacing,
  reply,
  reactions,
  children,
}: {
  display: MessageDisplay
  author: Author
  time: string
  groupStart: boolean
  spacing: number
  reply?: Reply
  reactions?: ReactNode
  children: ReactNode
}) {
  const marginTop = groupStart ? groupGap(spacing) : 0

  if (display === "compact") {
    return (
      <li className="py-0.5 pr-6 pl-20 -indent-16" style={{ marginTop }}>
        {reply && <ReplyLine reply={reply} />}
        <time className="mr-1.5 inline-block w-[50px] indent-0 text-right text-[11px] text-(--dc-muted)">
          {time}
        </time>
        <span className="font-[500]" style={{ color: nameColour(author) }}>
          {author.name}
        </span>{" "}
        {children}
        {reactions}
      </li>
    )
  }

  if (!groupStart) {
    return (
      <li className="py-0.5 pr-6 pl-[72px]">
        {children}
        {reactions}
      </li>
    )
  }

  return (
    <li className="relative min-h-11 py-0.5 pr-6 pl-[72px]" style={{ marginTop }}>
      {reply && (
        <>
          <span
            aria-hidden="true"
            className="absolute top-[11px] left-9 h-3 w-[30px] rounded-tl-[6px] border-t-2 border-l-2 border-(--dc-spine)"
          />
          <ReplyLine reply={reply} />
        </>
      )}
      <span
        aria-hidden="true"
        className="absolute left-4 flex size-10 items-center justify-center rounded-full font-[600] text-white"
        style={{ top: reply ? 26 : 4, background: author.avatar }}
      >
        {author.name.charAt(0).toUpperCase()}
      </span>
      <h3 className="text-[16px]/[22px] font-[500]">
        <span style={{ color: nameColour(author) }}>{author.name}</span>
        <time className="ml-1 text-[12px] font-[500] text-(--dc-time)">{time}</time>
      </h3>
      <div>{children}</div>
      {reactions}
    </li>
  )
}

function ReplyLine({ reply }: { reply: Reply }) {
  return (
    <div className="mb-1 flex items-center gap-1 overflow-hidden indent-0 text-[14px]/[18px] whitespace-nowrap text-(--dc-muted)">
      <span
        aria-hidden="true"
        className="size-4 shrink-0 rounded-full"
        style={{ background: reply.author.avatar }}
      />
      <span className="font-[500] text-(--dc-strong) opacity-64">@{reply.author.name}</span>
      {reply.content}
    </div>
  )
}

export function DiscordReaction({
  own,
  count,
  label,
  onPressedChange,
  children,
}: {
  own: boolean
  count: number
  label: string
  onPressedChange: (own: boolean) => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={own}
      onClick={() => onPressedChange(!own)}
      className="mr-1 mb-1 inline-flex items-center rounded-[8px] border px-1.5 py-0.5 indent-0"
      style={{
        background: own ? "var(--dc-own-background)" : "var(--dc-reaction)",
        borderColor: own ? "var(--dc-own-border)" : "transparent",
      }}
    >
      <span className="my-0.5">{children}</span>
      <span
        className="ml-1.5 text-[14px] font-[600]"
        style={{ color: own ? "var(--dc-own-count)" : "var(--dc-count)" }}
      >
        {count}
      </span>
    </button>
  )
}
