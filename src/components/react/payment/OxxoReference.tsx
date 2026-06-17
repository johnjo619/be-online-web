import StorePaymentCard from './StorePaymentCard';
import type { OxxoInitResponse } from '../../../lib/types';

interface OxxoReferenceProps {
  data: OxxoInitResponse;
  gatewayLabel?: string;
}

export default function OxxoReference({
  data,
  gatewayLabel = 'Pago en OXXO',
}: OxxoReferenceProps) {
  return (
    <StorePaymentCard
      reference={data.reference}
      barcodeUrl={data.barcode_url}
      amount={data.amount}
      dueDate={data.due_date}
      description={data.description}
      places={data.places || ['OXXO']}
      instructions={
        data.instructions || [
          'Acude a cualquier tienda OXXO',
          'Indica que realizarás un pago de servicio',
          'Proporciona la referencia al cajero',
          'Conserva tu ticket como comprobante',
        ]
      }
      gatewayLabel={gatewayLabel}
    />
  );
}
