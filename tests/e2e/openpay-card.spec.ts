import { test, expect } from '@playwright/test';
import { installTiendaMocks } from './mocks';

/**
 * PCI anti-regresión — /tienda con OpenPay tarjeta (fix 2026-09-17).
 *
 * ANTES de este fix, `OpenPayCard.tsx` armaba `OpenPayCardData` con el PAN
 * crudo (`card_number`, `cvv2`, `holder_name`, `expiration_month/year`) y
 * `lib/api.ts` lo reenviaba TAL CUAL a `/api/ecommerce/openpay/createCharge`
 * — y ese endpoint además esperaba `payment_reference` en vez de `order_uuid`,
 * así que ni siquiera cobraba (404 "Orden no encontrada").
 *
 * Esta prueba tokeniza con el SDK real de OpenPay (mockeado sin salir a la
 * red, ver `mocks.ts`) y verifica que el body que llega al backend SÓLO trae
 * `order_uuid` + `token_id` + `device_session_id` — nunca un dato de tarjeta —
 * y que los dos scripts del SDK se piden EN SERIE (openpay.v1 antes que
 * openpay-data.v1; pedirlos en paralelo tumbó la app en app_web, 16-sep-2026).
 */

test('OpenPay tarjeta en /tienda: tokeniza en el navegador y NUNCA manda el PAN al backend', async ({ page }) => {
  const state = installTiendaMocks(page, { includeOpenPayCard: true });

  await page.goto('/tienda/');

  // Llega hasta el checkout con servicio móvil + plan seleccionado.
  // NOTA: `tienda.spec.ts` usa `getByRole('button', {name: /quiero/i})`, pero
  // el `aria-label` real de PlanCardBO.tsx es "Contratar {title} — ...pesos"
  // (nunca contuvo "quiero") — bug preexistente de ESE helper, reproducible
  // en `origin/main` sin este fix y AJENO a la tokenización OpenPay. Aquí se
  // usa el aria-label real para no heredar ese false negative.
  const planCta = page.getByRole('button', { name: /Contratar/i });
  await expect(async () => {
    await page.getByRole('button', { name: /Telefonía móvil/i }).click();
    await expect(planCta).toBeVisible({ timeout: 2000 });
  }).toPass();
  await planCta.first().click();

  // Datos de cliente — número de prueba, NUNCA uno real.
  await page.getByPlaceholder('Juan Pérez').fill('Ana Prueba');
  await page.getByPlaceholder('55 1234 5678').fill('5500000099');
  await page.getByPlaceholder('tu@correo.com').fill('ana@correo.com');
  await page.getByRole('button', { name: 'Continuar al pago' }).click();

  // Elegimos OpenPay tarjeta (etiqueta distinta de 'Pagar con Tarjeta' de Stripe).
  await page.getByRole('button', { name: 'Pagar con Tarjeta OpenPay' }).click();

  const initReq = page.waitForRequest(
    (r) => r.url().includes('/api/ecommerce/openpay/init') && r.method() === 'POST',
  );
  await page.getByRole('button', { name: /Pagar \$\d+ MXN/ }).click();
  await initReq;

  // El formulario de tarjeta se pinta tras cargar el SDK (mockeado, ver mocks.ts).
  const cardNumberInput = page.getByPlaceholder('1234 5678 9012 3456');
  await expect(cardNumberInput).toBeVisible({ timeout: 10_000 });

  await cardNumberInput.fill('4111111111111111');
  await page.getByPlaceholder('Como aparece en la tarjeta').fill('QA Prueba');
  await page.getByPlaceholder('MM').fill('12');
  await page.getByPlaceholder('AA').fill('30');
  await page.getByPlaceholder('***').fill('123');

  const chargeReq = page.waitForRequest(
    (r) => r.url().includes('/api/ecommerce/openpay/createCharge') && r.method() === 'POST',
  );
  await page.getByRole('button', { name: /Pagar/ }).click();
  await chargeReq;

  // Cargo síncrono (sin 3DS en el mock) → redirige a /pago-exitoso, igual que
  // Stripe/Mercado Pago; OrderStatusPoller confirma ahí con el status de la orden.
  await page.waitForURL(/\/pago-exitoso/);
  await expect(page.getByText(/Pago confirmado|Confirmando tu pago/i)).toBeVisible();

  // ── Aserciones PCI: el cuerpo que llegó al backend ──────────────────────
  expect(state.openPayChargeBodies).toHaveLength(1);
  const body = state.openPayChargeBodies[0];
  expect(body).toEqual({
    order_uuid: 'test-uuid-123',
    token_id: 'tok_test_mocked_123',
    device_session_id: 'device-session-test-abc',
  });
  for (const campo of ['card_number', 'cvv2', 'cvv', 'holder_name', 'expiration_month', 'expiration_year']) {
    expect(body).not.toHaveProperty(campo);
  }
  // Cinturón y tirantes: ni el PAN de prueba aparece en ningún valor del body.
  expect(JSON.stringify(body)).not.toMatch(/4111111111111111/);

  // ── El SDK se pidió EN SERIE: openpay.v1 antes que openpay-data.v1 ──────
  expect(state.openPaySdkRequestOrder).toEqual(['openpay.v1', 'openpay-data.v1']);

  // Nada se filtró al backend real fuera de lo contemplado.
  expect(state.unexpected).toEqual([]);
});
