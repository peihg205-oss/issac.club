/**
 * Tiện ích nén ảnh client-side bằng HTML Canvas
 * Giúp giảm kích thước ảnh từ 2-10MB (ảnh gốc điện thoại) xuống còn ~8-15KB (160x160 JPEG 0.8)
 * Giúp đồng bộ đám mây Supabase siêu nhẹ, không lag, không vượt quota localStorage.
 */

export async function compressImage(
  fileOrDataUrl: File | string,
  maxDimension = 160,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '')
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      let { width, height } = img
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        } else {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, width)
      canvas.height = Math.max(1, height)
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(img.src)
        return
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      try {
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedDataUrl)
      } catch (err) {
        resolve(img.src)
      }
    }

    img.onerror = () => {
      resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '')
    }

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = (e.target?.result as string) || ''
      }
      reader.onerror = () => resolve('')
      reader.readAsDataURL(fileOrDataUrl)
    }
  })
}

/**
 * Tự động cắt bỏ các avatar base64 quá lớn (> 40KB) để bảo đảm payload luôn nhẹ < 30KB
 */
export function sanitizeMemberAvatar(avatarUrl?: string): string | undefined {
  if (!avatarUrl) return undefined
  if (avatarUrl.startsWith('data:image') && avatarUrl.length > 40000) {
    // Tránh gửi chuỗi base64 khổng lồ lên mạng
    return undefined
  }
  return avatarUrl
}
