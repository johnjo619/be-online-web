import type {
  Plan,
  PlanGroup,
  Gateway,
  Banner,
  CreateOrderPayload,
  Order,
  StripeInitResponse,
  MercadoPagoInitResponse,
  OxxoInitResponse,
  OpenPayInitResponse,
  OpenPayChargeResponse,
  IccidValidation,
  EcommerceProduct,
  DistributorLeadPayload,
  DistributorLeadResponse,
} from './types';

const API_BASE = '/api-proxy';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      platform: 'web',
      odoocompanyid: '1',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

/**
 * Saca `data` de la respuesta del backend `{status, message, data}` y tira un
 * Error legible si el backend respondió `{status:false}` sin payload. Sin esto,
 * el FE crashea con "Cannot read properties of undefined (reading 'X')" cuando
 * la orden no existe, MP no está configurado, llave faltante, etc.
 */
function unwrapData<T>(res: { status?: boolean; message?: string; data?: T }, fallbackMsg: string): T {
  if (res.status === false || !res.data) {
    throw new Error(res.message || fallbackMsg);
  }
  return res.data;
}

// ── Products ─────────────────────────────────────────────────────────────────

function cleanPlanName(name: string): string {
  return name.replace(/\b(XPRESS|MENSUAL|ANUAL)\b/gi, '').trim();
}

function flattenGroups(groups: PlanGroup[]): Plan[] {
  return groups.flatMap((g) =>
    (g.offers || []).map((o) => ({
      ...o,
      display_name: cleanPlanName(o.name),
      group_name: g.name,
    })),
  );
}

/**
 * Catálogo de planes del tenant.
 *
 * `familyType` es el filtro de familia de producto del CRM — NO es branding.
 * Heredado del fork venía fijo en 'Panda', que en el backend de Be Online
 * (api-crm.igou.mx) responde 404 "No offers found" y dejaba la tienda vacía.
 * Sin el parámetro el backend devuelve el catálogo completo del tenant, así
 * que se omite salvo que se pase explícitamente.
 */
export async function getPlans(
  type = 'Movilidad',
  familyType?: string,
): Promise<Plan[]> {
  const params = new URLSearchParams({ type });
  if (familyType) params.set('family_type', familyType);
  const res = await apiFetch<{ data: PlanGroup[] }>(
    `/api/odoo/product/findbytype?${params}`,
  );
  return flattenGroups(res.data || []);
}

export async function getPlansByMsisdn(
  msisdn: string,
  broadband = '',
  producttype = '',
): Promise<Plan[]> {
  const params = new URLSearchParams({ msisdn });
  if (broadband) params.set('broadband', broadband);
  if (producttype) params.set('producttype', producttype);
  const res = await apiFetch<{ data: PlanGroup[] | Plan[] }>(
    `/api/odoo/product/findbymsisdn?${params}`,
  );
  const data = res.data || [];
  // API may return grouped or flat
  if (data.length > 0 && 'offers' in data[0]) {
    return flattenGroups(data as PlanGroup[]);
  }
  return data as Plan[];
}

// ── Public gateways for ecommerce checkout (sin msisdn) ─────────────────────

/**
 * Pasarelas habilitadas para el tenant en flujo ECOMMERCE (compra línea nueva).
 * GET /api/public/ecommerce/gateways?company_id=1
 *
 * Misma lógica que portal cautivo (port.pandamovil.mx) pero sin msisdn —
 * la línea aún no existe en checkout. Backend cruza external_configuration
 * (flags globales) + payment_gateways_config (whitelist por empresa) +
 * credenciales en odoo_companies.
 */
export async function getEcommerceGateways(companyId: number = 1): Promise<Gateway[]> {
  const res = await apiFetch<{ data: { gateways: Gateway[] } }>(
    `/api/public/ecommerce/gateways?company_id=${companyId}`,
  );
  return res.data?.gateways || [];
}

// ── Public products (dispositivos físicos: equipo MiFi, envío) ─────────

interface PublicProductsParams {
  /** type del CRM: 'accessory' | 'mifi_device' | 'sim_card' | 'esim' */
  type?: string;
  /** category libre: 'mifi' | 'shipping' | etc. */
  category?: string;
  /** SKU exacto, ej. 'shipping-mx-fixed' */
  sku?: string;
}

export async function getPublicProducts(params: PublicProductsParams = {}): Promise<EcommerceProduct[]> {
  const qs = new URLSearchParams({ company_id: '1' });
  if (params.type)     qs.set('type', params.type);
  if (params.category) qs.set('category', params.category);
  if (params.sku)      qs.set('sku', params.sku);
  const res = await apiFetch<{ data: { items: EcommerceProduct[] } }>(
    `/api/public/ecommerce/products?${qs.toString()}`,
  );
  return res.data?.items || [];
}

// ── Banners ──────────────────────────────────────────────────────────────────

export async function getBanners(
  section = 'top',
  limit = 5,
): Promise<Banner[]> {
  const res = await apiFetch<{ data: { section: string; items: Banner[] } }>(
    `/api/page/banners/?company_id=1&section=${section}&limit=${limit}`,
  );
  return res.data?.items || [];
}

// ── Ecommerce Orders ─────────────────────────────────────────────────────────

export async function createOrder(
  payload: CreateOrderPayload,
): Promise<Order> {
  // Backend exige company_id en el payload (no en header). Si el caller no
  // lo pasó, lo defaulteamos a 1 (Be Online) — tenant único hoy.
  const body = { company_id: 1, ...payload };
  const res = await apiFetch<{ status?: boolean; message?: string; data?: Order & { order_uuid?: string } }>(
    '/api/public/ecommerce/orders',
    { method: 'POST', body: JSON.stringify(body) },
  );
  const data = unwrapData(res, 'No pudimos crear tu orden. Intenta de nuevo o contacta a *777.');
  // El backend (publicCreateOrder) responde `order_uuid`, NO `uuid` — verificado
  // contra api.celink.mx 2026-06-10. Sin normalizar, los init de pago mandaban
  // order_uuid undefined → 404 "Orden no encontrada" en TODOS los checkouts.
  const uuid = data.uuid ?? data.order_uuid;
  if (!uuid) {
    throw new Error('No pudimos crear tu orden. Intenta de nuevo o contacta a *777.');
  }
  return { ...data, uuid };
}

export async function getOrderStatus(uuid: string): Promise<Order> {
  const res = await apiFetch<{ data: Order }>(
    `/api/public/ecommerce/orders/${uuid}/status`,
  );
  return res.data;
}

// ── Ecommerce Payment Gateways (by order_uuid) ──────────────────────────────

export async function ecommerceStripeInit(
  orderUuid: string,
): Promise<StripeInitResponse> {
  const res = await apiFetch<{ status?: boolean; message?: string; data?: StripeInitResponse & { client_secret?: string } }>(
    '/api/ecommerce/stripe/init',
    { method: 'POST', body: JSON.stringify({ order_uuid: orderUuid }) },
  );
  const data = unwrapData(res, 'No se pudo iniciar el pago con Stripe.');
  // El endpoint ECOMMERCE responde { client_secret, publishable_key, amount,
  // currency } (Repository::stripeInit) — distinto del portal cautivo
  // (/api/stripe/initFromWebPortal → { paymentIntent }). Normalizamos al
  // contrato del FE manteniendo `paymentIntent` como el client_secret.
  const paymentIntent = data.paymentIntent ?? data.client_secret;
  if (!paymentIntent) {
    throw new Error('No se pudo iniciar el pago con Stripe.');
  }
  return { ...data, paymentIntent };
}

export async function ecommerceMercadoPagoInit(
  orderUuid: string,
): Promise<MercadoPagoInitResponse> {
  const res = await apiFetch<{ status?: boolean; message?: string; data?: MercadoPagoInitResponse }>(
    '/api/ecommerce/mercadopago/init',
    { method: 'POST', body: JSON.stringify({ order_uuid: orderUuid }) },
  );
  return unwrapData(res, 'No se pudo iniciar el pago con MercadoPago.');
}

export async function ecommerceOpenPayInit(
  orderUuid: string,
): Promise<OpenPayInitResponse> {
  const res = await apiFetch<{ status?: boolean; message?: string; data?: OpenPayInitResponse }>(
    '/api/ecommerce/openpay/init',
    { method: 'POST', body: JSON.stringify({ order_uuid: orderUuid }) },
  );
  return unwrapData(res, 'No se pudo iniciar el pago en OXXO/OpenPay.');
}

export async function ecommerceOpenPayCharge(payload: {
  payment_reference: string;
  card_number: string;
  holder_name: string;
  expiration_month: string;
  expiration_year: string;
  cvv2: string;
  device_session_id?: string;
  redirect_url: string;
}): Promise<OpenPayChargeResponse> {
  const res = await apiFetch<{ data: OpenPayChargeResponse }>(
    '/api/ecommerce/openpay/createCharge',
    { method: 'POST', body: JSON.stringify(payload) },
  );
  return res.data;
}

export async function ecommerceOpenPayValidate(
  chargeId: string,
): Promise<{ status: string }> {
  const res = await apiFetch<{ data: { status: string } }>(
    '/api/ecommerce/openpay/validateIntent',
    { method: 'POST', body: JSON.stringify({ charge_id: chargeId }) },
  );
  return res.data;
}

export async function ecommerceOxxoInit(
  orderUuid: string,
): Promise<OxxoInitResponse> {
  const res = await apiFetch<{ data: OxxoInitResponse }>(
    '/api/ecommerce/openpay/initStorePayment',
    { method: 'POST', body: JSON.stringify({ order_uuid: orderUuid }) },
  );
  return res.data;
}

// ── Portal Cautivo Payment Gateways (by msisdn + offerid) ────────────────────

export async function portalGetGateways(
  msisdn: string,
): Promise<Gateway[]> {
  const res = await apiFetch<{ data: { gateways: Gateway[] } }>(
    '/api/portal/payment/gateways',
    { method: 'POST', body: JSON.stringify({ msisdn }) },
  );
  return res.data?.gateways || [];
}

export async function portalStripeInit(
  msisdn: string,
  offerid: string | number,
): Promise<StripeInitResponse> {
  const res = await apiFetch<{
    status?: boolean | number;
    message?: string;
    response?: { paymentIntent?: string; dpmCheckerLink?: string };
    data?: StripeInitResponse;
  }>(
    '/api/stripe/initFromWebPortal',
    { method: 'POST', body: JSON.stringify({ msisdn, offerid }) },
  );
  if (res.data?.paymentIntent) return res.data;
  if (res.response?.paymentIntent) {
    return { paymentIntent: res.response.paymentIntent, dpmCheckerLink: res.response.dpmCheckerLink };
  }
  throw new Error(res.message || 'No se pudo iniciar el pago con Stripe.');
}

export async function portalMercadoPagoInit(payload: {
  msisdn: string;
  offerid: string | number;
  address?: string;
  url_success: string;
  url_failure: string;
  url_pending: string;
}): Promise<MercadoPagoInitResponse> {
  // El endpoint legacy /api/app/mercado/setMPPayment devuelve shape distinto:
  //   {status: 200, response: {preference: 'X'}}
  // (no es {status:true, data:{preference_id,...}} como el módulo ecommerce).
  // Adaptamos al tipo MercadoPagoInitResponse esperado por el FE.
  const res = await apiFetch<{
    status?: boolean | number;
    message?: string;
    response?: { preference?: string };
    data?: MercadoPagoInitResponse;
  }>(
    '/api/app/mercado/setMPPayment',
    { method: 'POST', body: JSON.stringify(payload) },
  );

  // Shape nuevo (módulo ecommerce-style)
  if (res.data?.preference_id) return res.data;

  // Shape legacy ({status:200, response:{preference}}). public_key viene de gateways.
  const legacyPref = res.response?.preference;
  if (legacyPref) {
    return { preference_id: legacyPref, init_point: '', public_key: '' };
  }

  throw new Error(res.message || 'No se pudo iniciar el pago con MercadoPago.');
}

export async function portalPayPalInit(payload: {
  msisdn: string;
  offerid: string | number;
  address?: string;
  order?: number;
}): Promise<{ paypal: { id: string } }> {
  const res = await apiFetch<{
    status?: boolean | number;
    message?: string;
    response?: { paypal?: { id: string } };
    data?: { paypal: { id: string } };
  }>(
    '/api/app/initPPPayment',
    { method: 'POST', body: JSON.stringify(payload) },
  );
  if (res.data?.paypal?.id) return res.data;
  if (res.response?.paypal?.id) return { paypal: res.response.paypal };
  throw new Error(res.message || 'No se pudo iniciar el pago con PayPal.');
}

export async function portalPayPalValidate(
  orderID: string,
): Promise<{ status: string }> {
  const res = await apiFetch<{ status?: boolean; message?: string; data?: { status: string } }>(
    '/api/paypal/validate',
    { method: 'POST', body: JSON.stringify({ orderID }) },
  );
  return unwrapData(res, 'No se pudo validar el pago de PayPal.');
}

export async function portalOpenPayInit(
  msisdn: string,
  offerid: string | number,
): Promise<OpenPayInitResponse> {
  const res = await apiFetch<{
    status?: boolean | number;
    message?: string;
    response?: OpenPayInitResponse;
    data?: OpenPayInitResponse;
  }>(
    '/api/openpay/initFromWebPortal',
    { method: 'POST', body: JSON.stringify({ msisdn, offerid }) },
  );
  if (res.data?.merchant_id) return res.data;
  if (res.response?.merchant_id) return res.response;
  throw new Error(res.message || 'No se pudo iniciar el pago con OpenPay.');
}

export async function portalOpenPayCharge(payload: {
  payment_reference: string;
  card_number: string;
  holder_name: string;
  expiration_month: string;
  expiration_year: string;
  cvv2: string;
  device_session_id?: string;
  redirect_url: string;
}): Promise<OpenPayChargeResponse> {
  const res = await apiFetch<{ status?: boolean; message?: string; data?: OpenPayChargeResponse }>(
    '/api/openpay/createCharge',
    { method: 'POST', body: JSON.stringify(payload) },
  );
  return unwrapData(res, 'No se pudo cobrar la tarjeta.');
}

export async function portalOpenPayValidate(
  chargeId: string,
): Promise<{ status: string }> {
  const res = await apiFetch<{ status?: boolean; message?: string; data?: { status: string } }>(
    '/api/openpay/validateIntent',
    { method: 'POST', body: JSON.stringify({ charge_id: chargeId }) },
  );
  return unwrapData(res, 'No se pudo validar el cargo.');
}

export async function portalOxxoInit(
  msisdn: string,
  offerid: string | number,
): Promise<OxxoInitResponse> {
  const res = await apiFetch<{
    status?: boolean | number;
    message?: string;
    response?: OxxoInitResponse;
    data?: OxxoInitResponse;
  }>(
    '/api/openpay/initStorePayment',
    { method: 'POST', body: JSON.stringify({ msisdn, offerid }) },
  );
  if (res.data?.reference) return res.data;
  if (res.response?.reference) return res.response;
  throw new Error(res.message || 'No se pudo generar el pago en OXXO.');
}

export async function portalDigitalFemsaInit(
  msisdn: string,
  offerid: string | number,
): Promise<OxxoInitResponse> {
  const res = await apiFetch<{
    status?: boolean | number;
    message?: string;
    response?: OxxoInitResponse;
    data?: OxxoInitResponse;
  }>(
    '/api/digitalfemsa/portabilityPayment',
    { method: 'POST', body: JSON.stringify({ msisdn, offerid }) },
  );
  if (res.data?.reference) return res.data;
  if (res.response?.reference) return res.response;
  throw new Error(res.message || 'No se pudo generar el pago en Digital FEMSA.');
}

// ── Distribuidor lead (landing /distribuidor/) ───────────────────────────────

export async function createDistributorLead(
  payload: DistributorLeadPayload,
): Promise<DistributorLeadResponse> {
  const res = await apiFetch<{ status?: boolean; message?: string; data?: DistributorLeadResponse }>(
    '/api/public/distribuidor/lead',
    { method: 'POST', body: JSON.stringify(payload) },
  );
  return unwrapData(res, 'No pudimos registrar tu solicitud. Intenta de nuevo o llámanos a *777.');
}

// ── ICCID Validation ─────────────────────────────────────────────────────────

export async function validateIccid(
  iccid: string,
): Promise<IccidValidation> {
  const res = await apiFetch<{ data: IccidValidation }>(
    `/api/page/getMsisdnBy?iccid=${encodeURIComponent(iccid)}`,
  );
  return res.data;
}
