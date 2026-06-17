import type { Page, Route } from '@playwright/test';

/**
 * Mocks de red para la tienda de Be Online.
 *
 * SEGURIDAD: TODO el tráfico a `/api-proxy/**` (que en dev pega a
 * apirelease.celink.mx) y a los SDKs externos de pago (Stripe / MercadoPago)
 * se intercepta a nivel browser. Ninguna request real sale: cero órdenes en
 * CRM, cero cargos. Cualquier endpoint no contemplado se aborta y se registra
 * en `state.unexpected` para que el test falle si algo intenta filtrarse.
 */

export interface MockState {
  /** Bodies POST de creación de orden — para aserción de payload. */
  createdOrders: any[];
  /** Endpoints `/api-proxy/**` no contemplados (deben quedar vacíos). */
  unexpected: string[];
}

export interface MockOptions {
  /** Forzar 500 en findbytype para probar el estado de error de planes. */
  failPlans?: boolean;
  /** Forzar fallo en el endpoint de gateways para ejercitar el FALLBACK del FE. */
  failGateways?: boolean;
}

const PLAN = {
  id: 101,
  name: 'Plan Mensual 5GB',
  card_title: 'Mi Panda Mensual',
  card_button: 'Lo quiero',
  amount: 199,
  is_popular: true,
  data_national_limit: 5,
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

export function installTiendaMocks(page: Page, opts: MockOptions = {}): MockState {
  const state: MockState = { createdOrders: [], unexpected: [] };

  // SDKs externos de pago — bloqueados (no queremos cargar Stripe/MP reales).
  page.route(/https:\/\/(js\.stripe\.com|.*mercadopago\.com|.*mercadolibre\.com)\/.*/, (r) =>
    r.abort(),
  );

  // SEPOMEX — no se usa en el flujo eSIM, pero blindamos por si acaso.
  page.route('**/sepomex-proxy/**', (r) => json(r, { data: { postcodes: [] } }));

  // Único handler para todo el backend proxied.
  page.route('**/api-proxy/**', (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace(/^\/api-proxy/, '');
    const method = req.method();

    // Catálogo de planes
    if (path.startsWith('/api/odoo/product/findbytype')) {
      if (opts.failPlans) return json(route, { status: false }, 500);
      return json(route, { status: true, data: [{ name: 'Planes MENSUAL', offers: [PLAN] }] });
    }

    // Pasarelas dinámicas del tenant — espeja la respuesta REAL de prod para
    // Be Online (company_id=1): Stripe + PayPal + Mercado Pago. NO incluye OXXO.
    // PayPal se devuelve a propósito para verificar que el FE lo filtra (no tiene
    // endpoint /api/ecommerce/paypal/init). `failGateways` fuerza el FALLBACK del FE.
    if (path.startsWith('/api/public/ecommerce/gateways')) {
      if (opts.failGateways) return json(route, { status: false }, 500);
      return json(route, {
        status: true,
        data: {
          gateways: [
            { key: 'stripe', label: 'Pagar con Tarjeta', icon: '', sortOrder: 1, type: 'card', publicKey: 'pk_test_gateway_mock' },
            { key: 'paypal', label: 'Pagar con PayPal', icon: '', sortOrder: 2, type: 'redirect', publicKey: 'paypal-client-mock' },
            { key: 'mercadoPago', label: 'Pagar con Mercado Pago', icon: '', sortOrder: 3, type: 'redirect', publicKey: 'APP_USR-test-mp-public-key' },
          ],
        },
      });
    }

    // Productos físicos (no se piden en eSIM móvil; vacío por defecto)
    if (path.startsWith('/api/public/ecommerce/products')) {
      return json(route, { status: true, data: { items: [] } });
    }

    // Estado de la orden (página /pago-exitoso)
    if (/^\/api\/public\/ecommerce\/orders\/[^/]+\/status/.test(path)) {
      const uuid = path.split('/')[5];
      return json(route, { status: true, data: { uuid, order_id: 'ORD-1', status: 'paid', total: 199 } });
    }

    // Crear orden (capturamos el payload, devolvemos UUID falso).
    // FIEL al backend real (publicCreateOrder): responde `order_uuid`, NO `uuid`.
    // El mock viejo devolvía `uuid` y enmascaró el bug que rompió TODOS los
    // checkouts reales (caso Martha 2026-06-10: 9 órdenes huérfanas).
    if (path === '/api/public/ecommerce/orders' && method === 'POST') {
      try {
        state.createdOrders.push(JSON.parse(req.postData() || '{}'));
      } catch {
        state.createdOrders.push(null);
      }
      return json(route, {
        status: true,
        data: { order_uuid: 'test-uuid-123', order_id: 1, total: 199, currency: 'MXN', payment_method: 'stripe', items_count: 1 },
      });
    }

    // Init de pasarelas — espejan el comportamiento REAL del backend
    // (Repository.php): si order_uuid no coincide con una orden `created`,
    // responden 404 "Orden no encontrada o ya procesada". Esto blinda el
    // contrato: un FE que mande order_uuid undefined revienta el test.
    // OXXO (openpay/initStorePayment) NO se mockea a propósito: no está
    // disponible para Be Online; si algo lo llama, cae a "unexpected".
    const initBodyUuid = (() => {
      try {
        return JSON.parse(req.postData() || '{}').order_uuid;
      } catch {
        return undefined;
      }
    })();
    const orderNotFound = () =>
      json(route, { status: false, message: 'Orden no encontrada o ya procesada', errors: [] }, 404);

    if (path === '/api/ecommerce/stripe/init') {
      if (initBodyUuid !== 'test-uuid-123') return orderNotFound();
      // Shape real: { client_secret, publishable_key, amount, currency }.
      return json(route, {
        status: true,
        data: { client_secret: 'pi_test_secret_abc', publishable_key: 'pk_test_gateway_mock', amount: '199.00', currency: 'MXN' },
      });
    }
    if (path === '/api/ecommerce/mercadopago/init') {
      if (initBodyUuid !== 'test-uuid-123') return orderNotFound();
      // Shape real: { init_point, preference_id, order_uuid } — SIN public_key
      // (la public_key vive en gateways[key=mercadoPago].publicKey).
      return json(route, {
        status: true,
        data: { init_point: 'https://mp.test/checkout', preference_id: 'pref-test-123', order_uuid: initBodyUuid },
      });
    }

    // Banners y cualquier otra lectura inocua → vacío
    if (path.startsWith('/api/page/banners')) {
      return json(route, { status: true, data: { section: 'top', items: [] } });
    }

    // Nada más debería salir hacia el backend.
    state.unexpected.push(`${method} ${path}`);
    return route.abort('failed');
  });

  return state;
}

export { PLAN };
