import { useEffect, useMemo, useState } from 'react';
import PlanActionModal from './PlanActionModal';
import NetworkIcon from './NetworkIcon';
import { getPlans } from '../../lib/api';
import { getActiveSocialNetworks, esSoloDatos } from './planHelpers';
import type { Plan } from '../../lib/types';
import sim1 from "@/assets/images/sim1.png";
import sim2 from "@/assets/images/sim2.png";
import movies from "@/assets/images/popcorn.png";


// ── Datos Estáticos Basados en la Imagen ─────────────────
/**
 * Color por NOMBRE de plan, no por posicion.
 *
 * Antes se asignaba por indice y bastaba que el CRM agregara o quitara un tier
 * para que cada plan cambiara de color. La referencia de marca fija el color de
 * cada plan, asi que se mapea por nombre y el indice queda solo de respaldo
 * para planes que no esten en la lista.
 */
const COLOR_POR_PLAN: Record<string, string> = {
  'BO EXPLORER': '#142035',
  'BO MERCURY': '#EF4B23',
  'BO APOLO': '#00A799',
  'BO ASTEROID': '#468BBC',
  'BO SUPERNOVA': '#7473C0',
  'BO COSMOS': '#E96BB0',
};

/** Respaldo cuando el plan no esta en el mapa de marca. */
const RESPALDO = ['#142035', '#EF4B23', '#00A799', '#468BBC', '#7473C0', '#E96BB0'];

function colorDePlan(nombre: string, i: number): string {
  const clave = Object.keys(COLOR_POR_PLAN).find((k) =>
    nombre.toUpperCase().includes(k),
  );
  return clave ? COLOR_POR_PLAN[clave] : RESPALDO[i % RESPALDO.length];
}

/**
 * Los bullets salen del plan, no de una constante: el CRM marca por oferta si
 * incluye redes sociales (los MiFi, por ejemplo, no las traen) y la tarjeta
 * decia "Redes sociales ilimitadas" en todas.
 *
 * El bullet de minutos y SMS no se aclara, se OMITE: un MiFi es un modem sin
 * marcador ni bandeja de mensajes, asi que la linea no tiene nada que decir
 * ahi. Ante segmento desconocido se pinta (fail-safe de `esSoloDatos`).
 */
function featuresDe(redes: string[], soloDatos: boolean): string[] {
  return [
    ...(soloDatos ? [] : ['• Minutos y SMS ilimitados']),
    '• Cobertura MEX, EUA, Canadá',
    '• Internet para compartir',
    redes.length > 0 ? '• Redes sociales ilimitadas' : '• Plan sin redes sociales',
  ];
}

const money = (n: number) => '$' + Number(n).toLocaleString('es-MX');

/** "4GB BO EXPLORER" -> "BO EXPLORER". Si no queda nada, deja el original. */
function soloNombre(nombre: string, gb: number): string {
  return nombre.replace(new RegExp(`\\b${gb}\\s*GB\\b`, 'i'), '').trim() || nombre;
}

/** Etiqueta de duracion a partir de interval/interval_count del CRM. */
function duracion(p: Plan): string {
  const n = Number(p.interval_count) || 1;
  if (p.interval === 'month') return n === 1 ? '1 mes' : `${n} meses`;
  if (p.interval === 'year') return n === 1 ? '1 año' : `${n} años`;
  return `${n} días`;
}

/**
 * Arma las tarjetas desde el catalogo real del CRM.
 *
 * Se agrupa por `data_national_limit` (los GB) y NO por el nombre: en el CRM
 * hay ofertas como "BO ASTEROID" que no llevan los GB en el texto, y parsear
 * el nombre las dejaba fuera. El nombre de la tarjeta sale de la oferta
 * mensual de ese mismo tier.
 */
function construirTarjetas(ofertas: Plan[], tipo: string) {
  const porGb = new Map<number, Plan[]>();
  for (const o of ofertas) {
    const gb = Number(o.data_national_limit);
    if (!gb) continue;
    const esMensual = o.interval === 'day' && Number(o.interval_count) === 30;
    const esLargo = o.interval === 'month' || o.interval === 'year';
    if (!esMensual && !esLargo) continue; // los Exprés van en la seccion de add-ons
    if (!porGb.has(gb)) porGb.set(gb, []);
    porGb.get(gb)!.push(o);
  }

  return [...porGb.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([gb, lista], i) => {
      const mensual = lista.find((o) => o.interval === 'day');
      const base = mensual || lista[0];
      const largos = lista
        .filter((o) => o !== mensual)
        .sort((a, b) => (Number(a.amount) || 0) - (Number(b.amount) || 0));
      const nombre = soloNombre(base.display_name || base.name || '', gb);
      const cuerpo = colorDePlan(nombre, i);
      return {
        id: String(base.id),
        badge: `${gb}GB`,
        headerColor: cuerpo === '#142035' ? '#FFCD54' : '#142035',
        iconColor: cuerpo === '#142035' ? '#142035' : 'white',
        bodyColor: cuerpo,
        name: nombre,
        subtitle: `${gb}GB de 4.5G LTE`,
        // Se pregunta con OR a la oferta y al `tipo` de la pagina: el catalogo
        // ya emite type/service_category, pero el `tipo` es la llave con la que
        // se pidio ese catalogo, asi que sirve de segunda senal explicita.
        features: featuresDe(
          getActiveSocialNetworks(base),
          esSoloDatos(base) || esSoloDatos({ type: tipo }),
        ),
        socialNetworks: getActiveSocialNetworks(base),
        prices: [
          ...(mensual ? [{ label: duracion(mensual), price: money(Number(mensual.amount) || 0) }] : []),
          ...largos.map((o) => ({ label: duracion(o), price: money(Number(o.amount) || 0) })),
        ],
      };
    });
}

/** Add-ons: las ofertas Exprés (vigencia menor a 30 dias). */
function construirAddons(ofertas: Plan[]) {
  return ofertas
    .filter((o) => o.interval === 'day' && Number(o.interval_count) < 30 && Number(o.data_national_limit))
    .sort((a, b) => (Number(a.data_national_limit) || 0) - (Number(b.data_national_limit) || 0))
    .map((o) => ({
      gb: `${Number(o.data_national_limit)}G`,
      days: `${Number(o.interval_count)} días`,
      price: money(Number(o.amount) || 0),
    }));
}

interface PlanSelectorProps {
  hideSimSelector?: boolean;
  /** Tipo del CRM a pintar: 'Movilidad' (default) o 'MiFi'. */
  tipo?: string;
  /** Oculta la seccion de add-ons Expres (solo aplica a Movilidad). */
  hideAddons?: boolean;
}

// ── Main Component ─────────────────────────────────────
export default function PlanSelector({ hideSimSelector = false, tipo = 'Movilidad', hideAddons = false }: PlanSelectorProps) {
  const [simType, setSimType] = useState<'esim' | 'fisica'>('esim');
  const [modalPlan, setModalPlan] = useState<any | null>(null);
  const [ofertas, setOfertas] = useState<Plan[] | null>(null);
  const [errorCatalogo, setErrorCatalogo] = useState(false);

  // Catalogo real del CRM. Antes estaba hardcodeado y quedo desfasado: los
  // precios eran correctos pero los nombres estaban corridos un tier, y habia
  // un "2 GB $149" que no existe en el CRM.
  useEffect(() => {
    let cancelado = false;
    getPlans(tipo)
      .then((r) => { if (!cancelado) setOfertas(r); })
      .catch(() => { if (!cancelado) setErrorCatalogo(true); });
    return () => { cancelado = true; };
  }, [tipo]);

  const plansData = useMemo(() => construirTarjetas(ofertas || [], tipo), [ofertas, tipo]);
  const addons = useMemo(() => construirAddons(ofertas || []), [ofertas]);

  return (
    <section id="planes" className={`py-12 md:py-16 px-4 bg-[#FFCD54] font-sans ${hideSimSelector ? "" : "min-h-screen"}`}>
      <div className="max-w-[1000px] mx-auto">

        {/* Header y Selector de SIM */}
        {!hideSimSelector && (
          <div className="text-center mb-16 text-[#142035]">
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
                    <div className={`w-5 h-5 rounded-full border-2 border-white shadow-[0_0_0_1px_#142035] flex items-center justify-center ${simType === 'esim' ? 'bg-[#142035]' : 'bg-white'}`}>
                      {simType === 'esim' && <div className="w-2 h-2 rounded-full bg-[#FFCD54]"></div>}
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
                    <div className={`w-5 h-5 rounded-full border-2 border-white shadow-[0_0_0_1px_#142035] flex items-center justify-center ${simType === 'fisica' ? 'bg-[#142035]' : 'bg-white'}`}>
                      {simType === 'fisica' && <div className="w-2 h-2 rounded-full bg-[#FFCD54]"></div>}
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
        {ofertas === null && !errorCatalogo && (
          <div className="flex justify-center py-16">
            <span className="w-10 h-10 border-4 border-[#142035] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {(errorCatalogo || (ofertas !== null && plansData.length === 0)) && (
          <p className="text-center text-[#142035] font-poppins py-16">
            No pudimos cargar los planes en este momento. Marca <strong>*34468</strong> desde tu línea Be Online.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-16 justify-items-center mb-16 pt-6">
          {plansData.map((plan) => (
            <div key={plan.id} className="relative w-full max-w-[280px] rounded-2xl shadow-xl flex flex-col" style={{ backgroundColor: plan.bodyColor, color: 'white' }}>

              {/* Badge Circular (eEj. 2 GB) */}
              <div className="absolute -top-4 -left-6 w-24 h-24 bg-white rounded-full flex items-center justify-center text-[#142035] font-black text-2xl shadow-md z-10 tracking-tighter">
                {plan.badge}
              </div>

              {/* Nombre del Plan (Header) */}
              <div className="rounded-t-2xl my-2 mr-4 py-3 pl-12 pr-4 text-right font-semibold text-lg tracking-wide uppercase" style={{ backgroundColor: plan.headerColor, color: plan.headerColor === '#FFCD54' ? '#142035' : 'white' }}>
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
                  <div className={`absolute left-1/2 w-0.5 bg-[#FFCD54] -translate-x-1/2 ${plan.prices.length === 1 ? 'h-5 top-1/2 -translate-y-1/2' : 'top-0 bottom-0'}`}></div>

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
        {!hideSimSelector && !hideAddons && (
          <div className="text-center mt-24 mb-8">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#142035] mb-3">
              ¿Te quedaste sin datos?
            </h2>
            <p className="text-base md:text-2xl text-[#142035] font-medium mb-10">
              No te preocupes, sólo tienes que contratar nuestros planes express
            </p>

            <div className="flex flex-wrap justify-center gap-6">
              {addons.map((addon, index) => (
                <div key={index} className="flex flex-col w-[180px] rounded-[2rem] overflow-hidden shadow-lg border-2 border-transparent transition-transform hover:scale-105 cursor-pointer" onClick={() => setModalPlan({ id: `addon-${addon.gb}`, name: `ADD ON ${addon.gb}`, selectedPrice: addon.price, selectedDuration: addon.days })}>
                  <div className="bg-[#142035] text-white w-full text-center py-1 text-xl font-black tracking-widest">
                    {addon.gb}
                  </div>
                  <div className="bg-white w-full text-center py-2 text-lg text-[#142035] ">
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
          // El servicio sale del `tipo` de la pagina, no de una constante: este
          // modal arma el deep link /tienda/?service=... y en
          // /internet-portatil mandaba 'movil', con lo que la tienda abria el
          // catalogo de telefonia con el id de una oferta MiFi.
          service={esSoloDatos({ type: tipo }) ? 'mifi' : 'movil'}
          onClose={() => setModalPlan(null)}
        />
      )}
    </section>
  );
}