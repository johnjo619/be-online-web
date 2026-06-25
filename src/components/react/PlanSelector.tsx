import { useState } from 'react';
import PlanActionModal from './PlanActionModal';
import NetworkIcon from './NetworkIcon';
import sim1 from "@/assets/images/sim1.png";
import sim2 from "@/assets/images/sim2.png";
import movies from "@/assets/images/popcorn.png";


// ── Datos Estáticos Basados en la Imagen ─────────────────
const plansData = [
  {
    id: 'explorer',
    badge: '2 GB',
    headerColor: '#fecc54',
    iconColor: 'black',
    bodyColor: '#1f2937', // Oscuro
    name: 'BO EXPLORER',
    subtitle: '2G de 4.5G LTE',
    features: [
      '• Minutos y SMS ilimitados',
      '• Cobertura MEX, EUA, Canadá',
      '• Internet para compartir',
      '• Redes sociales ilimitadas'
    ],
    socialNetworks: ['whatsapp', 'facebook', 'instagram', 'x', 'snapchat'],
    prices: [
      { label: '30 días', price: '$149' },
    ]
  },
  {
    id: 'mercury',
    badge: '4 GB',
    headerColor: '#1a1e29',
    iconColor: 'white',
    bodyColor: '#f15623', // Rojo/Naranja
    name: 'BO MERCURY',
    subtitle: '12G de 4.5G LTE',
    features: [
      '• Minutos y SMS ilimitados',
      '• Cobertura MEX, EUA, Canadá',
      '• Internet para compartir',
      '• Redes sociales ilimitadas'
    ],
    socialNetworks: ['whatsapp', 'facebook', 'instagram', 'x', 'snapchat', 'movies'],
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
    iconColor: 'white',
    bodyColor: '#49a59a', // Teal/Verde
    name: 'BO APOLO',
    subtitle: '12G de 4.5G LTE DATA',
    features: [
      '• Minutos y SMS ilimitados',
      '• Cobertura MEX, EUA, Canadá',
      '• Internet para compartir',
      '• Redes sociales ilimitadas'
    ],
    socialNetworks: ['whatsapp', 'facebook', 'instagram', 'x', 'snapchat', 'movies'],
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
    iconColor: 'white',
    bodyColor: '#528bbd', // Azul
    name: 'BO ASTEROID',
    subtitle: '24G de 4.5G LTE DATA',
    features: [
      '• Minutos y SMS ilimitados',
      '• Cobertura MEX, EUA, Canadá',
      '• Internet para compartir',
      '• Redes sociales ilimitadas'
    ],
    socialNetworks: ['whatsapp', 'facebook', 'instagram', 'x', 'snapchat'],
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
    iconColor: 'white',
    bodyColor: '#7272bc', // Morado
    name: 'BO SUPERNOVA',
    subtitle: '35G de 4.5G LTE',
    features: [
      '• Minutos y SMS ilimitados',
      '• Cobertura MEX, EUA, Canadá',
      '• Internet para compartir',
      '• Redes sociales ilimitadas'
    ],
    socialNetworks: ['whatsapp', 'facebook', 'instagram', 'x', 'snapchat'],
    prices: [
      { label: '30 días', price: '$419' }
    ]
  },
  {
    id: 'cosmos',
    badge: '50GB',
    headerColor: '#1a1e29',
    iconColor: 'white',
    bodyColor: '#ce6bac', // Rosa
    name: 'BO COSMOS',
    subtitle: '50G de 4.5G LTE DATA',
    features: [
      '• Minutos y SMS ilimitados',
      '• Cobertura MEX, EUA, Canadá',
      '• Internet para compartir',
      '• Redes sociales ilimitadas'
    ],
    socialNetworks: ['whatsapp', 'facebook', 'instagram', 'x', 'snapchat'],
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
    <section id="planes" className="py-12 md:py-16 px-4 bg-[#ffcd54] min-h-screen font-sans">
      <div className="max-w-[1000px] mx-auto">

        {/* Header y Selector de SIM */}
        {!hideSimSelector && (
          <div className="text-center mb-16 text-[#1a1e29]">
            <h2 className="text-lg md:text-xl mb-6">
              Todos nuestros planes están disponibles en eSIM o SIM física. Tú decides.
            </h2>
            <p className="text-lg md:text-xl mb-10">
              Elige el SIM que te convenga mas.
            </p>

            <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16 max-w-2xl mx-auto">
              {/* Opción eSIM */}
              <div
                className="flex items-center gap-4 cursor-pointer flex-1"
                onClick={() => setSimType('esim')}
              >
                <img src={sim1.src} alt="QR" className="w-20 mb-4 object-contain" />
                <div className="text-left pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-5 h-5 rounded-full border-2 border-white shadow-[0_0_0_1px_#1a1e29] flex items-center justify-center ${simType === 'esim' ? 'bg-[#1a1e29]' : 'bg-white'}`}>
                      {simType === 'esim' && <div className="w-2 h-2 rounded-full bg-[#fccd4d]"></div>}
                    </div>
                    <span className="font-bold text-md">eSIM digital</span>
                  </div>
                  <p className="text-md font-medium leading-snug">
                    Recibirás un QR por correo electrónico, lo escaneas desde tu celular y se activa al momento.
                  </p>
                </div>
              </div>

              {/* Opción SIM Física */}
              <div
                className="flex items-center gap-4 cursor-pointer flex-1"
                onClick={() => setSimType('fisica')}
              >
                <img src={sim2.src} alt="SIM" className="w-20 mb-4 object-contain" />
                <div className="text-left pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-5 h-5 rounded-full border-2 border-white shadow-[0_0_0_1px_#1a1e29] flex items-center justify-center ${simType === 'fisica' ? 'bg-[#1a1e29]' : 'bg-white'}`}>
                      {simType === 'fisica' && <div className="w-2 h-2 rounded-full bg-[#fccd4d]"></div>}
                    </div>
                    <span className="font-bold text-md">SIM física</span>
                  </div>
                  <p className="text-md font-medium leading-snug">
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
              <div className="absolute -top-4 -left-6 w-24 h-24 bg-white rounded-full flex items-center justify-center text-[#1a1e29] font-black text-2xl shadow-md z-10 tracking-tighter">
                {plan.badge}
              </div>

              {/* Nombre del Plan (Header) */}
              <div className="rounded-t-2xl my-2 mr-4 py-3 pl-12 pr-4 text-right font-semibold text-lg tracking-wide uppercase" style={{ backgroundColor: plan.headerColor }}>
                {plan.name}
              </div>

              {/* Contenido del Plan */}
              <div className="p-6 flex-grow flex flex-col">
                <p className="font-bold text-sm text-left mb-4 tracking-wider">
                  {plan.subtitle}
                </p>

                <ul className="text-xs  space-y-1.5 mb-2  leading-tight">
                  {plan.features.map((feature, i) => (
                    <li key={i}>{feature}</li>
                  ))}
                </ul>

                {/* Íconos de Redes Sociales */}
                <div className="flex justify-center items-center gap-1.5 mb-2 flex-wrap">
                  {plan.socialNetworks?.map((network) =>
                    network === 'movies' ? (
                      <img key={network} src={movies.src} alt="Movies" className="w-12 relative -top-2 flex" />
                    ) : (
                      <div
                        key={network}
                        className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-cente flex items-center justify-center"
                        style={{ backgroundColor: plan.headerColor, color: plan.iconColor }}
                      >
                        <NetworkIcon network={network} className="w-3.5 h-3.5" />
                      </div>
                    )
                  )}
                </div>

                {/* Precios (Clicleables) */}
                <div className="relative flex-grow flex flex-col justify-center items-center gap-3 ">
                  {/* LÍNEA CONTINUA VERTICAL */}
                  <div className={`absolute left-1/2 w-0.5 bg-yellow-400 -translate-x-1/2 ${plan.prices.length === 1 ? 'h-5 top-1/2 -translate-y-1/2' : 'top-0 bottom-0'}`}></div>

                  {plan.prices.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setModalPlan({ ...plan, selectedDuration: item.label, selectedPrice: item.price })}
                      // w-full asegura que el botón ocupe el ancho y se divida exacto a la mitad
                      className="relative z-10 w-full flex justify-center items-center text-md font-bold cursor-pointer hover:scale-105 transition-transform group"
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
            <p className="text-base md:text-2xl text-[#1a1e29] font-medium mb-10">
              No te preocupes, sólo tienes que contratar nuestros ADD ONS
            </p>

            <div className="flex flex-wrap justify-center gap-6">
              {[
                { gb: '2G', days: '3 días', price: '$59' },
                { gb: '6G', days: '7 días', price: '$99' },
                { gb: '8G', days: '20 días', price: '$199' },
                { gb: '10G', days: '15 días', price: '$179' },
              ].map((addon, index) => (
                <div key={index} className="flex flex-col w-[180px] rounded-[2rem] overflow-hidden shadow-lg border-2 border-transparent transition-transform hover:scale-105 cursor-pointer" onClick={() => setModalPlan({ id: `addon-${addon.gb}`, name: `ADD ON ${addon.gb}`, selectedPrice: addon.price, selectedDuration: addon.days })}>
                  <div className="bg-[#1a1e29] text-white w-full text-center py-1 text-xl font-black tracking-widest">
                    {addon.gb}
                  </div>
                  <div className="bg-white w-full text-center py-2 text-lg text-[#1a1e29] ">
                    {addon.days} <span className="mx-1 text-gray-300">|</span> <span className="underline decoration-2 underline-offset-2 font-bold">{addon.price}</span>
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