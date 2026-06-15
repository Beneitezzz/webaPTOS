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
