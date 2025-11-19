# Módulo: Planificador de Desarrollos (DosaFlow)

**Versión:** 1.0  
**Responsable Principal:** Jose Ojeda  
**Fecha de Última Actualización:** 2025-11-17

## 1. Propósito y Responsabilidades

La aplicación DosaFlow centraliza la planificación estratégica y operativa de los requisitos de desarrollo de DOSA. Reúne las vistas necesarias para seguir el ciclo de vida de cada requisito (dashboard, tabla, kanban, planificador temporal) y expone utilidades para administrar catálogos maestros, adjuntar evidencia, registrar actividad y nutrir la documentación del proyecto. Este módulo también actúa como front-end completo: gestiona la autenticación de usuarios (Firebase Auth), sincroniza datos en Firestore/Storage, genera bitácoras diarias y actas de reuniones con ayuda de Gemini, y expone prompts reutilizables para que la IA continúe evolucionando el producto.

Responsabilidades principales:
- Unificar la visualización de requisitos, programadores, módulos, plataformas, estados y objetivos en múltiples layouts interactivos.
- Garantizar la consistencia del dato usando Firestore como fuente única y manteniendo catálogos (programadores, módulos, destinos, estados, sugerencias).
- Automatizar tareas administrativas (bitácoras diarias, actas de reuniones, registro de auditoría) y ofrecer herramientas de apoyo a la toma de decisiones (Dashboard, Activity Log, panel de sugerencias).
- Servir como hub de conocimiento: documentación in-app, enlaces, adjuntos, prompts listos para IA y exportaciones CSV para compartir el avance con otros sistemas.

## 2. Componentes Clave

- **`src/App.tsx`**: Punto neurálgico. Controla el flujo de autenticación (`useAuth`), descarga todo el dataset mediante `firestore.getAllData`, construye el modelo `Task` con `joinData`, aplica sort/filters, gestiona notificaciones y confirma acciones antes de escribir en Firestore/Storage.
- **Cabecera y navegación (`components/Header.tsx`, `components/Sidebar.tsx`)**: Ofrecen acciones globales (modo oscuro, exportación CSV, logout) y navegación entre vistas principales y utilidades, incluyendo flyout para accesos rápidos cuando la barra lateral está colapsada.
- **Creación/edición (`components/AddTaskModal.tsx`, `components/PlannerTaskSelectorModal.tsx`, `components/ConfirmationModal.tsx`)**: Formularios completos para requisitos con subtareas, adjuntos y asignaciones múltiples; el modal del planificador permite asignar por lotes en una línea temporal específica.
- **Vistas operativas (`components/TableView.tsx`, `components/KanbanBoard.tsx`, `components/DashboardView.tsx`)**: Presentan el mismo dataset en diferentes formatos para análisis detallado, drag & drop de estados y KPIs agregados.
- **`components/PlannerView.tsx`**: Gantt mensual por programador con píldoras redimensionables y arrastrables; dispara reasignaciones y cambios de fechas directamente contra Firestore y Activity Log.
- **`components/DailyLogView.tsx`, `components/DailyLogModal.tsx`, `components/DailySummaryModal.tsx`**: Calendario mensual/semanal/diario para registrar partes de trabajo, invocar la IA que resume texto libre y abrir los flujos de reuniones relacionados con cada día.
- **Gestión de reuniones (`components/MeetingsView.tsx`, `components/MeetingLogModal.tsx`, `components/MeetingDetailsModal.tsx`, `components/MeetingCard.tsx`)**: Formularios y listados para actas generadas con Gemini a partir de notas libres, incluyendo tareas accionables con responsables.
- **Backoffice (`components/DbManagementView.tsx`, `components/SimpleManagementCard.tsx`, `components/StatusManagementCard.tsx`)**: UI CRUD para catálogos maestros (programadores, módulos, plataformas, targets, estados).
- **`components/FilestoreView.tsx`**: Explorador editable de subcolecciones `PLANIFICADOR/data/*` que usa `getAllFromCollection` y `updateDocument` para manipular documentos sin salir de la app.
- **`components/SuggestionsView.tsx` & `components/ApplySuggestionModal.tsx`**: Tablero categorizado de iniciativas (seed inicial en `INITIAL_SUGGESTIONS`) con flujos para cambiar su estado y generar prompts aprovechables por IA.
- **`components/ProjectDocumentationView.tsx` y `components/ActivityLogView.tsx`**: Refuerzan la gobernanza mostrando documentación viva, lineamientos y un timeline auditable de acciones.

## 3. Lógica de Negocio y Flujos de Datos

- **Autenticación y bootstrap:** `main.tsx` envuelve la app con `AuthProvider`; `src/App.tsx` condiciona la UI entre `LoadingScreen`, `LoginView` y `AppContent`. Se usa Firebase Auth (`utils/auth.ts`) con email/password o Google, y `Header` muestra el usuario activo con opción de logout.
- **Sincronización con Firestore:** `refreshData` llama a `firestore.getAllData`, que agrupa colecciones (`tasks`, `task_assignments`, `programmers`, etc.) bajo la ruta `PLANIFICADOR/data`. Los docs crudos se transforman en `Task` mediante `joinData`, que combina assignments, módulos, plataformas, targets y estados para mostrar nombres coloreados.
- **Gestión CRUD de requisitos:** `handleSaveTask` traduce los nombres seleccionados en IDs de catálogo y usa `firestore.saveTask`, que crea/actualiza el documento principal y sus subcolecciones de asignaciones en un batch atómico. Cada alta/cambio alimenta `ActivityLog` a través de `firestore.addActivityLog`, permitiendo reconstruir quién hizo qué y cuándo.
- **Planificador drag & drop:** `PlannerView` genera píldoras con handles para redimensionar. Eventos `onTaskMove` y `onTaskResize` recalculan asignaciones/fechas, invocan `firestore.saveTask` o `firestore.updateTaskDoc` y registran la acción. También existe `handleAssignToPlanner` para crear asignaciones masivas desde el selector modal.
- **Archivos y subtareas:** `AddTaskModal` permite adjuntar archivos, que se suben a Storage mediante `utils/storage.uploadFile` (ruta `attachments/<taskId>/...`). El archivo guarda `storagePath` para poder eliminarlo luego con `deleteFile`. Las subtareas se mantienen dentro de cada doc `TaskDoc.subtasks` y su progreso se muestra en Kanban/Planner/SubtaskProgress.
- **Utilidades administrativas:** `DbManagementView` y `FilestoreView` reusan las operaciones `addManagedItem`, `updateManagedItem`, `deleteManagedItem` o `updateDocument` para mantener catálogos sanos; `SimpleManagementCard` traduce las acciones del usuario a dichas operaciones.
-- **Bitácoras, reuniones y IA:** `DailyLogView` recopila logs manuales o dispara `handleProcessDailySummary`, que envía el resumen del día a Gemini (`@google/genai`) y guarda cada entrada con `firestore.saveDailyLog`. `MeetingsView` hace lo propio con notas de reunión (`handleProcessMeeting`), generando `MeetingDoc` con resumen, conclusiones, decisiones y tareas. Ambos flujos dependen de la variable de entorno del API Key (`VITE_GEMINI_API_KEY`) y fallan con mensajes amigables si la IA no responde.
- **Sugerencias y prompts:** `INITIAL_SUGGESTIONS` en `src/constants.ts` precarga un backlog de mejoras. Los estados se editan mediante `firestore.updateSuggestion` y el modal de aplicación genera un prompt listo para copiar, manteniendo la cultura de IA-assistida descrita en `CODING_GUIDELINES.md`.
- **Exportaciones/documentación:** `handleExportCsv` construye y descarga un CSV con el snapshot actual de requisitos, mientras que `ProjectDocumentationView` renderiza la documentación canónica dentro de la propia app usando React.

## 4. Interacción con Otros Módulos

- **Infraestructura Firebase (`utils/firebase.ts`):** Proporciona las instancias de Auth, Firestore y Storage usadas por todos los flujos descritos. Sin inicializar este módulo no existe persistencia ni autenticación.
- **Contexto de autenticación (`contexts/AuthContext.tsx`):** El módulo principal depende de este contexto para saber cuándo mostrar el login o habilitar acciones críticas (por ejemplo, `handleAddActivityLog` valida `user.email` antes de auditar).
- **Integración con IA externa:** Los procesos de bitácora y reuniones requieren una API Key válida (expuesta como `VITE_GEMINI_API_KEY` en `.env.local`) para comunicarse con Gemini 2.5 Flash. La salida JSON se valida y, si es correcta, se transforma en documentos Firestore.
- **Documentación y tareas históricas (`docs/tasks/*`):** La vista `ProjectDocumentationView` y los flujos de sugerencias se apoyan en los lineamientos del repositorio (`CODING_GUIDELINES.md`) y en los registros existentes para mantener la trazabilidad de cada evolución.
- **Front-matter reutilizable:** `metadata.json` describe la app para AI Studio; el módulo lo consume de forma indirecta porque las vistas `Suggestions`/`Documentation` se usan como contexto cuando se pide a otra IA que continúe desarrollando la herramienta.

## 5. Variables de Configuración o Constantes

- **`customProgrammerOrder` (src/App.tsx):** Prioriza nombres concretos en el ordenado del planificador y tablas para que el layout siga la jerarquía interna del equipo.
- **`INITIAL_STATUS_CONFIG` y `INITIAL_SUGGESTIONS` (src/constants.ts):** Definen los colores por estado y la semilla de ideas de mejora que se cargan en Firestore si la colección está vacía.
- **`COLLECTIONS` (utils/firestore.ts):** Enumera todas las subcolecciones bajo `PLANIFICADOR/data`. La estructura (colección `PLANIFICADOR` → doc `data` → subcolecciones) garantiza rutas con número impar de segmentos, requisito de Firestore.
- **Variables de entorno:** `.env.local` debe exponer la API Key de Gemini mediante `VITE_GEMINI_API_KEY` (leída en `src/App.tsx`) para habilitar los procesamientos automáticos.
- **Constantes de UI:** `collectionSchemas` en `components/FilestoreView.tsx` describe los campos visibles por colección y `INITIAL_STATUS_CONFIG` asegura coherencia cromática en Kanban, Tablas y Planner.
- **Archivos locales críticos:** Para que el despliegue vía Vite/Firebase Hosting siga funcionando, no sobrescribas `firebase.json`, `.firebaserc`, `package-lock.json`, la carpeta `src/` (especialmente `src/main.tsx`, `src/contexts/AuthContext.tsx` y `src/components/*`) ni el `.env.local` cuando traigas cambios desde AI Studio; si se pierden, recrea la estructura actual antes de volver a compilar.
