import type { ScreenImage } from "./contract";
export async function prepareScreenshot(file: File): Promise<ScreenImage> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw new Error(
      "Choose a PNG, JPG or WebP screenshot. Export HEIC as PNG first.",
    );
  if (file.size > 10_000_000) throw new Error("Choose an image under 10 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    if (
      !bitmap.width ||
      !bitmap.height ||
      bitmap.width * bitmap.height > 40_000_000
    )
      throw new Error("This image is too large. Crop to one screen first.");
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error("Image preview is unavailable in this browser.");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL("image/jpeg", 0.9).split(",")[1];
    if (data.length > 2_000_000)
      throw new Error("Crop this screenshot to a smaller area and retry.");
    return { mimeType: "image/jpeg", data };
  } finally {
    bitmap.close();
  }
}
