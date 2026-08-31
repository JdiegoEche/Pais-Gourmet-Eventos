/**
 * Migración única: saca la PII del dataset público `production` y la lleva al dataset
 * privado `leads`.
 *
 *   node migration/scripts/migrate-leads.mjs           # dry-run: solo imprime qué haría
 *   node migration/scripts/migrate-leads.mjs --apply   # ejecuta los cambios
 *
 * Qué hace con --apply:
 *   1. leadSignup: mueve cada doc de `production` a `leads` y lo borra de `production`.
 *   2. review: por cada reseña con contacto (en la reseña o en alguna respuesta):
 *        - crea una `review` NUEVA en `production` sin phone/email (mismo createdAt),
 *        - crea un `reviewContact` en `leads` con el contacto,
 *        - borra la `review` vieja (scrub: elimina doc + historial de revisiones).
 *
 * Idempotente: si ya existe un `reviewContact` para una reseña, la saltea.
 */
import {mkdirSync, writeFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {dirname, resolve} from 'node:path'
import {randomUUID} from 'node:crypto'
import {config, production, leads, assertLeadsAccess} from './_sanityEnv.mjs'

const APPLY = process.argv.includes('--apply')
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

const report = {
  startedAt: new Date().toISOString(),
  apply: APPLY,
  config: {projectId: config.projectId, productionDataset: config.productionDataset, leadsDataset: config.leadsDataset},
  leadSignups: {moved: 0, ids: []},
  reviews: {recreated: 0, skippedAlreadyMigrated: 0, skippedNoContact: 0, pairs: []},
  errors: [],
}

const log = (...args) => console.log(...args)

async function migrateLeadSignups() {
  const docs = await production.fetch(`*[_type == "leadSignup"]{ _id, name, email, phone, createdAt }`)
  log(`\nleadSignup en production: ${docs.length}`)
  for (const doc of docs) {
    log(`  - ${doc.name} <${doc.email}>  ${APPLY ? '→ moviendo' : '(dry-run)'}`)
    if (!APPLY) continue
    try {
      await leads.create({
        _type: 'leadSignup',
        name: doc.name,
        email: doc.email,
        phone: doc.phone,
        createdAt: doc.createdAt,
      })
      await production.delete(doc._id)
      report.leadSignups.moved++
      report.leadSignups.ids.push(doc._id)
    } catch (error) {
      report.errors.push({stage: 'leadSignup', id: doc._id, message: String(error?.message ?? error)})
      log(`    ERROR: ${error?.message ?? error}`)
    }
  }
}

function hasContact(review) {
  if (review.phone || review.email) return true
  return (review.replies ?? []).some((r) => r?.phone || r?.email)
}

async function migrateReviews() {
  const reviews = await production.fetch(
    `*[_type == "review"]{
      _id,
      "restaurantId": restaurant._ref,
      "restaurantSlug": restaurant->slug.current,
      name, phone, email,
      rating, foodRating, serviceRating, ambianceRating,
      comment, createdAt,
      replies
    } | order(createdAt asc)`,
  )
  log(`\nreview en production: ${reviews.length}`)

  for (const review of reviews) {
    if (!hasContact(review)) {
      report.reviews.skippedNoContact++
      continue
    }

    const already = await leads.fetch(`*[_type == "reviewContact" && reviewId == $id][0]._id`, {id: review._id})
    if (already) {
      report.reviews.skippedAlreadyMigrated++
      log(`  - ${review.name} (${review._id}) ya migrada, se saltea`)
      continue
    }

    // Re-keyea las respuestas para poder correlacionar la parte pública con la privada.
    const replies = (review.replies ?? []).map((r) => ({
      key: r?._key ?? randomUUID(),
      name: r?.name ?? '',
      message: r?.message ?? '',
      phone: r?.phone ?? '',
      email: r?.email ?? '',
      createdAt: r?.createdAt ?? review.createdAt,
    }))

    log(
      `  - ${review.name} <${review.email ?? ''}> [${review.restaurantSlug ?? review.restaurantId}] ` +
        `${replies.length} respuesta(s)  ${APPLY ? '→ recreando' : '(dry-run)'}`,
    )
    if (!APPLY) continue

    try {
      const newReview = await production.create({
        _type: 'review',
        restaurant: {_type: 'reference', _ref: review.restaurantId},
        name: review.name,
        rating: review.rating,
        ...(review.foodRating != null ? {foodRating: review.foodRating} : {}),
        ...(review.serviceRating != null ? {serviceRating: review.serviceRating} : {}),
        ...(review.ambianceRating != null ? {ambianceRating: review.ambianceRating} : {}),
        comment: review.comment,
        createdAt: review.createdAt,
        replies: replies.map((r) => ({
          _type: 'reviewReply',
          _key: r.key,
          name: r.name,
          message: r.message,
          createdAt: r.createdAt,
        })),
      })

      await leads.create({
        _type: 'reviewContact',
        reviewId: newReview._id,
        restaurantSlug: review.restaurantSlug ?? '',
        name: review.name,
        phone: review.phone ?? '',
        email: review.email ?? '',
        createdAt: review.createdAt,
        replies: replies
          .filter((r) => r.phone || r.email || r.name)
          .map((r) => ({_key: r.key, name: r.name, phone: r.phone, email: r.email, createdAt: r.createdAt})),
      })

      await production.delete(review._id)

      report.reviews.recreated++
      report.reviews.pairs.push({oldId: review._id, newId: newReview._id})
    } catch (error) {
      report.errors.push({stage: 'review', id: review._id, message: String(error?.message ?? error)})
      log(`    ERROR: ${error?.message ?? error}`)
    }
  }
}

async function main() {
  log(`Migración PII → dataset privado "${config.leadsDataset}"  [${APPLY ? 'APPLY' : 'DRY-RUN'}]`)
  await assertLeadsAccess()
  await migrateLeadSignups()
  await migrateReviews()

  report.finishedAt = new Date().toISOString()

  log('\n─── Resumen ───')
  log(`leadSignup movidos:        ${report.leadSignups.moved}${APPLY ? '' : ' (dry-run)'}`)
  log(`reviews recreadas:         ${report.reviews.recreated}${APPLY ? '' : ' (dry-run)'}`)
  log(`reviews ya migradas:       ${report.reviews.skippedAlreadyMigrated}`)
  log(`reviews sin contacto:      ${report.reviews.skippedNoContact}`)
  log(`errores:                   ${report.errors.length}`)

  if (APPLY) {
    const dir = resolve(repoRoot, 'migration', 'reports')
    mkdirSync(dir, {recursive: true})
    const file = resolve(dir, `migrate-leads-${Date.now()}.json`)
    writeFileSync(file, JSON.stringify(report, null, 2))
    log(`\nReporte: ${file}`)
  } else {
    log('\nDry-run: nada fue modificado. Volvé a correr con --apply para ejecutar.')
  }

  if (report.errors.length > 0) process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
