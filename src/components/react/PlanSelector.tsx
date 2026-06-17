import { useState } from 'react';
import PlanActionModal from './PlanActionModal';
import NetworkIcon from './NetworkIcon';

// ── Datos Estáticos Basados en la Imagen ─────────────────
const plansData = [
  {
    id: 'explorer',
    badge: '2 GB',
    headerColor: '#1a1e29',
    bodyColor: '#1f2937', // Oscuro
    name: 'BO EXPLORER',
    subtitle: '2G de 4.5G LTE',
    features: [
      '• Minutos y SMS ilimitados',
      '• Cobertura MEX, EUA, Canadá',
      '• Internet para compartir',
      '• Redes sociales ilimitadas'
    ],
    socialNetworks: ['whatsapp', 'facebook', 'instagram', 'x', 'messenger'],
    prices: [
      { label: '30 días', price: '$209' },
      { label: '3 meses', price: '$599' },
      { label: '6 meses', price: '$1,169' },
      { label: '12 meses', price: '$2,199' }
    ]
  },
  {
    id: 'mercury',
    badge: '4 GB',
    headerColor: '#1a1e29',
    bodyColor: '#f05244', // Rojo/Naranja
    name: 'BO MERCURY',
    subtitle: '12G de 4.5G LTE',
    features: [
      '• Minutos y SMS ilimitados',
      '• Cobertura MEX, EUA, Canadá',
      '• Internet para compartir',
      '• Redes sociales ilimitadas'
    ],
    socialNetworks: ['whatsapp', 'facebook', 'instagram', 'x', 'messenger', 'tiktok'],
    prices: [
      { label: '30 días', price: '$209' },
      { label: '3 meses', price: '$599' },
      { label: '6 meses', price: '$1,169' },
      { label: '12 meses', price: '$2,199' }
    ]
  },
  {
    id: 'apolo',
    badge: '12GB',
    headerColor: '#1a1e29',
    bodyColor: '#43b5a0', // Teal/Verde
    name: 'BO APOLO',
    subtitle: '12G de 4.5G LTE DATA',
    features: [
      '• Minutos y SMS ilimitados',
      '• Cobertura MEX, EUA, Canadá',
      '• Internet para compartir',
      '• Redes sociales ilimitadas'
    ],
    socialNetworks: ['whatsapp', 'facebook', 'instagram', 'x', 'messenger', 'tiktok', 'telegram'],
    prices: [
      { label: '30 días', price: '$259' },
      { label: '3 meses', price: '$749' },
      { label: '6 meses', price: '$1,499' },
      { label: '12 meses', price: '$2,759' }
    ]
  },
  {
    id: 'asteroid',
    badge: '24GB',
    headerColor: '#1a1e29',
    bodyColor: '#3996db', // Azul
    name: 'BO ASTEROID',
    subtitle: '24G de 4.5G LTE DATA',
    features: [
      '• Minutos y SMS ilimitados',
      '• Cobertura MEX, EUA, Canadá',
      '• Internet para compartir',
      '• Redes sociales ilimitadas'
    ],
    socialNetworks: ['whatsapp', 'facebook', 'instagram', 'x', 'messenger', 'tiktok', 'telegram', 'youtube'],
    prices: [
      { label: '30 días', price: '$329' },
      { label: '3 meses', price: '$969' },
      { label: '6 meses', price: '$1,939' },
      { label: '12 meses', price: '$3,599' }
    ]
  },
  {
    id: 'supernova',
    badge: '35GB',
    headerColor: '#1a1e29',
    bodyColor: '#6f62cc', // Morado
    name: 'BO SUPERNOVA',
    subtitle: '35G de 4.5G LTE',
    features: [
      '• Minutos y SMS ilimitados',
      '• Cobertura MEX, EUA, Canadá',
      '• Internet para compartir',
      '• Redes sociales ilimitadas'
    ],
    socialNetworks: ['whatsapp', 'facebook', 'instagram', 'x', 'messenger', 'tiktok', 'telegram', 'youtube', 'snapchat'],
    prices: [
      { label: '30 días', price: '$419' }
    ]
  },
  {
    id: 'cosmos',
    badge: '50GB',
    headerColor: '#1a1e29',
    bodyColor: '#df56b9', // Rosa
    name: 'BO COSMOS',
    subtitle: '50G de 4.5G LTE DATA',
    features: [
      '• Minutos y SMS ilimitados',
      '• Cobertura MEX, EUA, Canadá',
      '• Internet para compartir',
      '• Redes sociales ilimitadas'
    ],
    socialNetworks: ['whatsapp', 'facebook', 'instagram', 'x', 'messenger', 'tiktok', 'telegram', 'youtube', 'snapchat'],
    prices: [
      { label: '30 días', price: '$669' }
    ]
  }
];

interface PlanSelectorProps {
  hideSimSelector?: boolean;
}

// ── Main Component ─────────────────────────────────────
export default function PlanSelector({ hideSimSelector = false }: PlanSelectorProps) {
  const [simType, setSimType] = useState<'esim' | 'fisica'>('esim');
  const [modalPlan, setModalPlan] = useState<any | null>(null);

  return (
    <section id="planes" className="py-12 md:py-16 px-4 bg-[#fccd4d] min-h-screen font-sans">
      <div className="max-w-[1000px] mx-auto">

        {/* Header y Selector de SIM */}
        {!hideSimSelector && (
          <div className="text-center mb-16 text-[#1a1e29]">
            <h2 className="text-xl md:text-2xl font-bold mb-6">
              Todos nuestros planes están disponibles en eSIM o SIM física. Tú decides.
            </h2>
            <p className="text-lg font-medium mb-10">
              Elige el SIM que te convenga mas.
            </p>

            <div className="flex flex-col md:flex-row justify-center items-start gap-8 md:gap-16 max-w-2xl mx-auto">
              {/* Opción eSIM */}
              <div
                className="flex items-start gap-4 cursor-pointer flex-1"
                onClick={() => setSimType('esim')}
              >
                <div className="w-20 h-36 bg-white rounded-2xl border-[3px] border-[#1a1e29] flex flex-col items-center justify-center p-2 relative flex-shrink-0">
                  <div className="w-2 h-0.5 bg-[#1a1e29] rounded-full absolute top-2"></div>
                  {/* Reemplaza con la ruta de tu imagen QR real */}
                  <img src="/qr-placeholder.png" alt="QR" className="w-12 h-12 mb-4 object-contain" onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }} />
                  <div className="w-12 h-12 border-2 border-dashed border-[#1a1e29] hidden mb-4"></div>
                  <div className="w-8 h-8 rounded-full border-2 border-[#1a1e29] flex items-center justify-center absolute bottom-2 -right-2 bg-white">
                    <div className="w-4 h-4 bg-[#1a1e29] rounded-sm transform rotate-45"></div>
                  </div>
                </div>
                <div className="text-left pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-5 h-5 rounded-full border-2 border-white shadow-[0_0_0_1px_#1a1e29] flex items-center justify-center ${simType === 'esim' ? 'bg-[#1a1e29]' : 'bg-white'}`}>
                      {simType === 'esim' && <div className="w-2 h-2 rounded-full bg-[#fccd4d]"></div>}
                    </div>
                    <span className="font-bold text-sm">eSIM digital</span>
                  </div>
                  <p className="text-xs font-medium leading-snug">
                    Recibirás un QR por correo electrónico, lo escaneas desde tu celular y se activa al momento.
                  </p>
                </div>
              </div>

              {/* Opción SIM Física */}
              <div
                className="flex items-start gap-4 cursor-pointer flex-1"
                onClick={() => setSimType('fisica')}
              >
                <div className="w-20 h-28 bg-[#e8e8e8] rounded-xl border-[3px] border-[#e8e8e8] flex flex-col items-center justify-center relative flex-shrink-0 rounded-tr-[2rem] overflow-hidden shadow-inner">
                  <div className="w-10 h-12 bg-[#d1d1d1] rounded-md border border-gray-300 flex items-center justify-center">
                    <div className="w-6 h-8 bg-[#b8b8b8] grid grid-cols-2 gap-px p-[1px]">
                      <div className="bg-[#d1d1d1]"></div><div className="bg-[#d1d1d1]"></div>
                      <div className="bg-[#d1d1d1]"></div><div className="bg-[#d1d1d1]"></div>
                      <div className="bg-[#d1d1d1]"></div><div className="bg-[#d1d1d1]"></div>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full border-2 border-[#1a1e29] flex items-center justify-center absolute -top-2 -left-2 bg-white scale-75">
                    <div className="w-3 h-4 bg-[#1a1e29] rounded-sm"></div>
                  </div>
                </div>
                <div className="text-left pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-5 h-5 rounded-full border-2 border-white shadow-[0_0_0_1px_#1a1e29] flex items-center justify-center ${simType === 'fisica' ? 'bg-[#1a1e29]' : 'bg-white'}`}>
                      {simType === 'fisica' && <div className="w-2 h-2 rounded-full bg-[#fccd4d]"></div>}
                    </div>
                    <span className="font-bold text-sm">SIM física</span>
                  </div>
                  <p className="text-xs font-medium leading-snug">
                    Recibes tu SIM a domicilio y lo insertas en tu celular. Compatible con cualquier celular.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cuadrícula de Planes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-16 justify-items-center mb-16 pt-6">
          {plansData.map((plan) => (
            <div key={plan.id} className="relative w-full max-w-[280px] rounded-2xl shadow-xl flex flex-col" style={{ backgroundColor: plan.bodyColor, color: 'white' }}>

              {/* Badge Circular (eEj. 2 GB) */}
              <div className="absolute -top-6 -left-6 w-20 h-20 bg-white rounded-full flex items-center justify-center text-[#1a1e29] font-black text-2xl shadow-md z-10 tracking-tighter">
                {plan.badge}
              </div>

              {/* Nombre del Plan (Header) */}
              <div className="rounded-t-2xl my-4 mr-4 py-3 pl-12 pr-4 text-right font-black text-lg tracking-wide uppercase" style={{ backgroundColor: plan.headerColor }}>
                {plan.name}
              </div>

              {/* Contenido del Plan */}
              <div className="p-6 flex-grow flex flex-col">
                <p className="font-bold text-[13px] text-left mb-4 tracking-wider">
                  {plan.subtitle}
                </p>

                <ul className="text-[11px] font-medium space-y-1.5 mb-6  leading-tight">
                  {plan.features.map((feature, i) => (
                    <li key={i}>{feature}</li>
                  ))}
                </ul>

                {/* Íconos de Redes Sociales */}
                <div className="flex justify-center gap-1.5 mb-6 flex-wrap">
                  {plan.socialNetworks?.map((network) => (
                    <div key={network} className="w-6 h-6 rounded-full bg-black border border-white/20 flex items-center justify-center">
                      <NetworkIcon network={network} className="w-3.5 h-3.5 text-white" />
                    </div>
                  ))}
                </div>

                {/* Precios (Clicleables) */}
                <div className="relative flex-grow flex flex-col justify-center items-center gap-3 py-2">
                  {/* LÍNEA CONTINUA VERTICAL */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-yellow-400 -translate-x-1/2"></div>

                  {plan.prices.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setModalPlan({ ...plan, selectedDuration: item.label, selectedPrice: item.price })}
                      // w-full asegura que el botón ocupe el ancho y se divida exacto a la mitad
                      className="relative z-10 w-full flex justify-center items-center text-[15px] font-bold cursor-pointer hover:scale-105 transition-transform group"
                    >
                      {/* flex-1 empuja el texto contra la línea central, usando pr-4 y pl-4 para el espacio */}
                      <span className="flex-1 text-right group-hover:text-white/80 pr-4">{item.label}</span>
                      <span className="flex-1 text-left underline decoration-2 underline-offset-4 group-hover:text-white/80 pl-4">{item.price}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sección ADD ONS */}
        {!hideSimSelector && (
          <div className="text-center mt-24 mb-8">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1a1e29] mb-3">
              ¿Te quedaste sin datos?
            </h2>
            <p className="text-base md:text-lg text-[#1a1e29] font-medium mb-10">
              No te preocupes, sólo tienes que contratar nuestros ADD ONS
            </p>

            <div className="flex flex-wrap justify-center gap-6">
              {[
                { gb: '2G', days: '3 días', price: '$59' },
                { gb: '6G', days: '7 días', price: '$99' },
                { gb: '8G', days: '20 días', price: '$199' },
                { gb: '10G', days: '15 días', price: '$179' },
              ].map((addon, index) => (
                <div key={index} className="flex flex-col w-[130px] rounded-[2rem] overflow-hidden shadow-lg border-2 border-transparent transition-transform hover:scale-105 cursor-pointer" onClick={() => setModalPlan({ id: `addon-${addon.gb}`, name: `ADD ON ${addon.gb}`, selectedPrice: addon.price, selectedDuration: addon.days })}>
                  <div className="bg-[#1a1e29] text-white w-full text-center py-4 text-xl font-black tracking-widest">
                    {addon.gb}
                  </div>
                  <div className="bg-white w-full text-center py-3 text-[13px] text-[#1a1e29] font-bold">
                    {addon.days} <span className="mx-1 text-gray-300">|</span> <span className="underline decoration-2 underline-offset-2">{addon.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {modalPlan && (
        <PlanActionModal
          open={modalPlan !== null}
          plan={modalPlan}
          service="movil"
          onClose={() => setModalPlan(null)}
        />
      )}
    </section>
  );
}