import {useState} from 'react'
import {Button, Card, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {DownloadIcon} from '@sanity/icons/Download'
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

interface LeadSignup {
  name?: string
  email?: string
  phone?: string
  createdAt?: string
}

interface ReviewContactReply {
  name?: string
  email?: string
  phone?: string
  createdAt?: string
}

interface ReviewContact {
  name?: string
  email?: string
  phone?: string
  restaurantSlug?: string
  createdAt?: string
  reviewId?: string
  replies?: ReviewContactReply[]
}

type Status =
  | {state: 'idle'}
  | {state: 'loading'}
  | {state: 'error'; message: string}
  | {state: 'success'; signups: number; contacts: number}

function ExportLeadsTool() {
  const client = useClient({apiVersion: API_VERSION})
  const [status, setStatus] = useState<Status>({state: 'idle'})

  const handleExport = async () => {
    setStatus({state: 'loading'})
    try {
      const signups = await client.fetch<LeadSignup[]>(
        `*[_type == "leadSignup"] | order(createdAt desc){ name, email, phone, createdAt }`,
      )
      const signupsCsv = toCsv(
        ['nombre', 'email', 'celular', 'fecha'],
        signups.map((s) => [s.name, s.email, s.phone, s.createdAt]),
      )

      const contacts = await client.fetch<ReviewContact[]>(
        `*[_type == "reviewContact"] | order(createdAt desc){
          name, email, phone, restaurantSlug, createdAt, reviewId, replies
        }`,
      )
      const rows: unknown[][] = []
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

      downloadCsv('inscripciones.csv', signupsCsv)
      downloadCsv('contactos-resenas.csv', contactsCsv)

      setStatus({state: 'success', signups: signups.length, contacts: rows.length})
    } catch (error) {
      setStatus({
        state: 'error',
        message: error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
      })
    }
  }

  return (
    <Card padding={4}>
      <Stack gap={4}>
        <Text size={2} weight="semibold">
          Exportar leads a CSV
        </Text>
        <Text size={1} muted>
          Descarga dos archivos: las inscripciones del formulario y los contactos de reseñas
          (con sus respuestas). Se abren directamente en Excel.
        </Text>

        <Flex align="center" gap={3}>
          <Button
            icon={DownloadIcon}
            text="Exportar CSV"
            tone="primary"
            onClick={handleExport}
            disabled={status.state === 'loading'}
          />
          {status.state === 'loading' && <Spinner muted />}
        </Flex>

        {status.state === 'error' && (
          <Card padding={3} radius={2} tone="critical">
            <Text size={1}>No se pudo exportar: {status.message}</Text>
          </Card>
        )}

        {status.state === 'success' && (
          <Card padding={3} radius={2} tone="positive">
            <Text size={1}>
              Listo: {status.signups} inscripción(es) y {status.contacts} contacto(s) de reseñas
              descargados.
            </Text>
          </Card>
        )}
      </Stack>
    </Card>
  )
}

export const exportLeadsTool: Tool = {
  name: 'export-leads',
  title: 'Exportar CSV',
  icon: DownloadIcon,
  component: ExportLeadsTool,
}
