import { test, expect } from '@playwright/test';

/**
 * Pie de página, columna Be Protected (25-nov-2026): los documentos de la membresía que entregó el dueño se bajan
 * desde ahí, y «Programa Beneficios» ya no manda a /beneficios (no existe: 404) sino a la sección de la portada.
 */
const DOCUMENTOS = [
  { texto: 'Tabla de beneficios (PDF)', ruta: '/docs/be-protected-beneficios.pdf' },
  { texto: 'Condiciones generales (PDF)', ruta: '/docs/be-protected-condiciones-generales.pdf' },
  { texto: 'Condiciones del cine (PDF)', ruta: '/docs/cine-cinepolis-condiciones.pdf' },
];

test('los documentos de Be Protected están en el pie y se sirven como PDF', async ({ page, request }) => {
  await page.route('**/api-proxy/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"status":true,"data":[]}' }));
  await page.goto('/telefonia-movil/');
  const pie = page.locator('footer');

  for (const d of DOCUMENTOS) {
    const enlace = pie.getByRole('link', { name: d.texto });
    await expect(enlace).toHaveAttribute('href', d.ruta);
    await expect(enlace).toHaveAttribute('target', '_blank');
    const res = await request.get(d.ruta);
    expect(res.status(), d.ruta).toBe(200);
    expect((await res.body()).subarray(0, 5).toString()).toBe('%PDF-');
  }

  await expect(pie.getByRole('link', { name: 'Programa Beneficios' })).toHaveAttribute('href', '/#be-protected');
});

test('«Programa Beneficios» lleva a la sección Be Protected de la portada', async ({ page }) => {
  await page.route('**/api-proxy/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"status":true,"data":[]}' }));
  await page.goto('/#be-protected');
  await expect(page.locator('section#be-protected')).toBeInViewport();
});
