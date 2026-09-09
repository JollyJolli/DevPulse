import type { Locale } from "@/types/analytics";

const spanishNames: Record<string, string> = {
  Builder: "Constructor",
  "Original Builder": "Constructor original",
  "Fork Explorer": "Explorador de forks",
  "Star Power": "Poder estelar",
  Spotlight: "En el foco",
  "Fork Magnet": "Imán de forks",
  "Remix Magnet": "Imán de remixes",
  Audience: "Audiencia",
  Networker: "Conector",
  "Gist Crafter": "Creador de gists",
  Veteran: "Veterano",
  Polyglot: "Políglota",
  "Language Explorer": "Explorador de lenguajes",
  "Active Arsenal": "Arsenal activo",
  "On Fire": "En racha",
  Maintainer: "Mantenedor",
  Archivist: "Archivista",
  "Popular Portfolio": "Portfolio popular",
  "Breakout Projects": "Proyectos destacados",
  "Long Haul": "Largo recorrido",
  Documentation: "Documentación",
  "Licensed Portfolio": "Portfolio con licencias",
  "Topic Mapper": "Cartógrafo de temas",
  "Portfolio Freshness": "Actualidad del portfolio",
  "Project Health": "Salud de proyectos",
  Consistency: "Consistencia",
  Streak: "Racha",
  "External Contributor": "Contribuidor externo",
  Committer: "Committer",
  Contributor: "Contribuidor",
  "PR Pilot": "Piloto de PR",
  Reviewer: "Revisor",
  "Issue Hunter": "Cazador de issues",
};

const spanishDescriptions: Record<string, string> = {
  Builder: "Repositorios públicos",
  "Original Builder": "Repositorios originales que no son forks",
  "Fork Explorer": "Repositorios bifurcados",
  "Star Power": "Estrellas recibidas en total",
  Spotlight: "Estrellas del proyecto más popular",
  "Fork Magnet": "Forks recibidos en total",
  "Remix Magnet": "Forks del proyecto más bifurcado",
  Audience: "Seguidores en GitHub",
  Networker: "Desarrolladores seguidos",
  "Gist Crafter": "Gists públicos",
  Veteran: "Años en GitHub",
  Polyglot: "Lenguajes en repositorios públicos",
  "Language Explorer": "Lenguajes presentes en el portfolio público",
  "Active Arsenal": "Repositorios actualizados en los últimos 90 días",
  "On Fire": "Repositorios actualizados en los últimos 30 días",
  Maintainer: "Repositorios tocados durante el último año",
  Archivist: "Repositorios públicos archivados",
  "Popular Portfolio": "Repositorios con al menos una estrella",
  "Breakout Projects": "Repositorios con al menos diez estrellas",
  "Long Haul": "Edad del repositorio público más antiguo",
  Documentation: "Repositorios con descripción",
  "Licensed Portfolio": "Repositorios originales con licencia",
  "Topic Mapper": "Repositorios con temas de GitHub",
  "Portfolio Freshness": "Repositorios originales tocados durante el último año",
  "Project Health": "Salud media transparente de los repositorios",
  Consistency: "Regularidad de la actividad durante el periodo",
  Streak: "Racha más larga del periodo",
  "External Contributor": "Actividad medible fuera de repositorios propios",
  Committer: "Commits durante el periodo",
  Contributor: "Contribuciones durante el periodo",
  "PR Pilot": "Pull requests abiertos durante el periodo",
  Reviewer: "Revisiones de pull requests durante el periodo",
  "Issue Hunter": "Issues abiertos durante el periodo",
};

const spanishTiers: Record<string, string> = {
  Bronze: "Bronce",
  Silver: "Plata",
  Gold: "Oro",
  Emerald: "Esmeralda",
  Platinum: "Platino",
  Diamond: "Diamante",
  Master: "Maestro",
  Mythic: "Mítico",
};

export function trophyName(name: string, locale: Locale): string {
  return locale === "es" ? spanishNames[name] ?? name : name;
}

export function trophyDescription(name: string, fallback: string, locale: Locale): string {
  return locale === "es" ? spanishDescriptions[name] ?? fallback : fallback;
}

export function trophyTier(name: string, locale: Locale): string {
  return locale === "es" ? spanishTiers[name] ?? name : name;
}
