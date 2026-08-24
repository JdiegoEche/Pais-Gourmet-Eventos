// Compartido entre el parser del Excel (server) y el emparejamiento de carpetas de fotos
// (browser) — mismo criterio de normalización en los dos lugares.
export function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function slugify(name: string): string {
  return stripAccents(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
