import {useState} from 'react'
import {Button, Card, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {DownloadIcon} from '@sanity/icons/Download'
import {StarFilledIcon} from '@sanity/icons/StarFilled'
import {useClient} from 'sanity'
import type {Tool} from 'sanity'

const API_VERSION = '2024-01-01'

function toCsv(headers: string[], rows: unknown[][]) {
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [headers, ...rows].map((r) => r.map(esc).join(',')).join('\r\n') + '\r\n'
}

// Descarga vía Blob + <a download>: corre en el navegador del usuario logueado en el
// Studio, así que usa sus propios permisos en vez de un token de servidor.
function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'})
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

interface ReviewRow {
  rating: number
  foodRating?: number
  serviceRating?: number
  ambianceRating?: number
  restaurantSlug?: string
  restaurantName?: string
}

interface RankingRow {
  slug: string
  name: string
  count: number
  avgRating: number
  avgFood: number | null
  avgService: number | null
  avgAmbiance: number | null
}

type Status =
  | {state: 'idle'}
  | {state: 'loading'}
  | {state: 'error'; message: string}
  | {state: 'success'; rows: RankingRow[]}

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

// Sin piso mínimo de reseñas a propósito: el organizador quiere ver promedio Y cantidad
// juntos para comparar a ojo (ej. 1 reseña de 5 vs. 500 reseñas en 4.9) y decidir el ganador
// él mismo, en vez de que un filtro automático descarte candidatos de la lista.
function buildRanking(reviews: ReviewRow[]): RankingRow[] {
  const bySlug = new Map<
    string,
    {name: string; ratings: number[]; food: number[]; service: number[]; ambiance: number[]}
  >()

  for (const r of reviews) {
    if (!r.restaurantSlug) continue
    let entry = bySlug.get(r.restaurantSlug)
    if (!entry) {
      entry = {name: r.restaurantName ?? r.restaurantSlug, ratings: [], food: [], service: [], ambiance: []}
      bySlug.set(r.restaurantSlug, entry)
    }
    entry.ratings.push(r.rating)
    if (r.foodRating) entry.food.push(r.foodRating)
    if (r.serviceRating) entry.service.push(r.serviceRating)
    if (r.ambianceRating) entry.ambiance.push(r.ambianceRating)
  }

  const rows: RankingRow[] = []
  for (const [slug, entry] of bySlug) {
    rows.push({
      slug,
      name: entry.name,
      count: entry.ratings.length,
      avgRating: average(entry.ratings),
      avgFood: entry.food.length ? average(entry.food) : null,
      avgService: entry.service.length ? average(entry.service) : null,
      avgAmbiance: entry.ambiance.length ? average(entry.ambiance) : null,
    })
  }

  return rows.sort((a, b) => b.avgRating - a.avgRating || b.count - a.count)
}

function fmt(value: number | null): string {
  return value == null ? '—' : value.toFixed(2)
}

const HEADERS = ['#', 'Restaurante', 'Promedio', 'Reseñas', 'Comida', 'Servicio', 'Ambiente']

function RankingCalificacionesTool() {
  const client = useClient({apiVersion: API_VERSION})
  const [status, setStatus] = useState<Status>({state: 'idle'})

  const handleLoad = async () => {
    setStatus({state: 'loading'})
    try {
      const reviews = await client.fetch<ReviewRow[]>(
        `*[_type == "review"]{
          rating, foodRating, serviceRating, ambianceRating,
          "restaurantSlug": restaurant->slug.current,
          "restaurantName": restaurant->name
        }`,
      )
      setStatus({state: 'success', rows: buildRanking(reviews)})
    } catch (error) {
      setStatus({
        state: 'error',
        message: error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
      })
    }
  }

  const handleExport = () => {
    if (status.state !== 'success') return
    const csv = toCsv(
      ['posición', 'restaurante', 'promedio', 'reseñas', 'comida', 'servicio', 'ambiente'],
      status.rows.map((r, i) => [
        i + 1,
        r.name,
        r.avgRating.toFixed(2),
        r.count,
        fmt(r.avgFood),
        fmt(r.avgService),
        fmt(r.avgAmbiance),
      ]),
    )
    downloadCsv('ranking-calificaciones.csv', csv)
  }

  return (
    <Card padding={4}>
      <Stack gap={4}>
        <Text size={2} weight="semibold">
          Ranking de calificaciones
        </Text>
        <Text size={1} muted>
          Promedio de calificación por restaurante, de mayor a menor, con la cantidad de reseñas
          al lado. El promedio ordena la lista pero la decisión final del ganador queda en sus
          manos.
        </Text>

        <Flex align="center" gap={3}>
          <Button
            text="Calcular ranking"
            tone="primary"
            onClick={handleLoad}
            disabled={status.state === 'loading'}
          />
          {status.state === 'success' && (
            <Button icon={DownloadIcon} text="Descargar CSV" mode="ghost" onClick={handleExport} />
          )}
          {status.state === 'loading' && <Spinner muted />}
        </Flex>

        {status.state === 'error' && (
          <Card padding={3} radius={2} tone="critical">
            <Text size={1}>No se pudo calcular el ranking: {status.message}</Text>
          </Card>
        )}

        {status.state === 'success' && (
          <Card padding={0} radius={2} shadow={1} overflow="auto">
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr>
                  {HEADERS.map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left',
                        padding: '8px 12px',
                        borderBottom: '1px solid var(--card-border-color)',
                        fontSize: 12,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {status.rows.map((r, i) => (
                  <tr key={r.slug}>
                    <td style={{padding: '8px 12px'}}>{i + 1}</td>
                    <td style={{padding: '8px 12px'}}>{r.name}</td>
                    <td style={{padding: '8px 12px'}}>{r.avgRating.toFixed(2)}</td>
                    <td style={{padding: '8px 12px'}}>{r.count}</td>
                    <td style={{padding: '8px 12px'}}>{fmt(r.avgFood)}</td>
                    <td style={{padding: '8px 12px'}}>{fmt(r.avgService)}</td>
                    <td style={{padding: '8px 12px'}}>{fmt(r.avgAmbiance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </Stack>
    </Card>
  )
}

export const rankingCalificacionesTool: Tool = {
  name: 'ranking-calificaciones',
  title: 'Ranking',
  icon: StarFilledIcon,
  component: RankingCalificacionesTool,
}
