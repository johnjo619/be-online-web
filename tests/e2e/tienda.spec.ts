import { test, expect, type Page } from '@playwright/test';
import { installTiendaMocks, type MockState } from './mocks';

/**
 * E2E del flujo de contratación de línea (tienda — móvil + eSIM).
 *
 * TODO el backend está mockeado: ninguna orden ni cargo real se genera. Se
 * ejercita la UI completa hasta el paso de pago. Stripe y MercadoPago se validan
 * hasta que disparan el init de la pasarela (sus SDKs externos están bloqueados).
 *
 * Pasarelas REALES de Be Online (company_id=1): Tarjeta (Stripe) y Mercado Pago.
 * PayPal lo filtra el FE (sin endpoint) y OXXO NO está disponible — ambos casos
 * tienen test explícito abajo.
 */

/** Llega hasta el checkout con servicio móvil + plan seleccionado. */
async function selectMovilPlan(page: Page) {
  await page.goto('/tienda/');

  // TiendaFlow hidrata con client:visible — el primer click puede llegar antes
  // de que React adjunte el handler. Reintentamos hasta que aparezcan los planes.
  const planCta = page.getByRole('button', { name: /quiero/i });
  await expect(async () => {
    await page.getByRole('button', { name: /Telefonía móvil/i }).click();
    await expect(planCta).toBeVisible({ timeout: 2000 });
  }).toPass();

  await planCta.first().click();
}

/** Completa datos de cliente (eSIM: sin dirección) y elige una pasarela. */
async function fillCustomerAndPickGateway(page: Page, gatewayName: string) {
  await page.getByPlaceholder('Juan Pérez').fill('Ana Prueba');
  await page.getByPlaceholder('55 1234 5678').fill('5512345678');
  await page.getByPlaceholder('tu@correo.com').fill('ana@correo.com');

  await page.getByRole('button', { name: 'Continuar al pago' }).click();
  await page.getByRole('button', { name: gatewayName }).click();
}

test('contratación eSIM con Tarjeta (Stripe) — happy path: crea orden + dispara init', async ({ page }) => {
  const state: MockState = installTiendaMocks(page);

  await selectMovilPlan(page);
  await fillCustomerAndPickGateway(page, 'Pagar con Tarjeta');

  const initReq = page.waitForRequest((r) =>
    r.url().includes('/api/ecommerce/stripe/init') && r.method() === 'POST',
  );
  await page.getByRole('button', { name: /Pagar \$\d+ MXN/ }).click();
  await initReq;

  // Payload de la orden: plan correcto, eSIM, sin dispositivo/envío.
  expect(state.createdOrders).toHaveLength(1);
  const order = state.createdOrders[0];
  expect(order.company_id).toBe(1);
  expect(order.sim_type).toBe('esim');
  expect(order.customer_email).toBe('ana@correo.com');
  expect(order.items).toHaveLength(1);
  expect(order.items[0]).toMatchObject({ offer_id: 101, product_type: 'plan', quantity: 1 });

  // Nada se filtró al backend real.
  expect(state.unexpected).toEqual([]);
});

test('contratación eSIM con Mercado Pago — dispara init de pasarela', async ({ page }) => {
  const state = installTiendaMocks(page);

  await selectMovilPlan(page);
  await fillCustomerAndPickGateway(page, 'Pagar con Mercado Pago');

  const initReq = page.waitForRequest((r) =>
    r.url().includes('/api/ecommerce/mercadopago/init') && r.method() === 'POST',
  );
  await page.getByRole('button', { name: /Pagar \$\d+ MXN/ }).click();
  await initReq;

  expect(state.createdOrders).toHaveLength(1);
  expect(state.unexpected).toEqual([]);
});

/** Lleva al paso de checkout (selección de pasarela) sin elegir ninguna. */
async function gotoCheckout(page: Page) {
  await page.getByPlaceholder('Juan Pérez').fill('Ana Prueba');
  await page.getByPlaceholder('55 1234 5678').fill('5512345678');
  await page.getByPlaceholder('tu@correo.com').fill('ana@correo.com');
  await page.getByRole('button', { name: 'Continuar al pago' }).click();
}

test('OXXO NO se ofrece y PayPal se filtra — solo Tarjeta y Mercado Pago', async ({ page }) => {
  installTiendaMocks(page);

  await selectMovilPlan(page);
  await gotoCheckout(page);

  // Disponibles para Be Online.
  await expect(page.getByRole('button', { name: 'Pagar con Tarjeta' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pagar con Mercado Pago' })).toBeVisible();

  // NO disponibles: OXXO (no es pasarela de Be Online) y PayPal (sin endpoint, FE lo filtra).
  await expect(page.getByRole('button', { name: /OXXO/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /PayPal/i })).toHaveCount(0);
});

test('sin fallback: si el API de gateways falla, no se inyectan pasarelas hardcodeadas', async ({ page }) => {
  installTiendaMocks(page, { failGateways: true });

  await selectMovilPlan(page);
  await gotoCheckout(page);

  // No hay fallback: estado vacío, no inventamos métodos que el tenant podría no tener.
  await expect(page.getByText('No hay métodos de pago disponibles')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pagar con Tarjeta' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Pagar con Mercado Pago' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /OXXO/i })).toHaveCount(0);
});

test('error al cargar planes muestra mensaje de fallback', async ({ page }) => {
  installTiendaMocks(page, { failPlans: true });

  await page.goto('/tienda/');

  const errorMsg = page.getByText(/No pudimos cargar los planes/i);
  await expect(async () => {
    await page.getByRole('button', { name: /Telefonía móvil/i }).click();
    await expect(errorMsg).toBeVisible({ timeout: 2000 });
  }).toPass();
});
