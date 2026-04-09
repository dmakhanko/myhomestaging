/**
 * Client-side image optimization before upload
 * Resizes and compresses images to reduce file size for faster uploads and SEO
 */

export async function optimizeImage(file, maxWidth = 1200, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Resize if necessary (maintain aspect ratio)
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          
          // Draw with white background for RGBA images
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Convert canvas to blob with compression
          canvas.toBlob(
            (blob) => {
              resolve(blob);
            },
            "image/jpeg",
            quality
          );
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Calculate compression ratio for display
 */
export function getCompressionRatio(original, compressed) {
  return Math.round((1 - compressed.size / original.size) * 100);
}
