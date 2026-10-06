---
name: code-quality
description: Revisa cambios de Liftly para mantener tipos estrictos, límites claros, pruebas útiles y ausencia de regresiones.
---

# Calidad y revisión

Usa esta skill al implementar, revisar o finalizar cualquier cambio.

## Checklist

- La solución sigue las convenciones existentes y no añade abstracciones
  prematuras.
- Los tipos expresan estados válidos; evita `any`, casts innecesarios y
  valores opcionales sin razón.
- Las reglas de dominio importantes tienen pruebas unitarias o de integración.
- Las mutaciones comprueban autenticación, autorización, validación y errores.
- La UI contempla carga, vacío, error, éxito, responsive y accesibilidad.
- No hay secretos ni dependencias nuevas sin necesidad y justificación.
- La documentación directamente afectada está actualizada.

## Validación

Ejecuta desde la raíz:

```bash
bun run lint
bun run typecheck
bun run build
```

Si uno falla por una razón preexistente o ambiental, reporta el comando,
el error relevante y qué comprobación alternativa se ejecutó. No ocultes fallos
con configuraciones más permisivas.
