import { defineConfig, devices } from '@playwright/test';

// Permite apuntar a un entorno desplegado (smoke read-only) con:
//   PW_BASE_URL=https://webtest.pandamovil.mx npx playwright test
// Por defecto corre contra el dev server local de Astro (puerto 4321).
const BASE_URL = process.env.PW_BASE_URL || 'http://localhost:4321';
const IS_LOCAL = BASE_URL.includes('localhost') || BASE_URL.includes('127.0.0.1');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // Solo levantamos el dev server cuando corremos en local. Contra un entorno
  // desplegado (PW_BASE_URL externo) no arrancamos nada.
  webServer: IS_LOCAL
    ? {
        command: 'npm run dev',
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
});
