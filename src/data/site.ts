// ─────────────────────────────────────────────────────────────
// Toda la información personal del portfolio vive aquí.
// `profile` se comparte entre idiomas; `content` tiene una versión
// en español (es) y otra en inglés (en) con la misma estructura.
// ─────────────────────────────────────────────────────────────
import type { Lang } from '../i18n/ui';

export const profile = {
  name: 'Edwin Suarez Barrero',
  fullName: 'Edwin Enrique Suarez Barrero',
  email: 'edwinsuarezb9@gmail.com',
  available: true, // muestra la insignia "Disponible para nuevas oportunidades"
  // Ruta a tu CV en /public por idioma, p. ej. '/cv.pdf' (vacío = oculto)
  cv: { es: '', en: '' } as Record<Lang, string>,
  socials: [
    { label: 'GitHub', href: 'https://github.com/11d4rkm4n13', icon: 'github' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/edwinsuarezbarrero', icon: 'linkedin' },
    { label: 'Email', href: 'mailto:edwinsuarezb9@gmail.com', icon: 'mail' },
  ],
} as const;

interface Content {
  role: string;
  location: string;
  title: string;
  description: string;
  tagline: string;
  about: string[];
  highlights: { value: string; label: string }[];
  skills: { group: string; items: string[] }[];
  experience: { role: string; company: string; place: string; period: string; note?: string; points: string[] }[];
  education: { title: string; school: string; period: string }[];
  languages: { name: string; level: string }[];
}

const es: Content = {
  role: 'Android Developer',
  location: 'Bogotá, Colombia',
  title: 'Edwin Suarez Barrero — Android Developer',
  description:
    'Portfolio de Edwin Suarez Barrero, desarrollador Android especializado en sistemas de pago, autenticación segura y soluciones transaccionales.',
  tagline:
    'Desarrollo aplicaciones Android robustas y sistemas de pago seguros: de terminales EMV y QR a APIs que procesan más de 10 millones de transacciones al año.',
  about: [
    'Soy desarrollador de software con experiencia en investigación y desarrollo de soluciones tecnológicas: aplicaciones Android, sistemas de pago y autenticación, integración de dispositivos y optimización de sistemas críticos. Trabajo principalmente con Kotlin y Java, arquitectura de aplicaciones móviles, bases de datos relacionales y locales, y software para entornos Linux.',
    'He participado en el análisis de requerimientos, el diseño de soluciones técnicas, la documentación de APIs y la aplicación de estándares de seguridad en sistemas transaccionales. Me gusta analizar problemas complejos, integrar componentes de software y colaborar con equipos multidisciplinarios durante todo el ciclo de desarrollo.',
    'Me interesa especialmente construir aplicaciones Android mantenibles con arquitectura MVVM y soluciones móviles para entornos transaccionales y terminales de pago.',
  ],
  highlights: [
    { value: '10M+', label: 'transacciones anuales procesadas por APIs que desarrollé' },
    { value: '50 %', label: 'menos tiempo de validación de transacciones' },
    { value: '4+', label: 'años de experiencia en I+D y desarrollo' },
  ],
  skills: [
    { group: 'Móvil / Lenguajes', items: ['Kotlin', 'Kotlin Multiplatform', 'Compose Multiplatform', 'Java', 'Python', 'C++'] },
    { group: 'Backend y datos', items: ['Quarkus', 'APIs REST', 'PostgreSQL', 'MySQL', 'SQLite', 'Room'] },
    { group: 'Frontend', items: ['JavaScript', 'Vue.js', 'Angular', 'Astro', 'HTML5', 'CSS3'] },
    { group: 'Seguridad', items: ['Autenticación QR', 'EMV', 'Seguridad en Android', 'Control de acceso', 'ISO 8583'] },
    { group: 'DevOps / Herramientas', items: ['Git', 'GitHub', 'Azure DevOps', 'Bitbucket', 'Docker', 'CI/CD', 'JIRA', 'Confluence'] },
    { group: 'Metodologías', items: ['Scrum', 'Análisis funcional', 'UML'] },
  ],
  experience: [
    {
      role: 'Desarrollador',
      company: 'Alliance Enterprise SAS',
      place: 'Bogotá (remoto)',
      period: 'may. 2025 — actualidad',
      points: [
        'Desarrollo y mantenimiento de módulos de software en Java para el procesamiento de eventos SWIFT.',
        'Implementación de controles de seguridad para aplicaciones web, fortaleciendo la protección de los sistemas.',
        'Diseño y ejecución de una suite de testing para validar el funcionamiento y la integración entre componentes.',
      ],
    },
    {
      role: 'Research and Development Engineer',
      company: 'Opencity SAS',
      place: 'Bogotá (remoto)',
      period: 'oct. 2024 — may. 2025',
      points: [
        'Lideré el análisis de requerimientos de interoperabilidad entre sistemas, reduciendo en un 25 % los errores de integración en producción.',
        'Lideré la estandarización del modelado de software con UML, mejorando la documentación técnica en un 60 %.',
        'Diseñé y desarrollé una librería reutilizable de integración de dispositivos, reduciendo el tiempo de onboarding de nuevos sistemas.',
      ],
    },
    {
      role: 'Ingeniero de Investigación y Desarrollo Jr.',
      company: 'GSD Plus SAS',
      place: 'Colombia',
      period: 'jun. 2021 — may. 2025',
      note: 'Progresión: Estudiante en prácticas → Tecnólogo QA → Ingeniero I+D Jr.',
      points: [
        'Diseñé e implementé sistemas de pago con autenticación segura (QR y tarjetas EMV), reduciendo en un 50 % los tiempos de validación de transacciones.',
        'Desarrollé y desplegué APIs para el procesamiento de transacciones con tarjetas closed-loop y open-loop en Cartagena, con más de 10M de transacciones anuales en producción.',
        'Optimicé el rendimiento y la seguridad de aplicaciones de transporte público, mejorando la experiencia de usuario en un 30 %.',
        'Participé en la implementación de estándares de seguridad en aplicaciones Android.',
      ],
    },
  ],
  education: [
    { title: 'Ingeniería de Sistemas', school: 'Fundación Universitaria del Área Andina', period: '2023 — actualidad' },
    {
      title: 'Especialización Técnica en Análisis y Desarrollo de Sistemas de Información',
      school: 'SENA',
      period: '2020 — 2022',
    },
    { title: 'Técnico en Programación de Software', school: 'SENA', period: '2019' },
  ],
  languages: [
    { name: 'Español', level: 'Nativo' },
    { name: 'Inglés', level: 'Básico (A2)' },
  ],
};

const en: Content = {
  role: 'Android Developer',
  location: 'Bogotá, Colombia',
  title: 'Edwin Suarez Barrero — Android Developer',
  description:
    'Portfolio of Edwin Suarez Barrero, an Android developer specializing in payment systems, secure authentication and transactional solutions.',
  tagline:
    'I build robust Android apps and secure payment systems: from EMV and QR terminals to APIs that process over 10 million transactions a year.',
  about: [
    "I'm a software developer with a background in research and development of technology solutions: Android apps, payment and authentication systems, device integration and optimization of critical systems. I work mainly with Kotlin and Java, mobile app architecture, relational and local databases, and software for Linux environments.",
    "I've worked on requirements analysis, technical solution design, API documentation and applying security standards to transactional systems. I enjoy breaking down complex problems, integrating software components and collaborating with cross-functional teams throughout the development lifecycle.",
    "I'm especially interested in building maintainable Android apps with MVVM architecture, and mobile solutions for transactional environments and payment terminals.",
  ],
  highlights: [
    { value: '10M+', label: 'yearly transactions processed by APIs I built' },
    { value: '50%', label: 'faster transaction validation' },
    { value: '4+', label: 'years of R&D and development experience' },
  ],
  skills: [
    { group: 'Mobile / Languages', items: ['Kotlin', 'Kotlin Multiplatform', 'Compose Multiplatform', 'Java', 'Python', 'C++'] },
    { group: 'Backend & data', items: ['Quarkus', 'REST APIs', 'PostgreSQL', 'MySQL', 'SQLite', 'Room'] },
    { group: 'Frontend', items: ['JavaScript', 'Vue.js', 'Angular', 'Astro', 'HTML5', 'CSS3'] },
    { group: 'Security', items: ['QR authentication', 'EMV', 'Android security', 'Access control', 'ISO 8583'] },
    { group: 'DevOps / Tools', items: ['Git', 'GitHub', 'Azure DevOps', 'Bitbucket', 'Docker', 'CI/CD', 'JIRA', 'Confluence'] },
    { group: 'Methodologies', items: ['Scrum', 'Functional analysis', 'UML'] },
  ],
  experience: [
    {
      role: 'Developer',
      company: 'Alliance Enterprise SAS',
      place: 'Bogotá (remote)',
      period: 'May 2025 — Present',
      points: [
        'Develop and maintain Java software modules for processing SWIFT events.',
        'Implement security controls for web applications, strengthening system protection.',
        'Designed and ran a test suite to validate functionality and integration between software components.',
      ],
    },
    {
      role: 'Research and Development Engineer',
      company: 'Opencity SAS',
      place: 'Bogotá (remote)',
      period: 'Oct 2024 — May 2025',
      points: [
        'Led requirements analysis for system interoperability, reducing integration errors found in production by 25%.',
        'Led the standardization of software modeling with UML, improving technical documentation by 60%.',
        'Designed and built a reusable device integration library, reducing onboarding time for new systems.',
      ],
    },
    {
      role: 'Junior Research and Development Engineer',
      company: 'GSD Plus SAS',
      place: 'Colombia',
      period: 'Jun 2021 — May 2025',
      note: 'Progression: Intern → QA Technologist → Junior R&D Engineer',
      points: [
        'Designed and implemented payment systems with secure authentication (QR and EMV cards), reducing transaction validation times by 50%.',
        'Built and deployed APIs for processing closed-loop and open-loop card transactions in Cartagena, handling over 10M transactions a year in production.',
        'Optimized performance and security of public transport apps, improving user experience by 30%.',
        'Contributed to implementing security standards in Android applications.',
      ],
    },
  ],
  education: [
    { title: 'B.S. in Systems Engineering', school: 'Fundación Universitaria del Área Andina', period: '2023 — Present' },
    {
      title: 'Technical Specialization in Information Systems Analysis and Development',
      school: 'SENA',
      period: '2020 — 2022',
    },
    { title: 'Software Programming Technician', school: 'SENA', period: '2019' },
  ],
  languages: [
    { name: 'Spanish', level: 'Native' },
    { name: 'English', level: 'Basic (A2)' },
  ],
};

export const content: Record<Lang, Content> = { es, en };
