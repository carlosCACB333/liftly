"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  CircleAlertIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
} from "lucide-react"

import { authClient } from "@workspace/db/client"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@workspace/ui/components/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@workspace/ui/components/input-group"
import { Spinner } from "@workspace/ui/components/spinner"

import { signInErrorMessage } from "@/lib/auth/errors"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"

import { SocialAuthButtons } from "@/components/auth/social-auth-buttons"
import { useCallback, useEffect, useState } from "react"

const FOCUS_ORDER = ["email", "password"] as const

export function LoginForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const firstInvalidField = FOCUS_ORDER.find((field) => errors[field])

  useEffect(() => {
    if (firstInvalidField) {
      setFocus(firstInvalidField)
    }
  }, [firstInvalidField, setFocus])

  const onSubmit = useCallback(
    async (values: LoginInput) => {
      const { error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
      })

      if (error) {
        setError("root", { message: signInErrorMessage(error) })
        return
      }

      router.push("/")
      router.refresh()
    },
    [router, setError]
  )

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-6"
    >
      {errors.root ? (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>No pudimos iniciar sesión</AlertTitle>
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      ) : null}

      <FieldGroup className="gap-5">
        <Field data-invalid={Boolean(errors.email)}>
          <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <MailIcon />
            </InputGroupAddon>
            <InputGroupInput
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              disabled={isSubmitting}
              {...register("email")}
            />
          </InputGroup>
          {errors.email ? (
            <FieldError id="email-error">{errors.email.message}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={Boolean(errors.password)}>
          <div className="flex items-center justify-between gap-2">
            <FieldLabel htmlFor="password">Contraseña</FieldLabel>
            <Link
              href="/forgot-password"
              className="rounded-sm text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <LockIcon />
            </InputGroupAddon>
            <InputGroupInput
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              disabled={isSubmitting}
              {...register("password")}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-sm"
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-controls="password"
                aria-label="Mostrar contraseña"
                aria-pressed={showPassword}
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {errors.password ? (
            <FieldError id="password-error">
              {errors.password.message}
            </FieldError>
          ) : null}
        </Field>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Spinner />
              Iniciando sesión…
            </>
          ) : (
            "Iniciar sesión"
          )}
        </Button>

        <FieldSeparator className="[&>span]:bg-card">
          o continúa con
        </FieldSeparator>

        <SocialAuthButtons
          disabled={isSubmitting}
          onError={(message) => setError("root", { message })}
        />
      </FieldGroup>
    </form>
  )
}
