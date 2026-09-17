import { test, expect, type Route } from '@playwright/test';
import { installOpenPaySdkStub } from './mocks';

/**
 * /recarga monta el wizard portal-cautivo (mismo flujo que port.beonline.mx,
 * mismo backend vía /api-proxy): número/ICCID → acción → paquetes → pago.
 *
 * SEGURIDAD: todo el tráfico a `/api-proxy/**` se intercepta a nivel browser.
 * Ninguna request real sale: cero cargos, cero recargas. Los endpoints no
 * contemplados se abortan y se registran en `unexpected`.
 */

const MSISDN = '5512345678';

const ICCID_VALID = {
  processable: true,
  dn: MSISDN,
  type: 'Movilidad',
  activar: false,
  recargar: true,
  portar: false,
  cambiar_nir: false,
};

const OFFER = {
  id: 201,
  name: '12GB BO APOLO',
  display_name: '12GB BO APOLO',
  amount: 230,
  data_national_limit: 12,
  interval: 'month',
  interval_count: 1,
  call_is_unlimit: 1,
  sms_is_unlimit: 1,
  rs_included_whatsapp: true,
  rs_included_facebook: true,
};

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

function installRecargaMocks(page: import('@playwright/test').Page, opts: { includeOpenPayCard?: boolean } = {}) {
  const unexpected: string[] = [];
  /** Bodies POST capturados de `/api/openpay/createCharge` — PCI, ver openpay-card.spec.ts. */
  const openPayChargeBodies: any[] = [];
  const openPaySdkRequestOrder: string[] = [];

  // SDKs externos de pago — bloqueados, SALVO OpenPay (se sirve con un stub,
  // ver installOpenPaySdkStub en mocks.ts — necesario para ejercitar la
  // tokenización real en el navegador sin salir a la red).
  page.route(
    /https:\/\/(js\.stripe\.com|.*mercadopago\.com|.*mercadolibre\.com|.*paypal\.com)\/.*/,
    (r) => r.abort(),
  );
  installOpenPaySdkStub(page, { openPaySdkRequestOrder });

  page.route('**/api-proxy/**', (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace(/^\/api-proxy/, '');
    const method = req.method();

    // Validación de número/ICCID
    if (path.startsWith('/api/page/getMsisdnBy')) {
      return json(route, { status: true, data: ICCID_VALID });
    }

    // Paquetes disponibles para el MSISDN (shape agrupado, como el backend real)
    if (path.startsWith('/api/odoo/product/findbymsisdn')) {
      return json(route, { status: true, data: [{ name: 'Recargas', order: 1, offers: [OFFER] }] });
    }

    // Pasarelas del portal (por msisdn)
    if (path.startsWith('/api/portal/payment/gateways')) {
      const gateways = [
        { key: 'stripe', label: 'Pagar con Tarjeta', icon: '', sortOrder: 1, type: 'card', publicKey: 'pk_test_gateway_mock' },
      ];
      // Etiqueta DISTINTA de la de Stripe a propósito (mismo motivo que en
      // mocks.ts): con las dos pasarelas presentes, GatewaySelector ya no
      // auto-selecciona y el test elige explícitamente.
      if (opts.includeOpenPayCard) {
        gateways.push({ key: 'openpayCard', label: 'Pagar con Tarjeta OpenPay', icon: '', sortOrder: 2, type: 'card', publicKey: 'pk_test_openpay_mock' });
      }
      return json(route, { status: true, data: { gateways } });
    }

    // Init de Stripe (portal) — con una sola pasarela el FE la auto-selecciona
    // y dispara el init apenas se renderiza el paso de pago.
    if (path === '/api/stripe/initFromWebPortal') {
      return json(route, { status: true, data: { paymentIntent: 'pi_test_secret_abc' } });
    }

    if (path === '/api/openpay/initFromWebPortal') {
      return json(route, {
        status: true,
        data: { merchant_id: 'mch_test_portal', public_key: 'pk_test_portal', is_sandbox: true, payment_reference: 'REF-TEST-PORTAL-123' },
      });
    }

    // PCI: captura el body EXACTO que llega a createCharge — la prueba lee
    // de `openPayChargeBodies` y falla si aparece un dato de tarjeta.
    if (path === '/api/openpay/createCharge' && method === 'POST') {
      let body: any = null;
      try { body = JSON.parse(req.postData() || '{}'); } catch { /* noop */ }
      openPayChargeBodies.push(body);
      return json(route, { status: true, data: { charge_id: 'ch_test_portal_1', status: 'completed' } });
    }

    if (path === '/api/openpay/validateIntent') {
      return json(route, { status: true, data: { status: 'completed' } });
    }

    // Banners y lecturas inocuas → vacío
    if (path.startsWith('/api/page/banners')) {
      return json(route, { status: true, data: { section: 'top', items: [] } });
    }

    unexpected.push(`${method} ${path}`);
    return route.abort('failed');
  });

  return { unexpected, openPayChargeBodies, openPaySdkRequestOrder };
}

test.describe('/recarga — wizard portal cautivo', () => {
  test('flujo completo hasta selector de pago con tarjetas BO', async ({ page }) => {
    const { unexpected } = installRecargaMocks(page);

    await page.goto('/recarga/');

    // Paso 0: número. Con client:visible la isla puede hidratar DESPUÉS de
    // que empezamos a teclear y un re-render borra el valor. Reintentamos
    // hasta que el valor sobreviva a la hidratación.
    await expect(
      page.getByRole('heading', { name: 'Ingresa tu número' }),
    ).toBeVisible();
    const input = page.getByPlaceholder('10 dígitos o ICCID');
    await input.click();
    await expect(async () => {
      await input.fill('');
      await input.pressSequentially(MSISDN, { delay: 30 });
      await page.waitForTimeout(400);
      expect(await input.inputValue()).toBe(MSISDN);
    }).toPass({ timeout: 15000 });
    const continuar = page.getByRole('button', { name: /Continuar/ });
    await expect(continuar).toBeEnabled();
    await continuar.click();

    // Paso 1: acción (solo recargar disponible según el mock)
    await expect(page.getByText('¿Qué deseas hacer?')).toBeVisible();
    await page.getByRole('button', { name: /Recargar saldo/ }).click();

    // Paso 2: paquetes con el diseño nuevo (PlanCardBO)
    await expect(page.getByText('Elige tu plan')).toBeVisible();
    const card = page.getByRole('button', { name: /BO APOLO/i });
    await expect(card).toBeVisible();
    await expect(page.getByText('12GB', { exact: true }).first()).toBeVisible();
    await card.click();

    // Paso 3: pago — resumen del plan + pasarela
    await expect(page.getByText('$230 MXN')).toBeVisible();
    await expect(page.getByText('Pagar con Tarjeta')).toBeVisible();

    expect(unexpected).toEqual([]);
  });

  test('precarga el número desde ?msisdn=', async ({ page }) => {
    installRecargaMocks(page);
    await page.goto(`/recarga/?msisdn=${MSISDN}`);
    await expect(page.getByPlaceholder('10 dígitos o ICCID')).toHaveValue(MSISDN);
  });

  test('muestra el branding de marca (astronauta y SIM)', async ({ page }) => {
    installRecargaMocks(page);
    await page.goto('/recarga/');
    await expect(
      page.getByRole('heading', { name: /Activa y recarga tu línea/ }),
    ).toBeVisible();
    // Astronauta de bienvenida asomando en la tarjeta (como las páginas anteriores)
    await expect(page.getByAltText('Bienvenido a Be Online')).toBeVisible();
    // Tarjeta SIM de marca junto al input del número
    await expect(page.getByAltText('Tarjeta SIM Be Online')).toBeVisible();
  });

  /**
   * PCI anti-regresión (fix 2026-09-17). ANTES, `OpenPayCard.tsx` armaba
   * `OpenPayCardData` con el PAN crudo y `portalOpenPayCharge` lo reenviaba
   * tal cual a `/api/openpay/createCharge`. Esta prueba tokeniza con el SDK
   * de OpenPay (mockeado, sin red real — ver `installOpenPaySdkStub` en
   * `mocks.ts`) y verifica que el body que llega al backend SÓLO trae
   * `payment_reference` + `token_id` + `device_session_id` + `redirect_url`
   * — nunca un dato de tarjeta — y que los dos scripts del SDK se piden EN
   * SERIE (openpay.v1 antes que openpay-data.v1).
   */
  test('cobra con tarjeta OpenPay tokenizada en el navegador — NUNCA manda el PAN al backend', async ({ page }) => {
    const { openPayChargeBodies, openPaySdkRequestOrder, unexpected } = installRecargaMocks(page, {
      includeOpenPayCard: true,
    });

    await page.goto('/recarga/');

    const input = page.getByPlaceholder('10 dígitos o ICCID');
    await input.click();
    await expect(async () => {
      await input.fill('');
      await input.pressSequentially(MSISDN, { delay: 30 });
      await page.waitForTimeout(400);
      expect(await input.inputValue()).toBe(MSISDN);
    }).toPass({ timeout: 15000 });
    await page.getByRole('button', { name: /Continuar/ }).click();

    await expect(page.getByText('¿Qué deseas hacer?')).toBeVisible();
    await page.getByRole('button', { name: /Recargar saldo/ }).click();

    const card = page.getByRole('button', { name: /BO APOLO/i });
    await expect(card).toBeVisible();
    await card.click();

    // Con dos pasarelas disponibles ya NO se auto-selecciona — elegimos OpenPay.
    await expect(page.getByText('$230 MXN')).toBeVisible();
    await page.getByRole('button', { name: 'Pagar con Tarjeta OpenPay' }).click();

    // El formulario de tarjeta se pinta tras cargar el SDK (mockeado).
    const cardNumberInput = page.getByPlaceholder('1234 5678 9012 3456');
    await expect(cardNumberInput).toBeVisible({ timeout: 10_000 });

    await cardNumberInput.fill('4111111111111111');
    await page.getByPlaceholder('Como aparece en la tarjeta').fill('QA Prueba');
    await page.getByPlaceholder('MM').fill('12');
    await page.getByPlaceholder('AA').fill('30');
    await page.getByPlaceholder('***').fill('123');

    const chargeReq = page.waitForRequest(
      (r) => r.url().includes('/api/openpay/createCharge') && r.method() === 'POST',
    );
    // GatewaySelector sigue montado (con sus propios botones "Pagar con...")
    // junto al form de OpenPayCard — se escopea al <form> para no ambigüar.
    await page.locator('form').getByRole('button', { name: /Pagar/ }).click();
    await chargeReq;

    // Cargo síncrono (sin 3DS en el mock) → sondeo de validateIntent → éxito.
    await expect(page.getByText('¡Recarga exitosa!')).toBeVisible({ timeout: 15_000 });

    // ── Aserciones PCI: el cuerpo que llegó al backend ────────────────────
    expect(openPayChargeBodies).toHaveLength(1);
    const body = openPayChargeBodies[0];
    expect(body).toMatchObject({
      payment_reference: 'REF-TEST-PORTAL-123',
      token_id: 'tok_test_mocked_123',
      device_session_id: 'device-session-test-abc',
    });
    expect(body.redirect_url).toMatch(/\/pago-exitoso$/);
    expect(Object.keys(body).sort()).toEqual(
      ['device_session_id', 'payment_reference', 'redirect_url', 'token_id'],
    );
    for (const campo of ['card_number', 'cvv2', 'cvv', 'holder_name', 'expiration_month', 'expiration_year']) {
      expect(body).not.toHaveProperty(campo);
    }
    expect(JSON.stringify(body)).not.toMatch(/4111111111111111/);

    // ── El SDK se pidió EN SERIE: openpay.v1 antes que openpay-data.v1 ────
    expect(openPaySdkRequestOrder).toEqual(['openpay.v1', 'openpay-data.v1']);

    expect(unexpected).toEqual([]);
  });
});
