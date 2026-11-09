import { test, expect, type Route } from '@playwright/test';

/**
 * Pedido del dueño (9-nov-2026):
 *  1. PayNet salía con el logo de OXXO (y la tarjeta Openpay con el de Stripe).
 *  2. Después de la compra debe quedar claro que las asistencias se activan registrando los datos
 *     y que los boletos de cine se piden, SÓLO en la app o en app.beonline.mx (Beneficios).
 *
 * SEGURIDAD: todo `/api-proxy/**` se intercepta; lo no contemplado se aborta y falla la prueba.
 * Datos inventados.
 */

const MSISDN = '5512345678';

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

test('PayNet y Openpay salen con su propio logo, no con el de OXXO ni el de Stripe', async ({ page }) => {
  const inesperadas: string[] = [];
  await page.route(/https:\/\/(js\.stripe\.com|js\.openpay\.mx|.*mercadopago\.com|.*paypal\.com)\/.*/, (r) => r.abort());
  await page.route('**/api-proxy/**', (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api-proxy/, '');
    if (path.startsWith('/api/page/getMsisdnBy')) {
      return json(route, { status: true, data: { processable: true, dn: MSISDN, type: 'Movilidad', activar: false, recargar: true, portar: false, cambiar_nir: false } });
    }
    if (path.startsWith('/api/odoo/product/findbymsisdn')) {
      return json(route, { status: true, data: [{ name: 'Recargas', order: 1, offers: [{ id: 201, name: '12GB BO APOLO', display_name: '12GB BO APOLO', amount: 230, data_national_limit: 12, interval: 'month', interval_count: 1 }] }] });
    }
    if (path.startsWith('/api/portal/payment/gateways')) {
      return json(route, { status: true, data: { gateways: [
        { key: 'stripe', label: 'Pagar con Tarjeta', icon: '', sortOrder: 1, type: 'card', publicKey: 'pk_test_gateway_mock' },
        { key: 'openpayCard', label: 'Pagar con Tarjeta Openpay', icon: '', sortOrder: 2, type: 'card', publicKey: 'pk_test_openpay_mock' },
        { key: 'openpayStore', label: 'Pagar con PayNet', icon: 'store', sortOrder: 3, type: 'store', publicKey: '' },
      ] } });
    }
    if (path.startsWith('/api/page/banners')) {
      return json(route, { status: true, data: { section: 'top', items: [] } });
    }
    inesperadas.push(path);
    return route.abort('failed');
  });

  await page.goto('/recarga/');
  const input = page.getByPlaceholder('10 dígitos o ICCID');
  await expect(async () => {
    await input.fill('');
    await input.pressSequentially(MSISDN, { delay: 30 });
    await page.waitForTimeout(400);
    expect(await input.inputValue()).toBe(MSISDN);
  }).toPass({ timeout: 15000 });
  await page.getByRole('button', { name: /Continuar/ }).click();
  await page.getByRole('button', { name: /Recargar saldo/ }).click();
  await page.getByRole('button', { name: /BO APOLO/i }).click();

  const paynet = page.getByRole('button', { name: /Pagar con PayNet/ });
  await expect(paynet).toBeVisible();
  await expect(paynet.getByRole('img', { name: 'PayNet' })).toHaveAttribute('src', '/img/payment/paynet.png');
  await expect(paynet.getByRole('img', { name: 'OXXO' })).toHaveCount(0);
  const openpay = page.getByRole('button', { name: /Pagar con Tarjeta Openpay/ });
  await expect(openpay.getByRole('img', { name: 'Openpay' })).toHaveAttribute('src', '/img/payment/openpay.png');
  // Los archivos existen (un 404 dejaría el recuadro vacío).
  for (const ruta of ['/img/payment/paynet.png', '/img/payment/openpay.png']) {
    expect((await page.request.get(ruta)).status()).toBe(200);
  }
  expect(inesperadas).toEqual([]);
});

test('después de pagar se explica cómo activar asistencias y pedir boletos, sólo en la app o en app.beonline.mx', async ({ page }) => {
  const uuid = '0f5e7a1c-0000-4000-8000-00000000abcd';
  await page.route('**/api-proxy/**', (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api-proxy/, '');
    if (path === `/api/public/ecommerce/orders/${uuid}/status`) {
      return json(route, { status: true, data: { uuid, status: 'paid', total: 259 } });
    }
    return route.abort('failed');
  });

  await page.goto(`/pago-exitoso/?order=${uuid}`);
  await expect(page.getByRole('heading', { name: '¡Pago confirmado!' })).toBeVisible();
  const bloque = page.getByRole('region', { name: '¿Tu plan incluye cine 2x1 o Be Protected?' });
  await expect(bloque).toBeVisible();
  await expect(bloque).toContainText('registra tus datos (CURP, RFC y domicilio)');
  await expect(bloque).toContainText('ahí pides tus boletos');
  await expect(bloque.getByRole('link', { name: 'Ir a Beneficios' })).toHaveAttribute('href', 'https://app.beonline.mx/beneficios');
  await expect(bloque.getByRole('link', { name: /App Store/ })).toHaveAttribute('href', /apps\.apple\.com/);
  await expect(bloque.getByRole('link', { name: /Google Play/ })).toHaveAttribute('href', /play\.google\.com/);
});

test('un pago que falla no habla de beneficios', async ({ page }) => {
  const uuid = '0f5e7a1c-0000-4000-8000-00000000dead';
  await page.route('**/api-proxy/**', (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api-proxy/, '');
    if (path === `/api/public/ecommerce/orders/${uuid}/status`) {
      return json(route, { status: true, data: { uuid, status: 'failed', total: 259 } });
    }
    return route.abort('failed');
  });

  await page.goto(`/pago-exitoso/?order=${uuid}`);
  await expect(page.getByRole('heading', { name: 'Hubo un problema' })).toBeVisible();
  await expect(page.getByText('¿Tu plan incluye cine 2x1 o Be Protected?')).toHaveCount(0);
});

test('la sección Be Protected dice cómo se activan las asistencias', async ({ page }) => {
  await page.route('**/api-proxy/**', (route) => json(route, { status: true, data: [] }));
  await page.goto('/');
  const pasos = page.locator('#como-se-activa');
  await expect(pasos.getByRole('heading', { name: 'Así activas tus asistencias' })).toBeVisible();
  await expect(pasos).toContainText('Registra tus datos: CURP, RFC y domicilio');
  await expect(pasos.getByRole('link', { name: 'app.beonline.mx' })).toHaveAttribute('href', 'https://app.beonline.mx/beneficios');
});
