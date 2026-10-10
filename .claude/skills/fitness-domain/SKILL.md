---
name: fitness-domain
description: Modela planes de entrenamiento, sesiones planificadas, ejercicios planificados, sesiones realizadas, corazones y copia de planes entre usuarios en Liftly, sin introducir reglas médicas o de producto no acordadas. Úsala siempre que una tarea toque planes, sesiones planificadas (PlanSession), días de entrenamiento, rutinas, ejercicios planificados (PlanExercise), series, repeticiones, peso, descansos, orden, sesiones, visibilidad, likes/corazones o copiar planes de otros usuarios.
---

# Dominio de fitness

Sistema **multiusuario**: los usuarios crean planes, pueden hacerlos públicos,
darles corazón y copiar los de otros.

## Lenguaje ubicuo

Evita "Workout"/"rutina" como nombre de entidad (ambiguo).

- **Plan** (`TrainingPlan`): conjunto de sesiones planificadas de un usuario. Raíz de agregado.
- **Sesión planificada** (`PlanSession`): agrupación nombrada de ejercicios que normalmente debería ejecutarse en una sesión de entrenamiento.
- **Ejercicio planificado** (`PlanExercise`): ejercicio creado manualmente dentro de una `PlanSession`, con su nombre, grupo muscular y parámetros de planificación. No existe una entidad `Exercise` independiente ni un catálogo reutilizable.
- **Sesión realizada** (`WorkoutSession`): ejecución de una `PlanSession`, con snapshot de lo planificado. Es historial: nunca muta el plan.
- **Corazón** (`PlanLike`): marca de un usuario sobre un plan público.

```
TrainingPlan ─ PlanSession ─ PlanExercise
     ├─ PlanLike (user, plan)
WorkoutSession ─► TrainingPlan, PlanSession (obligatorios, Cascade)
```

Implementa solo las entidades que pida el caso de uso y documenta cualquier
cambio al modelo.

## Ejercicios planificados y grupos musculares

- Un `PlanExercise` solo puede existir dentro de una `PlanSession`; no se crea
  fuera de una sesión ni se referencia mediante un catálogo global.
- Cada `PlanExercise` se crea manualmente en el contexto del plan propietario.
- `demoUrls` (opcional) es una lista de enlaces http(s) a vídeos o imágenes de
  ejecución (máx. 5 por ejercicio, 500 caracteres por enlace). Solo se guardan y
  muestran los enlaces: no se aloja ni se incrusta contenido.
- El grupo muscular es obligatorio y debe pertenecer a esta lista predefinida:Pecho, espalda dorsal, espalda alta (trapecio y romboides), espalda baja (lumbares), hombros (deltoides anterior, lateral y posterior), bíceps, tríceps, antebrazos, abdominales (recto abdominal), oblicuos, transverso abdominal, core, cuádriceps, isquiotibiales (femorales), glúteos (mayor, medio y menor), aductores, abductores, gemelos (pantorrillas), sóleo, tibial anterior, manguito rotador, serrato anterior, cuello, zona lumbar, cadera (flexores de cadera/psoas), tren superior, tren inferior, cuerpo completo (full body)
- La lista y sus etiquetas visibles deben definirse en un único lugar compartido. No aceptes valores arbitrarios enviados por el cliente.

## Propiedad y visibilidad

- Visibilidad: `private` (por defecto) | `public`.
- **Escritura**: solo el propietario, siempre a través del plan (la autorización se comprueba una vez, a nivel de plan).
- **Lectura**: el propietario, o cualquier usuario autenticado si es `public`.
- Un plan que pasa a `private` deja de ser visible, listable y copiable al
  instante; las copias ya hechas no se ven afectadas.

## Corazones

- Un usuario, un corazón por plan: restricción única `(userId, planId)`.
- Dar/quitar corazón es **idempotente**.

## Copiar planes

- Solo se puede copiar un plan público (o uno propio).
- La copia es una **copia profunda** (plan, sesiones planificadas, ejercicios) creada **en una sola transacción**, propiedad del copiador, `private` y en `borrador`.
- Tras copiar, la copia es **independiente**: editar, borrar o privatizar el original no la altera, y viceversa.
- El detalle de la copia muestra la procedencia; el enlace al original solo se
  renderiza si el original es visible para quien lo consulta (si no, se muestra
  el nombre como texto plano, sin enlace muerto).
- Guarda procedencia: `copiedFromPlanId` (nullable, `SET NULL` al borrar el original).
- Los `PlanExercise` se copian como parte de la copia profunda de su `PlanSession`; cada copia es independiente y conserva su nombre, grupo muscular y parámetros.

## Sincronizar una copia

- Una copia puede **resincronizarse** con su original: solo su propietario y
  solo si el original sigue visible (público o propio).
- La sincronización reemplaza sesiones y ejercicios de la copia por los del
  original, en una sola transacción. **No** toca nombre, descripción, visibilidad,
  estado, likes ni procedencia de la copia; sí refresca `copiedFromName` y
  `copiedFromAuthorName`.
- El desfase se detecta **comparando el contenido** (sesiones y ejercicios en
  orden) entre original y copia, no por `updatedAt`: así un like o un cambio de
  visibilidad no marcan la copia como desactualizada y una ordenación sí.
- Al sincronizar, el contenido vuelve a coincidir y el aviso desaparece.

## Sesiones realizadas (ejecuciones)

- `WorkoutSession` es el historial de una ejecución.
- `WorkoutSet` guarda serie a serie con clave única.
- En ejecución, `reps` y `durationSec` son excluyentes igual que en plan; el
  tiempo real se guarda en **segundos** (`durationSec`), el plan usa minutos.
  Peso y unidad van juntos. `skipped: true` registra una serie omitida (avanza
  el cursor sin datos de reps/tiempo/peso). `durationSec` admite 0–12 h.
- Posición por `position` real (no por índice): `findRunPosition` y
  `countSetsDone` casan registros contra `exercise.position`.
- El orden de ejecución es libre: las series se guardan por clave
  `(posición, serie)`, no por orden de llegada. El cursor del runner es un
  estado explícito (`findExerciseCursor` con `activePosition` y `activeSet`);
  el selector "Elige el ejercicio" muestra el progreso por ejercicio, permite
  cambiar de orden y volver a cualquier serie ya registrada para editarla. Si
  el ejercicio elegido ya no tiene series pendientes, se vuelve al primer
  hueco en orden.
- La serie actual se marca con chips numerados (`aria-current="step"`), sin
  flechas: registrar una serie autoincrementa al siguiente hueco y los chips
  permiten saltar a cualquier serie del ejercicio (para revisar o editar).
- El runner es un **wizard de ejercicios**: la tarjeta muestra un ejercicio a
  la vez y los botones "Anterior"/"Siguiente" navegan por los ejercicios del
  plan (sin envolvente: deshabilitados en los extremos; el selector "Elige el
  ejercicio" sigue permitiendo saltos libres). Dentro de un ejercicio,
  registrar una serie avanza a su siguiente serie pendiente.
- **El descanso (`restMin`) se activa después de cada serie registrada u
  omitida** (a excepción de la última serie de la sesión): al guardar, el cursor
  avanza a la siguiente serie pendiente y la cuenta atrás se abre en el
  temporizador global. `restMin` es 0 o la sesión está completa → sin descanso.
- El runner delega el descanso en el **temporizador global** (`lib/timer-store.ts`
  + `components/timer-tool.tsx`, Zustand, montado en el layout raíz): al
  guardar una serie se llama a `openForRest(segundos, "Siguiente: … · serie N")`
  con `source === "rest"`. El temporizador también es una **herramienta
  independiente** desde la barra de navegación (cronómetro con vueltas y
  temporizador con presets, `+30 s`, pausa, minimizar a una píldora y vibración
  al llegar a 0). El runner cierra el descanso (`dismissSessionRest`) al
  registrar/omitir otra serie, navegar entre ejercicios o salir de la sesión.
- **Autocompletado del historial**: al entrar a un ejercicio, reps y peso se
  rellenan con el último registro del usuario para ese nombre (`history` en
  `RunState`, `buildHistoryMap` sobre las últimas 20 sesiones del usuario,
  nombre normalizado con `historyKey`, series omitidas y registros sin datos
  ignorados; la fila más reciente gana). Prioridad: registro de la serie
  actual > historial > valores del plan. La tarjeta muestra además
  "Último registro: …" como referencia (`formatHistoryReference`).
- Re-registrar una serie existente es una **edición** (mismo upsert): se
  rellena el formulario con lo guardado y el botón dice "Guardar cambios"; la
  edición no dispara descanso ni avanza el cursor, y una serie omitida se
  reactiva al guardarla con datos.
- Privacidad: cada usuario solo lee y registra sus propias sesiones; la
  identidad sale de `getSession()`, nunca del cliente. La escritura valida que
  la sesión siga abierta; `finishSession` es idempotente y `abandonSession`
  solo borra sesiones no completadas. El futuro no edita el histórico ya
  guardado.
- `startSession` reutiliza la sesión abierta existente (retomar); una carrera
  en `logSet` sobre la clave única se resuelve como `conflict`. `logSet`
  verifica además que la posición exista en la sesión planificada (si sigue
  existiendo) y usa el nombre y grupo del plan como fuente de verdad.
- Runner: el ejercicio con duración usa un cronómetro de cuenta ascendente con
  objetivo; el descanso (`restMin`) se delega en el temporizador global (cuenta
  atrás autoiniciada con saltar, `+30 s`, pausa; al llegar a 0 suena un chime
  sutil generado con Web Audio —`lib/timer-audio.ts`— y vibra). Muestra siempre
  serie actual, progreso y estado de carga/error/vacío.
- El runner es **mobile-first**: header `sticky top-14` (nombre, terminar y
  progreso siempre visibles) y barra de acciones inferior `sticky bottom-0`
  con botones grandes ("Omitir"/"Completar serie"); la barra se desplaza por
  encima de la píldora del temporizador y se oculta mientras el panel está
  abierto (`timerOpen && !timerMinimized`). Chips de serie y steppers de
  reps/peso con targets ≥ 40 px.

## Parámetros y límites

- Series: uniformes por ejercicio (series individuales, fuera de alcance).
- Repeticiones: rango `min`–`max`. **Repeticiones y duración son excluyentes.**
- Peso: unidad explícita (`kg`|`lb`), un único valor canónico almacenado.
- Descanso en minutos; notas opcionales.
- Constantes en un solo lugar (valores iniciales, ajustables): máx. 10 sesiones planificadas
  por plan, indenidos ejercicios por sesión, series 1–20 (4 por defecto), reps 1–100 (15 por defecto), duración 0-unlimited minutos, descanso 0–unlimited minutos (4 por defecto),   0–unlimited kg/lb (0 por defecto), hasta 5 enlaces de recurso por ejercicio.

## Orden

Posición entera densa por padre, única `(padre, posición)`. Reordenar reescribe
posiciones en una transacción. Un ejercicio puede repetirse en una sesión planificada.

## Integridad e historial

- `WorkoutSession` referencia `planId` y `planSessionId` como **obligatorios con
  `onDelete: Cascade`**: borrar plan → sesiones planificadas, ejercicios,
  likes **y sesiones realizadas con sus series** desaparecen; no quedan
  huérfanos (la migración de cambio elimina antes los huérfanos existentes).
- Editar un plan (`updatePlan`) difusa **por id**: las sesiones con `sessionId`
  existente se actualizan (borrando y recreando solo sus ejercicios), las
  nuevas se crean y las no conservadas se borran (cascada limpia sus
  ejecuciones). La sincronización de una copia difusa **por índice**:
  conserva las sesiones existentes renombrándolas, clona las que faltan y borra
  las sobrantes.
- Borrar una sesión realizada → cascada a sus `WorkoutSet`.
- Borrar un `PlanExercise` solo es válido dentro de una operación autorizada
  sobre su `PlanSession` y no debe dejar referencias a un catálogo inexistente.
- Una operación sobre un plan (con sesiones planificadas y ejercicios) es **una transacción**.

## UX

Muestra primero el objetivo de la acción (crear, editar, ordenar, ejecutar,
copiar). Estados vacíos útiles, errores de validación visibles. Atribuye siempre
al autor original en una copia. Sin consejos médicos ni promesas de resultados.

