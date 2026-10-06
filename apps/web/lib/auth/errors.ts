export type AuthCallError = {
  code?: string
  message?: string
  status?: number
}

export function signInErrorMessage(error: AuthCallError): string {
  switch (error.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
    case "USER_NOT_FOUND":
    case "INVALID_PASSWORD":
      return "Correo o contraseña incorrectos."
    case "EMAIL_NOT_VERIFIED":
      return "Verifica tu correo electrónico antes de iniciar sesión."
    default:
      return "No pudimos iniciar sesión. Inténtalo de nuevo."
  }
}

export function signUpErrorMessage(error: AuthCallError): string {
  switch (error.code) {
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "Ya existe una cuenta con este correo. Inicia sesión."
    case "PASSWORD_TOO_SHORT":
      return "La contraseña debe tener al menos 8 caracteres."
    case "EMAIL_NOT_VERIFIED":
      return "Verifica tu correo electrónico para continuar."
    default:
      return "No pudimos crear tu cuenta. Inténtalo de nuevo."
  }
}

export function socialAuthErrorMessage(error: AuthCallError): string {
  switch (error.code) {
    case "ACCOUNT_NOT_LINKED":
      return "No pudimos enlazar la cuenta con este proveedor."
    case "EMAIL_NOT_VERIFIED":
      return "Verifica tu correo electrónico antes de continuar."
    case "SESSION_NOT_FOUND":
      return "No se encontró una sesión activa."
    default:
      return "No pudimos iniciar sesión con ese proveedor. Inténtalo de nuevo."
  }
}