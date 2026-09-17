/**
 * Cuerpos de `POST /openpay/createCharge` (portal) y
 * `POST /ecommerce/openpay/createCharge` (tienda) — PCI (fix 2026-09-17).
 *
 * La tarjeta se tokeniza en el navegador con `OpenPay.token.create` (SDK
 * oficial, `components/react/payment/OpenPayCard.tsx`) y a estos endpoints
 * SÓLO viaja el `token_id` que devolvió OpenPay + metadatos de la orden. El
 * PAN, el CVV, el nombre del titular y la fecha de expiración NUNCA tocan
 * nuestro backend ni salen del navegador más que hacia `js.openpay.mx`.
 *
 * Antes, `OpenPayCard.tsx` armaba `OpenPayCardData` con el PAN crudo y
 * `lib/api.ts` lo reenviaba tal cual a nuestro backend (visto en
 * `portalOpenPayCharge`/`ecommerceOpenPayCharge`) — exactamente lo que PCI-DSS
 * prohíbe (SAQ A exige que el comercio nunca reciba/transmita el PAN). Estas
 * dos funciones son el ÚNICO lugar del repo que arma esos cuerpos, para que
 * baste UNA prueba (`tests/e2e/openpay-body.spec.ts`) para blindarlo: si algún
 * día alguien agrega un campo de tarjeta aquí, la prueba revienta.
 */

/** Campos de datos de tarjeta que jamás deben aparecer en un cuerpo de cargo. */
export const CAMPOS_DE_TARJETA_PROHIBIDOS = [
  'card_number',
  'cvv2',
  'cvv',
  'holder_name',
  'expiration_month',
  'expiration_year',
] as const;

export interface CuerpoPortalOpenPayCharge {
  payment_reference: string;
  token_id: string;
  device_session_id?: string;
  redirect_url: string;
  recurrent?: boolean;
}

export interface CuerpoEcommerceOpenPayCharge {
  order_uuid: string;
  token_id: string;
  device_session_id?: string;
}

/** Cuerpo EXACTO hacia `/api/openpay/createCharge` (flujo portal: /activar, /recarga). */
export function armarCuerpoPortalOpenPayCharge(datos: {
  paymentReference: string;
  tokenId: string;
  deviceSessionId?: string;
  redirectUrl: string;
  /** Sólo se manda si el caller lo pasa explícitamente (este sitio no tiene
   *  palanca de recurrente hoy; el campo existe para el contrato del backend). */
  recurrente?: boolean;
}): CuerpoPortalOpenPayCharge {
  return {
    payment_reference: datos.paymentReference,
    token_id: datos.tokenId,
    device_session_id: datos.deviceSessionId,
    redirect_url: datos.redirectUrl,
    ...(datos.recurrente !== undefined ? { recurrent: datos.recurrente } : {}),
  };
}

/** Cuerpo EXACTO hacia `/api/ecommerce/openpay/createCharge` (flujo /tienda). */
export function armarCuerpoEcommerceOpenPayCharge(datos: {
  orderUuid: string;
  tokenId: string;
  deviceSessionId?: string;
}): CuerpoEcommerceOpenPayCharge {
  return {
    order_uuid: datos.orderUuid,
    token_id: datos.tokenId,
    device_session_id: datos.deviceSessionId,
  };
}
