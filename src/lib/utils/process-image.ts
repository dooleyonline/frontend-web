export default async function processImage(file: File) {
  if (
    file.type === "image/heic" ||
    (file.type === "application/octet-stream" &&
      file.name.toLowerCase().endsWith(".heic"))
  ) {
    try {
      // Only import heic2any on the client side
      const heic2any = (await import("heic2any")).default;

      // Convert HEIC to JPEG
      const jpegBlob = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.8,
      });

      // Create a new file from the blob
      const blob = Array.isArray(jpegBlob) ? jpegBlob[0] : jpegBlob;

      return new File([blob], file.name.replace(/\.heic$/i, ".jpg"), {
        type: "image/jpeg",
      });
    } catch (error) {
      console.error("Error converting HEIC:", error);
      throw new Error("Failed to process HEIC image");
    }
  }

  return file;
}
