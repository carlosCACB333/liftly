// import { betterAuth } from "better-auth"
// import { prisma8Adapter } from "better-auth-adapter-prisma8"
// import { db } from "./src/prisma/db"

// // Debe tener los mismos plugins y campos extra que apps/web/lib/auth.ts
// export const auth = betterAuth({
//     database: prisma8Adapter(db, { provider: "postgresql", schema: "public" }),
//     emailAndPassword: { enabled: true },
// })

export { auth } from "./src"