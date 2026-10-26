export async function readImageAsDataUri(file: File, maxHeight: number) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxHeight / bitmap.height)
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")
  if (!context) {
    bitmap.close()
    throw new Error("Canvas 2D is not available")
  }
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return canvas.toDataURL("image/webp", 0.9)
}
