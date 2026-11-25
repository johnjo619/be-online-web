import { test, expect, type Page, type Route } from '@playwright/test';

/**
 * Pedido del dueño (25-nov-2026): en los planes que llevan cine, la ventana que se abre al tocar un precio dice
 * que los boletos se piden desde la app. La regla de qué plan lleva cine es la MISMA que pinta el sello en la
 * tarjeta (CineGratis/PlanSelector): 4 y 12 GB en los planes normales y todos los de Be Protected. Coincide con el
 * CRM (pluus_planes de Figou, verificado ese día).
 *
 * Todo `/api-proxy/**` se intercepta: ninguna petición real sale.
 */

function oferta(id: number, name: string, gb: number, amount: number) {
  return {
    id, name, amount, data_national_limit: gb, interval: 'day', interval_count: 30, type: 'Movilidad',
    call_is_unlimit: 1, sms_is_unlimit: 1,
  };
}

const CATALOGO = [
  { name: 'Mensual', order: 1, offers: [oferta(448, 'BO MERCURY', 4, 229), oferta(439, 'BO ASTEROID', 24, 329)] },
  { name: 'Be Protected', order: 2, offers: [oferta(491, 'BO MERCURY', 4, 349), oferta(493, 'BO ASTEROID', 24, 449)] },
];

function json(route: Route, body: unknown) {
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
}

async function instalar(page: Page) {
  await page.route('**/api-proxy/**', (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api-proxy/, '');
    if (path.startsWith('/api/odoo/product/findbytype')) return json(route, { status: true, data: CATALOGO });
    return json(route, { status: true, data: [] });
  });
}

/** La tarjeta de un plan dentro de una sección (`#planes-be-protected` o la de planes normales). */
function precio(page: Page, seccion: string | null, plan: string) {
  const base = seccion ? page.locator(seccion) : page.locator('section').filter({ hasNot: page.locator('#planes-be-protected') });
  return base.locator('div.rounded-2xl.shadow-xl', { hasText: plan }).first().getByRole('button', { name: /30 días/ });
}

test('el 4 GB normal avisa que el cine se pide desde la app; el 24 GB normal no lleva cine ni aviso', async ({ page }) => {
  await instalar(page);
  await page.goto('/telefonia-movil/');

  await precio(page, null, 'BO MERCURY').click();
  const ventana = page.getByRole('dialog');
  await expect(ventana).toBeVisible();
  await expect(ventana.locator('[data-aviso-cine]')).toHaveText(/Incluye cine 2x1: tus boletos se piden desde la app Be Online\./);
  await ventana.getByRole('button', { name: 'Cerrar' }).click();

  await precio(page, null, 'BO ASTEROID').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').locator('[data-aviso-cine]')).toHaveCount(0);
});

test('en Be Protected todos llevan cine: el 24 GB también avisa', async ({ page }) => {
  await instalar(page);
  await page.goto('/');
  const bp = page.locator('#planes-be-protected');
  await bp.scrollIntoViewIfNeeded();

  await precio(page, '#planes-be-protected', 'BO ASTEROID').click();
  await expect(page.getByRole('dialog').locator('[data-aviso-cine]')).toBeVisible();
});
