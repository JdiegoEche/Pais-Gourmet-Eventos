import type { APIRoute } from 'astro';
import { parseRestaurantsExcel } from '../../../../lib/admin/parseRestaurantsExcel';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
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
