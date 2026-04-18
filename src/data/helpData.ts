import { Role } from '@/types';

export interface TourStep {
  id: string;
  targetId: string; // DOM element ID to highlight
  title: { en: string; es: string };
  description: { en: string; es: string };
  icon: string; // SVG path
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export interface HelpTip {
  id: string;
  category: string;
  title: { en: string; es: string };
  description: { en: string; es: string };
  icon: string;
  roles: Role[]; // Which roles can see this tip
}

export interface HelpCategory {
  id: string;
  name: { en: string; es: string };
  icon: string;
  roles: Role[];
}

// ─── Tour Steps ─────────────────────────────────────────────

export const tourSteps: Record<string, TourStep[]> = {
  // Steps for ALL employees (Staff, Weekly Staff, Supervisor, Manager, HR Admin)
  common: [
    {
      id: 'welcome',
      targetId: 'tour-welcome-header',
      title: { en: 'Welcome to Your Portal! 👋', es: '¡Bienvenido a Tu Portal! 👋' },
      description: {
        en: 'This is your personal dashboard. Here you can see your status, upcoming events, and quick links to all portal features.',
        es: 'Este es tu panel personal. Aquí puedes ver tu estado, próximos eventos y accesos rápidos a todas las funciones del portal.',
      },
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    },
    {
      id: 'clock-status',
      targetId: 'tour-clock-status',
      title: { en: 'Your Work Status', es: 'Tu Estado Laboral' },
      description: {
        en: 'See if you\'re currently clocked in or resting. The green dot means you\'re working, and you can see your next shift here.',
        es: 'Mira si estás registrado o descansando. El punto verde significa que estás trabajando, y puedes ver tu próximo turno aquí.',
      },
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      id: 'clock-action',
      targetId: 'tour-clock-action',
      title: { en: 'Clock In / Clock Out', es: 'Entrada / Salida' },
      description: {
        en: 'Tap this button to clock in when you arrive or clock out when you leave. Location verification keeps everything accurate.',
        es: 'Toca este botón para registrar tu entrada cuando llegues o tu salida cuando te vayas. La verificación de ubicación mantiene todo exacto.',
      },
      icon: 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1',
    },
    {
      id: 'notifications',
      targetId: 'tour-notifications',
      title: { en: 'Notifications', es: 'Notificaciones' },
      description: {
        en: 'You\'ll see a badge here when you have new notifications — like request approvals, event tags, or birthday mentions.',
        es: 'Verás una insignia aquí cuando tengas nuevas notificaciones — como aprobaciones de solicitudes, etiquetas en eventos o menciones de cumpleaños.',
      },
      icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
    },
    {
      id: 'your-status',
      targetId: 'tour-your-status',
      title: { en: 'Your Status at a Glance', es: 'Tu Estado de un Vistazo' },
      description: {
        en: 'Check your pending trainings and requests here. Click "View All" to dive deeper into each section.',
        es: 'Revisa tus capacitaciones y solicitudes pendientes aquí. Haz clic en "Ver Todo" para profundizar en cada sección.',
      },
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    },
    {
      id: 'sidebar-nav',
      targetId: 'tour-sidebar-nav',
      title: { en: 'Navigation Menu', es: 'Menú de Navegación' },
      description: {
        en: 'Use the sidebar to access Culture Hub, Learning Center, Requests, Announcements, and Celebrations. On mobile, tap your profile picture to open it.',
        es: 'Usa la barra lateral para acceder al Centro Cultural, Centro de Aprendizaje, Solicitudes, Anuncios y Celebraciones. En móvil, toca tu foto de perfil para abrirlo.',
      },
      icon: 'M4 6h16M4 12h16M4 18h16',
    },
    {
      id: 'profile',
      targetId: 'tour-profile-link',
      title: { en: 'Your Profile', es: 'Tu Perfil' },
      description: {
        en: 'Tap your avatar to view and edit your profile — personal info, documents, preferences and more. Keep your documents updated!',
        es: 'Toca tu avatar para ver y editar tu perfil — información personal, documentos, preferencias y más. ¡Mantén tus documentos actualizados!',
      },
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    },
  ],

  // Additional steps for Managers & Supervisors
  manager: [
    {
      id: 'pending-approvals',
      targetId: 'tour-pending-approvals',
      title: { en: 'Team Approvals', es: 'Aprobaciones de Equipo' },
      description: {
        en: 'As a manager, you\'ll see pending approval requests from your team here. Review and approve vacation, absence, and other requests.',
        es: 'Como gerente, verás solicitudes de aprobación pendientes de tu equipo aquí. Revisa y aprueba vacaciones, ausencias y otras solicitudes.',
      },
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  ],

  // Additional steps for HR Admin
  admin: [
    {
      id: 'admin-panel',
      targetId: 'tour-admin-panel',
      title: { en: 'HR Command Center', es: 'Centro de Control de RR.HH.' },
      description: {
        en: 'Your command center for managing the entire hotel staff. Access the directory, hierarchy, trainings, events, recognition, and more.',
        es: 'Tu centro de control para gestionar todo el personal del hotel. Accede al directorio, jerarquía, capacitaciones, eventos, reconocimientos y más.',
      },
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    },
  ],
};

// ─── Help Center Tips ───────────────────────────────────────

export const helpCategories: HelpCategory[] = [
  {
    id: 'getting-started',
    name: { en: 'Getting Started', es: 'Primeros Pasos' },
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    roles: ['Staff', 'Weekly Staff', 'Supervisor', 'Manager', 'HR Admin'],
  },
  {
    id: 'daily-tasks',
    name: { en: 'Daily Tasks', es: 'Tareas Diarias' },
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    roles: ['Staff', 'Weekly Staff', 'Supervisor', 'Manager', 'HR Admin'],
  },
  {
    id: 'profile-docs',
    name: { en: 'Profile & Documents', es: 'Perfil y Documentos' },
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    roles: ['Staff', 'Weekly Staff', 'Supervisor', 'Manager', 'HR Admin'],
  },
  {
    id: 'requests',
    name: { en: 'Requests & Approvals', es: 'Solicitudes y Aprobaciones' },
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    roles: ['Staff', 'Weekly Staff', 'Supervisor', 'Manager', 'HR Admin'],
  },
  {
    id: 'learning',
    name: { en: 'Learning & Training', es: 'Aprendizaje y Capacitación' },
    icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222',
    roles: ['Staff', 'Weekly Staff', 'Supervisor', 'Manager', 'HR Admin'],
  },
  {
    id: 'culture',
    name: { en: 'Culture & Community', es: 'Cultura y Comunidad' },
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    roles: ['Staff', 'Weekly Staff', 'Supervisor', 'Manager', 'HR Admin'],
  },
  {
    id: 'team-management',
    name: { en: 'Team Management', es: 'Gestión de Equipo' },
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    roles: ['Supervisor', 'Manager', 'HR Admin'],
  },
  {
    id: 'admin-tools',
    name: { en: 'Admin Tools', es: 'Herramientas de Administración' },
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    roles: ['HR Admin'],
  },
];

export const helpTips: HelpTip[] = [
  // ─── Getting Started ─────────────────────
  {
    id: 'gs-1',
    category: 'getting-started',
    title: { en: 'Navigate the Dashboard', es: 'Navegar en el Panel' },
    description: {
      en: 'Your dashboard shows a snapshot of your status: pending trainings, requests, and upcoming events. Use the sidebar menu to navigate to specific sections.',
      es: 'Tu panel muestra un resumen de tu estado: capacitaciones pendientes, solicitudes y próximos eventos. Usa el menú lateral para navegar a secciones específicas.',
    },
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    roles: ['Staff', 'Weekly Staff', 'Supervisor', 'Manager', 'HR Admin'],
  },
  {
    id: 'gs-2',
    category: 'getting-started',
    title: { en: 'Change Your Language', es: 'Cambiar Tu Idioma' },
    description: {
      en: 'Tap the language selector (globe icon) in the top bar to switch between English and Spanish at any time.',
      es: 'Toca el selector de idioma (icono de globo) en la barra superior para cambiar entre Inglés y Español en cualquier momento.',
    },
    icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
    roles: ['Staff', 'Weekly Staff', 'Supervisor', 'Manager', 'HR Admin'],
  },
  {
    id: 'gs-3',
    category: 'getting-started',
    title: { en: 'Mobile Navigation', es: 'Navegación Móvil' },
    description: {
      en: 'On mobile, tap your profile picture in the top-right corner to open the sidebar menu. All the same options are available!',
      es: 'En móvil, toca tu foto de perfil en la esquina superior derecha para abrir el menú lateral. ¡Todas las mismas opciones están disponibles!',
    },
    icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
    roles: ['Staff', 'Weekly Staff', 'Supervisor', 'Manager', 'HR Admin'],
  },

  // ─── Daily Tasks ──────────────────────────
  {
    id: 'dt-1',
    category: 'daily-tasks',
    title: { en: 'How to Clock In', es: 'Cómo Registrar Entrada' },
    description: {
      en: 'Tap the green arrow button at the top of the page when you arrive. Your location will be verified to ensure you\'re at the hotel. If you have no scheduled shift, you\'ll be asked to provide a reason.',
      es: 'Toca el botón de flecha verde en la parte superior de la página cuando llegues. Tu ubicación será verificada para asegurar que estás en el hotel. Si no tienes turno programado, se te pedirá que indiques un motivo.',
    },
    icon: 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1',
    roles: ['Staff', 'Weekly Staff', 'Supervisor', 'Manager', 'HR Admin'],
  },
  {
    id: 'dt-2',
    category: 'daily-tasks',
    title: { en: 'How to Clock Out', es: 'Cómo Registrar Salida' },
    description: {
      en: 'When you finish your shift, tap the red arrow button. Your work timer will stop and your hours will be recorded automatically.',
      es: 'Cuando termines tu turno, toca el botón de flecha roja. Tu temporizador se detendrá y tus horas serán registradas automáticamente.',
    },
    icon: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
    roles: ['Staff', 'Weekly Staff', 'Supervisor', 'Manager', 'HR Admin'],
  },
  {
    id: 'dt-3',
    category: 'daily-tasks',
    title: { en: 'Check Notifications', es: 'Revisar Notificaciones' },
    description: {
      en: 'The bell icon shows your notifications. A red badge appears when you have unread ones. Tap to see request updates, event tags, and mentions.',
      es: 'El icono de campana muestra tus notificaciones. Una insignia roja aparece cuando tienes sin leer. Toca para ver actualizaciones de solicitudes, etiquetas de eventos y menciones.',
    },
    icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
    roles: ['Staff', 'Weekly Staff', 'Supervisor', 'Manager', 'HR Admin'],
  },

  // ─── Profile & Documents ──────────────────
  {
    id: 'pd-1',
    category: 'profile-docs',
    title: { en: 'Update Your Profile', es: 'Actualizar Tu Perfil' },
    description: {
      en: 'Go to your profile to edit personal info, emergency contacts, and preferences. Tap "Edit Profile" to enter edit mode, make your changes, then save.',
      es: 'Ve a tu perfil para editar información personal, contactos de emergencia y preferencias. Toca "Editar Perfil" para entrar en modo de edición, realiza tus cambios y guarda.',
    },
    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    roles: ['Staff', 'Weekly Staff', 'Supervisor', 'Manager', 'HR Admin'],
  },
  {
    id: 'pd-2',
    category: 'profile-docs',
    title: { en: 'Upload Documents', es: 'Subir Documentos' },
    description: {
      en: 'In your profile, scroll to the Documents section. While in edit mode, click "Upload File" on any document card to upload your Health Card, DPI, Criminal Record, etc.',
      es: 'En tu perfil, desplázate a la sección de Documentos. En modo de edición, haz clic en "Subir Archivo" en cualquier tarjeta para subir Tarjeta de Salud, DPI, Antecedentes Penales, etc.',
    },
    icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
    roles: ['Staff', 'Weekly Staff', 'Supervisor', 'Manager', 'HR Admin'],
  },
  {
    id: 'pd-3',
    category: 'profile-docs',
    title: { en: 'Document Expiration Alerts', es: 'Alertas de Vencimiento de Documentos' },
    description: {
      en: 'When a document is within 30 days of expiring, you\'ll see an amber warning banner on your profile and the document card will turn amber. Update the document before it expires!',
      es: 'Cuando un documento esté a 30 días de vencer, verás un banner de advertencia ámbar en tu perfil y la tarjeta del documento se pondrá ámbar. ¡Actualiza el documento antes de que expire!',
    },
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    roles: ['Staff', 'Weekly Staff', 'Supervisor', 'Manager', 'HR Admin'],
  },

  // ─── Requests ─────────────────────────────
  {
    id: 'rq-1',
    category: 'requests',
    title: { en: 'Submit a Request', es: 'Enviar una Solicitud' },
    description: {
      en: 'Go to Requests from the sidebar, then tap "New Request". Choose the type (Vacation, Absence, Uniform, etc.), fill in the details, and submit. Your supervisor will be notified.',
      es: 'Ve a Solicitudes desde el menú lateral, luego toca "Nueva Solicitud". Elige el tipo (Vacaciones, Ausencia, Uniforme, etc.), completa los detalles y envía. Tu supervisor será notificado.',
    },
    icon: 'M12 4v16m8-8H4',
    roles: ['Staff', 'Weekly Staff', 'Supervisor', 'Manager', 'HR Admin'],
  },
  {
    id: 'rq-2',
    category: 'requests',
    title: { en: 'Track Your Requests', es: 'Dar Seguimiento a Solicitudes' },
    description: {
      en: 'In the Requests page, you can see the status of all your submissions: Pending, Approved, or Rejected. You\'ll also receive a notification when your request is reviewed.',
      es: 'En la página de Solicitudes, puedes ver el estado de todas tus solicitudes: Pendiente, Aprobada o Rechazada. También recibirás una notificación cuando tu solicitud sea revisada.',
    },
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    roles: ['Staff', 'Weekly Staff', 'Supervisor', 'Manager', 'HR Admin'],
  },
  {
    id: 'rq-3',
    category: 'requests',
    title: { en: 'Approve Team Requests', es: 'Aprobar Solicitudes del Equipo' },
    description: {
      en: 'As a supervisor or manager, go to Requests → Approvals to review your team\'s pending requests. Approve or reject them with optional notes.',
      es: 'Como supervisor o gerente, ve a Solicitudes → Aprobaciones para revisar las solicitudes pendientes de tu equipo. Apruébalas o recházalas con notas opcionales.',
    },
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    roles: ['Supervisor', 'Manager', 'HR Admin'],
  },

  // ─── Learning & Training ──────────────────
  {
    id: 'lt-1',
    category: 'learning',
    title: { en: 'Complete Your Training', es: 'Completar Tu Capacitación' },
    description: {
      en: 'Go to Learning Center from the sidebar. You\'ll see your assigned training modules organized by tiers. Complete videos, documents, and quizzes to advance.',
      es: 'Ve al Centro de Aprendizaje desde el menú lateral. Verás tus módulos de capacitación asignados organizados por niveles. Completa videos, documentos y cuestionarios para avanzar.',
    },
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    roles: ['Staff', 'Weekly Staff', 'Supervisor', 'Manager', 'HR Admin'],
  },
  {
    id: 'lt-2',
    category: 'learning',
    title: { en: 'Sign Tier Agreements', es: 'Firmar Acuerdos de Nivel' },
    description: {
      en: 'After completing all modules in a tier, you\'ll be prompted to sign a digital agreement. This unlocks the next training tier.',
      es: 'Después de completar todos los módulos de un nivel, se te pedirá firmar un acuerdo digital. Esto desbloquea el siguiente nivel de capacitación.',
    },
    icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
    roles: ['Staff', 'Weekly Staff', 'Supervisor', 'Manager', 'HR Admin'],
  },

  // ─── Culture & Community ──────────────────
  {
    id: 'cc-1',
    category: 'culture',
    title: { en: 'View Events & Birthdays', es: 'Ver Eventos y Cumpleaños' },
    description: {
      en: 'The Culture Hub shows upcoming hotel events and team birthdays. Leave comments, share photos, and react with emojis to celebrate together.',
      es: 'El Centro Cultural muestra los próximos eventos del hotel y cumpleaños del equipo. Deja comentarios, comparte fotos y reacciona con emojis para celebrar juntos.',
    },
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    roles: ['Staff', 'Weekly Staff', 'Supervisor', 'Manager', 'HR Admin'],
  },
  {
    id: 'cc-2',
    category: 'culture',
    title: { en: 'Celebrate Team Members', es: 'Celebrar a los Compañeros' },
    description: {
      en: 'Visit the Celebrations page to see photo albums from past events. You can upload photos and comment on celebrations.',
      es: 'Visita la página de Celebraciones para ver álbumes de fotos de eventos pasados. Puedes subir fotos y comentar las celebraciones.',
    },
    icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
    roles: ['Staff', 'Weekly Staff', 'Supervisor', 'Manager', 'HR Admin'],
  },
  {
    id: 'cc-3',
    category: 'culture',
    title: { en: 'Read Announcements', es: 'Leer Anuncios' },
    description: {
      en: 'The Announcements section (megaphone icon) keeps you updated with hotel-wide broadcasts from management.',
      es: 'La sección de Anuncios (icono de megáfono) te mantiene al día con comunicados generales de la gerencia.',
    },
    icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.167H3.3a1.598 1.598 0 01-1.3-1.583V9.52a1.598 1.598 0 011.3-1.583h1.136l2.147-6.167A1.76 1.76 0 0111 2.358v3.524zM12.867 19.605a8.96 8.96 0 000-15.212M15.717 16.756a5.963 5.963 0 000-9.512',
    roles: ['Staff', 'Weekly Staff', 'Supervisor', 'Manager', 'HR Admin'],
  },

  // ─── Team Management ──────────────────────
  {
    id: 'tm-1',
    category: 'team-management',
    title: { en: 'Monitor Team Training', es: 'Monitorear Capacitación del Equipo' },
    description: {
      en: 'In the Admin panel → Compliance Overview, you can see which team members have completed their trainings and who still has pending modules.',
      es: 'En el panel de Admin → Cumplimiento, puedes ver qué miembros del equipo han completado sus capacitaciones y quién aún tiene módulos pendientes.',
    },
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    roles: ['Supervisor', 'Manager', 'HR Admin'],
  },
  {
    id: 'tm-2',
    category: 'team-management',
    title: { en: 'Vote for Employee of the Month', es: 'Votar por el Empleado del Mes' },
    description: {
      en: 'In the Culture Hub, you can nominate a peer for Employee of the Month. As a manager, you can also set supervisor scores in the Admin panel.',
      es: 'En el Centro Cultural, puedes nominar a un compañero para Empleado del Mes. Como gerente, también puedes establecer puntuaciones de supervisor en el panel de Admin.',
    },
    icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    roles: ['Supervisor', 'Manager', 'HR Admin'],
  },

  // ─── Admin Tools ──────────────────────────
  {
    id: 'at-1',
    category: 'admin-tools',
    title: { en: 'Manage Employee Directory', es: 'Gestionar Directorio de Empleados' },
    description: {
      en: 'In the HR Admin panel, the Directory tab lets you search, filter, add, edit, and deactivate employees. You can also import employees via Excel.',
      es: 'En el panel de Admin RR.HH., la pestaña Directorio te permite buscar, filtrar, agregar, editar y desactivar empleados. También puedes importar empleados por Excel.',
    },
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    roles: ['HR Admin'],
  },
  {
    id: 'at-2',
    category: 'admin-tools',
    title: { en: 'Create Training Modules', es: 'Crear Módulos de Capacitación' },
    description: {
      en: 'Use the Learning Modules tab to create new training content: videos, documents, or quizzes. Assign them to specific departments and mark them as onboarding requirements.',
      es: 'Usa la pestaña de Módulos de Aprendizaje para crear contenido de capacitación: videos, documentos o cuestionarios. Asígnalos a departamentos específicos y márcalos como requisitos de inducción.',
    },
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    roles: ['HR Admin'],
  },
  {
    id: 'at-3',
    category: 'admin-tools',
    title: { en: 'Manage Vacation Balances', es: 'Gestionar Saldos de Vacaciones' },
    description: {
      en: 'The Vacations tab shows each employee\'s vacation balance, used days, and pending requests. You can adjust balances and view historical data.',
      es: 'La pestaña de Vacaciones muestra el saldo de vacaciones de cada empleado, días usados y solicitudes pendientes. Puedes ajustar saldos y ver datos históricos.',
    },
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    roles: ['HR Admin'],
  },
  {
    id: 'at-4',
    category: 'admin-tools',
    title: { en: 'Set Roles & Permissions', es: 'Configurar Roles y Permisos' },
    description: {
      en: 'In the Roles & Permissions tab, you can control which features each role (Staff, Supervisor, Manager) can access. HR Admins always have full access.',
      es: 'En la pestaña de Roles y Permisos, puedes controlar a qué funciones tiene acceso cada rol (Staff, Supervisor, Gerente). Los Admin RR.HH. siempre tienen acceso completo.',
    },
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    roles: ['HR Admin'],
  },
  {
    id: 'at-5',
    category: 'admin-tools',
    title: { en: 'Track Document Expirations', es: 'Rastrear Vencimiento de Documentos' },
    description: {
      en: 'In the Directory, a ⚠️ warning icon appears next to employees whose documents are expiring within 30 days. Click to edit their profile and update expiration dates.',
      es: 'En el Directorio, un icono de advertencia ⚠️ aparece junto a los empleados cuyos documentos vencen dentro de 30 días. Haz clic para editar su perfil y actualizar las fechas de vencimiento.',
    },
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    roles: ['HR Admin'],
  },
  {
    id: 'at-6',
    category: 'admin-tools',
    title: { en: 'View Activity Logs', es: 'Ver Registros de Actividad' },
    description: {
      en: 'The Activity Log tab shows a chronological record of all actions taken in the portal: user creation, updates, training completions, and more.',
      es: 'La pestaña de Registro de Actividad muestra un registro cronológico de todas las acciones realizadas en el portal: creación de usuarios, actualizaciones, capacitaciones completadas y más.',
    },
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    roles: ['HR Admin'],
  },
  {
    id: 'at-7',
    category: 'admin-tools',
    title: { en: 'Manage Departments & Hierarchy', es: 'Gestionar Departamentos y Jerarquía' },
    description: {
      en: 'Use the Departments tab to create and edit hotel departments along with their areas. The Hierarchy tab provides an org-chart view of the entire organization.',
      es: 'Usa la pestaña de Departamentos para crear y editar departamentos del hotel junto con sus áreas. La pestaña de Jerarquía muestra un organigrama de toda la organización.',
    },
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    roles: ['HR Admin'],
  },
];

// Helper: Get tour steps for a given role
export function getTourStepsForRole(role: Role): TourStep[] {
  const steps = [...tourSteps.common];
  
  if (['Supervisor', 'Manager', 'HR Admin'].includes(role)) {
    steps.push(...tourSteps.manager);
  }
  
  if (role === 'HR Admin') {
    steps.push(...tourSteps.admin);
  }
  
  return steps;
}

// Helper: Get help tips for a given role
export function getHelpTipsForRole(role: Role): HelpTip[] {
  return helpTips.filter(tip => tip.roles.includes(role));
}

// Helper: Get help categories for a given role
export function getHelpCategoriesForRole(role: Role): HelpCategory[] {
  return helpCategories.filter(cat => cat.roles.includes(role));
}
