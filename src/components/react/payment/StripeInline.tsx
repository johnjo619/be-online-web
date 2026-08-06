import { useState, useMemo } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface StripeInlineProps {
  clientSecret: string;
  publishableKey: string;
  returnUrl: string;
  amount?: number;
}

function CheckoutForm({ returnUrl, amount }: { returnUrl: string; amount?: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });

    if (stripeError) {
      if (stripeError.type === 'card_error' || stripeError.type === 'validation_error') {
        setError(stripeError.message || 'Error en el pago');
      } else {
        setError('Ocurrió un error inesperado.');
      }
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: 'accordion' }} />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={!stripe || !elements || loading}
        className="w-full rounded-full bg-[#142035] text-white font-bold py-4 text-lg shadow-lg shadow-[#142035]/30 hover:bg-[#EF4B23] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

export default function StripeInline({
  clientSecret,
  publishableKey,
  returnUrl,
  amount,
}: StripeInlineProps) {
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey]);

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: { theme: 'stripe' },
        loader: 'auto',
      }}
    >
      <CheckoutForm returnUrl={returnUrl} amount={amount} />
    </Elements>
  );
}
