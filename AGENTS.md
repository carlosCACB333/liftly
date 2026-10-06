<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Liftly

Liftly es una plataforma de fitness para crear y ejecutar rutinas de
gimnasio. Mantén un diseño moderno y minimalista.

## Stack y arquitectura

- Monorepo Turborepo con Bun.
- `apps/web`: Next.js 16, App Router, React Server Components y TypeScript.
- `packages/ui`: componentes compartidos de shadcn/ui y Tailwind CSS.
- Backend mediante Server Actions de Next.js.
- Persistencia prevista con PostgreSQL y Prisma.

## Reglas del proyecto

- Lee la skill relevante en `.claude/skills/` antes de trabajar en esa área.
- Prefiere Server Components; usa `"use client"` solo para interactividad o
  APIs del navegador.
- Mantén la lógica de dominio fuera de la UI y evita duplicar reglas.
- Cada Server Action debe validar entradas, comprobar autenticación y
  autorización, usar transacciones cuando corresponda y devolver un resultado
  tipado.
- No confíes en un `userId` enviado por el cliente. No expongas secretos,
  errores internos de Prisma ni datos de otros usuarios.
- Prioriza accesibilidad, responsive, estados de carga, error y vacío.
- Una rutina pertenece a su usuario y sus ejercicios tienen un orden explícito.
- No inventes autenticación, progresión ni recomendaciones médicas sin una
  decisión explícita del producto.

Consulta la skill `code-quality` antes de finalizar y ejecuta, cuando aplique:
`bun run lint`, `bun run typecheck` y `bun run build`.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
