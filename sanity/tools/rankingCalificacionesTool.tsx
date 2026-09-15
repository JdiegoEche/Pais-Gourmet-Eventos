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
  menuKey?: string
  menuPriceSnapshot?: number
}

interface MenuRankingRow {
  menuKey: string
  priceSnapshot: number | null
  count: number
  avgRating: number
  avgFood: number | null
  avgService: number | null
  avgAmbiance: number | null
}

interface RankingRow {
  slug: string
  name: string
  count: number
  avgRating: number
  avgFood: number | null
  avgService: number | null
  avgAmbiance: number | null
  menus: MenuRankingRow[]
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
    {
      name: string
      ratings: number[]
      food: number[]
      service: number[]
      ambiance: number[]
      menus: Map<
        string,
        {priceSnapshot: number | null; ratings: number[]; food: number[]; service: number[]; ambiance: number[]}
      >
    }
  >()

  for (const r of reviews) {
    if (!r.restaurantSlug) continue
    let entry = bySlug.get(r.restaurantSlug)
    if (!entry) {
      entry = {
        name: r.restaurantName ?? r.restaurantSlug,
        ratings: [],
        food: [],
        service: [],
        ambiance: [],
        menus: new Map(),
      }
      bySlug.set(r.restaurantSlug, entry)
    }
    entry.ratings.push(r.rating)
    if (r.foodRating) entry.food.push(r.foodRating)
    if (r.serviceRating) entry.service.push(r.serviceRating)
    if (r.ambianceRating) entry.ambiance.push(r.ambianceRating)

    // Las reseñas sin menú (restaurantes de un solo menú, o reseñas de antes de esta
    // funcionalidad) sólo alimentan el acumulador general de arriba: nunca crean un bucket
    // por menú.
    const menuKey = r.menuKey ?? ''
    if (menuKey) {
      let menuEntry = entry.menus.get(menuKey)
      if (!menuEntry) {
        menuEntry = {priceSnapshot: null, ratings: [], food: [], service: [], ambiance: []}
        entry.menus.set(menuKey, menuEntry)
      }
      // La consulta GROQ ordena por createdAt asc, así que la última escritura gana: el
      // precio que etiqueta el bucket siempre refleja el snapshot más reciente de ese menú.
      if (r.menuPriceSnapshot != null) menuEntry.priceSnapshot = r.menuPriceSnapshot
      menuEntry.ratings.push(r.rating)
      if (r.foodRating) menuEntry.food.push(r.foodRating)
      if (r.serviceRating) menuEntry.service.push(r.serviceRating)
      if (r.ambianceRating) menuEntry.ambiance.push(r.ambianceRating)
    }
  }

  const rows: RankingRow[] = []
  for (const [slug, entry] of bySlug) {
    const menus: MenuRankingRow[] = []
    for (const [menuKey, m] of entry.menus) {
      menus.push({
        menuKey,
        priceSnapshot: m.priceSnapshot,
        count: m.ratings.length,
        avgRating: average(m.ratings),
        avgFood: m.food.length ? average(m.food) : null,
        avgService: m.service.length ? average(m.service) : null,
        avgAmbiance: m.ambiance.length ? average(m.ambiance) : null,
      })
    }
    // El bucket sin precio queda al final; menuKey sólo desempata para que el orden sea
    // determinístico, no para distinguir precios repetidos (la unicidad de currentPrice por
    // restaurante ya la garantiza el esquema).
    menus.sort(
      (a, b) =>
        (a.priceSnapshot ?? Infinity) - (b.priceSnapshot ?? Infinity) || a.menuKey.localeCompare(b.menuKey),
    )

    rows.push({
      slug,
      name: entry.name,
      count: entry.ratings.length,
      avgRating: average(entry.ratings),
      avgFood: entry.food.length ? average(entry.food) : null,
      avgService: entry.service.length ? average(entry.service) : null,
      avgAmbiance: entry.ambiance.length ? average(entry.ambiance) : null,
      menus,
    })
  }

  return rows.sort((a, b) => b.avgRating - a.avgRating || b.count - a.count)
}

function fmt(value: number | null): string {
  return value == null ? '—' : value.toFixed(2)
}

// Cuando el restaurante tiene un solo bucket de menú Y ese bucket explica el 100% de sus
// reseñas (caso normal: restaurante de un solo menú, o de varios pero solo uno recibió
// reseñas), la fila "Todos los menús" sería un duplicado exacto de esa única fila — mejor
// mostrar directamente el valor del menú ahí en vez de repetirlo. Si hay 2+ buckets, o si el
// conteo no cierra (reseñas "Sin menú" mezcladas), la fila general sigue aportando algo real.
function onlyMenuRow(r: RankingRow): MenuRankingRow | null {
  return r.menus.length === 1 && r.menus[0].count === r.count ? r.menus[0] : null
}

// toLocaleString, no Intl.NumberFormat({style: 'currency'}): ese formateador inyecta un
// espacio non-breaking que corrompe las celdas del CSV.
function menuLabel(price: number | null): string {
  return price == null ? 'Sin menú' : `Menú de $${price.toLocaleString('es-CO')}`
}

const HEADERS = ['#', 'Restaurante', 'Menú', 'Promedio', 'Reseñas', 'Comida', 'Servicio', 'Ambiente']

function RankingCalificacionesTool() {
  const client = useClient({apiVersion: API_VERSION})
  const [status, setStatus] = useState<Status>({state: 'idle'})

  const handleLoad = async () => {
    setStatus({state: 'loading'})
    try {
      const reviews = await client.fetch<ReviewRow[]>(
        `*[_type == "review"] | order(createdAt asc){
          rating, foodRating, serviceRating, ambianceRating,
          menuKey, menuPriceSnapshot,
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
    const rows: unknown[][] = []
    status.rows.forEach((r, i) => {
      const onlyMenu = onlyMenuRow(r)
      rows.push([
        i + 1,
        r.name,
        r.avgRating.toFixed(2),
        r.count,
        fmt(r.avgFood),
        fmt(r.avgService),
        fmt(r.avgAmbiance),
        onlyMenu ? menuLabel(onlyMenu.priceSnapshot) : 'Todos los menús',
        onlyMenu ? (onlyMenu.priceSnapshot ?? '') : '',
      ])
      if (!onlyMenu) {
        for (const m of r.menus) {
          rows.push([
            i + 1,
            r.name,
            m.avgRating.toFixed(2),
            m.count,
            fmt(m.avgFood),
            fmt(m.avgService),
            fmt(m.avgAmbiance),
            menuLabel(m.priceSnapshot),
            m.priceSnapshot ?? '',
          ])
        }
      }
    })
    const csv = toCsv(
      ['posición', 'restaurante', 'promedio', 'reseñas', 'comida', 'servicio', 'ambiente', 'menú', 'precio'],
      rows,
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
          manos. Si un restaurante tiene reseñas de más de un menú, se muestran las filas por
          menú debajo de la fila general; si solo tiene un valor, se muestra directamente ese
          valor sin repetirlo.
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
                {status.rows.flatMap((r, i) => {
                  const onlyMenu = onlyMenuRow(r)
                  return [
                    <tr key={r.slug}>
                      <td style={{padding: '8px 12px'}}>{i + 1}</td>
                      <td style={{padding: '8px 12px'}}>{r.name}</td>
                      <td style={{padding: '8px 12px'}}>
                        {onlyMenu ? menuLabel(onlyMenu.priceSnapshot) : 'Todos los menús'}
                      </td>
                      <td style={{padding: '8px 12px'}}>{r.avgRating.toFixed(2)}</td>
                      <td style={{padding: '8px 12px'}}>{r.count}</td>
                      <td style={{padding: '8px 12px'}}>{fmt(r.avgFood)}</td>
                      <td style={{padding: '8px 12px'}}>{fmt(r.avgService)}</td>
                      <td style={{padding: '8px 12px'}}>{fmt(r.avgAmbiance)}</td>
                    </tr>,
                    ...(onlyMenu
                      ? []
                      : r.menus.map((m) => (
                          <tr key={`${r.slug}::${m.menuKey ?? 'none'}`}>
                            <td style={{padding: '8px 12px'}} />
                            <td style={{padding: '8px 12px'}} />
                            <td style={{padding: '8px 12px 8px 32px'}}>{menuLabel(m.priceSnapshot)}</td>
                            <td style={{padding: '8px 12px'}}>{m.avgRating.toFixed(2)}</td>
                            <td style={{padding: '8px 12px'}}>{m.count}</td>
                            <td style={{padding: '8px 12px'}}>{fmt(m.avgFood)}</td>
                            <td style={{padding: '8px 12px'}}>{fmt(m.avgService)}</td>
                            <td style={{padding: '8px 12px'}}>{fmt(m.avgAmbiance)}</td>
                          </tr>
                        ))),
                  ]
                })}
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
