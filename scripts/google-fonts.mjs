import { readFileSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const source = require.resolve("next/dist/compiled/@next/font/dist/google/font-data.json")
const target = new URL("../lib/google-fonts.json", import.meta.url)

const fontData = JSON.parse(readFileSync(source, "utf8"))

const families = Object.entries(fontData)
  .filter(([, font]) => font.styles.includes("normal"))
  .map(([family, font]) => ({
    family,
    weights: font.weights.filter((weight) => weight !== "variable").map(Number),
  }))
  .sort((a, b) => a.family.localeCompare(b.family))

writeFileSync(
  target,
  `[\n${families.map((font) => JSON.stringify(font)).join(",\n")}\n]\n`
)

console.log(`Wrote ${families.length} families to lib/google-fonts.json`)
