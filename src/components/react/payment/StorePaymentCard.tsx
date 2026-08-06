import { useState } from 'react';

interface StorePaymentCardProps {
  reference: string;
  barcodeUrl?: string;
  amount?: number;
  dueDate?: string;
  description?: string;
  places?: string[];
  instructions?: string[];
  gatewayLabel: string;
}

export default function StorePaymentCard({
  reference,
  barcodeUrl,
  amount,
  dueDate,
  description,
  places = ['OXXO'],
  instructions = [
    'Acude a cualquier tienda participante',
    'Indica que realizarás un pago de servicio',
    'Proporciona la referencia al cajero',
    'Conserva tu ticket como comprobante',
  ],
  gatewayLabel,
}: StorePaymentCardProps) {
  const [copied, setCopied] = useState(false);

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const formattedDate = dueDate
    ? new Date(dueDate).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-5 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-50 text-yellow-600 text-xs font-semibold">
          🏪 {gatewayLabel}
        </span>
      </div>

      {/* Reference */}
      <div className="text-center space-y-2">
        <p className="text-xs text-[#7a7a7a] font-poppins">Referencia de pago</p>
        <p className="font-mono text-2xl font-bold text-[#142035] tracking-wider">
          {reference}
        </p>
        <button
          onClick={copyRef}
          className="text-xs font-semibold text-[#142035] hover:underline"
        >
          {copied ? '✓ Copiada' : 'Copiar referencia'}
        </button>
      </div>

      {/* Barcode */}
      {barcodeUrl && (
        <div className="flex justify-center">
          <img src={barcodeUrl} alt="Código de barras" className="max-w-full h-16" />
        </div>
      )}

      {/* Details */}
      <div className="bg-[#f8fafc] rounded-xl p-4 space-y-2 text-sm">
        {amount != null && (
          <div className="flex justify-between">
            <span className="text-[#7a7a7a]">Monto</span>
            <span className="font-bold text-[#142035]">${Number(amount).toFixed(2)} MXN</span>
          </div>
        )}
        {formattedDate && (
          <div className="flex justify-between">
            <span className="text-[#7a7a7a]">Vence</span>
            <span className="font-semibold text-[#142035]">{formattedDate}</span>
          </div>
        )}
        {!formattedDate && (
          <div className="flex justify-center">
            <span className="text-[10px] font-bold text-[#00A799] bg-[#00A799]/10 px-2 py-0.5 rounded-full">
              Referencia permanente
            </span>
          </div>
        )}
        {description && (
          <div className="flex justify-between">
            <span className="text-[#7a7a7a]">Descripción</span>
            <span className="text-[#142035]">{description}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-[#7a7a7a]">Paga en</span>
          <span className="text-[#142035] font-semibold">{places.join(', ')}</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-xl p-4">
        <p className="text-xs font-bold text-blue-700 mb-2">Instrucciones</p>
        <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
          {instructions.map((inst, i) => (
            <li key={i}>{inst}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
