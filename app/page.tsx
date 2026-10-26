import { EmojiEditor } from "@/components/emoji-editor"

export default function Home() {
  return (
    <main className="flex min-h-svh flex-col">
      <header className="border-b px-3 py-3">
        <h1 className="text-sm tracking-label uppercase">OSRS emoji creator</h1>
      </header>
      <EmojiEditor />
    </main>
  )
}
