// Helper compartido por los scripts de `leads`: arma un cliente de Sanity leyendo la
// configuración de `.dev.vars` (convención del proyecto) o de las variables de entorno.
import {readFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {dirname, resolve} from 'node:path'
import {createClient} from '@sanity/client'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

function loadDevVars() {
  const vars = {}
  try {
    const raw = readFileSync(resolve(repoRoot, '.dev.vars'), 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) vars[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {
    // sin .dev.vars: se usa process.env
  }
  return vars
}

const devVars = loadDevVars()
const get = (key, fallback) => process.env[key] ?? devVars[key] ?? fallback

export const config = {
  projectId: get('SANITY_PROJECT_ID', 'xo45blck'),
  productionDataset: get('SANITY_DATASET', 'production'),
  leadsDataset: get('SANITY_LEADS_DATASET', 'leads'),
  token: get('SANITY_WRITE_TOKEN'),
}

if (!config.token) {
  console.error(
    'Falta SANITY_WRITE_TOKEN. Ponelo en .dev.vars o export SANITY_WRITE_TOKEN=... antes de correr el script.',
  )
  process.exit(1)
}

const base = {apiVersion: '2024-01-01', token: config.token, useCdn: false}

export const production = createClient({...base, dataset: config.productionDataset, projectId: config.projectId})
export const leads = createClient({...base, dataset: config.leadsDataset, projectId: config.projectId})

// Verifica que el token pueda leer el dataset privado; aborta con mensaje claro si no.
export async function assertLeadsAccess() {
  try {
    await leads.fetch('*[_type == "sanity.imageAsset"][0]._id')
  } catch (error) {
    console.error(
      `\nEl token no puede acceder al dataset "${config.leadsDataset}".\n` +
        '- Verificá que el dataset exista y esté como Private en sanity.io/manage.\n' +
        '- Verificá que SANITY_WRITE_TOKEN tenga rol Editor (acceso a todos los datasets).\n' +
        `\nDetalle: ${error?.message ?? error}`,
    )
    process.exit(1)
  }
}
