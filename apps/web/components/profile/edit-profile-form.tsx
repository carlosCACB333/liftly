"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon, SaveIcon } from "lucide-react"
import { toast } from "sonner"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { updateProfile } from "@/lib/actions/profile"
import { profileSchema, type ProfileInput } from "@/lib/validations/profile"

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "U"
  )
}

type EditProfileFormProps = {
  name: string
  image: string | null
}

export function EditProfileForm({ name, image }: EditProfileFormProps) {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name, image: image ?? "" },
  })
  const preview = watch("image")

  async function onSubmit(values: ProfileInput) {
    const result = await updateProfile(values)
    if (!result.ok) {
      if (result.reason === "unauthenticated") {
        router.push("/login")
        return
      }
      for (const [field, message] of Object.entries(result.errors)) {
        setError(field as keyof ProfileInput, { message })
      }
      return
    }
    toast.success("Perfil actualizado.")
    router.refresh()
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-6"
    >
      <FieldGroup className="gap-5">
        <div className="flex items-center gap-4">
          <Avatar size="lg">
            {preview ? (
              <AvatarImage
                src={preview}
                alt="Vista previa de tu foto de perfil"
              />
            ) : null}
            <AvatarFallback>{initials(name)}</AvatarFallback>
          </Avatar>
          <p className="max-w-sm text-sm text-muted-foreground">
            Tu foto se guarda como un enlace: no subimos imágenes a Liftly.
          </p>
        </div>

        <Field data-invalid={Boolean(errors.name)}>
          <FieldLabel htmlFor="profile-name">Nombre</FieldLabel>
          <Input
            id="profile-name"
            type="text"
            autoComplete="name"
            placeholder="Tu nombre público"
            aria-invalid={Boolean(errors.name)}
            disabled={isSubmitting}
            {...register("name")}
          />
          {errors.name ? <FieldError>{errors.name.message}</FieldError> : null}
        </Field>

        <Field data-invalid={Boolean(errors.image)}>
          <FieldLabel htmlFor="profile-image">
            Foto de perfil (enlace)
          </FieldLabel>
          <FieldDescription>
            Pega un enlace http o https a tu imagen. Déjalo vacío para usar tus
            iniciales.
          </FieldDescription>
          <Input
            id="profile-image"
            type="url"
            inputMode="url"
            placeholder="https://ejemplo.com/foto.jpg"
            aria-invalid={Boolean(errors.image)}
            disabled={isSubmitting}
            {...register("image")}
          />
          {errors.image ? (
            <FieldError>{errors.image.message}</FieldError>
          ) : null}
        </Field>

        <Button
          type="submit"
          size="lg"
          className="w-fit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2Icon className="animate-spin" aria-hidden="true" />
          ) : (
            <SaveIcon aria-hidden="true" />
          )}
          Guardar cambios
        </Button>
      </FieldGroup>
    </form>
  )
}
