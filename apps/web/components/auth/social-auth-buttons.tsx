"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { authClient } from "@workspace/db/client"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

import { socialAuthErrorMessage } from "@/lib/auth/errors"

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
  const router = useRouter()
  const [pendingProvider, setPendingProvider] = React.useState<Provider | null>(null)

  const handleProvider = React.useCallback(
    async (provider: Provider) => {
      if (pendingProvider) {
        return
      }

      setPendingProvider(provider)

      const { error } = await authClient.signIn.social({
        provider,
        callbackURL: "/",
      })

      if (error) {
        setPendingProvider(null)
        onError?.(socialAuthErrorMessage(error))
        return
      }

      router.push("/")
      router.refresh()
    },
    [pendingProvider, onError, router]
  )

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