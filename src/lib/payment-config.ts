/**
 * Configuración de pasarelas de pago.
 *
 * Las llaves PÚBLICAS se exponen al cliente (PUBLIC_*). Las secretas viven
 * SOLO en el backend Laravel y nunca se importan aquí.
 *
 * Stripe publishable_key: en el flujo PORTAL CAUTIVO la entrega el endpoint
 * /api/portal/payment/gateways. En el flujo ECOMMERCE no hay gateway endpoint
 * por order_uuid, así que se lee de env (PUBLIC_STRIPE_PUBLISHABLE_KEY) con
 * fallback a la pk_live verificada de prod (es pública por diseño de Stripe).
 *
 * Para sandbox/test: poner pk_test_... en .env.
 */

const ENV_STRIPE_PK = (import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY as string | undefined)?.trim();

/** Be Online Stripe live publishable key (verificada vs api.celink.mx 2026-05-06). */
const FALLBACK_STRIPE_PK = 'pk_live_51MrqfiEDOAqywvj8lzBFGp3ZdPkJTKxMv5O4Q9NCkvkP10WluHuOPaufTZc6oX27KPEDqG0MUJ739hrvX5ipx5B500psyQvxOu';

export const STRIPE_PUBLISHABLE_KEY: string = ENV_STRIPE_PK || FALLBACK_STRIPE_PK;
