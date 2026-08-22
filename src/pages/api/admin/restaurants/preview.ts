import type { APIRoute } from 'astro';
import { parseRestaurantsExcel } from '../../../../lib/admin/parseRestaurantsExcel';
import { isRateLimited } from '../../../../lib/rateLimit';

export const prerender = false;

const MAX_EXCEL_SIZE = 10 * 1024 * 1024; // 10MB, holgado para un excel de inscripciones
const ALLOWED_EXCEL_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel',
]);

// El content-type que reporta el navegador para .xlsx no siempre es confiable (a veces llega
// vacío u "octet-stream"), así que se acepta también por extensión de archivo.
function isAllowedExcelFile(file: File): boolean {
  if (ALLOWED_EXCEL_TYPES.has(file.type)) return true;
  return /\.xlsx$/i.test(file.name);
}

export const POST: APIRoute = async (context) => {
  const { request } = context;

  if (await isRateLimited(context, 'RATE_LIMITER_WRITE')) {
    return new Response(JSON.stringify({ error: 'Demasiadas solicitudes. Esperá un minuto e intentá de nuevo.' }), {
      status: 429,
    });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: 'No se pudo leer el formulario' }), { status: 400 });
  }

  const file = formData.get('excel');
  const eventId = formData.get('eventId');

  if (!(file instanceof File)) {
    return new Response(JSON.stringify({ error: 'Falta el archivo Excel' }), { status: 400 });
  }
  if (typeof eventId !== 'string' || !eventId) {
    return new Response(JSON.stringify({ error: 'Falta el evento' }), { status: 400 });
  }
  if (file.size > MAX_EXCEL_SIZE) {
    return new Response(
      JSON.stringify({ error: `El archivo excede el tamaño máximo permitido (${MAX_EXCEL_SIZE / (1024 * 1024)}MB)` }),
      { status: 400 }
    );
  }
  if (!isAllowedExcelFile(file)) {
    return new Response(JSON.stringify({ error: 'El archivo debe ser un Excel (.xlsx)' }), { status: 400 });
  }

  try {
    const buffer = await file.arrayBuffer();
    const { documents, report } = parseRestaurantsExcel(buffer, eventId);
    return new Response(JSON.stringify({ documents, report }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(JSON.stringify({ error: `No se pudo leer el Excel: ${message}` }), { status: 400 });
  }
};
