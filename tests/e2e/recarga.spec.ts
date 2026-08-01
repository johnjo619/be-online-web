import { test, expect, type Route } from '@playwright/test';

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

function installRecargaMocks(page: import('@playwright/test').Page) {
  const unexpected: string[] = [];

  // SDKs externos de pago — bloqueados.
  page.route(
    /https:\/\/(js\.stripe\.com|.*mercadopago\.com|.*mercadolibre\.com|.*paypal\.com|.*openpay\.mx)\/.*/,
    (r) => r.abort(),
  );

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
      return json(route, {
        status: true,
        data: {
          gateways: [
            { key: 'stripe', label: 'Pagar con Tarjeta', icon: '', sortOrder: 1, type: 'card', publicKey: 'pk_test_gateway_mock' },
          ],
        },
      });
    }

    // Init de Stripe (portal) — con una sola pasarela el FE la auto-selecciona
    // y dispara el init apenas se renderiza el paso de pago.
    if (path === '/api/stripe/initFromWebPortal') {
      return json(route, { status: true, data: { paymentIntent: 'pi_test_secret_abc' } });
    }

    // Banners y lecturas inocuas → vacío
    if (path.startsWith('/api/page/banners')) {
      return json(route, { status: true, data: { section: 'top', items: [] } });
    }

    unexpected.push(`${method} ${path}`);
    return route.abort('failed');
  });

  return { unexpected };
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
});
