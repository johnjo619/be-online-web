import { test, expect, type Locator, type Page, type Route } from '@playwright/test';
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

function installRecargaMocks(
  page: import('@playwright/test').Page,
  opts: { includeOpenPayCard?: boolean; gateways?: unknown[] } = {},
) {
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
      return json(route, { status: true, data: { gateways: opts.gateways ?? gateways } });
    }

    if (path === '/api/openpay/initStorePayment' && method === 'POST') {
      // Ficha de PayNet SIN `places` ni `instructions`: así se ve lo que el sitio pone por su cuenta.
      return json(route, { status: true, data: { reference: '93000000000000001234', amount: 230, barcode_url: null, due_date: null, description: 'Recarga' } });
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

/** Las pasarelas que ve una línea de Be Online en producción (25-nov-2026): Tarjeta, tarjeta Openpay y PayNet. */
const PASARELAS_BO = [
  { key: 'stripe', label: 'Pagar con Tarjeta', icon: '', sortOrder: 1, type: 'card', publicKey: 'pk_test_gateway_mock' },
  { key: 'openpayCard', label: 'Pagar con Tarjeta OpenPay', icon: '', sortOrder: 2, type: 'card', publicKey: 'pk_test_openpay_mock' },
  { key: 'openpayStore', label: 'Pagar con PayNet', icon: '', sortOrder: 3, type: 'store', publicKey: '' },
];

/** Del número al paso de pago, con la hidratación tardía de la isla resuelta (ver la primera prueba). */
async function llegarAlPago(page: Page) {
  const input = page.getByPlaceholder('10 dígitos o ICCID');
  await input.click();
  await expect(async () => {
    await input.fill('');
    await input.pressSequentially(MSISDN, { delay: 30 });
    await page.waitForTimeout(400);
    expect(await input.inputValue()).toBe(MSISDN);
  }).toPass({ timeout: 15000 });
  await page.getByRole('button', { name: /Continuar/ }).click();
  await page.getByRole('button', { name: /Recargar saldo/ }).click();
  await page.getByRole('button', { name: /BO APOLO/i }).click();
  await expect(page.getByText('$230 MXN')).toBeVisible();
}

/**
 * Toca la pasarela como el cliente en un celular: ve el paso de pago desde su inicio (el resumen del paquete justo
 * debajo de la barra) y, si la que quiere no se ve, baja SOLO lo justo para verla. Nada de centrarla: así quedaba
 * fuera de la vista lo que aparece debajo.
 */
async function elegirPasarela(page: Page, nombre: RegExp) {
  await llegarAlPago(page);
  const tarjeta = page.getByRole('button', { name: nombre });
  await page.getByText('$230 MXN').evaluate((el) => {
    const barra = document.querySelector('header')?.getBoundingClientRect().height ?? 0;
    window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - barra - 16);
  });
  await tarjeta.evaluate((el) => el.scrollIntoView({ block: 'nearest' }));
  const antes = await page.evaluate(() => window.scrollY);
  await tarjeta.click();
  return antes;
}

/** Lo que aparece al elegir tiene que ASOMAR: su orilla de arriba en pantalla con al menos 120 px debajo. */
async function expectQueAsome(page: Page, loc: Locator) {
  await expect.poll(async () => {
    const caja = await loc.boundingBox();
    const alto = page.viewportSize()!.height;
    return caja !== null && caja.y >= 0 && caja.y <= alto - 120;
  }, { message: 'lo que aparece al elegir la pasarela no queda a la vista' }).toBe(true);
}

test.describe('/recarga — lo que se elige se ve (25-nov-2026)', () => {
  test('en el celular, al elegir Tarjeta el formulario queda a la vista (no abajo, fuera de la pantalla)', async ({ page }) => {
    const { unexpected } = installRecargaMocks(page, { gateways: PASARELAS_BO });
    await page.setViewportSize({ width: 390, height: 664 });
    await page.goto('/recarga/');
    await elegirPasarela(page, /Pagar con Tarjeta Visa/);

    const pagar = page.getByRole('button', { name: /Pagar \$230/ });
    await expectQueAsome(page, page.locator('form').filter({ has: pagar }));
    await expect(pagar).toBeInViewport();
    expect(unexpected).toEqual([]);
  });

  test('en el celular, al elegir PayNet la ficha queda a la vista', async ({ page }) => {
    const { unexpected } = installRecargaMocks(page, { gateways: PASARELAS_BO });
    await page.setViewportSize({ width: 390, height: 664 });
    await page.goto('/recarga/');
    await elegirPasarela(page, /Pagar con PayNet/);

    await expectQueAsome(page, page.getByText('Referencia de pago'));
    expect(unexpected).toEqual([]);
  });

  test('si el formulario ya se ve al elegir la pasarela, la página no se mueve', async ({ page }) => {
    installRecargaMocks(page, { gateways: PASARELAS_BO });
    // Pantalla alta a propósito: en Be Online, a 1440×1100, el formulario TODAVÍA queda abajo y bajar es lo correcto.
    await page.setViewportSize({ width: 1440, height: 1600 });
    await page.goto('/recarga/');
    const antes = await elegirPasarela(page, /Pagar con Tarjeta Visa/);

    await expect(page.getByRole('button', { name: /Pagar \$230/ })).toBeInViewport();
    expect(await page.evaluate(() => window.scrollY)).toBe(antes);
  });

  test('PayNet no se presenta como OXXO: sus tiendas y su ficha', async ({ page }) => {
    // Una referencia de PayNet NO se paga en OXXO. Sin lista del backend, la ficha decía «Acude a cualquier tienda
    // OXXO» y el subtítulo «Pago en efectivo» no decía dónde.
    const { unexpected } = installRecargaMocks(page, { gateways: PASARELAS_BO });
    await page.goto('/recarga/');
    await llegarAlPago(page);

    const paynet = page.getByRole('button', { name: /Pagar con PayNet/ });
    await expect(paynet).toContainText(/7.Eleven, Walmart y más · 24.48.h/);
    await expect(paynet.getByRole('img', { name: 'OXXO' })).toHaveCount(0);

    await paynet.click();
    await expect(page.getByText('Acude a cualquier tienda participante de PayNet')).toBeVisible();
    await expect(page.locator('[data-zona-pago]')).not.toContainText('OXXO');
    expect(unexpected).toEqual([]);
  });
});
