---
name: server-actions-prisma
description: Implementa el backend de Liftly con Server Actions, Prisma y PostgreSQL de forma segura, tipada y transaccional.
---

# Server Actions y Prisma

Usa esta skill para persistencia, mutaciones, validación y acceso a datos.

## Flujo obligatorio de una acción

1. Marca el módulo con `"use server"` y exporta una función con una entrada
   serializable y un resultado tipado.
2. Valida la entrada con un esquema compartido en el límite de confianza.
3. Obtén la identidad del usuario desde el mecanismo de autenticación real; no
   aceptes `userId` enviado por el cliente como autoridad.
4. Comprueba propiedad/autorización antes de leer o mutar recursos.
5. Ejecuta la operación con Prisma y usa `$transaction` cuando cambien varias
   filas relacionadas.
6. Devuelve un resultado discriminado para éxito y errores esperables; registra
   los errores inesperados sin revelar detalles internos.
7. Invalida la caché necesaria con las APIs de Next y vuelve a dirigir solo
   cuando sea parte del flujo de producto.

## Prisma y PostgreSQL

- Mantén un único cliente Prisma reutilizable en desarrollo para evitar
  agotar conexiones por hot reload.
- Usa `select`/`include` explícitos y limita consultas; no devuelvas modelos
  completos por defecto.
- Usa claves y restricciones de base de datos para propiedad, unicidad y
  relaciones; la validación de TypeScript no sustituye las restricciones SQL.
- Representa el orden de ejercicios con un campo dedicado y actualízalo dentro
  de una transacción.
- Crea migraciones reproducibles y no edites manualmente la base de datos
  compartida.

## Errores y seguridad

Distingue validación, no autenticado, no autorizado, no encontrado y conflicto.
No captures errores de forma amplia para devolver éxito falso. No registres
contraseñas, tokens, secretos ni payloads sensibles.
