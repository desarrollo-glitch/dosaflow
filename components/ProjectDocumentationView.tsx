import React from 'react';

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-8 mb-4 border-b-2 border-brand-primary pb-2">{children}</h2>
);

const SubTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mt-6 mb-3">{children}</h3>
);

const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm text-gray-800 dark:text-gray-200 my-4">
        <code>{children}</code>
    </pre>
);

const ListItem: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <li className="mt-2">
        <strong className="text-gray-800 dark:text-gray-200">{title}:</strong> {children}
    </li>
);

export const ProjectDocumentationView: React.FC = () => {
    return (
        <div className="p-4 sm:p-6 lg:p-8 text-gray-700 dark:text-gray-300 max-w-4xl mx-auto">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">Documentación del Proyecto: Kanban Planner Pro</h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Este documento proporciona una descripción detallada y técnica de la aplicación "Kanban Planner Pro". El objetivo es servir como una guía completa de su arquitectura, funcionalidades y modelo de datos, y como base para generar un prompt de IA capaz de replicar el proyecto.
            </p>

            <SectionTitle>1. Resumen del Proyecto</SectionTitle>
            <p>
                Kanban Planner Pro es una herramienta de gestión de proyectos estilo Kanban diseñada para equipos de desarrollo de software. Permite planificar, seguir y gestionar requisitos, asignaciones de desarrolladores y plazos a través de múltiples vistas interactivas. La aplicación utiliza Firebase/Firestore como backend, asegurando la sincronización de datos en tiempo real y la persistencia en la nube.
            </p>
            <p className="font-semibold mt-2">Tecnologías Clave:</p>
            <ul className="list-disc list-inside">
                <li><strong>Framework:</strong> React 19 con TypeScript</li>
                <li><strong>Estilos:</strong> Tailwind CSS</li>
                <li><strong>Gestión de Estado:</strong> React Hooks (`useState`, `useEffect`, `useMemo`)</li>
                <li><strong>Base de Datos:</strong> Firebase Firestore</li>
                <li><strong>Autenticación:</strong> Firebase Auth</li>
                <li><strong>Módulos:</strong> ES6 Modules con `importmap` (sin bundler)</li>
            </ul>

            <SectionTitle>2. Modelo de Datos (Estructura en Firestore)</SectionTitle>
            <p>
                La aplicación utiliza Firestore para almacenar todos los datos. La estructura sigue un modelo de subcolecciones dentro de un documento principal para mantener los datos organizados.
            </p>

            <SubTitle>tasks</SubTitle>
            <p>Almacena la información de cada requisito o tarea. El ID del documento es el ID del requisito (ej: "1", "2", etc.).</p>
            <CodeBlock>{`
// task document in 'tasks' collection
{
  id: "1",
  requirement: "Implementar login de usuario",
  moduleId: "3", // ref to 'modules' collection
  targetId: "1", // ref to 'targets' collection
  platformId: "2", // ref to 'platforms' collection
  statusId: "2", // ref to 'managedStatuses' collection
  link: "http://...",
  startDate: "2023-10"
}
            `}</CodeBlock>

            <SubTitle>task_assignments</SubTitle>
            <p>Almacena la relación entre tareas y programadores. Permite asignaciones múltiples.</p>
            <CodeBlock>{`
// assignment document in 'task_assignments' collection
{
  id: "101",
  taskId: "1", // ref to 'tasks' collection
  programmerId: "5", // ref to 'programmers' collection
  endDate: "2023-11"
}
            `}</CodeBlock>

            <SubTitle>subtasks</SubTitle>
            <p>Almacena las subtareas asociadas a un requisito principal.</p>
            <CodeBlock>{`
// subtask document in 'subtasks' collection
{
  id: "201",
  parentId: "1", // ref to 'tasks' collection (the parent task)
  text: "Crear formulario de login",
  completed: true
}
            `}</CodeBlock>
            
            <SubTitle>activity_log</SubTitle>
            <p>Registra un historial de todos los cambios importantes realizados en la aplicación.</p>
            <CodeBlock>{`
// log document in 'activity_log' collection
{
  id: "301",
  taskId: "1",
  taskRequirement: "Implementar login de usuario",
  user: "developer@example.com",
  timestamp: "2023-10-28T10:00:00.000Z",
  action: "Requisito Actualizado",
  details: "Cambió estado de 'En proceso' a 'En testeo'."
}
            `}</CodeBlock>
            
            <SubTitle>programmers, modules, platforms, targets, managedStatuses</SubTitle>
            <p>Colecciones que guardan listas de elementos gestionables (nombre y color) para categorizar tareas y rellenar selectores.</p>

            <SectionTitle>3. Componentes Globales y Vistas Principales</SectionTitle>
            
            <SubTitle>Header (Cabecera)</SubTitle>
            <p>La barra superior persistente que contiene las acciones globales de la aplicación.</p>
            <ul>
                <ListItem title="Botón de Menú (Hamburguesa)">Expande o contrae la barra lateral de navegación.</ListItem>
                <ListItem title="Gestión de Usuario">Muestra el email del usuario logueado y un botón para cerrar sesión.</ListItem>
                <ListItem title="Selector de Tema (Sol/Luna)">Un interruptor para cambiar entre el modo claro y oscuro.</ListItem>
                <ListItem title="Botones de Importar/Exportar CSV">Permiten la carga y descarga masiva de datos en formato CSV.</ListItem>
                <ListItem title="Botón 'Añadir Requisito'">Abre el modal de creación de tareas.</ListItem>
            </ul>
            
            <SubTitle>Sidebar (Barra Lateral)</SubTitle>
            <p>El menú de navegación principal para cambiar entre las diferentes vistas. Contiene enlaces a todas las vistas, incluyendo el nuevo "Registro Actividad".</p>

            <SectionTitle>4. Descripción Detallada de las Vistas</SectionTitle>

            <SubTitle>Dashboard, Tabla, Kanban, Planificador, Gestión DB, Sugerencias</SubTitle>
            <p>La funcionalidad de estas vistas permanece como se describió anteriormente. La principal mejora visual es la **inclusión de un indicador de progreso de subtareas** (ej: ✅ 2/5) en las tarjetas de Kanban, las filas de la Tabla y las "píldoras" del Planificador.</p>

            <SubTitle>Modal de Tarea (AddTaskModal)</SubTitle>
            <p>Este modal ha sido expandido para incluir una sección de "Subtareas". Cuando se está editando un requisito existente, esta sección permite:</p>
            <ul>
                <ListItem title="Añadir Subtareas">Un campo de texto y un botón para añadir nuevas subtareas a la lista.</ListItem>
                <ListItem title="Marcar como Completada">Un checkbox junto a cada subtarea para cambiar su estado completado/pendiente.</ListItem>
                <ListItem title="Eliminar Subtareas">Un botón para eliminar una subtarea.</ListItem>
            </ul>

            <SubTitle>Registro Actividad (Nueva Vista)</SubTitle>
            <p><strong>Propósito:</strong> Proporcionar un historial completo y auditable de todas las acciones significativas dentro de la aplicación.</p>
            <p className="font-semibold mt-2">Elementos y Funcionalidades:</p>
            <ul>
                <ListItem title="Lista Cronológica">Muestra una lista de eventos, del más reciente al más antiguo.</ListItem>
                <ListItem title="Detalle del Evento">Cada entrada en la lista muestra:
                    <ul>
                        <li>El tipo de acción (ej: "Requisito Creado", "Subtarea Actualizada").</li>
                        <li>El requisito afectado (nombre e ID).</li>
                        <li>Una descripción detallada del cambio.</li>
                        <li>El usuario que realizó la acción y la fecha/hora exacta.</li>
                    </ul>
                </ListItem>
            </ul>
        </div>
    );
};