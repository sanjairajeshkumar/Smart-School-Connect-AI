/**
 * High-performance client-side image compression utility
 * Bypasses OS/browser file locks via URL.createObjectURL with FileReader fallback
 * Returns high-quality base64 JPEG data URL suitable for preview and transmission
 */
export const compressImage = (file, maxWidth = 1600, quality = 0.82) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No image file selected'));
    }

    const processCanvas = (img) => {
      try {
        let width = img.naturalWidth || img.width || 1200;
        let height = img.naturalHeight || img.height || 900;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Fill background white so transparent PNGs don't turn black in JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      } catch (err) {
        reject(new Error('Failed to process image: ' + err.message));
      }
    };

    // Primary: URL.createObjectURL creates an in-memory blob pointer that avoids FileReader locks
    if (typeof URL !== 'undefined' && URL.createObjectURL) {
      try {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          processCanvas(img);
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          fallbackFileReader();
        };
        img.src = objectUrl;
        return;
      } catch (e) {
        // Fallback to FileReader below
      }
    }

    // Fallback: FileReader
    const fallbackFileReader = () => {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => processCanvas(img);
          img.onerror = () => reject(new Error('Failed to parse image from file'));
          img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Could not read the selected image file. Please try another photo.'));
        reader.readAsDataURL(file);
      } catch (err) {
        reject(new Error('File reader error: ' + err.message));
      }
    };

    fallbackFileReader();
  });
};

/**
 * Compress an array of files in parallel
 */
export const compressMultipleImages = async (files, maxWidth = 1600, quality = 0.82) => {
  const fileArray = Array.from(files || []).filter((f) => f && (f.type ? f.type.startsWith('image/') : true));
  if (fileArray.length === 0) return [];
  const results = await Promise.all(fileArray.map((file) => compressImage(file, maxWidth, quality)));
  return results;
};
