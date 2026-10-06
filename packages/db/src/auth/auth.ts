import { betterAuth } from "better-auth"
import { nextCookies } from "better-auth/next-js"
import { prisma8Adapter } from "better-auth-adapter-prisma8"
import { db } from "../prisma/db"

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

const githubClientId = process.env.GITHUB_CLIENT_ID
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET

const socialProviders = {
  ...(googleClientId && googleClientSecret
    ? {
        google: {
          clientId: googleClientId,
          clientSecret: googleClientSecret,
        },
      }
    : {}),
  ...(githubClientId && githubClientSecret
    ? {
        github: {
          clientId: githubClientId,
          clientSecret: githubClientSecret,
        },
      }
    : {}),
}

export const auth = betterAuth({
  database: prisma8Adapter(db, {
    provider: "postgresql",
    schema: "public",
    transaction: true, // recomendado: por defecto las operaciones multi-paso no son atómicas
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  ...(Object.keys(socialProviders).length > 0 ? { socialProviders } : {}),
  plugins: [nextCookies()], // siempre al final
})