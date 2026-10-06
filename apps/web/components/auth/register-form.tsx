"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  CircleAlertIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  UserIcon,
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

import { signUpErrorMessage } from "@/lib/auth/errors"
import {
  registerSchema,
  type RegisterInput,
} from "@/lib/validations/auth"

import { SocialAuthButtons } from "@/components/auth/social-auth-buttons"

const FOCUS_ORDER = ["name", "email", "password", "confirmPassword"] as const


export function RegisterForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const firstInvalidField = FOCUS_ORDER.find((field) => errors[field])

  React.useEffect(() => {
    if (firstInvalidField) {
      setFocus(firstInvalidField)
    }
  }, [firstInvalidField, setFocus])

  const onSubmit = React.useCallback(
    async (values: RegisterInput) => {
      const { error } = await authClient.signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
      })

      if (error) {
        setError("root", { message: signUpErrorMessage(error) })
        return
      }

      router.push("/")
      router.refresh()
    },
    [router, setError]
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      {errors.root ? (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>No pudimos crear tu cuenta</AlertTitle>
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      ) : null}

      <FieldGroup className="gap-5">
        <Field data-invalid={Boolean(errors.name)}>
          <FieldLabel htmlFor="name">Nombre</FieldLabel>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <UserIcon />
            </InputGroupAddon>
            <InputGroupInput
              id="name"
              type="text"
              inputMode="text"
              autoComplete="name"
              placeholder="Cómo te llamas"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
              disabled={isSubmitting}
              {...register("name")}
            />
          </InputGroup>
          {errors.name ? (
            <FieldError id="name-error">{errors.name.message}</FieldError>
          ) : null}
        </Field>

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
          <FieldLabel htmlFor="password">Contraseña</FieldLabel>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <LockIcon />
            </InputGroupAddon>
            <InputGroupInput
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
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
            <FieldError id="password-error">{errors.password.message}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={Boolean(errors.confirmPassword)}>
          <FieldLabel htmlFor="confirmPassword">Confirmar contraseña</FieldLabel>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <LockIcon />
            </InputGroupAddon>
            <InputGroupInput
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repite tu contraseña"
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={
                errors.confirmPassword ? "confirm-password-error" : undefined
              }
              disabled={isSubmitting}
              {...register("confirmPassword")}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-sm"
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                aria-controls="confirmPassword"
                aria-label="Mostrar contraseña"
                aria-pressed={showConfirmPassword}
                disabled={isSubmitting}
              >
                {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {errors.confirmPassword ? (
            <FieldError id="confirm-password-error">
              {errors.confirmPassword.message}
            </FieldError>
          ) : null}
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner />
              Creando cuenta…
            </>
          ) : (
            "Crear cuenta"
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