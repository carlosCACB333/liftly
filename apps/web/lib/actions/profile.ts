"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { auth } from "@workspace/db"
import { getSession } from "@/lib/auth/session"
import { profileSchema } from "@/lib/validations/profile"
import { validationResult, type ValidationFailure } from "@/lib/actions/result"

export type UpdateProfileResult =
  { ok: true } | ValidationFailure | { ok: false; reason: "unauthenticated" }

export async function updateProfile(
  input: unknown
): Promise<UpdateProfileResult> {
  const session = await getSession()
  const userId = session?.user?.id
  if (!userId) return { ok: false, reason: "unauthenticated" }

  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) return validationResult(parsed.error)

  try {
    await auth.api.updateUser({
      body: { name: parsed.data.name, image: parsed.data.image },
      headers: await headers(),
    })
  } catch {
    return { ok: false, reason: "unauthenticated" }
  }

  revalidatePath(`/profile/${userId}`, "page")
  revalidatePath("/", "layout")
  return { ok: true }
}
