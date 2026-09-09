import type { Locale } from "@/types/analytics";

// Only apply to DevPulse-generated evidence; user bios and repository descriptions remain untouched.
export function localizeEvidence(text: string, locale: Locale): string {
  if (locale !== "es") return text;
  const labels: Record<string, string> = {
    "Joined GitHub": "Se unió a GitHub",
    "Oldest public original repository currently visible.": "Repositorio original público más antiguo visible.",
    "Newest public original repository.": "Repositorio original público más reciente.",
    "marked archived on GitHub": "Archivado en GitHub",
    "has prior public adoption signals": "Tiene señales de adopción pública",
    "Tests": "Pruebas", "Linting": "Análisis estático", "Formatting": "Formato",
    "Container setup": "Contenedores", "TypeScript config": "Configuración de TypeScript",
    "Contributing guide": "Guía de contribución", "Repository tree": "Árbol del repositorio",
    "GitHub community profile": "Perfil comunitario de GitHub", "Test paths found": "Rutas de pruebas detectadas",
    "Lint configuration": "Configuración de análisis estático", "Formatting configuration": "Configuración de formato",
    "Docker configuration": "Configuración de Docker",
  };
  if (labels[text]) return labels[text];
  return text
    .replace(/^Created (.+)$/, "Creó $1")
    .replace(/^@(.+) account created\.$/, "Cuenta de @$1 creada.")
    .replace(/^(\d+) days since the latest public push$/, "$1 días desde el último push público")
    .replace(/^(\d+) months old$/, "$1 meses de antigüedad")
    .replace(/^(.+) era$/, "Era de $1")
    .replace(/^(.+) appeared$/, "Apareció $1")
    .replace(/^First public original repository with (.+) as its primary language\.$/, "Primer repositorio original público con $1 como lenguaje principal.")
    .replace(/^(.+) was the most common primary language among original repositories created in (.+)\.$/, "$1 fue el lenguaje principal más común entre los repositorios originales creados en $2.");
}

