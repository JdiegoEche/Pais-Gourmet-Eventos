import { createClient } from '@sanity/client';

const projectId = import.meta.env.SANITY_PROJECT_ID;
const dataset = import.meta.env.SANITY_DATASET;
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
    token: import.meta.env.SANITY_REVIEW_TOKEN,
    useCdn: false,
  });
}
