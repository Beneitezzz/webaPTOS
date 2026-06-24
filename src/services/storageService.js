import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase'

const compressImage = (file, maxPx = 1920, quality = 0.82) =>
  new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const { naturalWidth: w, naturalHeight: h } = img
      const scale = Math.min(1, maxPx / Math.max(w, h))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(w * scale)
      canvas.height = Math.round(h * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => resolve(blob ?? file), 'image/jpeg', quality)
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })

export const uploadCertFile = async (businessId, certCode, file) => {
  const ext = file.name.split('.').pop().toLowerCase()
  const fileRef = ref(storage, `certificados/${businessId}/${certCode}.${ext}`)
  await uploadBytes(fileRef, file)
  return getDownloadURL(fileRef)
}

export const uploadMenuFile = async (businessId, file) => {
  const ext = file.name.split('.').pop().toLowerCase()
  const menuRef = ref(storage, `menus/${businessId}/menu.${ext}`)
  await uploadBytes(menuRef, file)
  return getDownloadURL(menuRef)
}

export const uploadBusinessPhoto = async (businessId, file, index) => {
  const compressed = await compressImage(file)
  const photoRef = ref(storage, `fotos/${businessId}/foto_${index}.jpg`)
  await uploadBytes(photoRef, compressed)
  return getDownloadURL(photoRef)
}
