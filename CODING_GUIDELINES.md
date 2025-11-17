# Guía de Estilo y Normas de Programación

Este documento sirve como la "fuente de la verdad" para las convenciones, patrones y mejores prácticas a seguir en el desarrollo de este proyecto. El objetivo es mantener un código limpio, consistente y mantenible.

## 0. Filosofía General

- **KISS (Keep It Simple, Stupid):** Prefiere soluciones simples y claras sobre las complejas.
- **DRY (Don't Repeat Yourself):** Evita la duplicación de código. Reutiliza componentes y funciones siempre que sea posible.
- **Código Autocomentado:** Nombra variables, funciones y componentes de forma descriptiva para que el código sea fácil de entender sin necesidad de comentarios excesivos.

---

## 1. Frontend (React + TypeScript)

### 1.1. Componentes
- **Componentes Funcionales:** Utiliza siempre componentes funcionales con Hooks de React.
- **Tipado de Props:** Todas las props de los componentes deben estar explícitamente tipadas con una `interface` o `type`.
- **Nombrado:** Los ficheros de componentes deben usar `PascalCase` (ej: `KanbanCard.tsx`).
- **Desestructuración:** Desestructura las props en la firma de la función.
- **Índice de Componentes:** Considera crear un `index.ts` en el directorio de componentes para exportaciones centralizadas.

### 1.2. Gestión de Estado
- **`useState`:** Para estados simples y locales de un componente (cadenas, booleanos, números).
- **`useReducer`:** Para estados más complejos o cuando la lógica de transición de estado es no trivial (similar a Redux pero a nivel de componente).
- **Evita `useEffect` para lógica compleja:** Si un `useEffect` se vuelve muy complejo, considera abstraer la lógica a un custom hook.

### 1.3. Estilos
- **Tailwind CSS:** Se utilizará el enfoque "utility-first" de Tailwind para todos los estilos.
- **Clases Condicionales:** Usa plantillas literales (template literals) para aplicar clases de forma condicional y mantener la legibilidad.
- **Colores:** Utiliza los colores definidos en `tailwind.config` (`brand-primary`, `brand-secondary`) para mantener la consistencia de la marca.

### 1.4. Nombrado de Ficheros y Variables
- **Componentes:** `PascalCase.tsx` (ej. `MyComponent.tsx`)
- **Hooks:** `camelCase.ts` (ej. `useMyHook.ts`)
- **Utilidades/Servicios:** `camelCase.ts` (ej. `apiClient.ts`)
- **Variables y Funciones:** `camelCase`.
- **Constantes:** `UPPER_SNAKE_CASE`.

### 1.5. Accesibilidad (A11Y)
- **HTML Semántico:** Utiliza etiquetas HTML semánticas (`<nav>`, `<main>`, `<button>`, etc.) siempre que sea posible.
- **Atributos ARIA:** Añade roles y atributos ARIA cuando sea necesario para mejorar la accesibilidad de componentes complejos.
- **Labels:** Todos los inputs de formulario deben tener una `<label>` asociada.

---

## 2. Backend (Ejemplo: Node.js + Express)

*(Esta sección es un ejemplo para cuando se desarrolle un backend)*

### 2.1. Arquitectura
- Se seguirá una arquitectura en capas:
  1.  **Routes:** Define los endpoints de la API.
  2.  **Controllers:** Maneja la lógica de `request` y `response`. Valida la entrada.
  3.  **Services:** Contiene la lógica de negocio.
  4.  **Data Access Layer (DAL):** Interactúa con la base de datos.

### 2.2. API
- **RESTful:** Diseña los endpoints siguiendo los principios REST.
- **JSON:** Todas las respuestas de la API deben ser en formato JSON.
- **Errores:** Utiliza códigos de estado HTTP apropiados y devuelve mensajes de error claros en formato JSON.

### 2.3. Seguridad
- **Variables de Entorno:** Nunca guardes credenciales o claves secretas en el código. Usa ficheros `.env`.
- **Validación de Entradas:** Valida y sanitiza todas las entradas del usuario para prevenir inyecciones (SQL, XSS, etc.).

---

## 3. Firebase / Firestore

### 3.1. Estructura de Datos
- La estructura principal para los datos de la aplicación es:
  - Colección: `PLANIFICADOR`
  - Documento: `data`
  - Subcolecciones: `tasks`, `programmers`, `modules`, etc.
- Esto asegura que todas las colecciones tienen un número impar de segmentos en su ruta.

### 3.2. Acceso a Datos
- **Centralización:** Toda la lógica de interacción con Firestore debe residir en `src/utils/firestore.ts`. Los componentes no deben importar `firebase/firestore` directamente.
- **Funciones Genéricas:** Utiliza funciones genéricas como `getAllFromCollection` para reducir la duplicación de código.

### 3.3. Transacciones
- Para operaciones que impliquen múltiples escrituras o lecturas/escrituras que deban ser atómicas (como el importador de CSV o la gestión de contadores), utiliza `runTransaction`.

---

## 4. Git y Control de Versiones

### 4.1. Mensajes de Commit
- Se seguirá la especificación de [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
- **Formato:** `<tipo>(<ámbito opcional>): <descripción>`
- **Ejemplos:**
  - `feat(planner): add drag and drop functionality`
  - `fix(table): correct sorting for date columns`
  - `docs(readme): update setup instructions`
  - `style(header): adjust button spacing`
  - `refactor(db): simplify data fetching logic`
  - `chore(deps): upgrade react to v19`

### 4.2. Ramas
- **`main`:** Rama principal, refleja el código en producción. Solo se mezcla desde `develop` para nuevos lanzamientos.
- **`develop`:** Rama de integración. Todo el nuevo desarrollo se fusiona aquí.
- **Ramas de funcionalidad:** `feat/nombre-funcionalidad`, `fix/nombre-arreglo`, etc. Se crean a partir de `develop` y se fusionan de nuevo en `develop` mediante Pull Requests.

---

## 5. Documentación de Tareas Completadas

Para mantener la consistencia y asegurar que el conocimiento del proyecto crezca con cada desarrollo, es **esencial** documentar cada tarea una vez que se completa. Esta documentación debe ser concisa y enfocada en ser útil para futuros desarrolladores (incluida una IA).

### Plantilla de Documentación de Tarea

Utiliza la siguiente plantilla Markdown como base para documentar cada requisito finalizado. Es crucial rellenar todos los campos, especialmente la **fecha de finalización**, para mantener un historial preciso. Esta documentación puede vivir en una wiki interna o en un directorio `docs/` dentro del proyecto.

```markdown
# Documentación: [ID_TAREA] - [TÍTULO_TAREA]

**Fecha de Finalización:** AAAA-MM-DD
**Autor:** [Nombre del Programador]
**Estado:** Finalizado

## 1. Objetivo

*¿Qué problema resuelve esta tarea o qué valor aporta?*
(Ej: Implementar la autenticación de usuarios con Firebase para proteger el acceso a la aplicación.)

## 2. Enfoque Técnico

*Descripción de la implementación. ¿Qué ficheros o componentes fueron clave?*
- **Componentes Creados/Modificados:**
  - `LoginView.tsx`: Se creó este componente para manejar el formulario de inicio de sesión y registro.
  - `AuthContext.tsx`: Nuevo contexto de React para gestionar el estado de autenticación globalmente.
  - `App.tsx`: Modificado para mostrar `LoginView` o el contenido principal según el estado del usuario.
- **Lógica Clave:**
  - Se utilizaron las funciones `signInWithEmailAndPassword` y `createUserWithEmailAndPassword` de Firebase.
  - La gestión de errores se centralizó para mostrar mensajes claros al usuario.
- **Cambios en el Modelo de Datos:**
  - No hubo cambios en el modelo de datos de Firestore, ya que Firebase Authentication gestiona los usuarios de forma separada.

## 3. Cambios Visibles para el Usuario

*¿Qué ve el usuario de nuevo o diferente?*
- Una nueva pantalla de inicio de sesión al acceder a la aplicación por primera vez.
- Un botón de "Cerrar Sesión" en la cabecera una vez que el usuario ha iniciado sesión.
- Mensajes de error si las credenciales son incorrectas.

## 4. Cómo Probar

*Pasos sencillos para verificar que la funcionalidad está correcta.*
1. Ve a la página principal sin haber iniciado sesión. Deberías ver el formulario de login.
2. Intenta registrar un nuevo usuario. Deberías ser redirigido a la aplicación principal.
3. Cierra sesión. Deberías volver a la pantalla de login.
4. Inicia sesión con el usuario que acabas de crear.
```

Este enfoque estructurado no solo ayuda al mantenimiento del código, sino que también crea un registro invaluable del "porqué" detrás de las decisiones técnicas, facilitando la incorporación de nuevos miembros al equipo y la colaboración con asistentes de IA.

---

## 6. Documentación de Módulos

Además de la documentación por tarea, es crucial documentar los módulos principales de la aplicación para tener una visión de alto nivel de la arquitectura. Se debe crear un documento por cada módulo principal (ej: en una carpeta `docs/modules/`).

### Plantilla de Documentación de Módulo

```markdown
# Módulo: [Nombre del Módulo]

**Versión:** 1.0
**Responsable Principal:** [Nombre del Programador o Equipo]
**Fecha de Última Actualización:** AAAA-MM-DD

## 1. Propósito y Responsabilidades

*¿Cuál es la función principal de este módulo dentro de la aplicación? ¿Qué problemas de negocio o de usuario resuelve?*

(Ejemplo para el módulo "Planificador": "Este módulo proporciona una vista de planificación a largo plazo, permitiendo a los gestores de proyecto asignar tareas a los programadores en una línea de tiempo mensual. Su objetivo principal es visualizar la carga de trabajo y los plazos a nivel macro.")

## 2. Componentes Clave

*Lista de los componentes de React más importantes que conforman este módulo y una breve descripción de su función.*

- **`PlannerView.tsx`**: Componente principal que renderiza la matriz de planificación.
- **`PlannerTaskSelectorModal.tsx`**: Modal que se abre para seleccionar y asignar tareas a un programador en un mes específico.
- **[Otro componente relevante]**: ...

## 3. Lógica de Negocio y Flujos de Datos

*¿Dónde reside la lógica más importante? ¿Cómo interactúa con los datos (Firestore)?*

- La lógica para agrupar las tareas por programador y mes se encuentra en `PlannerView.tsx` dentro de un `useMemo` para optimizar el rendimiento.
- El módulo lee las colecciones `tasks`, `programmers` y `task_assignments` de Firestore.
- La funcionalidad de arrastrar y soltar (`onTaskMove`) modifica los documentos en `task_assignments` para cambiar la fecha de fin o el programador asignado.

## 4. Interacción con Otros Módulos

*¿Cómo se conecta este módulo con otras partes de la aplicación? ¿Tiene dependencias?*

- El módulo "Planificador" es mayormente independiente, pero utiliza el modal `TaskModal` (compartido con otras vistas) cuando se hace clic para editar una tarea.
- Los datos que muestra dependen de la información gestionada en el módulo de "Gestión DB" (listas de programadores, etc.).

## 5. Variables de Configuración o Constantes

*¿Hay alguna configuración especial o constantes importantes para este módulo?*

- Se utiliza una constante para determinar el inicio del "curso académico" (septiembre) para generar las columnas de los meses.
```

---

## 7. Interacción con la IA

Para asegurar que la IA genere código que se adhiera a estas guías:
1.  **Proporciona este fichero como contexto:** Antes de pedirle que genere código, dile: "Usando las directrices del fichero `CODING_GUIDELINES.md` que te he proporcionado...".
2.  **Sé específico en tus peticiones:** En lugar de "Crea un componente", di: "Crea un componente funcional de React en TypeScript llamado `UserProfileCard` que siga nuestras guías de estilo. Debe aceptar estas props: `interface UserProfileCardProps { ... }`".
3.  **Itera y Corrige:** Si la IA genera código que no sigue las normas, corrígelo y explícale por qué: "El código es correcto, pero según nuestras guías, las props deben desestructurarse en la firma de la función. Por favor, ajústalo".