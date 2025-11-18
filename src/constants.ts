import { Status, Suggestion, RequirementType } from './types';

export const INITIAL_STATUS_CONFIG: Record<Status, { color: string; name: string }> = {
    'Sin asignar': { color: '#9CA3AF', name: 'Sin asignar' }, // gray-400
    'Asignado': { color: '#3B82F6', name: 'Asignado' }, // blue-500
    'En proceso': { color: '#F59E0B', name: 'En proceso' }, // amber-500
    'Retrasado': { color: '#EF4444', name: 'Retrasado' }, // red-500
    'En testeo': { color: '#8B5CF6', name: 'En testeo' }, // violet-500
    'Finalizado': { color: '#10B981', name: 'Finalizado' }, // emerald-500
    'Descartado': { color: '#6B7280', name: 'Descartado' }, // gray-500
};

export const REQUIREMENT_TYPE_OPTIONS = [
    { id: 'tipo-desarrollo', docId: 'tipo-desarrollo', name: 'Desarrollo', color: '#0EA5E9' },
    { id: 'tipo-seguimiento', docId: 'tipo-seguimiento', name: 'Seguimiento', color: '#8B5CF6' },
] as const;

export const REQUIREMENT_TYPES: RequirementType[] = REQUIREMENT_TYPE_OPTIONS.map(option => option.name);
export const DEFAULT_REQUIREMENT_TYPE: RequirementType = 'Desarrollo';

const categorizedSuggestionTexts: Record<string, string[]> = {
    "UI/UX y Experiencia de Usuario": [
        "Implementar un modo oscuro para mejorar la visualización en entornos con poca luz.",
        "Implementar un 'Command Palette' (Ctrl+K) para acceso rápido a acciones.",
        "Añadir atajos de teclado para las acciones más comunes (crear tarea, cambiar estado, etc.).",
        "Mejorar las animaciones y transiciones de la interfaz para una experiencia más fluida.",
        "Permitir a los usuarios personalizar los colores de los estados.",
        "Añadir un 'modo zen' o 'focus' que oculte elementos de la UI para evitar distracciones.",
        "Añadir un tour de bienvenida o guía interactiva para nuevos usuarios.",
        "Permitir colapsar/expandir columnas en la vista Kanban.",
        "Añadir un 'modo compacto' en las vistas para mostrar más información en pantallas pequeñas.",
        "Añadir un 'modo presentación' para las reuniones de seguimiento.",
        "Permitir a los usuarios personalizar las columnas visibles en la vista de tabla.",
        "Mejorar la accesibilidad de la aplicación siguiendo los estándares WCAG."
    ],
    "Funcionalidad Principal": [
        "Añadir la funcionalidad de subtareas dentro de un requisito principal.",
        "Crear una vista de diagrama de Gantt para visualizar la línea de tiempo del proyecto.",
        "Permitir la asignación de múltiples programadores a un mismo requisito.",
        "Añadir la posibilidad de adjuntar archivos a los requisitos (documentos, imágenes, etc.).",
        "Crear un dashboard principal personalizable con widgets de estadísticas.",
        "Añadir prioridades a los requisitos (Baja, Media, Alta, Urgente).",
        "Añadir un campo de 'horas estimadas' y 'horas reales' a cada requisito.",
        "Crear una vista de calendario para visualizar las fechas de inicio y fin de los requisitos.",
        "Implementar un sistema de control de versiones o historial de cambios para cada requisito.",
        "Permitir la creación de plantillas de requisitos para tareas repetitivas.",
        "Añadir un sistema de etiquetas o tags personalizables para categorizar los requisitos.",
        "Implementar la funcionalidad de arrastrar y soltar para reordenar la prioridad en la vista de tabla.",
        "Crear un sistema de 'sprints' o iteraciones para metodologías ágiles.",
        "Añadir un campo para 'dependencias' entre requisitos (ej: REQ-02 depende de REQ-01).",
        "Habilitar la edición en línea de múltiples campos en la vista de tabla (bulk editing).",
        "Crear campos personalizados para los requisitos (ej: URL de staging, versión afectada).",
        "Crear un 'basurero' para requisitos eliminados con opción de restaurarlos.",
        "Permitir la importación/exportación de datos en formato JSON.",
        "Añadir un campo para el 'cliente' o 'stakeholder' asociado al requisito.",
        "Implementar un sistema de 'OKRs' (Objectives and Key Results) y vincular requisitos.",
        "Añadir una vista de 'matriz de Eisenhower' para priorizar tareas (Urgente/Importante).",
        "Implementar un sistema de 'time tracking' integrado para registrar el tiempo en cada tarea.",
        "Añadir un sistema de 'bloqueo' de requisitos para indicar impedimentos.",
        "Permitir arrastrar y soltar para adjuntar archivos directamente en las tarjetas.",
        "Añadir un changelog o registro de cambios de la propia aplicación.",
        "Permitir la creación de 'epics' o historias de usuario que agrupen varios requisitos.",
        "Permitir la fusión de requisitos duplicados.",
        "Añadir una vista de 'mapa mental' para la planificación inicial de ideas.",
        "Implementar 'WIP limits' (Work In Progress) en las columnas del Kanban.",
        "Añadir un campo de 'versión de la app' donde se desplegará el requisito.",
        "Crear un 'icebox' o congelador para ideas o requisitos que no se abordarán a corto plazo."
    ],
    "Colaboración y Comunicación": [
        "Integrar un sistema de comentarios en cada tarjeta de requisito para facilitar la comunicación.",
        "Añadir un sistema de menciones (@programador) en los comentarios.",
        "Añadir un 'swimlane' (carril) por programador en la vista Kanban.",
        "Generar automáticamente un email de resumen diario/semanal con el progreso.",
        "Añadir una vista de 'Mis Tareas' para que cada programador vea solo lo que tiene asignado.",
        "Añadir un campo de 'Revisor' o 'QA asignado' a los requisitos.",
        "Permitir a los usuarios suscribirse a requisitos específicos para recibir notificaciones detalladas.",
        "Añadir una sección de 'lecciones aprendidas' o retrospectiva por proyecto/sprint.",
        "Implementar un sistema de encuestas rápidas para la toma de decisiones del equipo."
    ],
    "Integraciones y Extensibilidad": [
        "Integración con repositorios de Git (GitHub, GitLab) para vincular commits y pull requests.",
        "Integración con Slack o Microsoft Teams para enviar notificaciones.",
        "Sincronización en tiempo real entre diferentes usuarios usando WebSockets.",
        "Integración con Google Calendar / Outlook para sincronizar las fechas de entrega.",
        "Crear una API pública para que otras herramientas puedan interactuar con el planificador.",
        "Integración con herramientas de CI/CD para actualizar el estado de un requisito automáticamente.",
        "Integración con herramientas de diseño como Figma o Sketch para previsualizar mockups.",
        "Implementar un sistema de 'webhooks' para notificar a sistemas externos sobre cambios."
    ],
    "IA y Automatización": [
        "Sugerencia de asignación de programador basada en la carga de trabajo y habilidades (IA).",
        "Detección automática de requisitos en riesgo o potenciales retrasos (IA).",
        "Estimación automática de tiempo para nuevos requisitos basada en datos históricos (IA).",
        "Analizar el texto de los requisitos para sugerir módulos o etiquetas automáticamente (IA).",
        "Crear un bot que responda preguntas sobre el estado del proyecto (ej: '¿En qué está trabajando Ana?')."
    ],
    "Informes y Analíticas": [
        "Crear reportes de rendimiento por programador o por módulo.",
        "Permitir la exportación de vistas (Tabla, Kanban) a PDF.",
        "Crear un gráfico 'Burndown' para el seguimiento del progreso en los sprints.",
        "Permitir la visualización de la carga de trabajo de cada programador.",
        "Crear un gráfico de 'velocidad del equipo' (velocity chart) para sprints.",
        "Añadir un gráfico de distribución de tareas por estado, módulo o programador.",
        "Añadir un sistema de 'salud del proyecto' basado en métricas clave.",
        "Añadir una calculadora de costes de proyecto basada en las horas de los programadores."
    ],
    "Rendimiento y Calidad": [
        "Optimizar la aplicación para que funcione offline como una PWA (Progressive Web App).",
        "Optimizar la carga inicial de la aplicación (code splitting, lazy loading).",
        "Crear un 'sandbox' o entorno de pruebas para probar nuevas funcionalidades sin afectar los datos reales."
    ],
    "Administración y Seguridad": [
        "Implementar un sistema de roles y permisos de usuario (Admin, Programador, Invitado).",
        "Implementar autenticación de dos factores (2FA) para mayor seguridad.",
        "Permitir archivar proyectos o módulos antiguos para no saturar la vista principal.",
        "Generar un enlace público (de solo lectura) para compartir el estado de un proyecto.",
        "Añadir una sección de 'recursos' para gestionar programadores y sus habilidades.",
        "Permitir la personalización del formato de ID de los requisitos (ej: PROJ-101)."
    ]
};

export const INITIAL_SUGGESTIONS: Omit<Suggestion, 'id' | 'docId'>[] = Object.entries(categorizedSuggestionTexts).flatMap(([category, texts]) =>
    texts.map(text => ({
        text,
        category,
        status: 'pending' as const,
    }))
);

export const AUTO_APPROVED_EMAILS: string[] = [
    'kikepradas@gmail.com',
    'jojedajurado@gmail.com',
];
