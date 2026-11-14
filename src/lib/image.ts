// Reads an uploaded image and returns a square, centre-cropped JPEG data URL.
export async function downscaleImage(file: File, size = 512): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('read'))
    reader.readAsDataURL(file)
  })

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image'))
    img.src = dataUrl
  })

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrl
  const scale = Math.max(size / image.width, size / image.height)
  const width = image.width * scale
  const height = image.height * scale
  ctx.drawImage(image, (size - width) / 2, (size - height) / 2, width, height)
  return canvas.toDataURL('image/jpeg', 0.86)
}
