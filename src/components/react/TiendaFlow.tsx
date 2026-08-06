import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { getPlans, getPublicProducts, getEcommerceGateways, createOrder, ecommerceStripeInit, ecommerceMercadoPagoInit, ecommerceOxxoInit } from '../../lib/api';
import { STRIPE_PUBLISHABLE_KEY } from '../../lib/payment-config';
import type { Plan, SimType, Gateway, EcommerceProduct } from '../../lib/types';
import ServiceChooser, { SERVICE_TO_CRM_TYPE, SERVICE_LABEL, type Service } from './ServiceChooser';
import SimEsimPicker from './SimEsimPicker';
import CustomerForm, { type CustomerData } from './CustomerForm';
import OrderSummary from './OrderSummary';
import GatewaySelector from './payment/GatewaySelector';
import PlanCardBO from './PlanCardBO';
import DeviceLineItem from './DeviceLineItem';
import { getChunkSize, getPlanDuration } from './planHelpers';

/** Categoría CRM del dispositivo asociado a cada servicio. */
const DEVICE_CATEGORY_BY_SERVICE: Record<Exclude<Service, 'movil'>, string> = {
  mifi: 'mifi',
};

/** SKU fijo del producto "Gastos de envío" en CRM. */
const SHIPPING_SKU = 'shipping-mx-fixed';

/* ── MOCK products para preview local ──────────────────────────────
 * Solo se usan si PUBLIC_USE_MOCK_PRODUCTS=true en .env (no en build prod).
 * Cuando el backend (feature/ecommerce-devices-shipping) esté deployado
 * y los productos seedeados en CRM, estos mocks se descartan automáticamente.
 */
const MOCK_DEVICE_BY_CATEGORY: Record<string, EcommerceProduct> = {
  mifi: {
    id: -2, sku: 'mifi-pmf01',
    name: 'Equipo MiFi PMF01',
    product_type: 'mifi_device', category: 'mifi',
    valor_unitario: '1200.00', tasa_iva: '0.16',
    requires_shipping: true,
  },
};
const MOCK_SHIPPING: EcommerceProduct = {
  id: -3, sku: 'shipping-mx-fixed',
  name: 'Gastos de envío MX',
  product_type: 'accessory', category: 'shipping',
  valor_unitario: '99.00', tasa_iva: '0.00',
  requires_shipping: false,
};

const StripeInline = lazy(() => import('./payment/StripeInline'));
const MercadoPagoWallet = lazy(() => import('./payment/MercadoPagoWallet'));
const OxxoReference = lazy(() => import('./payment/OxxoReference'));

// ── Helpers ──────────────────────────────────────────────────────────────────

type MovilTabKey = 'XPRESS' | 'MENSUAL' | 'ANUAL';

const MOVIL_TABS: { key: MovilTabKey; label: string }[] = [
  { key: 'XPRESS', label: 'Xpress' },
  { key: 'MENSUAL', label: 'Mensual' },
  { key: 'ANUAL', label: 'Anual' },
];

// ── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex justify-center py-8">
      <div className="w-8 h-8 border-3 border-[#142035] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

type Step = 'service' | 'plans' | 'checkout' | 'payment' | 'done';

export default function TiendaFlow() {
  // ── Service selection ────────────────────────────────────────
  const [service, setService] = useState<Service | null>(null);
  const [includeDevice, setIncludeDevice] = useState(true);

  // ── Plans state ──────────────────────────────────────────────
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeMovilTab, setActiveMovilTab] = useState<MovilTabKey>('MENSUAL');
  const [pageIdx, setPageIdx] = useState(0);
  const [chunkSize, setChunkSize] = useState(3);
  const [animating, setAnimating] = useState(false);

  // ── Checkout state ───────────────────────────────────────────
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [simType, setSimType] = useState<SimType>('esim');
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const [orderUuid, setOrderUuid] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // ── Catálogo público (equipo MiFi / shipping) ──────────
  // Se fetchean cuando entra al checkout para mostrarlos en sidebar y
  // construir items[] al crear la orden.
  const [device, setDevice] = useState<EcommerceProduct | null>(null);
  const [shipping, setShipping] = useState<EcommerceProduct | null>(null);

  // ── Gateways dinámicas del tenant (mismo patrón que port.pandamovil.mx) ──
  // GET /api/public/ecommerce/gateways?company_id=3
  // SIN fallback hardcodeado: se muestran SOLO las pasarelas realmente
  // configuradas para el tenant. Si el API no responde o el tenant no tiene
  // ninguna, queda vacío y GatewaySelector muestra el estado "sin métodos".
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [gatewaysLoading, setGatewaysLoading] = useState(false);

  // ── Payment state ────────────────────────────────────────────
  const [stripeData, setStripeData] = useState<{ clientSecret: string; publishableKey: string } | null>(null);
  const [mpData, setMpData] = useState<{ preferenceId: string; publicKey: string } | null>(null);
  const [oxxoData, setOxxoData] = useState<import('../../lib/types').OxxoInitResponse | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // ── Step tracking ────────────────────────────────────────────
  const [step, setStep] = useState<Step>('service');

  // ── Fetch plans cuando se selecciona servicio ────────────────
  const loadPlans = useCallback(async (srv: Service) => {
    setLoading(true);
    setError('');
    setPlans([]);
    try {
      const data = await getPlans(SERVICE_TO_CRM_TYPE[srv]);
      setPlans(data);
    } catch (err) {
      // El backend devuelve 200 con status:false cuando "No offers found"
      const msg = err instanceof Error ? err.message : '';
      if (/no offers/i.test(msg) || /not found/i.test(msg)) {
        setError(`Estamos preparando los planes de ${SERVICE_LABEL[srv].toLowerCase()}. Marca *34468 para más info.`);
      } else {
        setError('No pudimos cargar los planes. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Responsive chunk size ────────────────────────────────────
  useEffect(() => {
    const handle = () => setChunkSize(getChunkSize());
    handle();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  // ── Checkout layout: side-by-side (main + sidebar) ───────────
  // Replicamos el patrón del WizardShell de pandamovil-next: cuando se entra
  // a checkout/payment, en vez de modal flotante se monta una sección con
  // grid 1fr + 320px (sidebar resumen del pedido siempre visible).
  const checkoutOpen = (step === 'checkout' || step === 'payment') && !!selectedPlan;

  // ── Deep link: ?service=movil|mifi&plan=ID ───────────────
  // Cuando el usuario llega desde el PlanActionModal de otra sección,
  // preseleccionamos servicio y plan, y saltamos al step 'checkout'.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const qSrv = params.get('service') as Service | null;
    const qPlan = params.get('plan');
    if (!qSrv || !['movil', 'mifi'].includes(qSrv)) return;

    setService(qSrv);
    setIncludeDevice(true);
    (async () => {
      setLoading(true);
      try {
        const data = await getPlans(SERVICE_TO_CRM_TYPE[qSrv]);
        setPlans(data);
        if (qPlan) {
          const found = data.find((p) => String(p.id) === qPlan);
          if (found) {
            setSelectedPlan(found);
            setStep('checkout');
            return;
          }
        }
        setStep('plans');
      } catch {
        setError(`Estamos preparando los planes de ${SERVICE_LABEL[qSrv].toLowerCase()}. Marca *34468 para más info.`);
        setStep('plans');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers de service step ─────────────────────────────────
  // Auto-avance: para Movilidad (sin toggle de equipo) saltamos directo
  // a /plans al primer click. Para MiFi mantenemos el toggle visible
  // y el usuario confirma con "Continuar" que carga los planes filtrados
  // por includeDevice=true|false. Antes el click solo seteaba state y los
  // usuarios mobile no veían el botón Continuar abajo del fold.
  const handleServiceSelect = async (srv: Service, includeDev: boolean) => {
    setService(srv);
    setIncludeDevice(includeDev);
    if (srv === 'movil') {
      await loadPlans(srv);
      setStep('plans');
      setPageIdx(0);
      setActiveMovilTab('MENSUAL');
    }
  };

  const handleServiceContinue = async () => {
    if (!service) return;
    await loadPlans(service);
    setStep('plans');
    setPageIdx(0);
    if (service === 'movil') setActiveMovilTab('MENSUAL');
  };

  const handleBackToService = () => {
    setStep('service');
    setSelectedPlan(null);
    setCustomerData(null);
    setSelectedGateway(null);
    setOrderUuid(null);
    setCheckoutError('');
  };

  // ── Filtrado por tab (solo Movilidad) ────────────────────────
  const filtered = useMemo(() => {
    if (service !== 'movil') return plans;
    return plans.filter((p) => (p.group_name || '').toUpperCase().includes(activeMovilTab));
  }, [plans, activeMovilTab, service]);

  const chunks = useMemo(() => {
    const c: Plan[][] = [];
    for (let i = 0; i < filtered.length; i += chunkSize) c.push(filtered.slice(i, i + chunkSize));
    return c;
  }, [filtered, chunkSize]);

  const totalPages = chunks.length;

  useEffect(() => { setPageIdx(0); }, [activeMovilTab, chunkSize, service]);

  const goTo = useCallback(
    (idx: number) => {
      if (animating) return;
      setAnimating(true);
      setPageIdx(idx);
      setTimeout(() => setAnimating(false), 400);
    },
    [animating],
  );

  // ── Checkout handlers ────────────────────────────────────────

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setStep('checkout');
    setCustomerData(null);
    setSelectedGateway(null);
    setOrderUuid(null);
    setCheckoutError('');
    // El checkout se abre como modal centrado, no requiere scrollIntoView.
  };

  const handleCustomerSubmit = (data: CustomerData) => {
    setCustomerData(data);
  };

  const handleProceedToPayment = async () => {
    if (!selectedPlan || !customerData || !selectedGateway || !service) return;

    setCheckoutLoading(true);
    setCheckoutError('');

    try {
      // Construir items[] mixto: plan obligatorio, dispositivo opcional, envío opcional.
      // El backend recalcula subtotal/tax/shipping_cost/devices_cost server-side.
      const items: Array<{ offer_id?: number | string; product_id?: number | string; product_type: string; quantity: number }> = [
        { offer_id: selectedPlan.id, product_type: 'plan', quantity: 1 },
      ];
      if (device) {
        items.push({ product_id: device.id, product_type: device.product_type, quantity: 1 });
      }
      if (shipping) {
        items.push({ product_id: shipping.id, product_type: shipping.product_type, quantity: 1 });
      }

      const orderPayload = {
        customer_name: customerData.name,
        customer_email: customerData.email,
        customer_phone: customerData.phone,
        ...(service === 'movil' ? { sim_type: simType } : {}),
        items,
        shipping_address: customerData.shipping,
        // Flag de diagnóstico — el cobro real lo controla la presencia/ausencia
        // del item dispositivo en items[]. El backend ignora include_device.
        include_device: service === 'movil' ? true : includeDevice,
      };

      const order = await createOrder(orderPayload);
      setOrderUuid(order.uuid);

      setPaymentLoading(true);

      if (selectedGateway === 'stripe') {
        const stripe = await ecommerceStripeInit(order.uuid);
        // Preferimos la publishable_key que entrega el backend (por tenant);
        // STRIPE_PUBLISHABLE_KEY de env queda como fallback.
        setStripeData({ clientSecret: stripe.paymentIntent, publishableKey: stripe.publishable_key || STRIPE_PUBLISHABLE_KEY });
      } else if (selectedGateway === 'mercadoPago') {
        const mp = await ecommerceMercadoPagoInit(order.uuid);
        // /api/ecommerce/mercadopago/init NO devuelve public_key — vive en
        // gateways[key=mercadoPago].publicKey (mismo patrón que PaymentStep).
        // Sin public_key el MP SDK no inicializa y la wallet gira indefinido.
        const mpGw = gateways.find((g) => g.key === 'mercadoPago');
        const mpPublicKey = mp.public_key || mpGw?.publicKey || '';
        if (!mpPublicKey) {
          throw new Error('No se encontró la llave pública de MercadoPago.');
        }
        setMpData({ preferenceId: mp.preference_id, publicKey: mpPublicKey });
      } else if (selectedGateway === 'openpayStore') {
        const oxxo = await ecommerceOxxoInit(order.uuid);
        setOxxoData(oxxo);
      }

      setStep('payment');
      setPaymentLoading(false);
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Error al procesar la orden.');
      setPaymentLoading(false);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleBackToPlans = () => {
    setStep('plans');
    setSelectedPlan(null);
  };

  // ── Necesita envío físico? ───────────────────────────────────
  // Movil: solo si elige SIM física. MiFi: si incluye dispositivo.
  const needsShipping = service === 'movil' ? simType === 'sim' : includeDevice;

  // Para CustomerForm necesita un SimType — para MiFi 'con dispositivo' tratamos
  // como 'sim' (envío físico requerido), 'sin dispositivo' como 'esim' (no envío).
  const formSimType: SimType =
    service === 'movil' ? simType : includeDevice ? 'sim' : 'esim';

  // ── Fetch gateways dinámicas del tenant al entrar a checkout ───────────
  useEffect(() => {
    if (step !== 'checkout') return;
    let cancelled = false;
    setGatewaysLoading(true);
    getEcommerceGateways(1)
      .then((gws) => {
        if (cancelled) return;
        setGatewaysLoading(false);
        // PayPal aún no tiene endpoint /api/ecommerce/paypal/init en el backend.
        // Si lo dejamos visible, el user lo selecciona y queda en pantalla muerta
        // tras click en Pagar. Lo filtramos hasta que se implemente.
        // Sin fallback: se muestra exactamente lo que el tenant tiene configurado.
        setGateways(gws.filter((g) => g.key !== 'paypal'));
      })
      .catch(() => {
        if (cancelled) return;
        setGatewaysLoading(false);
        // Sin fallback hardcodeado: no ofrecemos métodos que el tenant podría no tener.
        setGateways([]);
      });
    return () => { cancelled = true; };
  }, [step]);

  // ── Fetch catálogo público (dispositivo + envío) al entrar a checkout ──
  // El backend (publicCreateOrder) recalcula totales server-side, pero el FE
  // necesita estos productos para mostrarlos en sidebar y armar items[].
  //
  // FALLBACK MOCK: si el CRM no tiene los productos seedeados (response vacío),
  // usamos datos hardcoded para que la UX no se rompa (shipping/device fantasma).
  // Cuando los productos estén en CRM, los items reales reemplazan al mock — el
  // backend recalcula el total final server-side de cualquier modo, así que el
  // único impacto del mock es la preview del sidebar.
  useEffect(() => {
    if (step !== 'checkout' || !service || !selectedPlan) return;

    // Dispositivo: solo MiFi con includeDevice=true
    if (service !== 'movil' && includeDevice) {
      const cat = DEVICE_CATEGORY_BY_SERVICE['mifi'];
      getPublicProducts({ category: cat })
        .then((items) => {
          setDevice(items[0] || MOCK_DEVICE_BY_CATEGORY[cat]);
        })
        .catch(() => setDevice(MOCK_DEVICE_BY_CATEGORY[cat]));
    } else {
      setDevice(null);
    }

    // Envío: cuando hay algo físico que entregar
    if (needsShipping) {
      getPublicProducts({ sku: SHIPPING_SKU })
        .then((items) => {
          setShipping(items[0] || MOCK_SHIPPING);
        })
        .catch(() => setShipping(MOCK_SHIPPING));
    } else {
      setShipping(null);
    }
  }, [step, service, selectedPlan, includeDevice, simType, needsShipping]);

  // ── Numeración dinámica de steps en checkout ───────────────────────────
  // movil: 01 SIM, 02 Datos, 03 Pago
  // mifi: 01 Datos, 02 Pago (sin step de SIM)
  const stepNumbers = service === 'movil'
    ? { sim: '01', datos: '02', pago: '03' }
    : { sim: '',   datos: '01', pago: '02' };

  // ── Total visible al cliente (server-side hace el cálculo final) ────────
  // Plan: `amount` del API ya viene con IVA incluido → NO sumar tasa adicional.
  // Devices/shipping: vienen ex-IVA en `valor_unitario` + `tasa_iva` separado → sí sumar.
  const visibleTotal = useMemo(() => {
    if (!selectedPlan) return 0;
    const planTotal = Number(selectedPlan.amount || 0); // ya incluye IVA

    let total = planTotal;
    if (device) {
      const v = Number(device.valor_unitario || 0);
      const t = Number(device.tasa_iva || 0);
      total += v + v * t;
    }
    if (shipping) {
      const v = Number(shipping.valor_unitario || 0);
      const t = Number(shipping.tasa_iva || 0);
      total += v + v * t;
    }
    return Math.round(total * 100) / 100;
  }, [selectedPlan, device, shipping]);

  // ── Render ───────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Stepper / breadcrumb */}
      {step !== 'service' && (
        <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 px-5 py-3 shadow-sm">
          <div className="flex items-center gap-3 text-sm font-poppins text-[#7a7a7a]">
            <button onClick={handleBackToService} className="text-[#142035] font-semibold hover:underline">
              ← Cambiar servicio
            </button>
            <span className="text-gray-300">/</span>
            <span className="text-[#142035] font-semibold">
              {service ? SERVICE_LABEL[service] : ''}
            </span>
            {service && service !== 'movil' && (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-[11px] uppercase tracking-wider">
                  {includeDevice ? 'Con dispositivo' : 'Solo plan'}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── STEP: Service ─────────────────────────────────── */}
      {step === 'service' && (
        <ServiceChooser
          selectedService={service}
          includeDevice={includeDevice}
          onSelect={handleServiceSelect}
          onContinue={handleServiceContinue}
        />
      )}

      {/* ── STEP: Plans (catálogo) ─────────────────────────── */}
      {step === 'plans' && (
        <>
          {/* Tab Selector — solo Movilidad */}
          {service === 'movil' && plans.length > 0 && (
            <div className="flex justify-center">
              <div className="inline-flex bg-gray-100 rounded-full p-1">
                {MOVIL_TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => { setActiveMovilTab(t.key); if (step !== 'plans') handleBackToPlans(); }}
                    className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                      activeMovilTab === t.key
                        ? 'bg-[#142035] text-white shadow-lg shadow-[#142035]/30'
                        : 'text-[#7a7a7a] hover:text-[#142035]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && <Spinner />}

          {!loading && error && (
            <div className="max-w-xl mx-auto bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-3">
              <p className="font-unbounded font-bold text-[#142035]">Aún no hay planes para este servicio</p>
              <p className="font-poppins text-sm text-[#7a7a7a]">{error}</p>
              <button
                onClick={handleBackToService}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#142035] text-[#142035] font-semibold text-sm hover:bg-[#142035] hover:text-white transition-colors"
              >
                ← Elegir otro servicio
              </button>
            </div>
          )}

          {!loading && !error && chunks.length > 0 && (
            <div>
              {/* flex + justify-center: cards mantienen ancho fijo (300px) y se
                  centran horizontalmente. NO usar grid 1fr porque estira las
                  cards al ancho del contenedor (rectangulares aplanadas). */}
              <div
                className="flex flex-wrap gap-x-8 gap-y-14 justify-center pt-8 pb-2 pl-6 transition-opacity duration-300"
                style={{ opacity: animating ? 0 : 1 }}
              >
                {(chunks[pageIdx] || []).map((plan, i) => (
                  <PlanCardBO
                    key={plan.id}
                    plan={plan}
                    index={pageIdx * chunkSize + i}
                    isSelected={selectedPlan?.id === plan.id}
                    onSelect={() => handleSelectPlan(plan)}
                  />
                ))}
              </div>

              {/* Navigation bar */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6">
                  <button
                    onClick={() => goTo(pageIdx <= 0 ? totalPages - 1 : pageIdx - 1)}
                    className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                    aria-label="Anterior"
                  >
                    <svg className="w-5 h-5 text-[#142035]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <div className="flex gap-2">
                    {chunks.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => goTo(i)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          i === pageIdx ? 'bg-[#142035] scale-125' : 'bg-gray-300'
                        }`}
                        aria-label={`Página ${i + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => goTo(pageIdx >= totalPages - 1 ? 0 : pageIdx + 1)}
                    className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                    aria-label="Siguiente"
                  >
                    <svg className="w-5 h-5 text-[#142035]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}

          {!loading && !error && chunks.length === 0 && plans.length > 0 && (
            <p className="text-center text-[#7a7a7a] py-8">No hay planes en esta categoría.</p>
          )}
        </>
      )}

      {/* ── Checkout: layout side-by-side (main + sidebar resumen) ─
          Replica patrón WizardShell de pandamovil-next. NO modal flotante.
          Sidebar derecho fijo con resumen del pedido (Servicio, Plan, Tipo,
          Total destacado en rojo) sobre fondo negro. */}
      {checkoutOpen && selectedPlan && (
        <div className="max-w-5xl mx-auto grid lg:grid-cols-[1fr_320px] gap-6">
          {/* MAIN CARD */}
          <div className="order-2 lg:order-none bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8 space-y-7">
            {/* Stepper visual de progreso */}
            {step === 'checkout' && (
              <div className="flex items-center gap-1 sm:gap-2 mb-2">
                {[
                  { key: 'sim',   label: 'Tipo',  active: service === 'movil' },
                  { key: 'datos', label: 'Datos', active: true },
                  { key: 'pago',  label: 'Pago',  active: true },
                ].filter(s => s.active).map((s, i, arr) => {
                  const completed = (s.key === 'sim') ? !!simType
                                  : (s.key === 'datos') ? !!customerData
                                  : !!selectedGateway;
                  const current = !completed && (
                    (s.key === 'sim' && !simType) ||
                    (s.key === 'datos' && (service !== 'movil' || simType) && !customerData) ||
                    (s.key === 'pago' && customerData && !selectedGateway)
                  );
                  return (
                    <div key={s.key} className="flex items-center gap-1.5 sm:gap-2 flex-1">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors flex-shrink-0 ${
                        completed ? 'bg-emerald-500 text-white'
                        : current ? 'bg-panda-red text-white shadow-md shadow-panda-red/30'
                        : 'bg-gray-100 text-gray-400'
                      }`}>
                        {completed ? (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        ) : (i + 1)}
                      </span>
                      <span className={`hidden sm:inline font-poppins text-xs font-semibold ${current ? 'text-panda-dark' : 'text-gray-400'}`}>{s.label}</span>
                      {i < arr.length - 1 && <span className={`flex-1 h-0.5 ${completed ? 'bg-emerald-300' : 'bg-gray-200'}`} />}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Hero header */}
            <div className="flex items-start gap-4 pb-5 border-b border-gray-100">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-panda-red text-white shadow-lg shadow-panda-red/30">
                {step === 'checkout' ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 8h18M5 16h6m6 0h.01M3 6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 id="checkout-modal-title" className="font-unbounded text-xl sm:text-2xl font-bold text-panda-dark leading-tight">
                  {step === 'checkout' ? 'Casi listo' : 'Procesando pago…'}
                </h2>
                <p className="font-poppins text-sm text-panda-gray mt-1">
                  {step === 'checkout'
                    ? 'Completa tus datos y elige cómo pagas. Tu pedido se confirma al instante.'
                    : 'No cierres esta ventana.'}
                </p>
              </div>
              {step === 'checkout' && (
                <button
                  onClick={handleBackToPlans}
                  className="text-sm text-panda-red hover:text-panda-red-dark hover:underline font-semibold whitespace-nowrap"
                >
                  ← Cambiar plan
                </button>
              )}
            </div>

            <div className="space-y-7">

          {step === 'checkout' && (
            <>
              {/* SIM/eSIM Picker — solo Móvil */}
              {service === 'movil' && (
                <section>
                  <SectionHeader
                    number={stepNumbers.sim}
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M5 7h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z" /></svg>}
                    title="¿Cómo quieres tu chip?"
                    subtitle="eSIM activa en minutos. SIM física llega a tu domicilio."
                  />
                  <SimEsimPicker selected={simType} onChange={setSimType} />
                </section>
              )}

              {/* Customer Form con SectionHeader del padre (numeración consistente) */}
              <section>
                <SectionHeader
                  number={stepNumbers.datos}
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                  title="Tus datos"
                  subtitle="Para enviarte tu eSIM o confirmar tu pedido."
                />
                <CustomerForm
                  simType={formSimType}
                  onSubmit={handleCustomerSubmit}
                  loading={checkoutLoading}
                  hideMainHeader
                />
              </section>

              {/* Gateway Selector */}
              {customerData && (
                <section>
                  <SectionHeader
                    number={stepNumbers.pago}
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 8h18M5 16h6m6 0h.01M3 6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6z" /></svg>}
                    title="¿Cómo prefieres pagar?"
                    subtitle="Pago 100% seguro con cifrado de extremo a extremo."
                  />
                  <GatewaySelector
                    gateways={gateways}
                    selected={selectedGateway}
                    onSelect={setSelectedGateway}
                    isLoading={gatewaysLoading}
                  />
                </section>
              )}

              {/* CTA Pagar */}
              {customerData && selectedGateway && (
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  {checkoutError && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700">
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      <p className="font-poppins text-sm">{checkoutError}</p>
                    </div>
                  )}

                  {/* Sin desglose aquí: el sidebar derecho ya muestra el total
                      con línea por línea. Botón Pagar directo. */}

                  <button
                    onClick={handleProceedToPayment}
                    disabled={checkoutLoading}
                    className="group w-full rounded-2xl bg-panda-red text-white font-bold py-4 text-lg shadow-lg shadow-panda-red/40 hover:shadow-xl hover:shadow-panda-red/50 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-3"
                  >
                    {checkoutLoading ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        <span>Pagar<span className="hidden sm:inline"> ${visibleTotal.toFixed(0)} MXN</span></span>
                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs text-panda-gray font-poppins">
                      <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                      Cifrado SSL
                    </div>
                    <span className="text-gray-300">·</span>
                    <div className="flex items-center gap-1.5 text-xs text-panda-gray font-poppins">
                      <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      Sin contratos
                    </div>
                    <span className="text-gray-300">·</span>
                    <div className="flex items-center gap-1.5 text-xs text-panda-gray font-poppins">
                      <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      {needsShipping ? 'Envío gratis' : 'Sin envío'}
                    </div>
                  </div>
                </div>
              )}

              {/* CTA Continuar (cuando aún no hay customerData) */}
              {!customerData && (
                <div className="pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      const btn = document.getElementById('customer-form-submit') as HTMLButtonElement;
                      btn?.click();
                    }}
                    className="group w-full rounded-2xl bg-panda-red text-white font-bold py-4 text-lg shadow-lg shadow-panda-red/40 hover:shadow-xl hover:shadow-panda-red/50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                  >
                    Continuar al pago
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── Payment Step ─────────────────────────────── */}
          {step === 'payment' && (
            <div className="space-y-4">
              <OrderSummary plan={selectedPlan} simType={formSimType} />

              {paymentLoading ? (
                <Spinner />
              ) : (
                <Suspense fallback={<Spinner />}>
                  {selectedGateway === 'stripe' && stripeData && (
                    <StripeInline
                      clientSecret={stripeData.clientSecret}
                      publishableKey={stripeData.publishableKey}
                      returnUrl={`${window.location.origin}/pago-exitoso?order=${orderUuid}`}
                      amount={Number(selectedPlan.amount)}
                    />
                  )}

                  {selectedGateway === 'mercadoPago' && mpData && (
                    <MercadoPagoWallet
                      publicKey={mpData.publicKey}
                      preferenceId={mpData.preferenceId}
                    />
                  )}

                  {selectedGateway === 'openpayStore' && oxxoData && (
                    <OxxoReference data={oxxoData} />
                  )}
                </Suspense>
              )}

              {/* Escape hatch: MP/Stripe SDKs no exponen evento "cancel" cuando
                  el user cierra la modal/iframe. Sin este botón, el user queda
                  atrapado en el step de pago. */}
              {!paymentLoading && (
                <button
                  type="button"
                  onClick={() => {
                    setStep('checkout');
                    setSelectedGateway(null);
                    setStripeData(null);
                    setMpData(null);
                    setOxxoData(null);
                    setOrderUuid(null);
                    setCheckoutError('');
                  }}
                  className="w-full mt-2 py-3 text-sm font-poppins font-semibold text-panda-gray hover:text-panda-red transition-colors"
                >
                  ← Cambiar método de pago
                </button>
              )}
            </div>
          )}
            </div>
          </div>

          {/* SIDEBAR — Una sola card unificada estilo recibo:
              header gradient con plan destacado + lista de items + total + microconfianza */}
          <aside className="order-1 lg:order-none lg:sticky lg:top-24 lg:self-start">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

              {/* HEADER: plan destacado con gradient rojo (compacto, no PlanCard 300x460) */}
              <div className="bg-panda-red px-5 pt-5 pb-4 text-white">
                <p className="font-poppins text-[10px] uppercase tracking-wider opacity-80 mb-1">
                  Tu plan {service ? SERVICE_LABEL[service].toLowerCase() : ''}
                </p>
                <h3 className="font-unbounded text-lg font-bold leading-tight">
                  {selectedPlan.card_title || selectedPlan.display_name || selectedPlan.name}
                </h3>
                <div className="flex items-baseline gap-3 mt-3">
                  <div>
                    <span className="font-unbounded text-3xl font-extrabold leading-none">
                      {(() => {
                        const v = selectedPlan.data_national_limit;
                        if (selectedPlan.data_is_unlimit && !v) return '∞';
                        return v ? `${v}` : '0';
                      })()}
                    </span>
                    <span className="font-unbounded text-base font-semibold opacity-90 ml-1">GB</span>
                  </div>
                  <div className="h-6 w-px bg-white/30" />
                  <span className="font-poppins text-xs opacity-90">
                    {getPlanDuration(selectedPlan)}
                  </span>
                </div>
              </div>

              {/* BODY: lista uniforme de items con precio en mono */}
              <div className="px-5 py-4 space-y-3">
                <p className="font-poppins text-[10px] uppercase tracking-wider text-panda-gray font-semibold">
                  Resumen del pedido
                </p>

                {/* Plan — amount ya incluye IVA, no multiplicar */}
                <ReceiptLine
                  icon="sim"
                  name="Plan"
                  hint={selectedPlan.card_title || selectedPlan.display_name || selectedPlan.name}
                  price={Number(selectedPlan.amount)}
                />

                {/* Dispositivo */}
                {device && (
                  <ReceiptLine
                    icon={service === 'mifi' ? 'mifi' : 'router'}
                    name="Equipo"
                    hint={device.name}
                    price={Number(device.valor_unitario) * (1 + Number(device.tasa_iva || 0))}
                  />
                )}

                {/* Envío */}
                {shipping && (
                  <ReceiptLine
                    icon="truck"
                    name="Envío"
                    hint="Llega en 2-5 días hábiles"
                    price={Number(shipping.valor_unitario) * (1 + Number(shipping.tasa_iva || 0))}
                  />
                )}
              </div>

              {/* TOTAL */}
              <div className="px-5 py-4 bg-panda-surface border-t border-gray-200">
                <div className="flex justify-between items-baseline">
                  <div>
                    <p className="font-poppins text-[11px] uppercase tracking-wider text-panda-gray font-semibold">
                      Total a pagar
                    </p>
                    <p className="font-poppins text-[10px] text-panda-gray mt-0.5">
                      MXN · IVA incluido
                    </p>
                  </div>
                  <span className="font-unbounded font-extrabold text-panda-red text-3xl tabular-nums leading-none">
                    ${visibleTotal.toFixed(0)}
                  </span>
                </div>
              </div>

              {/* MICROCONFIANZA al pie */}
              <div className="px-5 py-3 bg-panda-dark text-gray-300 flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="font-poppins text-[11px]">
                  Pago seguro · Sin contratos · Cancelas cuando quieras
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

/* ── ReceiptLine — línea uniforme del recibo (sidebar) ───────── */

function ReceiptLine({
  icon, name, hint, price,
}: { icon: 'sim' | 'router' | 'mifi' | 'truck'; name: string; hint?: string; price: number }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-panda-red/10 flex items-center justify-center flex-shrink-0 text-panda-red mt-0.5">
        <ReceiptIcon name={icon} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-poppins text-[11px] uppercase tracking-wider text-panda-gray font-semibold">
          {name}
        </p>
        {hint && (
          <p className="font-poppins text-xs text-panda-dark leading-tight mt-0.5 truncate">
            {hint}
          </p>
        )}
      </div>
      <span className="font-mono font-bold text-sm text-panda-dark tabular-nums whitespace-nowrap pt-1">
        ${price.toFixed(2)}
      </span>
    </div>
  );
}

function ReceiptIcon({ name }: { name: 'sim' | 'router' | 'mifi' | 'truck' }) {
  const cls = 'w-4 h-4';
  switch (name) {
    case 'sim':
      return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M5 7h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z" /></svg>;
    case 'router':
      return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a2 2 0 012-2zm2 4h.01M11 16h2m-7-4V8a2 2 0 012-2h8a2 2 0 012 2v4" /></svg>;
    case 'mifi':
      return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>;
    case 'truck':
      return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" /></svg>;
  }
}

/* ── SectionHeader ────────────────────────────────────────────── */

function SectionHeader({
  number, icon, title, subtitle,
}: { number?: string; icon?: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      {number && (
        <span className="font-unbounded text-xs font-bold text-panda-red bg-panda-red/10 rounded-lg w-9 h-9 flex items-center justify-center flex-shrink-0">
          {number}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-unbounded text-sm sm:text-base font-bold text-panda-dark flex items-center gap-2">
          {icon && <span className="text-panda-red">{icon}</span>}
          {title}
        </p>
        {subtitle && <p className="font-poppins text-xs text-panda-gray mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
