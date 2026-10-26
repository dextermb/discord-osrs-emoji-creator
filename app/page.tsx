import { EmojiEditor } from "@/components/emoji-editor"

export default function Home() {
  return (
    <main className="flex min-h-svh flex-col items-center gap-8 px-4 py-16">
      <h1 className="text-2xl font-semibold">OSRS emoji creator</h1>
      <EmojiEditor />
    </main>
  )
}
