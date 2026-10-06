# shadcn/ui monorepo template

This is a Next.js monorepo template with shadcn/ui.

## Liftly

Liftly is a minimal fitness platform for creating and following gym routines.
The web app lives in `apps/web`, shared shadcn/ui components live in
`packages/ui`, and future persistence is planned with PostgreSQL and Prisma
through Next.js Server Actions.

### Agent skills

Project-specific guidance for AI agents is available under `.github/skills/`.
The canonical skills for OpenCode and Claude Code are available under
`.claude/skills/`, and the shared project rules are in `AGENTS.md` and
`CLAUDE.md`. Copilot-specific conventions remain in
`.github/copilot-instructions.md`. Read the skill relevant to the area being
changed before implementing a feature.

## Adding components

To add components to your app, run the following command at the root of your `web` app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This will place the ui components in the `packages/ui/src/components` directory.

## Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/button";
```
