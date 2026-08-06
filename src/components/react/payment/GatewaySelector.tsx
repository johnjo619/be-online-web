import { useEffect } from 'react';
import type { Gateway } from '../../../lib/types';

interface GatewaySelectorProps {
  gateways: Gateway[];
  selected: string | null;
  onSelect: (key: string) => void;
  isLoading?: boolean;
}

export default function GatewaySelector({
  gateways,
  selected,
  onSelect,
  isLoading,
}: GatewaySelectorProps) {
  // Auto-select si solo hay 1 gateway disponible
  useEffect(() => {
    if (gateways.length === 1 && !selected) {
      onSelect(gateways[0].key);
    }
  }, [gateways, selected, onSelect]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-panda-gray font-poppins text-sm">
        <span className="w-6 h-6 border-2 border-panda-red border-t-transparent rounded-full animate-spin" />
        Buscando métodos disponibles…
      </div>
    );
  }

  if (gateways.length === 0) {
    return (
      <div className="flex items-start gap-2 p-4 rounded-xl bg-amber-50 border border-amber-200">
        <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <p className="font-poppins text-sm font-semibold text-amber-900">No hay métodos de pago disponibles</p>
          <p className="font-poppins text-xs text-amber-700 mt-0.5">Por favor llama al *777 para ayudarte a completar la compra.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {gateways.map((gw) => {
        const isSelected = selected === gw.key;
        return (
          <button
            key={gw.key}
            type="button"
            onClick={() => onSelect(gw.key)}
            className={`relative text-left rounded-2xl border-2 p-4 transition-all overflow-hidden ${
              isSelected
                ? 'border-panda-red bg-panda-red/5 shadow-lg shadow-panda-red/15 -translate-y-0.5'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Logo/icono cuadrado a la izquierda */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                isSelected ? 'bg-white shadow-sm' : 'bg-panda-surface'
              }`}>
                <GatewayLogo gatewayKey={gw.key} />
              </div>

              {/* Texto */}
              <div className="flex-1 min-w-0">
                <p className="font-unbounded text-sm font-bold text-panda-dark leading-tight">
                  {gw.label}
                </p>
                <p className="font-poppins text-[11px] text-panda-gray mt-0.5">
                  {gatewaySubLabel(gw)}
                </p>
              </div>

              {/* Radio circular */}
              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                isSelected ? 'border-panda-red bg-panda-red' : 'border-gray-300'
              }`}>
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/** Texto secundario con info útil del método (instantáneo / 24h / etc). */
function gatewaySubLabel(gw: Gateway): string {
  switch (gw.key) {
    case 'stripe':
    case 'openpayCard':
      return 'Visa, Mastercard, AMEX · al instante';
    case 'mercadoPago':
      return 'Tarjeta o saldo MP · al instante';
    case 'paypal':
      return 'Cuenta PayPal · al instante';
    case 'openpayStore':
      return 'Pago en efectivo · 24-48 h';
    case 'digitalFemsa':
      return 'OXXO en efectivo · 24-48 h';
    default:
      return gw.type === 'store' ? 'Pago en efectivo' : 'Pago en línea';
  }
}

/**
 * Logo oficial por gateway — SVGs descargados de fuentes oficiales:
 *   - Stripe / MercadoPago / PayPal: simple-icons CDN (mantiene logos brand)
 *   - OXXO: Wikipedia Commons (logo oficial)
 *
 * Los archivos viven en /public/img/payment/*.svg y se sirven estáticos.
 */
const LOGO_BY_KEY: Record<string, { src: string; alt: string }> = {
  stripe:       { src: '/img/payment/stripe.svg',      alt: 'Stripe' },
  mercadoPago:  { src: '/img/payment/mercadopago.svg', alt: 'MercadoPago' },
  paypal:       { src: '/img/payment/paypal.svg',      alt: 'PayPal' },
  openpayCard:  { src: '/img/payment/stripe.svg',      alt: 'Tarjeta' }, // OpenPay no tiene logo oficial libre — se usa genérico
  openpayStore: { src: '/img/payment/oxxo.svg',        alt: 'OXXO' },
  digitalFemsa: { src: '/img/payment/oxxo.svg',        alt: 'OXXO' },
};

function GatewayLogo({ gatewayKey }: { gatewayKey: string }) {
  const meta = LOGO_BY_KEY[gatewayKey];
  if (!meta) {
    return (
      <svg className="w-6 h-6 text-panda-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 8h18M5 16h6m6 0h.01M3 6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6z" />
      </svg>
    );
  }
  return (
    <img
      src={meta.src}
      alt={meta.alt}
      className="max-w-[24px] max-h-[24px] sm:max-w-[28px] sm:max-h-[28px] w-auto h-auto object-contain"
      loading="lazy"
      decoding="async"
    />
  );
}
