---
name: nextjs-frontend
description: Construye interfaces de Liftly con Next.js App Router, shadcn/ui y Tailwind manteniendo accesibilidad, rendimiento y un estilo minimalista.
---

# Frontend Next.js

Usa esta skill para páginas, layouts, componentes, formularios e interacción
de la aplicación web.

## Arquitectura

- Prefiere Server Components; añade `"use client"` solo cuando se necesite
  estado, eventos, APIs del navegador o una librería interactiva.
- Mantén las páginas del App Router orientadas a composición y extrae UI
  reutilizable a `apps/web/components`.
- Los componentes genéricos y reutilizables viven en `packages/ui`.
- Importa componentes shadcn desde `@workspace/ui/components/*` y utilidades
  desde los aliases existentes; no copies implementaciones entre paquetes.
- Evita obtener datos de la base de datos desde un Client Component. Usa
  Server Components para lecturas y Server Actions para mutaciones.

## Diseño

- Usa una jerarquía visual clara, espacios generosos, bordes sutiles y una
  paleta sobria con un único acento.
- Usa tokens de Tailwind y variables del tema; no introduzcas colores
  hexadecimales aislados.
- Cada pantalla debe contemplar responsive, foco visible, navegación por
  teclado, `aria-label` cuando el control no tenga texto y contraste adecuado.
- Todo formulario necesita estado inicial, carga, éxito, error y validación
  accesible. Usa `useActionState` o el patrón equivalente de Next cuando sea
  apropiado.
- Para listas editables, ofrece reordenamiento accesible además de drag and
  drop y confirma las acciones destructivas.

## Verificación

Comprueba que no haya errores de hidratación, que la página funcione sin
JavaScript cuando sea posible y que los estados de vacío y error sean
comprensibles. Ejecuta lint y typecheck antes de dar una tarea por terminada.
