/**
 * Compresses and enhances receipt images for OCR scanning.
 * Keeps text resolution high enough for small receipt fonts while reducing huge phone photos.
 */
export async function optimizeReceiptImage(fileOrBase64: File | string, maxDimension = 1800): Promise<{
  base64: string;
  mimeType: string;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let { width, height } = img;

      // Scale down if larger than maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        if (typeof fileOrBase64 === 'string') {
          resolve({ base64: fileOrBase64, mimeType: 'image/jpeg' });
        } else {
          const reader = new FileReader();
          reader.onload = () => resolve({ base64: reader.result as string, mimeType: fileOrBase64.type || 'image/jpeg' });
          reader.onerror = reject;
          reader.readAsDataURL(fileOrBase64);
        }
        return;
      }

      // Draw with white background in case of transparent PNGs.
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const contrasted = Math.max(0, Math.min(255, (gray - 128) * 1.28 + 142));
        data[i] = contrasted;
        data[i + 1] = contrasted;
        data[i + 2] = contrasted;
      }

      ctx.putImageData(imageData, 0, 0);
      ctx.filter = 'contrast(1.08) brightness(1.03)';
      ctx.drawImage(canvas, 0, 0);
      ctx.filter = 'none';

      const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      resolve({
        base64: optimizedDataUrl,
        mimeType: 'image/jpeg',
      });
    };

    img.onerror = (e) => {
      console.warn('Failed to load image for optimization, using raw source:', e);
      if (typeof fileOrBase64 === 'string') {
        resolve({ base64: fileOrBase64, mimeType: 'image/jpeg' });
      } else {
        const reader = new FileReader();
        reader.onload = () => resolve({ base64: reader.result as string, mimeType: fileOrBase64.type || 'image/jpeg' });
        reader.onerror = reject;
        reader.readAsDataURL(fileOrBase64);
      }
    };

    if (typeof fileOrBase64 === 'string') {
      img.src = fileOrBase64;
    } else {
      img.src = URL.createObjectURL(fileOrBase64);
    }
  });
}
