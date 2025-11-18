# Documentación: TASK-REQ-03 - Tipos de requisito y filtros

**Fecha de Finalización:** 2024-06-07
**Autor:** Codex
**Estado:** Finalizado

## 1. Objetivo

Habilitar la clasificación de requisitos entre “Desarrollo” y “Seguimiento”, marcando todos los existentes como Desarrollo por defecto y permitiendo filtrar por este nuevo campo para mejorar el seguimiento y reporting.

## 2. Enfoque Técnico

*Descripción de la implementación. ¿Qué ficheros o componentes fueron clave?*
- **Componentes Creados/Modificados:**
  - `types.ts`: Se añadió el tipo `RequirementType` y el campo `requirementType` en los modelos `Task` y `TaskDoc`, además de extender `VisibilityFilters`.
  - `src/constants.ts` / `constants.ts`: Nuevas constantes `REQUIREMENT_TYPE_OPTIONS`, `REQUIREMENT_TYPES` y `DEFAULT_REQUIREMENT_TYPE` (valor por defecto “Desarrollo”).
  - `App.tsx`: Carga, persistencia y filtros ahora contemplan `requirementType`; se normalizan tareas existentes a “Desarrollo”; CSV incluye la nueva columna.
  - `components/AddTaskModal.tsx`: El formulario incorpora selector de tipo y lo envía con valor por defecto al crear/editar.
  - `components/TableView.tsx`: Nueva columna editable de tipo y filtros de texto para el campo.
  - `components/TableToolbar.tsx`: Se añadió filtro de visibilidad por tipo de requisito.
  - `utils/firestore.ts`: Guarda `requirementType` con fallback al valor por defecto.
  - `components/FilestoreView.tsx`: El esquema mostrado incluye el nuevo campo en `tasks`.
- **Lógica Clave:**
  - Se asigna `DEFAULT_REQUIREMENT_TYPE` al mapear documentos de Firestore y se actualizan en bloque los que no tenían el campo.
  - Los filtros de visibilidad usan `REQUIREMENT_TYPES` para decidir cuándo aplicar el filtrado.
  - El modal y la tabla usan las opciones de tipo preconfiguradas para edición consistente.
- **Cambios en el Modelo de Datos:**
  - Se añadió el campo `requirementType` (string) a los documentos `tasks` en Firestore; los registros existentes se inicializan como “Desarrollo”.

## 3. Cambios Visibles para el Usuario

- El formulario de requisito muestra un selector “Tipo” con opciones Desarrollo/Seguimiento, preseleccionando Desarrollo y guardándolo en cada alta o edición.
- La tabla incluye una columna “Tipo” editable y filtros (texto y panel de visibilidad) para segmentar requisitos por tipo.
- Exportaciones CSV ahora incluyen la columna de tipo.

## 4. Cómo Probar

1. Abrir “Nuevo Requisito”: verificar que el selector “Tipo” aparece y está en “Desarrollo”. Crear un requisito y comprobar en la tabla que queda con tipo Desarrollo.
2. Editar un requisito existente y cambiar el tipo a Seguimiento: guardar y validar que la tabla refleja el cambio.
3. Usar el filtro de texto “Tipo” y el panel de “Opciones de Visualización” para mostrar solo Seguimiento: la tabla debe ocultar los demás.
4. Exportar a CSV y confirmar que la columna “Tipo” contiene el valor guardado para cada requisito.
