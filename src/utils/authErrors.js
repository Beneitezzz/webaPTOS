const AUTH_ERRORS = {
  'auth/email-already-in-use': 'Ya existe una cuenta con ese email',
  'auth/wrong-password': 'Email o contraseña incorrectos',
  'auth/user-not-found': 'Email o contraseña incorrectos',
  'auth/invalid-credential': 'Email o contraseña incorrectos',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
  'auth/popup-closed-by-user': null,
  'auth/cancelled-popup-request': null,
  'auth/network-request-failed': 'Error de conexión. Revisá tu internet',
}

export const getAuthError = (code) =>
  code in AUTH_ERRORS
    ? AUTH_ERRORS[code]
    : 'Ocurrió un error. Intentá de nuevo.'
