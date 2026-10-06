---
name: fitness-domain
description: Modela rutinas, ejercicios y sesiones de gimnasio de Liftly sin introducir reglas médicas o de producto no acordadas.
---

# Dominio de fitness

Usa esta skill cuando una tarea afecte a rutinas, ejercicios, series,
repeticiones, peso, descansos o la ejecución de una sesión.

## Modelo conceptual inicial

- **Exercise**: movimiento reutilizable, con nombre, grupo muscular y
  descripción opcional.
- **Workout**: rutina propiedad de un usuario, con nombre, descripción,
  visibilidad y ejercicios ordenados.
- **WorkoutExercise**: relación ordenada entre una rutina y un ejercicio; guarda
  los parámetros planificados (series, repeticiones, peso, duración y descanso)
  sin mezclar el catálogo del ejercicio con la planificación.
- **WorkoutSession**: ejecución concreta y opcional de una rutina; sus datos son
  un registro histórico y no deben mutar silenciosamente la rutina planificada.

No implementes todas las entidades por defecto. Añade solo las necesarias para
el caso de uso solicitado y deja documentada cualquier decisión que cambie
este modelo.

## Invariantes

- El orden se representa explícitamente y es estable después de reordenar.
- Los valores cuantitativos tienen límites razonables y unidades claras.
- Una rutina y sus relaciones solo pueden leerse o modificarse por su
  propietario, salvo una futura regla de publicación explícita.
- Borrar o sustituir un ejercicio no debe dejar relaciones huérfanas.
- Los cambios de una rutina y sus ejercicios se guardan de forma atómica.

## UX y lenguaje

Muestra primero el objetivo de la acción: crear, editar, ordenar o ejecutar.
Usa estados vacíos útiles y no ocultes errores de validación. Evita presentar
datos médicos o promesas de resultados como si fueran asesoramiento profesional.
