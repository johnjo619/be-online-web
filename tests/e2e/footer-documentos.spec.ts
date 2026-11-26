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

test('ningún enlace del pie da 404 (Contratos, Neutralidad de la Red y la Carta de Derechos Mínimos incluidos)', async ({ page, request }) => {
  // Antes del 25-nov-2026 «Contratos», «Neutralidad de la Red» y «Carta de Derechos Mínimos» daban 404 en vivo.
  await page.route('**/api-proxy/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"status":true,"data":[]}' }));
  await page.goto('/telefonia-movil/');
  const hrefs = await page.locator('footer a[href^="/"]').evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute('href')!))]);
  expect(hrefs).toEqual(expect.arrayContaining(['/contratos', '/neutralidad-de-la-red', '/docs/carta-derechos-minimos.pdf']));
  for (const h of hrefs) {
    const res = await request.get(h.split('#')[0] || '/');
    expect(res.status(), h).toBe(200);
  }
});

test('Contratos y Neutralidad de la Red: páginas de Be Online con los documentos del operador', async ({ page, request }) => {
  await page.route('**/api-proxy/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"status":true,"data":[]}' }));
  await page.goto('/contratos/');
  await expect(page.getByRole('heading', { name: 'Contratos', level: 1 })).toBeVisible();
  const pdfs = page.locator('article a[href^="/docs/"]');
  await expect(pdfs).toHaveCount(4);
  for (const href of await pdfs.evaluateAll((as) => as.map((a) => a.getAttribute('href')!))) {
    const res = await request.get(href);
    expect(res.status(), href).toBe(200);
    expect((await res.body()).subarray(0, 5).toString()).toBe('%PDF-');
  }

  await page.goto('/neutralidad-de-la-red/');
  await expect(page.getByRole('heading', { name: 'Neutralidad de la Red', level: 1 })).toBeVisible();
  await expect(page.locator('article')).toContainText('Código de Políticas de Gestión de Tráfico y Administración de Red');
  await expect(page.locator('article')).toContainText('9. Recomendaciones para prevenir riesgos');
});

test('«Programa Beneficios» lleva a la sección Be Protected de la portada', async ({ page }) => {
  await page.route('**/api-proxy/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"status":true,"data":[]}' }));
  await page.goto('/#be-protected');
  await expect(page.locator('section#be-protected')).toBeInViewport();
});
