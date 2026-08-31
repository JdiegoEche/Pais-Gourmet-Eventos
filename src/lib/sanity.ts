import { createClient } from '@sanity/client';

const projectId = import.meta.env.SANITY_PROJECT_ID;
const dataset = import.meta.env.SANITY_DATASET;
// Dataset privado (visibilidad "Private" en Sanity) donde vive la PII: inscripciones del
// formulario y datos de contacto de las reseñas. Nunca se lee desde el sitio público.
const leadsDataset = import.meta.env.SANITY_LEADS_DATASET ?? 'leads';
export const eventSlug = import.meta.env.EVENT_SLUG;

export const sanity = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: true,
});

// Server-only: never import this from a component that ships to the client.
export function getSanityWriteClient() {
  return createClient({
    projectId,
    dataset,
    apiVersion: '2024-01-01',
    token: import.meta.env.SANITY_WRITE_TOKEN,
    useCdn: false,
  });
}

// Server-only: cliente de escritura/lectura contra el dataset privado `leads`. Reusa el
// mismo SANITY_WRITE_TOKEN (un token Editor del proyecto tiene acceso a todos los datasets).
export function getLeadsWriteClient() {
  return createClient({
    projectId,
    dataset: leadsDataset,
    apiVersion: '2024-01-01',
    token: import.meta.env.SANITY_WRITE_TOKEN,
    useCdn: false,
  });
}
