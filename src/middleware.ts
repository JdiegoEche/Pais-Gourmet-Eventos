import { defineMiddleware } from 'astro:middleware';
import { isAuthenticated } from './lib/adminAuth';

// Protege todo /admin/* (páginas) y /api/admin/* (API), salvo login/logout — el resto del
// sitio (público) pasa de largo sin tocar la sesión.
const PROTECTED_PAGE_PREFIX = '/admin';
const PROTECTED_API_PREFIX = '/api/admin';
const PUBLIC_PAGE_PATHS = new Set(['/admin/login']);
const PUBLIC_API_PATHS = new Set(['/api/admin/login', '/api/admin/logout']);

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  const isProtectedPage = pathname.startsWith(PROTECTED_PAGE_PREFIX) && !PUBLIC_PAGE_PATHS.has(pathname);
  const isProtectedApi = pathname.startsWith(PROTECTED_API_PREFIX) && !PUBLIC_API_PATHS.has(pathname);

  if (!isProtectedPage && !isProtectedApi) {
    return next();
  }

  if (await isAuthenticated(context.cookies)) {
    return next();
  }

  if (isProtectedApi) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return context.redirect('/admin/login');
});
