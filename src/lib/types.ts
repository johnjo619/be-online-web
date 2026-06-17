// ── Product / Plan types ─────────────────────────────────────────────────────

export interface Plan {
  id: number | string;
  name: string;
  display_name?: string;
  group_name?: string;
  card_title?: string;
  amount: number | string;
  card_footer?: string;
  card_body?: string;
  card_button?: string;
  description?: string;
  is_popular?: boolean;

  // Data
  data_national_limit?: number | string;
  data_is_unlimit?: number;

  // Calls
  call_national_limit?: number | string;
  call_is_unlimit?: number;

  // SMS
  sms_national_limit?: number | string;
  sms_is_unlimit?: number;

  // Duration
  interval?: 'day' | 'month' | 'year';
  interval_count?: number;

  // Social networks
  rs_included_whatsapp?: boolean;
  rs_included_facebook?: boolean;
  rs_included_instagram?: boolean;
  rs_included_tiktok?: boolean;
  rs_included_messenger?: boolean;
  rs_included_youtube?: boolean;
  rs_included_telegram?: boolean;
  rs_included_snapchat?: boolean;
  rs_included_x?: boolean;
}

export interface PlanGroup {
  name: string;
  order?: number;
  offers: Plan[];
}

// ── Payment Gateway ──────────────────────────────────────────────────────────

export interface Gateway {
  key: string;
  label: string;
  icon: string;
  iconFamily?: string;
  color?: string;
  sortOrder: number;
  type: 'card' | 'redirect' | 'store';
  publicKey?: string;
}

// ── Ecommerce Order ──────────────────────────────────────────────────────────

export type SimType = 'sim' | 'esim';

export interface OrderItem {
  /** ID de la tabla `offers` (planes). Mutuamente excluyente con product_id. */
  offer_id?: number | string;
  /** ID de la tabla `ecommerce_products` (router HBB, MiFi, envío). */
  product_id?: number | string;
  product_type: string;
  quantity: number;
}

/**
 * Producto físico del catálogo CRM (ecommerce_products).
 * Se obtiene de GET /api/public/ecommerce/products.
 */
export interface EcommerceProduct {
  id: number;
  uuid?: string;
  sku: string | null;
  name: string;
  description?: string | null;
  product_type: 'sim_card' | 'esim' | 'mifi_device' | 'accessory';
  category: string | null;
  valor_unitario: string;        // decimal:2 viene como string
  tasa_iva: string;              // decimal:4 viene como string
  image_url?: string | null;
  requires_shipping?: boolean;
  weight_grams?: number | null;
}

export interface CreateOrderPayload {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  /** Solo aplica a 'Movilidad'. Para HBB/MiFi se omite o se ignora. */
  sim_type?: SimType;
  items: OrderItem[];
  shipping_address?: ShippingAddress;
  /** True = paquete con dispositivo (router HBB / equipo MiFi). False = solo plan. */
  include_device?: boolean;
}

export interface ShippingAddress {
  street: string;
  colony: string;
  zip_code: string;
  city: string;
  state: string;
}

export interface Order {
  uuid: string;
  order_id?: string;
  status: string;
  total: number;
}

// ── Ecommerce Payment Init ───────────────────────────────────────────────────

/**
 * Respuesta normalizada de los init de Stripe. OJO: los dos endpoints
 * difieren (verificado contra middleware-api Repository.php 2026-06-10):
 *  - PORTAL /api/stripe/initFromWebPortal → { paymentIntent }; la
 *    publishable_key se obtiene de gateways[key=stripe].publicKey.
 *  - ECOMMERCE /api/ecommerce/stripe/init → { client_secret,
 *    publishable_key, amount, currency }; api.ts lo normaliza a
 *    `paymentIntent` y conserva `publishable_key`.
 */
export interface StripeInitResponse {
  paymentIntent: string;          // === clientSecret para Stripe Elements
  publishable_key?: string;       // solo flujo ecommerce (por tenant)
  dpmCheckerLink?: string;        // opcional, para Stripe DPM checker
}

export interface MercadoPagoInitResponse {
  init_point: string;
  preference_id: string;
  public_key?: string;
}

export interface OxxoInitResponse {
  reference: string;
  barcode_url?: string;
  amount?: number;
  due_date?: string;
  description?: string;
  places?: string[];
  instructions?: string[];
}

export interface OpenPayInitResponse {
  merchant_id: string;
  public_key: string;
  is_sandbox: boolean;
  payment_reference: string;
}

export interface OpenPayChargeResponse {
  charge_id: string;
  status: string;
  payment_method?: {
    type: string;
    url?: string;
  };
}

// ── Portal Cautivo (Activation Wizard) ───────────────────────────────────────

export interface IccidValidation {
  processable: boolean;
  dn: string;
  type: 'Movilidad' | 'MiFi' | 'Internet en casa';
  activar: boolean;
  recargar: boolean;
  portar: boolean;
  cambiar_nir: boolean;
}

export type WizardFlow = 'activar' | 'recargar' | 'portar' | 'cambiar_nir';

export interface WizardState {
  // ICCID
  iccidInput: string;
  msisdn: string | null;
  simType: 'Movilidad' | 'MiFi' | 'Internet en casa' | '';
  actions: IccidValidation | null;

  // Flow
  flow: WizardFlow | null;

  // Plan
  offerId: string | number | null;
  offerName: string;

  // Payment
  paid: boolean;

  // HBB
  address: string;
  broadband: string;

  // Stepper
  step: number;
}

export type WizardAction =
  | { type: 'SET_ICCID'; payload: string }
  | { type: 'SET_ICCID_RESULT'; payload: IccidValidation }
  | { type: 'SET_FLOW'; payload: WizardFlow }
  | { type: 'SET_OFFER'; payload: { id: string | number; name: string } }
  | { type: 'SET_PAID'; payload: boolean }
  | { type: 'SET_ADDRESS'; payload: { address: string; broadband: string } }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'RESET' };

// ── Banner ───────────────────────────────────────────────────────────────────

export interface Banner {
  slug: string;
  title: string;
  link_url?: string;
  link_target?: '_self' | '_blank';
  link_text?: string;
  images?: {
    desktop?: string;
    tablet?: string;
    mobile?: string;
  };
  alt?: string;
}

// ── Distributor Lead (landing /distribuidor/) ────────────────────────────────

export type PreferredContact = 'whatsapp' | 'call' | 'email';

export interface DistributorLeadPayload {
  name: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  /** Bucket de SIMs/mes estimadas (string libre por si crece el catálogo). */
  estimated_sales_volume?: string;
  preferred_contact?: PreferredContact;
  message?: string;
  /** UTM tracking — capturado de window.location.search en el cliente. */
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  /** Honeypot anti-bot — siempre se envía VACÍO desde campo input oculto. */
  website?: string;
}

export interface DistributorLeadResponse {
  lead_id: number;
  accepted_at: string;
  duplicate?: boolean;
}
