import { useState, useEffect, useRef } from 'react';

interface OpenPayCardProps {
  merchantId: string;
  publicKey: string;
  isSandbox: boolean;
  paymentReference: string;
  onCharge: (cardData: OpenPayCardData) => Promise<void>;
  amount?: number;
}

export interface OpenPayCardData {
  card_number: string;
  holder_name: string;
  expiration_month: string;
  expiration_year: string;
  cvv2: string;
  device_session_id: string;
  payment_reference: string;
}

declare global {
  interface Window {
    OpenPay?: {
      setId: (id: string) => void;
      setApiKey: (key: string) => void;
      setSandboxMode: (sandbox: boolean) => void;
      deviceData: {
        setup: (formId?: string, hiddenFieldName?: string) => string;
      };
    };
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      // Script already executed — resolve immediately
      if (src.includes('openpay.v1') && window.OpenPay) {
        resolve();
        return;
      }
      if (src.includes('openpay-data') && window.OpenPay?.deviceData) {
        resolve();
        return;
      }
      // Script tag in DOM but may still be loading, or load event already fired.
      // Poll briefly for the global to appear (handles both cases).
      let attempts = 0;
      const poll = setInterval(() => {
        attempts++;
        const ready =
          (src.includes('openpay.v1') && window.OpenPay) ||
          (src.includes('openpay-data') && window.OpenPay?.deviceData);
        if (ready) {
          clearInterval(poll);
          resolve();
        } else if (attempts >= 50) {
          // 5 seconds max
          clearInterval(poll);
          reject(new Error(`Timeout loading ${src}`));
        }
      }, 100);
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export default function OpenPayCard({
  merchantId,
  publicKey,
  isSandbox,
  paymentReference,
  onCharge,
  amount,
}: OpenPayCardProps) {
  const [sdkReady, setSdkReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef('');

  const [form, setForm] = useState({
    card_number: '',
    holder_name: '',
    expiration_month: '',
    expiration_year: '',
    cvv2: '',
  });

  useEffect(() => {
    const init = async () => {
      try {
        await loadScript('https://js.openpay.mx/openpay.v1.min.js');
        await loadScript('https://js.openpay.mx/openpay-data.v1.min.js');
        window.OpenPay!.setId(merchantId);
        window.OpenPay!.setApiKey(publicKey);
        window.OpenPay!.setSandboxMode(isSandbox);
        sessionRef.current = window.OpenPay!.deviceData.setup() || '';
        setSdkReady(true);
      } catch {
        setError('No se pudo cargar el procesador de pagos.');
      }
    };
    init();
  }, [merchantId, publicKey, isSandbox]);

  const handleChange = (field: string, value: string) => {
    // Only digits for numeric fields
    if (['card_number', 'expiration_month', 'expiration_year', 'cvv2'].includes(field)) {
      value = value.replace(/\D/g, '');
    }
    setForm((f) => ({ ...f, [field]: value }));
  };

  const formatCardNumber = (n: string) =>
    n.replace(/(\d{4})(?=\d)/g, '$1 ').trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sdkReady) return;

    setLoading(true);
    setError(null);

    try {
      await onCharge({
        ...form,
        device_session_id: sessionRef.current,
        payment_reference: paymentReference,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar el pago.');
    } finally {
      setLoading(false);
    }
  };

  if (!sdkReady && !error) {
    return (
      <div className="flex justify-center py-6">
        <div className="w-6 h-6 border-2 border-[#EF4B23] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const inputClass =
    'w-full rounded-xl border border-gray-300 px-4 py-3 font-poppins text-sm focus:border-[#EF4B23] focus:ring-2 focus:ring-[#EF4B23]/20 outline-none transition-colors';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-[#142035] mb-1">
          Número de tarjeta
        </label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={19}
          value={formatCardNumber(form.card_number)}
          onChange={(e) => handleChange('card_number', e.target.value)}
          placeholder="1234 5678 9012 3456"
          className={inputClass}
          required
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#142035] mb-1">
          Nombre del titular
        </label>
        <input
          type="text"
          value={form.holder_name}
          onChange={(e) => handleChange('holder_name', e.target.value)}
          placeholder="Como aparece en la tarjeta"
          className={inputClass}
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-[#142035] mb-1">MM</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={2}
            value={form.expiration_month}
            onChange={(e) => handleChange('expiration_month', e.target.value)}
            placeholder="MM"
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#142035] mb-1">AA</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={2}
            value={form.expiration_year}
            onChange={(e) => handleChange('expiration_year', e.target.value)}
            placeholder="AA"
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#142035] mb-1">CVV</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={form.cvv2}
            onChange={(e) => handleChange('cvv2', e.target.value)}
            placeholder="***"
            className={inputClass}
            required
          />
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-[#EF4B23] text-white font-bold py-4 text-lg shadow-lg shadow-[#EF4B23]/30 hover:bg-[#EF4B23] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Procesando...
          </span>
        ) : (
          `🔒 Pagar${amount ? ` $${Number(amount).toFixed(2)} MXN` : ''}`
        )}
      </button>
    </form>
  );
}
