/**
 * Exporta los datos de contacto del dataset privado `leads` a CSV (para Excel).
 *
 *   npm run export:leads
 *   node migration/scripts/export-leads.mjs [directorio-de-salida]
 *
 * Genera en el directorio actual (o el que se pase como argumento):
 *   inscripciones.csv        — formulario "Inscribite" (leadSignup)
 *   contactos-resenas.csv    — contacto de quienes dejaron reseñas y respuestas (reviewContact)
 */
import {writeFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {leads, assertLeadsAccess} from './_sanityEnv.mjs'

const outDir = resolve(process.cwd(), process.argv[2] ?? '.')

function toCsv(headers, rows) {
  const esc = (v) => {
    const s = v == null ? '' : String(v)
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [headers, ...rows].map((r) => r.map(esc).join(',')).join('\r\n') + '\r\n'
}

async function main() {
  await assertLeadsAccess()

  const signups = await leads.fetch(
    `*[_type == "leadSignup"] | order(createdAt desc){ name, email, phone, createdAt }`,
  )
  const signupsCsv = toCsv(
    ['nombre', 'email', 'celular', 'fecha'],
    signups.map((s) => [s.name, s.email, s.phone, s.createdAt]),
  )
  const signupsFile = resolve(outDir, 'inscripciones.csv')
  writeFileSync(signupsFile, signupsCsv)

  const contacts = await leads.fetch(
    `*[_type == "reviewContact"] | order(createdAt desc){
      name, email, phone, restaurantSlug, createdAt, reviewId, replies
    }`,
  )
  // Una fila por contacto de reseña + una fila por cada respuesta con contacto.
  const rows = []
  for (const c of contacts) {
    rows.push(['reseña', c.name, c.email, c.phone, c.restaurantSlug, c.createdAt, c.reviewId])
    for (const r of c.replies ?? []) {
      if (!r?.email && !r?.phone && !r?.name) continue
      rows.push(['respuesta', r.name, r.email, r.phone, c.restaurantSlug, r.createdAt, c.reviewId])
    }
  }
  const contactsCsv = toCsv(
    ['tipo', 'nombre', 'email', 'celular', 'restaurante', 'fecha', 'reviewId'],
    rows,
  )
  const contactsFile = resolve(outDir, 'contactos-resenas.csv')
  writeFileSync(contactsFile, contactsCsv)

  console.log(`inscripciones.csv     ${signups.length} fila(s)   → ${signupsFile}`)
  console.log(`contactos-resenas.csv ${rows.length} fila(s)   → ${contactsFile}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
