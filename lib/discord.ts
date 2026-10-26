import type { CSSProperties } from "react"

export type DiscordTheme = "light" | "ash" | "dark" | "onyx"

export type MessageDisplay = "default" | "compact"

type ThemeTokens = {
  background: string
  text: string
  strong: string
  time: string
  muted: string
  border: string
  input: string
  spine: string
  count: string
  ownBackground: string
  ownBorder: string
  ownCount: string
}

const OWN_REACTION_DARK = "rgba(89, 102, 242, 0.24)"
const OWN_BORDER_DARK = "#5966f2"
const DIVIDER = "hsla(240, 4%, 61%, 0.2)"

export const REACTION_BACKGROUND = "hsla(240, 4%, 61%, 0.12)"

export const DISCORD_THEMES: { theme: DiscordTheme; label: string; tokens: ThemeTokens }[] = [
  {
    theme: "light",
    label: "Light",
    tokens: {
      background: "#fbfbfb",
      text: "#2e2e33",
      strong: "#29292e",
      time: "#70707a",
      muted: "#6b6e75",
      border: DIVIDER,
      input: "#ffffff",
      spine: "#c4c7c9",
      count: "#595963",
      ownBackground: "#e7e9fd",
      ownBorder: "#5865f2",
      ownCount: "#4752c4",
    },
  },
  {
    theme: "ash",
    label: "Ash",
    tokens: {
      background: "#333338",
      text: "#f2f2f5",
      strong: "#ffffff",
      time: "#9e9ea6",
      muted: "#ababb3",
      border: DIVIDER,
      input: "#383b40",
      spine: "#595963",
      count: "#c4c7c9",
      ownBackground: OWN_REACTION_DARK,
      ownBorder: OWN_BORDER_DARK,
      ownCount: "#dee3ff",
    },
  },
  {
    theme: "dark",
    label: "Dark",
    tokens: {
      background: "#1a1a1e",
      text: "#f0f0f2",
      strong: "#fafafa",
      time: "#82828a",
      muted: "#96969e",
      border: DIVIDER,
      input: "#212426",
      spine: "#474752",
      count: "#ababb3",
      ownBackground: OWN_REACTION_DARK,
      ownBorder: OWN_BORDER_DARK,
      ownCount: "#bac7ff",
    },
  },
  {
    theme: "onyx",
    label: "Onyx",
    tokens: {
      background: "#000000",
      text: "#d4d6d9",
      strong: "#dbdbde",
      time: "#73737d",
      muted: "#82828a",
      border: DIVIDER,
      input: "#101013",
      spine: "#383840",
      count: "#96969e",
      ownBackground: OWN_REACTION_DARK,
      ownBorder: OWN_BORDER_DARK,
      ownCount: "#99adff",
    },
  },
]

export const DEFAULT_THEME: DiscordTheme = "dark"

export const MESSAGE_DISPLAYS: { display: MessageDisplay; label: string }[] = [
  { display: "default", label: "Default" },
  { display: "compact", label: "Compact" },
]

export const GROUP_SPACINGS = [0, 4, 8, 16, 24]

export const DEFAULT_GROUP_SPACING = 16

export const MAX_JUMBO_EMOJI = 30

export const DISCORD_SIZES = {
  inline: 22,
  jumbo: 48,
  reaction: 20,
  reply: 17.5,
}

export type ChatSizes = typeof DISCORD_SIZES & { jumboOn: boolean }

export function chatSizes(display: MessageDisplay, count: number): ChatSizes {
  const jumboOn = display === "default" && count <= MAX_JUMBO_EMOJI
  return {
    ...DISCORD_SIZES,
    jumbo: jumboOn ? DISCORD_SIZES.jumbo : DISCORD_SIZES.inline,
    jumboOn,
  }
}

export function groupGap(spacing: number) {
  return spacing + 1
}

export function themeStyle(theme: DiscordTheme): CSSProperties {
  const { tokens } = DISCORD_THEMES.find((entry) => entry.theme === theme)!
  return {
    "--dc-background": tokens.background,
    "--dc-text": tokens.text,
    "--dc-strong": tokens.strong,
    "--dc-time": tokens.time,
    "--dc-muted": tokens.muted,
    "--dc-border": tokens.border,
    "--dc-input": tokens.input,
    "--dc-spine": tokens.spine,
    "--dc-count": tokens.count,
    "--dc-own-background": tokens.ownBackground,
    "--dc-own-border": tokens.ownBorder,
    "--dc-own-count": tokens.ownCount,
    "--dc-reaction": REACTION_BACKGROUND,
  } as CSSProperties
}
