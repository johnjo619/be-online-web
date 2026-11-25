import StorePaymentCard from './StorePaymentCard';
import type { OxxoInitResponse } from '../../../lib/types';

/** Red de tiendas donde se paga la referencia: `digitalFemsa` cobra en OXXO; `openpayStore` es PayNet. */
export type TiendaDePago = 'oxxo' | 'paynet';

/**
 * Textos por red de tiendas, los mismos de app_web (`OxxoPaymentCard.tsx`). Una referencia OXXO SOLO se paga en
 * OXXO y una de PayNet NUNCA en OXXO: con el texto de la otra red el cliente va a la tienda equivocada y no puede
 * pagar (pasó en producción en app_web, Figou, 16-sep-2026). Aquí la ficha de PayNet decía «Acude a cualquier
 * tienda OXXO» siempre que el backend no mandaba su propia lista, y en la tienda se titulaba «Pago en OXXO»
 * (mismo arreglo que pandamovil.mx, 25-nov-2026).
 */
const TIENDA: Record<TiendaDePago, { titulo: string; lugares: string[]; donde: string }> = {
  oxxo: { titulo: 'Pago en OXXO', lugares: ['OXXO'], donde: 'Acude a cualquier tienda OXXO' },
  paynet: {
    titulo: 'Pago con PayNet',
    // Un solo renglón: la ficha los une con comas («Paga en 7-Eleven, Walmart y más tiendas PayNet»).
    lugares: ['7-Eleven, Walmart y más tiendas PayNet'],
    donde: 'Acude a cualquier tienda participante de PayNet',
  },
};

interface OxxoReferenceProps {
  data: OxxoInitResponse;
  /** Dónde se paga. Sin valor por omisión a propósito: adivinar la red es mandar al cliente a la tienda equivocada. */
  tienda: TiendaDePago;
}

export default function OxxoReference({ data, tienda }: OxxoReferenceProps) {
  const textos = TIENDA[tienda];
  return (
    <StorePaymentCard
      reference={data.reference}
      barcodeUrl={data.barcode_url}
      amount={data.amount}
      dueDate={data.due_date}
      description={data.description}
      places={data.places || textos.lugares}
      instructions={
        data.instructions || [
          textos.donde,
          'Indica que realizarás un pago de servicio',
          'Proporciona la referencia al cajero',
          'Conserva tu ticket como comprobante',
        ]
      }
      gatewayLabel={textos.titulo}
    />
  );
}
