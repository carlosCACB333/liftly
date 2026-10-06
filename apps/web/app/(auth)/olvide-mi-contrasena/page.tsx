import type { Metadata } from "next"

import { ComingSoon } from "@/components/auth/coming-soon"

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  description: "Restablece la contraseña de tu cuenta de Liftly.",
}

export default function OlvideMiContrasenaPage() {
  return (
    <ComingSoon
      title="Recuperar contraseña"
      description="El envío de correos de recuperación todavía no está disponible. Muy pronto podrás restablecer tu contraseña aquí."
    />
  )
}