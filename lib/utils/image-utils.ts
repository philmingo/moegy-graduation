import { toPng } from "html-to-image"

export async function downloadQRCardAsImage(node: HTMLElement, fileName = "qr-card.png") {
  try {
    const dataUrl = await toPng(node, {
      cacheBust: true,
      pixelRatio: 3,
      backgroundColor: "#1e1b4b", // fallback if no background
      width: node.offsetWidth,
      height: node.offsetHeight,
      style: {
        transform: "scale(1)",
        transformOrigin: "top left",
      },
    })

    const link = document.createElement("a")
    link.download = fileName
    link.href = dataUrl
    link.click()

    return dataUrl
  } catch (error) {
    console.error("Error generating image:", error)
    throw error
  }
}

export async function copyQRCardAsImage(node: HTMLElement) {
  try {
    const dataUrl = await toPng(node, {
      cacheBust: true,
      pixelRatio: 3,
      backgroundColor: "#1e1b4b",
      width: node.offsetWidth,
      height: node.offsetHeight,
      style: {
        transform: "scale(1)",
        transformOrigin: "top left",
      },
    })

    // Convert data URL to blob
    const response = await fetch(dataUrl)
    const blob = await response.blob()

    // Copy to clipboard
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ])

    return dataUrl
  } catch (error) {
    console.error("Error copying image:", error)
    throw error
  }
}
