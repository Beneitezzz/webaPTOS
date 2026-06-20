import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase'

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
  const ext = file.name.split('.').pop().toLowerCase()
  const photoRef = ref(storage, `fotos/${businessId}/foto_${index}.${ext}`)
  await uploadBytes(photoRef, file)
  return getDownloadURL(photoRef)
}
