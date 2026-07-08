import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { getPlans, getPublicProducts, getEcommerceGateways, createOrder, ecommerceStripeInit, ecommerceMercadoPagoInit, ecommerceOxxoInit } from '../../lib/api';
import { STRIPE_PUBLISHABLE_KEY } from '../../lib/payment-config';
import type { Plan, SimType, Gateway, EcommerceProduct } from '../../lib/types';
import { SERVICE_TO_CRM_TYPE, SERVICE_LABEL, type Service } from './ServiceChooser';
import SimEsimPicker from './SimEsimPicker';
import CustomerForm, { type CustomerData } from './CustomerForm';
import GatewaySelector from './payment/GatewaySelector';
import PlanCard from './PlanCard';
import { getChunkSize, getPlanDuration } from './planHelpers';
import astronautaImagen from '@/assets/images/astronauta6.png';
import simImagen from '@/assets/images/sim_bo.png';


const DEVICE_CATEGORY_BY_SERVICE: Record<Exclude<Service, 'movil'>, string> = {
  hbb: 'router_hbb',
  mifi: 'mifi',
};

const SHIPPING_SKU = 'shipping-mx-fixed';

const MOCK_DEVICE_BY_CATEGORY: Record<string, EcommerceProduct> = {
  router_hbb: {
    id: -1, sku: 'router-hbb-pmf01',
    name: 'Router HBB 4G LTE PMF01',
    product_type: 'accessory', category: 'router_hbb',
    valor_unitario: '1500.00', tasa_iva: '0.16',
    requires_shipping: true,
  },
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

// --- MODIFICADO: Tabs actualizados para coincidir con la agrupación solicitada ---
type MovilTabKey = 'MENSUAL' | '3 MESES' | '6 MESES' | 'ANUAL';

const MOVIL_TABS: { key: MovilTabKey; label: string }[] = [
  { key: 'MENSUAL', label: 'Mensual' },
  { key: '3 MESES', label: '3 Meses' },
  { key: '6 MESES', label: '6 Meses' },
  { key: 'ANUAL', label: 'Anual' },
];

// --- NUEVO: Data dura basada en la información proporcionada ---
const PLAN_DATA: Record<MovilTabKey, any[]> = {
  MENSUAL: [
    { gb: '2 GB', name: 'BO EXPLORER', desc: '2G de 4.5G LTE', price: 209, color: '#1a1e29', duration: '30 días' },
    { gb: '4 GB', name: 'BO MERCURY', desc: '12G de 4.5G LTE', price: 209, color: '#f05244', duration: '30 días' },
    { gb: '12 GB', name: 'BO APOLO', desc: '12G de 4.5G LTE DATA', price: 259, color: '#4aa49c', duration: '30 días' },
    { gb: '24 GB', name: 'BO ASTEROID', desc: '24G de 4.5G LTE DATA', price: 329, color: '#2a74ba', duration: '30 días' },
    { gb: '35 GB', name: 'BO SUPERNOVA', desc: '35G de 4.5G LTE', price: 419, color: '#8a2be2', duration: '30 días' },
    { gb: '50 GB', name: 'BO COSMOS', desc: '50G de 4.5G LTE DATA', price: 669, color: '#ff8c00', duration: '30 días' },
  ],
  '3 MESES': [
    { gb: '2 GB', name: 'BO EXPLORER', desc: '2G de 4.5G LTE', price: 599, color: '#1a1e29', duration: '3 meses' },
    { gb: '4 GB', name: 'BO MERCURY', desc: '12G de 4.5G LTE', price: 599, color: '#f05244', duration: '3 meses' },
    { gb: '12 GB', name: 'BO APOLO', desc: '12G de 4.5G LTE DATA', price: 749, color: '#4aa49c', duration: '3 meses' },
    { gb: '24 GB', name: 'BO ASTEROID', desc: '24G de 4.5G LTE DATA', price: 969, color: '#2a74ba', duration: '3 meses' },
  ],
  '6 MESES': [
    { gb: '2 GB', name: 'BO EXPLORER', desc: '2G de 4.5G LTE', price: 1169, color: '#1a1e29', duration: '6 meses' },
    { gb: '4 GB', name: 'BO MERCURY', desc: '12G de 4.5G LTE', price: 1169, color: '#f05244', duration: '6 meses' },
    { gb: '12 GB', name: 'BO APOLO', desc: '12G de 4.5G LTE DATA', price: 1499, color: '#4aa49c', duration: '6 meses' },
    { gb: '24 GB', name: 'BO ASTEROID', desc: '24G de 4.5G LTE DATA', price: 1939, color: '#2a74ba', duration: '6 meses' },
  ],
  'ANUAL': [
    { gb: '2 GB', name: 'BO EXPLORER', desc: '2G de 4.5G LTE', price: 2199, color: '#1a1e29', duration: '12 meses' },
    { gb: '4 GB', name: 'BO MERCURY', desc: '12G de 4.5G LTE', price: 2199, color: '#f05244', duration: '12 meses' },
    { gb: '12 GB', name: 'BO APOLO', desc: '12G de 4.5G LTE DATA', price: 2759, color: '#4aa49c', duration: '12 meses' },
    { gb: '24 GB', name: 'BO ASTEROID', desc: '24G de 4.5G LTE DATA', price: 3599, color: '#2a74ba', duration: '12 meses' },
  ]
};

function Spinner() {
  return (
    <div className="flex justify-center py-8">
      <div className="w-8 h-8 border-3 border-[#1a1e29] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

type Step = 'info' | 'plans' | 'checkout' | 'payment' | 'done';

const STEP_LABELS = ['Agrega Información', 'Elige tu plan', 'Método de pago', ''];

export default function TiendaFlow() {
  const [service, setService] = useState<Service | null>('movil');
  const [includeDevice, setIncludeDevice] = useState(true);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeMovilTab, setActiveMovilTab] = useState<MovilTabKey>('MENSUAL');
  const [pageIdx, setPageIdx] = useState(0);
  const [chunkSize, setChunkSize] = useState(3);
  const [animating, setAnimating] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [simType, setSimType] = useState<SimType>('esim');
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);

  const [isRecarga, setIsRecarga] = useState(false);
  const [recargaPhone, setRecargaPhone] = useState('');
  const [recargaError, setRecargaError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsRecarga(window.location.pathname.includes('/recarga'));
    }
  }, []);

  const STEP_LABELS_FLOW = isRecarga
    ? ['Ingresa el número', 'Elige tu plan', 'Método de pago', '']
    : ['Agrega Información', 'Elige tu plan', 'Método de pago', ''];
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const [orderUuid, setOrderUuid] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const [device, setDevice] = useState<EcommerceProduct | null>(null);
  const [shipping, setShipping] = useState<EcommerceProduct | null>(null);

  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [gatewaysLoading, setGatewaysLoading] = useState(false);

  const [stripeData, setStripeData] = useState<{ clientSecret: string; publishableKey: string } | null>(null);
  const [mpData, setMpData] = useState<{ preferenceId: string; publicKey: string } | null>(null);
  const [oxxoData, setOxxoData] = useState<import('../../lib/types').OxxoInitResponse | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [step, setStep] = useState<Step>('info');

  const loadPlans = useCallback(async (srv: Service) => {
    setLoading(true);
    setError('');
    setPlans([]);
    try {
      const data = await getPlans(SERVICE_TO_CRM_TYPE[srv], 'Panda');
      setPlans(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (/no offers/i.test(msg) || /not found/i.test(msg)) {
        setError(`Estamos preparando los planes de ${SERVICE_LABEL[srv].toLowerCase()}. Marca *777 para más info.`);
      } else {
        setError('No pudimos cargar los planes. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = () => setChunkSize(getChunkSize());
    handle();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const qSrv = (params.get('service') as Service | null) || 'movil';
    const qPlan = params.get('plan');

    setService(qSrv);
    setIncludeDevice(true);
    (async () => {
      setLoading(true);
      try {
        const data = await getPlans(SERVICE_TO_CRM_TYPE[qSrv], 'Panda');
        setPlans(data);
        if (qPlan) {
          const found = data.find((p) => String(p.id) === qPlan);
          if (found) {
            setSelectedPlan(found);
          }
        }
        setStep('info');
      } catch {
        setError(`Estamos preparando los planes de ${SERVICE_LABEL[qSrv]?.toLowerCase() || 'telefonía móvil'}. Marca *777 para más info.`);
        setStep('info');
      } finally {
        setLoading(false);
      }
    })();
  }, [loadPlans]);

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

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setStep('checkout');
    setCheckoutError('');
  };

  const handleCustomerSubmit = (data: CustomerData) => {
    setCustomerData(data);
    if (selectedPlan) {
      setStep('checkout');
    } else {
      setStep('plans');
    }
  };

  const handleRecargaSubmit = () => {
    if (recargaPhone.length !== 10) {
      setRecargaError('El número de celular debe tener 10 dígitos.');
      return;
    }
    setRecargaError('');
    handleCustomerSubmit({
      name: 'Cliente Recarga',
      email: 'recarga@beonline.mx',
      phone: recargaPhone,
    });
  };

  const handleProceedToPayment = async () => {
    if (!selectedPlan || !customerData || !selectedGateway || !service) return;

    setCheckoutLoading(true);
    setCheckoutError('');

    try {
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
        customer_name: customerData.name || 'Cliente Recarga',
        customer_email: customerData.email || 'recarga@beonline.mx',
        customer_phone: customerData.phone,
        ...(service === 'movil' ? { sim_type: simType } : {}),
        items,
        shipping_address: customerData.shipping,
        include_device: isRecarga ? false : (service === 'movil' ? true : includeDevice),
      };

      const order = await createOrder(orderPayload);
      setOrderUuid(order.uuid);
      setPaymentLoading(true);

      if (selectedGateway === 'stripe') {
        const stripe = await ecommerceStripeInit(order.uuid);
        setStripeData({ clientSecret: stripe.paymentIntent, publishableKey: stripe.publishable_key || STRIPE_PUBLISHABLE_KEY });
      } else if (selectedGateway === 'mercadoPago') {
        const mp = await ecommerceMercadoPagoInit(order.uuid);
        const mpGw = gateways.find((g) => g.key === 'mercadoPago');
        const mpPublicKey = mp.public_key || mpGw?.publicKey || '';
        if (!mpPublicKey) throw new Error('No se encontró la llave pública de MercadoPago.');
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

  const needsShipping = isRecarga ? false : (service === 'movil' ? simType === 'sim' : includeDevice);
  const formSimType: SimType = isRecarga ? 'esim' : (service === 'movil' ? simType : includeDevice ? 'sim' : 'esim');

  useEffect(() => {
    if (step !== 'checkout') return;
    let cancelled = false;
    setGatewaysLoading(true);
    getEcommerceGateways(1)
      .then((gws) => {
        if (cancelled) return;
        setGatewaysLoading(false);
        setGateways(gws.filter((g) => g.key !== 'paypal'));
      })
      .catch(() => {
        if (cancelled) return;
        setGatewaysLoading(false);
        setGateways([]);
      });
    return () => { cancelled = true; };
  }, [step]);

  useEffect(() => {
    if (step !== 'checkout' || !service || !selectedPlan) return;

    if (service !== 'movil' && includeDevice) {
      const cat = DEVICE_CATEGORY_BY_SERVICE[service as 'hbb' | 'mifi'];
      getPublicProducts({ category: cat })
        .then((items) => setDevice(items[0] || MOCK_DEVICE_BY_CATEGORY[cat]))
        .catch(() => setDevice(MOCK_DEVICE_BY_CATEGORY[cat]));
    } else {
      setDevice(null);
    }

    if (needsShipping) {
      getPublicProducts({ sku: SHIPPING_SKU })
        .then((items) => setShipping(items[0] || MOCK_SHIPPING))
        .catch(() => setShipping(MOCK_SHIPPING));
    } else {
      setShipping(null);
    }
  }, [step, service, selectedPlan, includeDevice, simType, needsShipping]);

  const visibleTotal = useMemo(() => {
    if (!selectedPlan) return 0;
    const planTotal = Number(selectedPlan.amount || 0);

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

  const activeStepIndex = useMemo(() => {
    switch (step) {
      case 'info': return 0;
      case 'plans': return 1;
      case 'checkout': return 2;
      case 'payment': return 3;
      default: return 0;
    }
  }, [step]);

  const isInfoView = step === 'info';
  const isPlansView = step === 'plans';
  const isPaymentView = step === 'checkout' || step === 'payment';

  const staticChunkSize = useMemo(() => {
    return chunkSize === 3 ? 4 : chunkSize;
  }, [chunkSize]);

  const staticChunks = useMemo(() => {
    const arr = PLAN_DATA[activeMovilTab] || [];
    const c: any[][] = [];
    for (let i = 0; i < arr.length; i += staticChunkSize) {
      c.push(arr.slice(i, i + staticChunkSize));
    }
    return c;
  }, [activeMovilTab, staticChunkSize]);

  const staticTotalPages = staticChunks.length;

  // Manejador para los planes estáticos
  const onSelectHardcodedPlan = (hardcodedPlan: any) => {
    // Buscamos si existe en la API por nombre y precio para pasar el ID real si es posible
    const realPlan = plans.find(p => p.name.toUpperCase().includes(hardcodedPlan.name.split(' ')[1]) && Number(p.amount) === hardcodedPlan.price);

    if (realPlan) {
      handleSelectPlan(realPlan);
    } else {
      // Mock plan para que la UI fluya (usando la información dura provista)
      const mockPlan: Plan = {
        id: Math.floor(Math.random() * 10000),
        name: hardcodedPlan.name,
        amount: hardcodedPlan.price.toString(),
        group_name: activeMovilTab,
        features: [
          'Minutos y SMS ilimitados',
          'Cobertura MEX, EUA, Canadá',
          'Internet para compartir',
          'Redes sociales ilimitadas'
        ],
        badge: hardcodedPlan.gb,
        subtitle: hardcodedPlan.desc
      };
      handleSelectPlan(mockPlan);
    }
  };

  const onSelectAddon = (addon: any) => {
    const numericPrice = addon.price.replace('$', '');
    const realPlan = plans.find(p => p.name.toUpperCase().includes(`ADDON ${addon.gb}`) && Number(p.amount) === Number(numericPrice));

    if (realPlan) {
      handleSelectPlan(realPlan);
    } else {
      const mockPlan: Plan = {
        id: Math.floor(Math.random() * 10000),
        name: `ADDON ${addon.gb}`,
        amount: numericPrice,
        group_name: 'ADDON',
        features: [
          'Minutos y SMS ilimitados',
          'Cobertura MEX, EUA, Canadá',
          'Internet para compartir',
          'Redes sociales ilimitadas'
        ],
        badge: addon.gb,
        subtitle: `Paquete de datos · Validez de ${addon.days}`
      };
      handleSelectPlan(mockPlan);
    }
  };

  return (
    <div className="w-full bg-black min-h-screen font-sans overflow-hidden">

      {/* ── STEP: Plans ────────────────────────────────────── */}
      {isPlansView && (
        <div className="flex flex-col min-h-screen">

          {/* SECCIÓN SUPERIOR (DARK SLIDE HEADER) */}
          <div className="pt-12 pb-10 px-4 text-center bg-[#1a1e29]">
            {customerData && (
              <button
                onClick={() => setStep('info')}
                className="text-[#fccd4d] text-sm font-bold mb-4 hover:underline block mx-auto"
              >
                ← Regresar
              </button>
            )}
            <h1 className="text-3xl md:text-[40px] font-black text-white uppercase tracking-wide mb-2 mt-6">
              ELIGE TU PLAN
            </h1>
            <p className="text-[#fccd4d] text-lg font-bold mb-10">Tu conexión, tus reglas.</p>

            {/* Stepper (Original adaptado al header oscuro) */}
            <div className="flex items-center justify-center max-w-[400px] mx-auto relative mb-6">
              <div className="absolute top-2.5 md:top-3 left-[15%] right-[15%] h-0 border-t-[1.5px] border-dashed border-[#fccd4d] z-0"></div>
              {STEP_LABELS.map((label, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center flex-1">
                  <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center font-black text-[10px] md:text-xs mb-2 transition-colors ${activeStepIndex >= i ? 'bg-[#fccd4d] text-[#1a1e29]' : 'bg-[#1a1e29] text-[#fccd4d] border-2 border-[#fccd4d]'}`}>
                    {i === 3 ? '4' : i + 1}
                  </div>
                  <span className={`text-[9px] md:text-[10px] font-semibold text-center leading-tight ${activeStepIndex >= i ? 'text-white' : 'text-transparent'} max-w-[80px]`}>
                    {label || '\u00A0'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN INFERIOR (YELLOW SLIDE BODY) */}
          <div className="bg-[#fccd4d] py-12 px-4 flex-grow flex flex-col items-center">
            <div className="w-full max-w-[1200px]">

              {/* ADD ONS */}
              <div className="mb-14 text-center">
                <h3 className="text-[#1a1e29] font-black text-2xl uppercase tracking-widest mb-1">ADD ONS</h3>
                <p className="text-[#1a1e29] text-sm font-bold mb-8">Redes sociales incluidas, minutos y SMS ilimitados</p>
                <div className="flex flex-wrap justify-center gap-4">
                  {[
                    { gb: '2G', days: '3 días', price: '$59' },
                    { gb: '6G', days: '7 días', price: '$99' },
                    { gb: '8G', days: '20 días', price: '$199' },
                    { gb: '10G', days: '15 días', price: '$179' }
                  ].map(addon => (
                    <div key={addon.gb} className="flex flex-col items-center w-[120px]">
                      <div className="bg-[#1a1e29] text-white rounded-t-2xl px-2 py-2 font-black text-xl w-full text-center">
                        {addon.gb}
                      </div>
                      <div className="bg-white text-[#1a1e29] rounded-b-2xl px-2 py-2 text-[11px] font-bold w-full text-center shadow-lg">
                        {addon.days} | <span className="text-[13px]">{addon.price}</span>
                      </div>
                      <button
                        onClick={() => onSelectAddon(addon)}
                        className="mt-3 text-[9px] font-black uppercase text-[#1a1e29] underline underline-offset-4 hover:opacity-70"
                      >
                        LO QUIERO
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* TABS */}
              <div className="flex justify-center mb-16">
                <div className="inline-flex bg-[#1a1e29] rounded-full p-1.5 shadow-xl">
                  {MOVIL_TABS.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setActiveMovilTab(t.key)}
                      className={`px-6 md:px-10 py-2.5 rounded-full text-xs md:text-[13px] font-black transition-all uppercase ${activeMovilTab === t.key
                        ? 'bg-white text-[#1a1e29] shadow-md'
                        : 'text-white hover:text-[#fccd4d]'
                        }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* CARDS ESTÁTICAS AGRUPADAS CON SLIDER DE FLECHAS A LOS LATERALES */}
              <div className="relative w-full px-14 sm:px-16">

                {/* Flecha Izquierda */}
                {staticTotalPages > 1 && (
                  <button
                    onClick={() => goTo(pageIdx <= 0 ? staticTotalPages - 1 : pageIdx - 1)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center hover:scale-110 transition-colors z-20"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}

                {/* Contenedor de las Tarjetas */}
                <div
                  className="flex flex-wrap justify-center gap-x-8 gap-y-12 w-full transition-opacity duration-300"
                  style={{ opacity: animating ? 0 : 1 }}
                >
                  {(staticChunks[pageIdx] || []).map((plan, index) => (
                    <div key={index} className="flex flex-col  w-[220px]">

                      {/* Circle Badge (GB) */}
                      <div className="bg-white text-[#1a1e29] rounded-full w-16 h-16 flex items-center justify-center font-black text-lg z-10 -mb-8 shadow-md border-4 border-[#fccd4d]">
                        {plan.gb}
                      </div>

                      {/* Card Body */}
                      <div className="w-full rounded-[20px] shadow-2xl overflow-hidden flex flex-col h-[360px]" style={{ backgroundColor: plan.color }}>

                        {/* Cabecera Negra de la Tarjeta */}
                        <div className="bg-[#1a1e29] my-4 mr-4 text-white text-right py-2.5 pr-4 text-[11px] font-black uppercase tracking-wider pl-12 rounded-tr-[12px]">
                          {plan.name}
                        </div>

                        <div className="p-5 flex-grow flex flex-col text-white text-center">
                          <p className="font-black text-[11px] mb-4 tracking-wide text-left">{plan.desc}</p>
                          <ul className="text-[10px] font-medium space-y-1.5 mb-auto text-left leading-snug">
                            <li>• Minutos y SMS ilimitados</li>
                            <li>• Cobertura MEX, EUA, Canadá</li>
                            <li>• Internet para compartir</li>
                            <li>• Redes sociales ilimitadas</li>
                          </ul>

                          {/* Fake Social Icons */}
                          <div className="flex justify-center gap-1.5 my-5">
                            {[1, 2, 3, 4, 5].map(i => (
                              <div key={i} className="w-5 h-5 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
                                <div className="w-2.5 h-2.5 bg-white/80 rounded-full"></div>
                              </div>
                            ))}
                          </div>

                          {/* Price area */}
                          <div className="mt-auto">
                            <p className="text-[34px] font-black leading-none mb-1 shadow-black drop-shadow-md">
                              ${plan.price}
                            </p>
                            <p className="text-[11px] font-bold tracking-wide">
                              {plan.duration}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Botón Lo Quiero */}
                      <button
                        onClick={() => onSelectHardcodedPlan(plan)}
                        className="mt-6 text-[11px] font-black uppercase text-[#1a1e29] underline decoration-2 underline-offset-4 hover:scale-105 transition-transform">
                        LO QUIERO
                      </button>
                    </div>
                  ))}
                </div>

                {/* Flecha Derecha */}
                {staticTotalPages > 1 && (
                  <button
                    onClick={() => goTo(pageIdx >= staticTotalPages - 1 ? 0 : pageIdx + 1)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center hover:scale-110 transition-colors z-20"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}

              </div>

              {/* Indicadores de página (puntos abajo) */}
              {staticTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  {staticChunks.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i)}
                      className={`w-3 h-3 rounded-full transition-all ${i === pageIdx ? 'bg-[#1a1e29] scale-125' : 'bg-[#1a1e29]/30'}`}
                    />
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ── STEP: Checkout (Información) ───────────────────── */}
      {isInfoView && (
        <>
          <div className="pt-12 pb-16 px-4">
            {selectedPlan && (
              <button onClick={handleBackToPlans} className="text-[#fccd4d] text-sm font-bold mb-4 hover:underline block mx-auto">
                ← Cambiar plan
              </button>
            )}
            <h1 className="text-3xl md:text-[40px] font-black text-white text-center uppercase tracking-wide mb-16">
              {isRecarga ? 'RECARGA TU LÍNEA' : 'ACTIVA TU LÍNEA'}
            </h1>

            <div className="max-w-[850px] mx-auto bg-white rounded-[2.5rem] p-8 md:px-16 md:py-12 relative shadow-2xl">
              {/* Astronaut */}
              {!isRecarga && (
                <div className="absolute -top-28 -right-4 md:-right-10 hidden md:block w-[13rem] z-20">
                  <img
                    src={astronautaImagen.src}
                    alt="Bienvenido"
                    className="w-full drop-shadow-xl"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              )}

              {/* Stepper Light */}
              <div className="flex items-center justify-center max-w-[400px] mx-auto relative mb-12 mt-2">
                <div className="absolute top-3 md:top-3.5 left-[15%] right-[15%] h-0 border-t-[1.5px] border-dashed border-[#fccd4d] z-0"></div>
                {(isRecarga ? ['Ingresa el número', '', '', ''] : ['Agrega Información', '', '', '']).map((label, i) => (
                  <div key={i} className="relative z-10 flex flex-col items-center flex-1">
                    <div className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center font-black text-[11px] md:text-[13px] mb-2 transition-colors ${0 >= i ? 'bg-[#fccd4d] text-[#1a1e29]' : 'bg-white text-[#fccd4d] border-2 border-[#fccd4d]'}`}>
                      {i + 1}
                    </div>
                    <span className={`text-[10px] md:text-[11px] font-bold text-center leading-tight ${0 >= i ? 'text-[#1a1e29]' : 'text-transparent'} max-w-[80px]`}>
                      {label || '\u00A0'}
                    </span>
                  </div>
                ))}
              </div>

              {isRecarga ? (
                /* RECARGA FLOW: Single input */
                <div className="flex flex-col items-center max-w-sm mx-auto mb-8">
                  <label className="text-lg font-bold text-[#1a1e29] mb-4 text-center">
                    Ingresa el número de celular a recargar.
                  </label>
                  <div className="relative w-full flex items-center justify-center">
                    <input
                      type="tel"
                      maxLength={10}
                      value={recargaPhone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setRecargaPhone(val);
                      }}
                      placeholder="10 digitos"
                      className="w-full max-w-[380px] h-[48px] px-4 border border-gray-600 rounded-full text-center text-lg font-bold tracking-widest focus:outline-none focus:border-[#1a1e29] focus:ring-1 focus:ring-[#1a1e29]"
                    />
                  </div>
                  {recargaError && (
                    <p className="text-red-500 text-xs font-bold mt-2 text-center">{recargaError}</p>
                  )}
                </div>
              ) : (
                /* ACTIVA FLOW: Form + SIM info */
                <>
                  <h2 className="text-xl md:text-[22px] font-medium text-center text-[#1a1e29] mb-8">
                    Agrega tu información personal
                  </h2>

                  {service === 'movil' && (
                    <div className="mb-8 hidden">
                      <p className="font-bold text-[#1a1e29] mb-4 text-center">Selecciona tu tipo de SIM:</p>
                      <SimEsimPicker selected={simType} onChange={setSimType} />
                    </div>
                  )}

                  <CustomerForm
                    simType={formSimType}
                    onSubmit={handleCustomerSubmit}
                    loading={checkoutLoading}
                    hideMainHeader
                  />

                  {/* SECCIÓN NUEVA: Datos de la tarjeta SIM */}
                  <div className="mt-12 pt-10">
                    <h3 className="text-xl md:text-[22px] font-medium text-center text-[#1a1e29] leading-tight mb-4">
                      Si ya cuentas con tu SIM físico, solo<br className="hidden md:block" />
                      agrega los datos de la tarjeta SIM
                    </h3>
                    <p className="text-center text-[10px] md:text-[11.5px] font-medium text-[#1a1e29] mb-10 max-w-[500px] mx-auto">
                      Ingresa los últimos 7 dígitos que encontrarás al reverso de tu tarjeta SIM Be Online,
                      estos se encuentran debajo del código de barras.
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-10 md:gap-12 mb-8">

                      {/* SIM Image Placeholder */}
                      <div className="w-full max-w-[260px] flex-shrink-0">
                        <img
                          src={simImagen.src}
                          alt="Tarjeta SIM Be Online"
                          className="w-full h-auto rounded-lg shadow-sm"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        {/* Fallback visual en caso de que falte la imagen */}
                        <div className="hidden w-full h-[150px] bg-[#f8981d] rounded-xl border border-gray-200 flex flex-col items-center justify-center text-white font-bold text-sm relative overflow-hidden">
                          <div className="absolute left-4 top-4">
                            <svg className="w-10 h-10 opacity-80" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L3 20L12 16L21 20L12 2Z" /></svg>
                          </div>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-16 border-2 border-white rounded-md flex items-center justify-center">
                            <div className="w-6 h-8 border border-white grid grid-cols-2 gap-px p-0.5"><div className="bg-white"></div><div className="bg-white"></div><div className="bg-white"></div><div className="bg-white"></div></div>
                          </div>
                        </div>
                      </div>

                      {/* ICCID Inputs */}
                      <div className="flex flex-col sm:flex-row gap-6 lg:gap-10">
                        {/* ICCID */}
                        <div className="flex flex-col items-center">
                          <label className="text-[10px] md:text-[11px] font-bold text-[#1a1e29] mb-2 tracking-wide">
                            ICCID<span className="text-red-500">*</span>
                          </label>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] md:text-[12px] text-[#1a1e29] font-medium tracking-wide">
                              895214006193
                            </span>
                            <input
                              type="text"
                              className="w-[90px] h-[34px] px-3 border border-gray-500 rounded-[20px] text-sm text-center font-bold focus:outline-none focus:ring-1 focus:ring-[#1a1e29]"
                              maxLength={7}
                            />
                            <span className="text-[12px] md:text-[13px] font-bold text-[#1a1e29]">
                              F
                            </span>
                          </div>
                        </div>

                        {/* Confirmar ICCID */}
                        <div className="flex flex-col items-center">
                          <label className="text-[10px] md:text-[11px] font-bold text-[#1a1e29] mb-2 tracking-wide">
                            Confirmar ICCID<span className="text-red-500">*</span>
                          </label>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] md:text-[12px] text-[#1a1e29] font-medium tracking-wide">
                              895214006193
                            </span>
                            <input
                              type="text"
                              className="w-[90px] h-[34px] px-3 border border-gray-500 rounded-[20px] text-sm text-center font-bold focus:outline-none focus:ring-1 focus:ring-[#1a1e29]"
                              maxLength={7}
                            />
                            <span className="text-[12px] md:text-[13px] font-bold text-[#1a1e29]">
                              F
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Checkboxes de Términos */}
                    <div className="flex flex-col gap-3 mt-10 md:ml-12 lg:ml-20">
                      <div className="flex items-center justify-start gap-2">
                        <span className="text-[10px] md:text-[11px] font-bold text-[#1a1e29]">
                          Datos protegidos por la Ley (LFPDP) y por el Aviso de Privacidad
                        </span>
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 border-gray-600 rounded-sm text-[#1a1e29] focus:ring-transparent cursor-pointer"
                        />
                        <span className="text-red-600 text-sm font-bold">*</span>
                      </div>
                      <div className="flex items-center justify-start gap-2">
                        <span className="text-[10px] md:text-[11px] font-bold text-[#1a1e29]">
                          He leído y acepto los términos y condiciones
                        </span>
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 border-gray-600 rounded-sm text-[#1a1e29] focus:ring-transparent cursor-pointer"
                        />
                        <span className="text-red-600 text-sm font-bold">*</span>
                      </div>
                    </div>

                  </div>
                </>
              )}

              {/* Botón Siguiente */}
              <div className="mt-12 text-center">
                {isRecarga ? (
                  <button
                    type="button"
                    onClick={handleRecargaSubmit}
                    className="bg-[#fccd4d] text-[#1a1e29] font-bold text-[15px] px-14 py-3 rounded-full hover:scale-105 transition-transform shadow-md"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => document.getElementById('customer-form-submit')?.click()}
                    className="bg-[#fccd4d] text-[#1a1e29] font-bold text-[15px] px-14 py-3 rounded-full hover:scale-105 transition-transform shadow-md"
                  >
                    Siguiente
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── STEP: Payment (Método de Pago) ─────────────────── */}
      {isPaymentView && (
        <div className="pt-12 pb-16 px-4">
          <h1 className="text-3xl md:text-4xl font-black text-white text-center uppercase tracking-wide mb-10">
            ELIGE TU MÉTODO DE PAGO
          </h1>
          <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl">

            {/* Stepper Light */}
            <div className="flex items-center justify-center max-w-[400px] mx-auto relative mb-8 mt-2">
              <div className="absolute top-2.5 md:top-3 left-[15%] right-[15%] h-0 border-t-[1.5px] border-dashed border-[#fccd4d] z-0"></div>
              {STEP_LABELS.map((label, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center flex-1">
                  <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center font-black text-[10px] md:text-xs mb-2 transition-colors ${activeStepIndex >= i ? 'bg-[#fccd4d] text-[#1a1e29]' : 'bg-white text-[#fccd4d] border-2 border-[#fccd4d]'}`}>
                    {i === 3 ? '4' : i + 1}
                  </div>
                  <span className={`text-[9px] md:text-[10px] font-semibold text-center leading-tight ${activeStepIndex >= i ? 'text-[#1a1e29]' : 'text-gray-400'} max-w-[80px]`}>
                    {label || '\u00A0'}
                  </span>
                </div>
              ))}
            </div>

            <h2 className="text-lg md:text-xl font-bold text-center text-[#1a1e29] mb-10">Elige la opción que más te convenga.</h2>

            <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-10 lg:gap-16">

              {/* Left Column: Gateways / SDK */}
              <div className="flex-1 w-full max-w-sm">
                {step === 'checkout' ? (
                  <>
                    <GatewaySelector
                      gateways={gateways}
                      selected={selectedGateway}
                      onSelect={setSelectedGateway}
                      isLoading={gatewaysLoading}
                    />
                    {checkoutError && (
                      <p className="text-red-600 text-sm font-bold mt-4 text-center">{checkoutError}</p>
                    )}
                    <div className="mt-8 text-center">
                      <button
                        onClick={handleProceedToPayment}
                        disabled={checkoutLoading || !selectedGateway}
                        className="bg-[#fccd4d] text-[#1a1e29] font-bold text-[15px] px-12 py-3.5 rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                      >
                        {checkoutLoading ? 'Procesando...' : 'Pagar'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    {paymentLoading ? (
                      <Spinner />
                    ) : (
                      <Suspense fallback={<Spinner />}>
                        {selectedGateway === 'stripe' && stripeData && (
                          <StripeInline
                            clientSecret={stripeData.clientSecret}
                            publishableKey={stripeData.publishableKey}
                            returnUrl={`${window.location.origin}/pago-exitoso?order=${orderUuid}`}
                            amount={visibleTotal}
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
                        className="w-full text-center text-sm font-bold text-gray-400 hover:text-[#1a1e29] transition-colors"
                      >
                        ← Cambiar método de pago
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Plan Summary Card */}
              <div className="w-full max-w-[260px] flex-shrink-0">
                {selectedPlan && (
                  <div className="relative w-full rounded-[20px] shadow-2xl flex flex-col" style={{ backgroundColor: '#f05244', color: 'white' }}>

                    {/* Badge */}
                    <div className="absolute -top-5 -left-5 w-16 h-16 bg-[#fccd4d] rounded-full flex items-center justify-center text-[#1a1e29] font-black text-xl shadow-md z-10 tracking-tighter border-4 border-white">
                      {selectedPlan.badge || 'GB'}
                    </div>

                    {/* Header */}
                    <div className="rounded-t-[20px] py-2.5 pl-12 pr-4 text-right font-black text-sm tracking-wide uppercase bg-[#1a1e29]">
                      {selectedPlan.name}
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-grow flex flex-col text-center">
                      <p className="font-bold text-[12px] mb-4 tracking-wide">
                        {selectedPlan.subtitle || 'Conexión 4.5G LTE'}
                      </p>

                      <ul className="text-[10px] font-medium space-y-1.5 mb-5 text-left leading-snug">
                        {selectedPlan.features && selectedPlan.features.length > 0 ? (
                          selectedPlan.features.map((f, i) => <li key={i}>{f}</li>)
                        ) : (
                          <>
                            <li>• Minutos y SMS ilimitados</li>
                            <li>• Cobertura MEX, EUA, Canadá</li>
                            <li>• Internet para compartir</li>
                            <li>• Redes sociales ilimitadas</li>
                          </>
                        )}
                      </ul>

                      {/* Social Icons Placeholder */}
                      <div className="flex justify-center gap-1.5 mb-6">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="w-5 h-5 rounded-full bg-[#1a1e29]/40 border border-white/20 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 bg-white/70 rounded-full"></div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-auto">
                        <p className="text-[32px] font-black underline decoration-2 underline-offset-4 leading-none mb-1">
                          ${visibleTotal.toFixed(0)}
                        </p>
                        <p className="text-[12px] font-bold">
                          {getPlanDuration(selectedPlan)}
                        </p>
                      </div>
                    </div>

                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}