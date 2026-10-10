# @workspace/db

Acceso a datos (Prisma 8 + PostgreSQL) y configuración de Better Auth.

Las dependencias se instalan desde la raíz del monorepo con Bun (gestor de
paquetes):

```bash
bun install
```

Los scripts (`db:emit`, `db:migrate`, `db:seed`, `auth:generate`, …) se
ejecutan en Node y cargan las variables de entorno desde `apps/web/.env`.
Ejecútalos desde este paquete o filtrando con Turborepo:

```bash
bun run --filter @workspace/db db:migrate
```
