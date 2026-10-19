/**
 * Service to handle uploading and deleting images in assets/images and program database
 */

export interface UploadImageResponse {
  success: boolean;
  url: string;
  filename?: string;
  error?: string;
}

/**
 * Upload a base64 image to server to be saved into assets/images folder
 * Returns the public URL (e.g. /assets/images/STO1901_179074.jpg) or the base64 fallback
 */
export async function uploadImageToAssets(
  imageBase64: string,
  kodeStok?: string,
  customFilename?: string
): Promise<string> {
  // If it's already an asset path or external URL, keep as is
  if (imageBase64.startsWith('/assets/images/') || imageBase64.startsWith('http://') || imageBase64.startsWith('https://')) {
    return imageBase64;
  }

  // If not a data URL (e.g. raw text or empty), return empty
  if (!imageBase64 || !imageBase64.startsWith('data:image/')) {
    return imageBase64;
  }

  try {
    const res = await fetch('/api/upload-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
        kodeStok,
        filename: customFilename,
      }),
    });

    if (!res.ok) {
      console.warn('Upload image API responded with status:', res.status);
      return imageBase64; // fallback to base64 data URL
    }

    const data: UploadImageResponse = await res.json();
    if (data.success && data.url) {
      return data.url;
    }
    return imageBase64;
  } catch (err) {
    console.warn('Failed to upload image to server assets, using base64 fallback:', err);
    return imageBase64;
  }
}

/**
 * Delete image file from server assets if applicable
 */
export async function deleteImageFromAssets(url: string): Promise<void> {
  if (!url || !url.startsWith('/assets/images/')) {
    return;
  }

  try {
    await fetch('/api/delete-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });
  } catch (err) {
    console.warn('Failed to delete image file from server:', err);
  }
}
