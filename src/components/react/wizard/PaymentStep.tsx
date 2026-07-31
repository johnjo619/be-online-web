import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { portalGetGateways, portalStripeInit, portalMercadoPagoInit, portalPayPalInit, portalPayPalValidate, portalOpenPayInit, portalOpenPayCharge, portalOpenPayValidate, portalOxxoInit, portalDigitalFemsaInit } from '../../../lib/api';
import type { Gateway, Plan, OpenPayChargeResponse } from '../../../lib/types';
import GatewaySelector from '../payment/GatewaySelector';

const StripeInline = lazy(() => import('../payment/StripeInline'));
const MercadoPagoWallet = lazy(() => import('../payment/MercadoPagoWallet'));
const PayPalButtons = lazy(() => import('../payment/PayPalButtons'));
const OpenPayCard = lazy(() => import('../payment/OpenPayCard'));
const OxxoReference = lazy(() => import('../payment/OxxoReference'));

interface PaymentStepProps {
  msisdn: string;
  plan: Plan;
  onPaid: () => void;
}

function Spinner() {
  return (
    <div className="flex justify-center py-6">
      <div className="w-6 h-6 border-2 border-[#1a1e29] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function PaymentStep({ msisdn, plan, onPaid }: PaymentStepProps) {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [gwLoading, setGwLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState('');
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  // Payment-specific state
  const [payLoading, setPayLoading] = useState(false);
  const [stripeData, setStripeData] = useState<{ clientSecret: string; publishableKey: string } | null>(null);
  const [mpData, setMpData] = useState<{ preferenceId: string; publicKey: string } | null>(null);
  const [ppClientId, setPpClientId] = useState<string | null>(null);
  const [opData, setOpData] = useState<{ merchantId: string; publicKey: string; isSandbox: boolean; paymentReference: string } | null>(null);
  const [oxxoData, setOxxoData] = useState<import('../../../lib/types').OxxoInitResponse | null>(null);

  const offerId = plan.id;

  // Fetch available gateways
  useEffect(() => {
    portalGetGateways(msisdn)
      .then((gws) => {
        setGateways(gws.length > 0 ? gws : [
          { key: 'stripe', label: 'Pagar con Tarjeta', icon: '💳', sortOrder: 1, type: 'card' as const },
        ]);
        setGwLoading(false);
      })
      .catch(() => {
        setGateways([{ key: 'stripe', label: 'Pagar con Tarjeta', icon: '💳', sortOrder: 1, type: 'card' as const }]);
        setGwLoading(false);
      });
  }, [msisdn]);

  // Clear stale payment data and init when gateway changes
  useEffect(() => {
    if (!selected) return;

    // Reset all payment state before initializing new gateway
    setStripeData(null);
    setMpData(null);
    setPpClientId(null);
    setOpData(null);
    setOxxoData(null);

    let cancelled = false;

    const init = async () => {
      setPayLoading(true);
      setError('');

      try {
        if (selected === 'stripe') {
          // El backend devuelve { paymentIntent, dpmCheckerLink }.
          // La publishable_key NO viene de este endpoint — viene del gateway info.
          // Ver portal-cautivo-v4/src/components/Payment/Stripe/StripePayment.tsx
          const stripeGateway = gateways.find((g) => g.key === 'stripe');
          const publishableKey = stripeGateway?.publicKey;
          if (!publishableKey) {
            throw new Error('No se encontró la llave pública de Stripe.');
          }
          const res = await portalStripeInit(msisdn, offerId);
          if (!cancelled) setStripeData({ clientSecret: res.paymentIntent, publishableKey });
        } else if (selected === 'mercadoPago') {
          // El endpoint legacy /api/app/mercado/setMPPayment NO devuelve public_key,
          // solo el preference_id. La public_key real vive en gateways[key=mercadoPago].publicKey
          // (mismo patrón que stripe arriba). Sin public_key, el MP SDK no inicializa
          // y la wallet se queda dando vueltas indefinido.
          const mpGw = gateways.find((g) => g.key === 'mercadoPago');
          const mpPublicKey = mpGw?.publicKey || '';
          if (!mpPublicKey) {
            throw new Error('No se encontró la llave pública de MercadoPago.');
          }
          const res = await portalMercadoPagoInit({
            msisdn,
            offerid: offerId,
            url_success: `${window.location.origin}/pago-exitoso`,
            url_failure: `${window.location.origin}/activar/`,
            url_pending: `${window.location.origin}/pago-pendiente`,
          });
          if (!cancelled) setMpData({ preferenceId: res.preference_id, publicKey: res.public_key || mpPublicKey });
        } else if (selected === 'paypal') {
          const gw = gateways.find((g) => g.key === 'paypal');
          if (!cancelled) setPpClientId(gw?.publicKey || null);
        } else if (selected === 'openpayCard') {
          const res = await portalOpenPayInit(msisdn, offerId);
          if (!cancelled) setOpData({
            merchantId: res.merchant_id,
            publicKey: res.public_key,
            isSandbox: res.is_sandbox,
            paymentReference: res.payment_reference,
          });
        } else if (selected === 'openpayStore' || selected === 'digitalFemsa') {
          const fn = selected === 'openpayStore' ? portalOxxoInit : portalDigitalFemsaInit;
          const res = await fn(msisdn, offerId);
          if (!cancelled) setOxxoData(res);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al inicializar el pago.');
      } finally {
        if (!cancelled) setPayLoading(false);
      }
    };

    init();

    return () => { cancelled = true; };
  }, [selected, msisdn, offerId, gateways]);

  // OpenPay charge handler
  const handleOpenPayCharge = async (cardData: import('../payment/OpenPayCard').OpenPayCardData) => {
    const res: OpenPayChargeResponse = await portalOpenPayCharge({
      ...cardData,
      redirect_url: `${window.location.origin}/pago-exitoso`,
    });

    if (res.payment_method?.type === 'redirect' && res.payment_method?.url) {
      window.location.href = res.payment_method.url;
      return;
    }

    // Poll for validation with cleanup
    let attempts = 0;
    const maxAttempts = 40;
    const poll = async () => {
      if (!mountedRef.current) return;
      try {
        const status = await portalOpenPayValidate(res.charge_id);
        if (!mountedRef.current) return;
        if (status.status === 'completed' || status.status === 'charge_pending') {
          onPaid();
          return;
        }
      } catch { /* retry */ }
      attempts++;
      if (attempts < maxAttempts && mountedRef.current) {
        pollTimerRef.current = setTimeout(poll, 3000);
      } else if (mountedRef.current) {
        setError('Tiempo de espera agotado. Verifica tu pago.');
      }
    };
    poll();
  };

  // PayPal handlers
  const ppCreateOrder = async (): Promise<string> => {
    try {
      const res = await portalPayPalInit({ msisdn, offerid: offerId, order: 1 });
      return res.paypal.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar PayPal.');
      throw err; // PayPal SDK necesita el throw para abortar el checkout
    }
  };

  const ppOnApprove = async (orderID: string) => {
    try {
      await portalPayPalValidate(orderID);
      onPaid();
    } catch (err) {
      // El cobro pudo haber pasado del lado de PayPal pero validación falló.
      // El user ve el mensaje en pantalla en vez de un crash.
      setError(err instanceof Error ? err.message : 'PayPal procesó el pago pero hubo un problema validándolo. Contacta a *34468 con tu número de orden.');
    }
  };

  const amount = Number(plan.amount) || 0;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Plan summary */}
      <div className="bg-[#f8fafc] rounded-xl p-4 flex justify-between items-center">
        <div>
          <p className="font-poppins text-sm font-semibold text-[#0f172a]">
            {plan.display_name || plan.name}
          </p>
          <p className="font-poppins text-xs text-[#7a7a7a]">{plan.card_footer || ''}</p>
        </div>
        <p className="font-unbounded text-xl font-bold text-[#1a1e29]">
          ${amount.toFixed(0)} MXN
        </p>
      </div>

      {/* Gateway Selector */}
      <GatewaySelector
        gateways={gateways}
        selected={selected}
        onSelect={setSelected}
        isLoading={gwLoading}
      />

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      {/* Payment Component */}
      {selected && !payLoading && (
        <Suspense fallback={<Spinner />}>
          {selected === 'stripe' && stripeData && (
            <StripeInline
              clientSecret={stripeData.clientSecret}
              publishableKey={stripeData.publishableKey}
              returnUrl={`${window.location.origin}/pago-exitoso`}
              amount={amount}
            />
          )}

          {selected === 'mercadoPago' && mpData && (
            <MercadoPagoWallet
              publicKey={mpData.publicKey}
              preferenceId={mpData.preferenceId}
            />
          )}

          {selected === 'paypal' && ppClientId && (
            <PayPalButtons
              clientId={ppClientId}
              createOrderFn={ppCreateOrder}
              onApproveFn={ppOnApprove}
              onError={() => setError('Error con PayPal.')}
            />
          )}

          {selected === 'openpayCard' && opData && (
            <OpenPayCard
              merchantId={opData.merchantId}
              publicKey={opData.publicKey}
              isSandbox={opData.isSandbox}
              paymentReference={opData.paymentReference}
              onCharge={handleOpenPayCharge}
              amount={amount}
            />
          )}

          {(selected === 'openpayStore' || selected === 'digitalFemsa') && oxxoData && (
            <OxxoReference
              data={oxxoData}
              gatewayLabel={selected === 'digitalFemsa' ? 'Pago en OXXO' : 'Pago con PayNet'}
            />
          )}
        </Suspense>
      )}

      {payLoading && <Spinner />}

      {/* Escape hatch: MP SDK no expone evento "cancel" cuando el user cierra
          la modal. Sin este botón, el user queda atrapado sin poder cambiar
          de método de pago si cancela. */}
      {selected && !payLoading && (
        <button
          type="button"
          onClick={() => {
            setSelected(null);
            setStripeData(null);
            setMpData(null);
            setPpClientId(null);
            setOpData(null);
            setOxxoData(null);
            setError('');
          }}
          className="w-full mt-2 py-3 text-sm font-poppins font-semibold text-[#94a3b8] hover:text-[#1a1e29] transition-colors"
        >
          ← Cambiar método de pago
        </button>
      )}
    </div>
  );
}
