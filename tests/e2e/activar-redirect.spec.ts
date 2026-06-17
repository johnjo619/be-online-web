import { test, expect } from '@playwright/test';

/**
 * /activar/ no contiene el wizard de activación en este repo — vive en
 * port.pandamovil.mx (repo portal_vinculaci-n). Aquí solo verificamos que la
 * página redirige correctamente, preservando el parámetro `flow` como hash.
 *
 * El destino externo se intercepta para no navegar fuera durante el test.
 */
test.describe('/activar redirect', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('https://port.pandamovil.mx/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!doctype html><html><body><h1>Portal Be Online (stub)</h1></body></html>',
      }),
    );
  });

  test('redirige a port.pandamovil.mx', async ({ page }) => {
    await page.goto('/activar/');
    await page.waitForURL('https://port.pandamovil.mx/**');
    expect(page.url()).toContain('port.pandamovil.mx');
  });

  test('preserva ?flow=portar como hash', async ({ page }) => {
    await page.goto('/activar/?flow=portar');
    await page.waitForURL('https://port.pandamovil.mx/**');
    expect(page.url()).toContain('port.pandamovil.mx');
    expect(page.url()).toContain('portar');
  });
});
