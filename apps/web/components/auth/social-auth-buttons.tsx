"use client"

import { authClient } from "@workspace/db/client"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { socialAuthErrorMessage } from "@/lib/auth/errors"
import { useState } from "react"

const PROVIDERS = [
  { id: "google", label: "Google" },
  { id: "github", label: "GitHub" },
] as const

type Provider = (typeof PROVIDERS)[number]["id"]

export type SocialAuthButtonsProps = {
  disabled?: boolean
  onError?: (message: string) => void
}

export function SocialAuthButtons({
  disabled = false,
  onError,
}: SocialAuthButtonsProps) {
  const [pendingProvider, setPendingProvider] = useState<Provider | null>(null)

  const handleProvider = async (provider: Provider) => {
    if (pendingProvider) {
      return
    }

    setPendingProvider(provider)

    const { error } = await authClient.signIn.social({
      provider,
    })

    if (error) {
      setPendingProvider(null)
      onError?.(socialAuthErrorMessage(error))
      return
    }

  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {PROVIDERS.map((provider) => (
        <Button
          key={provider.id}
          type="button"
          variant="outline"
          disabled={disabled || pendingProvider !== null}
          onClick={() => handleProvider(provider.id)}
        >
          {pendingProvider === provider.id ? <Spinner /> : null}
          {provider.label}
        </Button>
      ))}
    </div>
  )
}
